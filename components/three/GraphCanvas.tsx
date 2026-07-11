"use client";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Text, Billboard, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GraphNodes } from "./GraphNodes";
import { Lattice, BALL_R } from "./Lattice";
import {
  makeSunMaterial,
  makeFlameMaterial,
  makeCoronaTexture,
  tickSuns,
} from "./sun";
import { isSoftwareRenderer } from "@/lib/gpu";
import { ladoModelo, nodos } from "@/lib/navigation";

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

/** Estado de cámara derivado del scroll. `t` es el progreso CONTINUO por la
 * ruta de waypoints (0 = portada, 1..N = nodo N de lleno; los decimales son la
 * transición suave entre waypoints — sin saltos al cruzar secciones). `active`
 * es la sección discreta (para HUD / sol activo). */
export type CamState = { t: number; active: number };
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

/* Transición del sol central (mutación imperativa, fuera del componente):
 * en un tópico se ACHICA y el FD se desvanece (el sol del tópico es el
 * protagonista y quedan alineados en el eje de cámara); en la portada vuelve a
 * crecer con el logo. Corre en frames renderizados (la cámara siempre está en
 * movimiento cuando esto cambia, así que nunca queda a medio camino). */
function easeSunCore(
  g: THREE.Group,
  fd: THREE.MeshBasicMaterial | null,
  inTopic: boolean,
  delta: number,
) {
  const k = 1 - Math.pow(0.000001, Math.min(delta, 0.05));
  const target = inTopic ? 0.45 : 1;
  const s = g.scale.x + (target - g.scale.x) * k;
  g.scale.setScalar(s);
  if (fd) {
    const o = inTopic ? 0 : 1;
    fd.opacity += (o - fd.opacity) * k;
    fd.visible = fd.opacity > 0.02;
  }
}

/**
 * SOL CENTRAL — el corazón del grafo, con el logo FD adentro (silueta oscura
 * sobre el disco ardiente, como un eclipse). Capas, de adentro hacia afuera:
 * superficie de plasma animada (domain-warp, HDR) → shell de LLAMAS
 * (prominencias animadas en el borde) → corona aditiva → una luz puntual que
 * ilumina el balón desde adentro. El FD va en un Billboard entre el sol y la
 * cámara (siempre legible). En lite: superficie estática, sin llamas.
 */
function SunCore({
  radius,
  lite,
  reduced,
  activeIndex,
}: {
  radius: number;
  lite: boolean;
  reduced: boolean;
  activeIndex: number;
}) {
  const R = radius * 0.5;
  const group = useRef<THREE.Group>(null);
  const fdMat = useRef<THREE.MeshBasicMaterial>(null);
  const mat = useMemo(
    () => makeSunMaterial({ bright: 1.3, invR: 1 / R, animated: !lite }),
    [R, lite],
  );
  const flame = useMemo(
    () => (lite ? null : makeFlameMaterial(1 / (R * 1.32))),
    [R, lite],
  );
  const corona = useMemo(() => makeCoronaTexture(), []);
  useEffect(() => {
    return () => {
      mat.dispose();
      flame?.dispose();
      corona.dispose();
    };
  }, [mat, flame, corona]);

  useFrame((s, delta) => {
    if (!reduced) tickSuns(s.clock.elapsedTime, mat, flame);
    if (group.current) {
      easeSunCore(group.current, fdMat.current, activeIndex >= 0, delta);
    }
  });

  return (
    <group ref={group}>
      <mesh material={mat}>
        <sphereGeometry args={[R, 48, 48]} />
      </mesh>
      {flame && (
        <mesh material={flame} scale={1.32}>
          <sphereGeometry args={[R, 32, 32]} />
        </mesh>
      )}
      {/* Un solo halo amplio y suave: el resplandor cercano lo hacen las llamas
          + el bloom (dos coronas encimadas lavaban la textura del disco). */}
      <sprite scale={R * 4.6}>
        <spriteMaterial
          map={corona}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </sprite>
      {/* El sol ilumina el balón desde el centro (luz real en la escena). */}
      <pointLight color="#ffb45c" intensity={1.2} distance={radius * 2.4} decay={1.8} />
      {/* FD entre el sol y la cámara: silueta tinta sobre el disco ardiente. */}
      <Billboard>
        <Text
          font={LOGO_FONT}
          fontSize={R * 0.72}
          position={[0, 0, R * 1.5]}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
        >
          FD
          <meshBasicMaterial ref={fdMat} color="#122a3e" transparent />
        </Text>
      </Billboard>
    </group>
  );
}

/** El contenedor geodésico (cromo + vidrio) + el sol central (con el FD) + los
 * nodos. Grupo ESTÁTICO (sin rotación): así las direcciones de los nodos son
 * fijas en el mundo y la cámara los encara con precisión. */
