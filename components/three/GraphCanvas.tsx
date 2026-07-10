"use client";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Text, Billboard, Environment } from "@react-three/drei";
import { GraphNodes } from "./GraphNodes";
import { isSoftwareRenderer } from "@/lib/gpu";
import { ladoModelo, nodos } from "@/lib/navigation";

const MODEL = "/models/pelota-estructura-transformed.glb";
const LOGO_FONT = "/fonts/logo.ttf";
/** Skybox fotorealista: "Kloofendal partly cloudy puresky" (Poly Haven, CC0).
 * El JPG 4K es el FONDO (cielo real con nubes); el HDR 1K es la LUZ (environment
 * map): el cielo ilumina el balón y se refleja en él, como en Blender. */
const SKY_BG = "/hdri/cielo-fondo.jpg";
const SKY_BG_LITE = "/hdri/cielo-fondo-1k.jpg"; /* render por software: menos bandwidth */
const SKY_HDR = "/hdri/cielo-luz.hdr";
/** Rotación del skybox (elige qué parte del cielo queda detrás del balón). */
const SKY_ROT = 2.35;

/** Escala del grafo. El balón queda centrado; la CÁMARA hace todo el movimiento. */
const S = 1.4;

/** Estado de cámara derivado del scroll: nodo activo (0 = overview) + cuánto
 * "buceó" hacia él (0..1). */
export type CamState = { active: number; dive: number };
export type NodeProj = { x: number; y: number; front: boolean };

/* Setup imperativo de three (fuera del componente: API mutable de la escena). */
function applySky(scene: THREE.Scene, tex: THREE.Texture) {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
  scene.backgroundIntensity = 1.0;
  scene.backgroundRotation.set(0, SKY_ROT, 0);
}
function clearSky(scene: THREE.Scene) {
  scene.background = null;
}

/** Skybox: el cielo fotográfico como fondo equirectangular de la ESCENA. Al
 * orbitar/panear la cámara se ve otra parte del cielo (el modelo no se mueve;
 * se mueve la cámara). */
function SkyDome({ lite }: { lite: boolean }) {
  const tex = useTexture(lite ? SKY_BG_LITE : SKY_BG);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    applySky(scene, tex);
    return () => clearSky(scene);
  }, [tex, scene]);
  return null;
}

function useBallRadius(): number {
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const geometry = nodes.geometry_0.geometry;
  return useMemo(() => {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    return geometry.boundingSphere?.radius ?? 1;
  }, [geometry]);
}

/** Malla del balón + el logo FD flotando en el centro 3D + los nodos. Grupo
 * ESTÁTICO (sin rotación): así las direcciones de los nodos son fijas en el
 * mundo y la cámara los encara con precisión. El logo FD solo se muestra en la
 * portada (overview); en un tópico el mini-sol activo toma el centro. */
