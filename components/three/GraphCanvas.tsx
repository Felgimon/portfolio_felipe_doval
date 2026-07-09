"use client";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Text, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GraphNodes } from "./GraphNodes";
import { isSoftwareRenderer } from "@/lib/gpu";
import { nodos } from "@/lib/navigation";

const MODEL = "/models/pelota-estructura-transformed.glb";
const LOGO_FONT = "/fonts/logo.ttf";

/** Escala del grafo. El balón queda centrado; la cámara hace todo el movimiento. */
const S = 1.4;

/** Estado de cámara derivado del scroll: nodo activo (0 = overview) + cuánto
 * "buceó" hacia él (0..1). */
export type CamState = { active: number; dive: number };
export type NodeProj = { x: number; y: number; front: boolean };

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
 * mundo y la cámara los encara con precisión. */
function GraphGroup({ activeIndex }: { activeIndex: number }) {
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  return (
    <group scale={S}>
      <mesh geometry={nodes.geometry_0.geometry}>
        <meshStandardMaterial
          color="#123028"
          emissive="#59c9a6"
          emissiveIntensity={0.62}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      <GraphNodes activeIndex={activeIndex} />
      <Billboard>
        <Text
          font={LOGO_FONT}
          fontSize={0.42}
          color="#c7f5e2"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
          material-toneMapped={false}
        >
          FD
        </Text>
        <mesh position={[0.46, -0.13, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color="#c7f5e2"
            emissive="#8fe3c6"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
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
const ORIGIN = new THREE.Vector3(0, 0, 0);

/** Respuesta de la cámara: base de la caída exponiencial por segundo. Más chico
 * = más "snappy" (buceo rápido + tracking ajustado del scroll → menos residuo al
 * frenar → asienta antes). */
const SETTLE = 0.00002;
/** Umbral de "ya no se mueve": si el desplazamiento por frame es menor a esto,
 * la cámara hace snap al objetivo y DEJA de pedir frames → el canvas se pausa.
 * ~0.009 unidades sobre una cámara a distancia ~5 = sub-pixel (invisible). */
const MOVE_EPS2 = 0.009 * 0.009;

/**
 * Rig de cámara scroll-driven: siempre mira al centro; su dirección y distancia
 * salen de (active, dive). En overview ve el balón entero; al "bucear" hacia un
 * nodo, se acerca por su dirección hasta encararlo de cerca. On-demand: pide un
 * frame más SOLO mientras se movió algo perceptible; apenas el movimiento es
 * imperceptible hace snap y se calla → el render se pausa casi al instante en
 * que termina la animación visible (nada de perseguir la cola asintótica).
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
  const rBall = radius * S;
  const OVER = rBall * 3.6; // overview: balón entero
  const CLOSE = rBall * 1.7; // pegado al nodo

  useFrame((_, delta) => {
    const st = camRef.current;
    const active = reduced ? 0 : st.active;
    const dive = reduced ? 0 : st.dive;

    if (active <= 0) {
      _dir.copy(_z);
      _target.copy(_dir).multiplyScalar(OVER);
    } else {
      const nd = nodos[active - 1].dir;
      _node.set(nd[0], nd[1], nd[2]).normalize();
      _dir.copy(_z).lerp(_node, dive).normalize();
      _target.copy(_dir).multiplyScalar(THREE.MathUtils.lerp(OVER, CLOSE, dive));
    }

    if (reduced) {
      camera.position.copy(_target);
      camera.lookAt(ORIGIN);
      return; // reduced-motion: instantáneo, sin pings → pausa inmediata
    }

    _prev.copy(camera.position);
    const k = 1 - Math.pow(SETTLE, Math.min(delta, 0.05));
    camera.position.lerp(_target, k);
    camera.lookAt(ORIGIN);

    // ¿Se movió algo perceptible este frame? Si sí, pedí otro. Si no, cerrá:
    // snap al objetivo y no pingees → deja que el canvas se pause de una.
    if (camera.position.distanceToSquared(_prev) > MOVE_EPS2) {
      onActivity?.();
    } else {
      camera.position.copy(_target);
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
  const rNode = radius * 1.02 * S;
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
  onReady,
  onProject,
  onActivity,
}: {
  camRef: RefObject<CamState>;
  activeIndex: number;
  reduced: boolean;
  onReady?: () => void;
  onProject?: (p: NodeProj[]) => void;
  onActivity?: () => void;
}) {
  const radius = useBallRadius();
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color="#dff7ec" />
      <GraphGroup activeIndex={activeIndex} />
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
  // Modo "lite" cuando el WebGL corre por software (sin GPU acelerada): el
  // fill-rate del bloom + DPR alto es lo que clava los FPS. En ese caso: sin
  // postproceso y DPR 1. En GPU real: calidad completa (el bloom es el alma del
  // look). El emissivo (toneMapped=false) sostiene el glow aun sin bloom.
  const lite = useMemo(() => isSoftwareRenderer(), []);
  const dpr = lite
    ? 1
    : typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio, 1.5)
      : 1.25;

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={dpr}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{
        alpha: true,
        antialias: false,
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
          onReady={onReady}
          onProject={onProject}
          onActivity={onActivity}
        />
      </Suspense>
      {!lite && (
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.4}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}

useGLTF.preload(MODEL);