function GraphGroup({
  activeIndex,
  lite,
  reduced,
}: {
  activeIndex: number;
  lite: boolean;
  reduced: boolean;
}) {
  return (
    <group scale={S}>
      <Lattice lite={lite} />
      <GraphNodes activeIndex={activeIndex} lite={lite} reduced={reduced} />
      <SunCore
        radius={BALL_R}
        lite={lite}
        reduced={reduced}
        activeIndex={activeIndex}
      />
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

/* Waypoints de la ruta de cámara: 0 = overview (frente, lejos, centrado);
 * k = 1..N = nodo k (su dirección, cerca, paneado a su lado). */
function wpDir(k: number, out: THREE.Vector3) {
  if (k <= 0) {
    out.copy(_z);
  } else {
    const d = nodos[k - 1].dir;
    out.set(d[0], d[1], d[2]).normalize();
  }
}
function wpPan(k: number): number {
  if (k <= 0) return 0;
  return (ladoModelo(k - 1) === "right" ? -1 : 1) * PAN_F;
}

/**
 * Rig de cámara scroll-driven, estilo escena 3D real: la cámara recorre una
 * RUTA CONTINUA de waypoints (overview → nodo 1 → … → nodo N) según `t`. Entre
 * waypoints interpola dirección (orbita el skybox), distancia (con un leve
 * retroceso a mitad de camino entre nodos: respira, no látiga) y pan lateral
 * (pasa por el centro al cambiar de lado). `t` es continuo a través de los
 * bordes de sección → NUNCA hay un salto de objetivo abrupto. On-demand: pide
 * un frame más SOLO mientras algo se movió perceptiblemente; después hace snap
 * y se calla → el render se pausa.
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
  // Calibrado contra BALL_R exacto (el GLB viejo tenía boundingSphere inflada,
  // por eso estos factores son mayores que los históricos 3.6/2.55).
  const OVER = rBall * 5.0; // overview: contenedor entero, de frente
  const CLOSE = rBall * 3.6; // en tópico: contenedor grande, sol activo de frente

  useFrame((_, delta) => {
    const st = camRef.current;
    const N = nodos.length;
    const t = reduced ? 0 : THREE.MathUtils.clamp(st.t, 0, N);

    // Segmento actual [iA → iB] + progreso local con easing (suave en ambas
    // puntas del segmento).
    const iA = Math.min(Math.floor(t), N);
    const iB = Math.min(iA + 1, N);
    const f = t - iA;
    const fs = f * f * (3 - 2 * f); // smoothstep

    wpDir(iA, _node);
    wpDir(iB, _v);
    _dir.copy(_node).lerp(_v, fs).normalize();

    const dA = iA === 0 ? OVER : CLOSE;
    const dB = iB === 0 ? OVER : CLOSE;
    let dist = THREE.MathUtils.lerp(dA, dB, fs);
    // Entre dos NODOS la cámara retrocede un poco a mitad de camino (arco de
    // respiro) en vez de rozar el balón.
    if (iA >= 1 && iB >= 1 && iA !== iB) {
      dist += Math.sin(Math.PI * fs) * (OVER - CLOSE) * 0.45;
    }
    _target.copy(_dir).multiplyScalar(dist);

    // Pan lateral: mirar a un costado del balón → el balón queda del lado del
    // modelo (opuesto al texto) sin mover la escena.
    const pan = THREE.MathUtils.lerp(wpPan(iA), wpPan(iB), fs);
    _fwd.copy(_dir).negate();
    _right.crossVectors(_fwd, _up).normalize();
    const half = dist * TAN_HALF_FOV * (size.width / size.height);
    _lookGoal.copy(_right).multiplyScalar(pan * half);

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
  const rNode = radius * 1.32 * S;
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
  return (
    <>
      {/* El cielo fotográfico de fondo (siempre: ES el diseño). */}
      <SkyDome lite={lite} />
      {/* Iluminación: environment map del cielo (reflejos reales en el cromo y
          el vidrio). En render por SOFTWARE el PBR con envmap se paga carísimo →
          luces simples equivalentes (mismo clima, fracción del costo). */}
      {lite ? (
        <ambientLight intensity={0.85} color="#eaf5fb" />
      ) : (
        <Environment files={SKY_HDR} environmentRotation={[0, SKY_ROT, 0]} />
      )}
      {/* Un sol direccional cálido refuerza los highlights del cromo. */}
      <directionalLight
        position={[2.5, 4.5, 2]}
        intensity={lite ? 1.15 : 0.7}
        color="#fff3dd"
      />
      <GraphGroup activeIndex={activeIndex} lite={lite} reduced={reduced} />
      <CameraRig
        camRef={camRef}
        reduced={reduced}
        radius={BALL_R}
        onActivity={onActivity}
      />
      <NodeProjector onProject={onProject} radius={BALL_R} />
      <SignalReady onReady={onReady} />
    </>
  );
}

export type GraphCanvasProps = {
  camRef: RefObject<CamState>;
  activeIndex?: number;
  reduced?: boolean;
  /** Solicitud de pausa de GraphHome (sin actividad de scroll/cámara). Solo se
   * respeta en software rendering o reduced-motion — ahí el sol es estático y
   * pausar ahorra CPU. En GPU real el canvas corre SIEMPRE: el plasma del sol
   * hierve a framerate completo (el costo es trivial para cualquier GPU). */
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
  // En render por software (SwiftShader) se capa DPR a 1 y sin antialias para
  // sostener FPS; en GPU real, calidad completa.
  const lite = useMemo(() => isSoftwareRenderer(), []);
  const dpr = lite
    ? 1
    : typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio, 2)
      : 1.5;

  return (
    <Canvas
      frameloop={paused && (lite || reduced) ? "never" : "always"}
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
      {/* Bloom HDR SELECTIVO: umbral > 1 → solo los píxeles HDR de los soles
          (uBright > 1, toneMapped=false) derraman luz. El cielo, el vidrio y el
          balón quedan limpios. Esto es el "encandila": luz renderizada real del
          modelo, no un halo pegado. En software rendering se omite. */}
      {!lite && (
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={0.7}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.3}
            mipmapBlur
            radius={0.75}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}