function GraphGroup({
  activeIndex,
  lite,
}: {
  activeIndex: number;
  lite: boolean;
}) {
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const overview = activeIndex < 0;
  return (
    <group scale={S}>
      {/* Balón blanco nacarado: el environment map del cielo se refleja en los
          struts (clearcoat) → material con vida, no plástico plano. En software
          rendering el clearcoat se paga caro → material estándar. */}
      <mesh geometry={nodes.geometry_0.geometry}>
        {lite ? (
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.4} />
        ) : (
          <meshPhysicalMaterial
            color="#ffffff"
            metalness={0.05}
            roughness={0.3}
            clearcoat={1}
            clearcoatRoughness={0.22}
            envMapIntensity={1.15}
          />
        )}
      </mesh>
      <GraphNodes activeIndex={activeIndex} />
      {/* Logo FD flotando en el centro 3D: metal tinta pulido (refleja el cielo)
          + punto oro. Solo en la portada. */}
      {overview && (
        <Billboard>
          <Text
            font={LOGO_FONT}
            fontSize={0.42}
            anchorX="center"
            anchorY="middle"
            letterSpacing={-0.02}
          >
            FD
            <meshStandardMaterial
              color="#0e2233"
              metalness={0.9}
              roughness={0.25}
              envMapIntensity={1.2}
            />
          </Text>
          <mesh position={[0.46, -0.13, 0]}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial
              color="#e8a83f"
              metalness={0.85}
              roughness={0.25}
              envMapIntensity={1.2}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// Temporales (sin allocs por frame)
const _dir = new THREE.Vector3();
const _node = new THREE.Vector3();
const _target = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _v = new THREE.Vector3();
const _nd = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _z = new THREE.Vector3(0, 0, 1);
const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _lookCur = new THREE.Vector3(); // estado persistente del punto de mira
const _prevLook = new THREE.Vector3();

/** Respuesta de la cámara: base de la caída exponiencial por segundo. Más chico
 * = más "snappy" (buceo rápido + tracking ajustado del scroll → menos residuo al
 * frenar → asienta antes). */
const SETTLE = 0.00002;
/** Umbral de "ya no se mueve": si el desplazamiento por frame es menor a esto,
 * la cámara hace snap al objetivo y DEJA de pedir frames → el canvas se pausa.
 * ~0.009 unidades sobre una cámara a distancia ~5 = sub-pixel (invisible). */
const MOVE_EPS2 = 0.009 * 0.009;
/** tan(fov/2) del canvas (fov 40). */
const TAN_HALF_FOV = Math.tan((40 * Math.PI) / 360);
/** Cuánto panea la cámara en un tópico (fracción del semiancho visible). El
 * balón queda del lado del modelo SIN salirse de pantalla e invade un poco el
 * lado del texto. */
const PAN_F = 0.3;

/**
 * Rig de cámara scroll-driven, estilo escena 3D real: la cámara ORBITA (ve otra
 * parte del skybox por sección) y PANEA el punto de mira (el balón queda a un
 * costado — se mueve la cámara, nunca el modelo). En overview ve el balón entero
 * y centrado. On-demand: pide un frame más SOLO mientras algo se movió
 * perceptiblemente; después hace snap y se calla → el render se pausa.
 */
function CameraRig({
  camRef,
  reduced,
  radius,
  onActivity,
}: {
  camRef: RefObject<CamState>;
  reduced: boolean;
  radius: number;
  /** ping por frame mientras la cámara AÚN se mueve de verdad. */
  onActivity?: () => void;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const rBall = radius * S;
  const OVER = rBall * 3.6; // overview: balón entero, de frente
  const CLOSE = rBall * 2.55; // en tópico: balón grande, sol activo de frente

  useFrame((_, delta) => {
    const st = camRef.current;
    const active = reduced ? 0 : st.active;
    const dive = reduced ? 0 : st.dive;

    if (active <= 0) {
      _dir.copy(_z);
      _target.copy(_dir).multiplyScalar(OVER);
      _lookGoal.set(0, 0, 0);
    } else {
      const nd = nodos[active - 1].dir;
      _node.set(nd[0], nd[1], nd[2]).normalize();
      _dir.copy(_z).lerp(_node, dive).normalize();
      const dist = THREE.MathUtils.lerp(OVER, CLOSE, dive);
      _target.copy(_dir).multiplyScalar(dist);
      // Pan lateral: mirar a un costado del balón → el balón se corre al lado
      // del modelo (opuesto al texto) sin mover la escena.
      _fwd.copy(_dir).negate();
      _right.crossVectors(_fwd, _up).normalize();
      const half = dist * TAN_HALF_FOV * (size.width / size.height);
      const sign = ladoModelo(active - 1) === "right" ? -1 : 1;
      _lookGoal.copy(_right).multiplyScalar(sign * half * PAN_F * dive);
    }

    if (reduced) {
      camera.position.copy(_target);
      camera.lookAt(_lookGoal);
      return; // reduced-motion: instantáneo, sin pings → pausa inmediata
    }

    _prev.copy(camera.position);
    _prevLook.copy(_lookCur);
    const k = 1 - Math.pow(SETTLE, Math.min(delta, 0.05));
    camera.position.lerp(_target, k);
    _lookCur.lerp(_lookGoal, k);
    camera.lookAt(_lookCur);

    // ¿Se movió algo perceptible este frame (posición O punto de mira)? Si sí,
    // pedí otro. Si no, cerrá: snap a los objetivos y dejá pausar.
    if (
      camera.position.distanceToSquared(_prev) > MOVE_EPS2 ||
      _lookCur.distanceToSquared(_prevLook) > MOVE_EPS2
    ) {
      onActivity?.();
    } else {
      camera.position.copy(_target);
      _lookCur.copy(_lookGoal);
      camera.lookAt(_lookCur);
    }
  });
  return null;
}

/** Proyecta los nodos a 2D para el overlay clickeable; "front" según si el nodo
 * mira a la cámara. Corre en los frames renderizados (durante scroll/asentado). */
function NodeProjector({
  onProject,
  radius,
}: {
  onProject?: (p: NodeProj[]) => void;
  radius: number;
}) {
  const { camera, size } = useThree();
  const buf = useRef<NodeProj[]>([]);
  const rNode = radius * 1.04 * S;
  useFrame(() => {
    if (!onProject) return;
    _cam.copy(camera.position).normalize();
    const b = buf.current;
    for (let i = 0; i < nodos.length; i++) {
      const d = nodos[i].dir;
      _v.set(d[0], d[1], d[2]).normalize().multiplyScalar(rNode);
      _nd.copy(_v).normalize();
      const front = _nd.dot(_cam) > 0.12;
      _v.project(camera);
      let e = b[i];
      if (!e) {
        e = { x: 0, y: 0, front: false };
        b[i] = e;
      }
      e.x = ((_v.x + 1) / 2) * size.width;
      e.y = (1 - (_v.y + 1) / 2) * size.height;
      e.front = front;
    }
    onProject(b);
  });
  return null;
}

function SignalReady({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

function Scene({
  camRef,
  activeIndex,
  reduced,
  lite,
  onReady,
  onProject,
  onActivity,
}: {
  camRef: RefObject<CamState>;
  activeIndex: number;
  reduced: boolean;
  lite: boolean;
  onReady?: () => void;
  onProject?: (p: NodeProj[]) => void;
  onActivity?: () => void;
}) {
  const radius = useBallRadius();
  return (
    <>
      {/* El cielo fotográfico de fondo (siempre: ES el diseño). */}
      <SkyDome lite={lite} />
      {/* Iluminación: environment map del cielo (reflejos reales en el balón).
          En render por SOFTWARE el shading PBR con envmap se paga carísimo →
          luces simples equivalentes (mismo clima, fracción del costo). */}
      {lite ? (
        <ambientLight intensity={0.85} color="#eaf5fb" />
      ) : (
        <Environment files={SKY_HDR} environmentRotation={[0, SKY_ROT, 0]} />
      )}
      {/* Un sol direccional cálido refuerza los highlights del clearcoat. */}
      <directionalLight
        position={[2.5, 4.5, 2]}
        intensity={lite ? 1.15 : 0.7}
        color="#fff3dd"
      />
      <GraphGroup activeIndex={activeIndex} lite={lite} />
      <CameraRig
        camRef={camRef}
        reduced={reduced}
        radius={radius}
        onActivity={onActivity}
      />
      <NodeProjector onProject={onProject} radius={radius} />
      <SignalReady onReady={onReady} />
    </>
  );
}

export type GraphCanvasProps = {
  camRef: RefObject<CamState>;
  activeIndex?: number;
  reduced?: boolean;
  /** true → frameloop "never" (0 frames en reposo). GraphHome lo prende con la
   * actividad de scroll y lo apaga cuando la cámara se asentó. */
  paused?: boolean;
  onReady?: () => void;
  onProject?: (p: NodeProj[]) => void;
  /** ping por frame mientras la cámara se mueve (para pausar recién al asentar). */
  onActivity?: () => void;
};

export default function GraphCanvas({
  camRef,
  activeIndex = -1,
  reduced = false,
  paused = false,
  onReady,
  onProject,
  onActivity,
}: GraphCanvasProps) {
  // Sin postproceso: la escena es liviana en cualquier GPU. En render por
  // software (SwiftShader) se capa DPR a 1 y sin antialias para sostener FPS.
  const lite = useMemo(() => isSoftwareRenderer(), []);
  const dpr = lite
    ? 1
    : typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio, 2)
      : 1.5;

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={dpr}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{
        antialias: !lite,
        stencil: false,
        depth: true,
        powerPreference: "high-performance",
      }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Scene
          camRef={camRef}
          activeIndex={activeIndex}
          reduced={reduced}
          lite={lite}
          onReady={onReady}
          onProject={onProject}
          onActivity={onActivity}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL);
