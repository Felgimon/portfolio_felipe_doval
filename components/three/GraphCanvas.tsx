"use client";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Text, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GraphNodes } from "./GraphNodes";
import { Asteroids } from "./Asteroids";
import { Stars, SKY_DRIFT } from "./Stars";
import { Lattice, BALL_R } from "./Lattice";
import {
  SUN_TEX,
  prepSunTexture,
  makeSunMaterial,
  makeFlameMaterial,
  makeProminenceMaterial,
  makeCoronaTexture,
  updateProminences,
  advanceSuns,
  spinSun,
} from "./sun";
import { isSoftwareRenderer } from "@/lib/gpu";
import { ladoModelo, nodos } from "@/lib/navigation";

const LOGO_FONT = "/fonts/logo.ttf";
/** Skybox fotorealista del ESPACIO: panorámica 360° REAL de la Vía Láctea
 * (ESO/S. Brunier, CC BY 4.0), desde la fuente de 6000px con GRADING propio
 * (negros aplastados + contraste + saturación: espacio profundo, no velo gris;
 * compensa el lavado del tonemapping ACES). El JPG equirectangular es el FONDO
 * y, en GPU real, también la LUZ (environment map): la galaxia ilumina el
 * cromo y el vidrio, y se refleja en ellos. Las estrellas NÍTIDAS las pone la
 * bóveda procedural (Stars): una foto estirada nunca da puntos nítidos. */
const SKY_BG = "/hdri/espacio-fondo.jpg";
const SKY_BG_LITE = "/hdri/espacio-fondo-1k.jpg"; /* render por software: menos bandwidth */
/** Rotación del skybox (elige qué parte de la galaxia queda detrás del balón). */
const SKY_ROT = 2.35;
/** Inclinación de la bóveda: la banda galáctica cruza en DIAGONAL (composición
 * dinámica) y la mayor parte del encuadre es espacio profundo con estrellas
 * nítidas, no la franja brillante y granulada del ecuador del panorama. */
const SKY_TILT = 0.3;

/** Escala del grafo. El balón queda centrado; la CÁMARA hace todo el movimiento. */
const S = 1.4;

/** Estado de cámara derivado del scroll. `t` es el progreso CONTINUO por la
 * ruta de waypoints (0 = portada, 1..N = nodo N de lleno; los decimales son la
 * transición suave entre waypoints — sin saltos al cruzar secciones). `active`
 * es la sección discreta (para HUD / sol activo). */
export type CamState = { t: number; active: number };
/** Proyección 2D de un sol-nodo: posición en px, si mira a cámara, y su RADIO
 * aparente en px (para el hit-area circular del overlay). */
export type NodeProj = { x: number; y: number; front: boolean; r: number };

/* Setup imperativo de three (fuera del componente: API mutable de la escena). */
function applySky(scene: THREE.Scene, tex: THREE.Texture, lite: boolean) {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
  scene.backgroundIntensity = 1.0;
  scene.backgroundRotation.set(SKY_TILT, SKY_ROT, 0);
  if (!lite) {
    // La galaxia como IBL: el cromo refleja el campo de estrellas real. En
    // software rendering el PBR con envmap se paga carísimo → luces simples.
    scene.environment = tex;
    scene.environmentIntensity = 0.6;
    scene.environmentRotation.set(SKY_TILT, SKY_ROT, 0);
  }
}
function clearSky(scene: THREE.Scene) {
  scene.background = null;
  scene.environment = null;
}
/** Deriva lentísima del cielo: fondo y reflejos giran juntos. */
function driftSky(scene: THREE.Scene, delta: number) {
  scene.backgroundRotation.y += SKY_DRIFT * delta;
  scene.environmentRotation.y = scene.backgroundRotation.y;
}

/** Skybox: el espacio fotográfico como fondo equirectangular de la ESCENA. Al
 * orbitar/panear la cámara se ve otra parte de la galaxia (el modelo no se
 * mueve; se mueve la cámara), y el cielo entero deriva muy lento. */
function SkyDome({ lite, reduced }: { lite: boolean; reduced: boolean }) {
  const tex = useTexture(lite ? SKY_BG_LITE : SKY_BG);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    applySky(scene, tex, lite);
    return () => clearSky(scene);
  }, [tex, scene, lite]);
  useFrame((_, delta) => {
    if (!reduced) driftSky(scene, Math.min(delta, 0.1));
  });
  return null;
}

/* Transición del sol central (mutación imperativa, fuera del componente):
 * en un tópico se ACHICA y el FD se encoge hasta desaparecer (el sol del tópico
 * es el protagonista y quedan alineados en el eje de cámara); en la portada
 * vuelve a crecer con el logo. El FD se anima por ESCALA de su grupo (robusto:
 * la opacidad del material de troika-text no es confiable de mutar). */
function easeSunCore(
  g: THREE.Group,
  fdG: THREE.Group | null,
  inTopic: boolean,
  delta: number,
) {
  // Misma curva "épica" que el foco de los nodos (~95% en 0.7s).
  const k = 1 - Math.pow(0.014, Math.min(delta, 0.1));
  const target = inTopic ? 0.45 : 1;
  const s = g.scale.x + (target - g.scale.x) * k;
  g.scale.setScalar(s);
  if (fdG) {
    const o = inTopic ? 0.0001 : 1;
    const fs = fdG.scale.x + (o - fdG.scale.x) * k;
    fdG.scale.setScalar(fs);
    fdG.visible = fs > 0.03;
  }
}

/**
 * SOL CENTRAL — el corazón del grafo, con el logo FD adentro (silueta oscura
 * sobre el disco ardiente, como un eclipse). Capas, de adentro hacia afuera:
 * superficie fotográfica hirviendo (foto NASA/SDO + domain-warp) → shell de
 * LLAMAS → 4 PROTUBERANCIAS VIVAS (mallas 3D que erupcionan desde el limbo,
 * crecen, colapsan y RENACEN en otro punto — siempre hay ráfagas formándose) →
 * corona → una luz puntual que ilumina el contenedor desde adentro. El FD va
 * en un Billboard entre el sol y la cámara. En lite: superficie estática.
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
  const sunMesh = useRef<THREE.Mesh>(null);
  const flameMesh = useRef<THREE.Mesh>(null);
  const promGroups = useRef<(THREE.Group | null)[]>([]);
  const lastCycle = useRef<number[]>([-1, -1, -1, -1]);
  const fdGroup = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  // La FOTO solar real (granulación NASA/SDO) — la base del hiperrealismo.
  const solTex = useTexture(SUN_TEX);
  useEffect(() => prepSunTexture(solTex), [solTex]);
  const mat = useMemo(
    () =>
      makeSunMaterial({ bright: 1.3, invR: 1 / R, animated: !lite, map: solTex }),
    [R, lite, solTex],
  );
  const flame = useMemo(
    () => (lite ? null : makeFlameMaterial(1 / (R * 1.42))),
    [R, lite],
  );
  // 4 protuberancias, cada una con su MATERIAL propio (uAlpha independiente:
  // cada arco vive y muere en su propio ciclo).
  const promMats = useMemo(
    () =>
      lite
        ? []
        : Array.from({ length: 4 }, () => makeProminenceMaterial(1 / (R * 0.5))),
    [R, lite],
  );
  const corona = useMemo(() => makeCoronaTexture(), []);
  useEffect(() => {
    return () => {
      mat.dispose();
      flame?.dispose();
      for (const m of promMats) m.dispose();
      corona.dispose();
    };
  }, [mat, flame, promMats, corona]);

  useFrame((_, delta) => {
    if (!reduced) {
      timeRef.current += Math.min(delta, 0.1);
      advanceSuns(delta, mat, flame, ...promMats);
      // Rotación lenta: el plasma gira; las llamas contra-rotan.
      if (sunMesh.current) spinSun(sunMesh.current, 0.06, delta);
      if (flameMesh.current) spinSun(flameMesh.current, -0.04, delta);
      // El ciclo de vida de las protuberancias (erupción → colapso → renacer).
      updateProminences(
        promGroups.current,
        promMats,
        lastCycle.current,
        timeRef.current,
        R,
      );
    }
    if (group.current) {
      easeSunCore(group.current, fdGroup.current, activeIndex >= 0, delta);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={sunMesh} material={mat}>
        <sphereGeometry args={[R, 48, 48]} />
      </mesh>
      {flame && (
        <mesh ref={flameMesh} material={flame} scale={1.42}>
          <sphereGeometry args={[R, 32, 32]} />
        </mesh>
      )}
      {/* Protuberancias VIVAS: mallas 3D (torus parciales) con ciclo de vida —
          el anclaje, escala y alfa los maneja updateProminences por frame.
          Solo GPU real. */}
      {promMats.map((m, i) => (
        <group
          key={i}
          ref={(el) => {
            promGroups.current[i] = el;
          }}
          scale={0.0001}
        >
          <mesh material={m} rotation={[0, 0, -Math.PI * 0.575]}>
            <torusGeometry args={[R * 0.45, R * 0.055, 8, 40, Math.PI * 1.15]} />
          </mesh>
        </group>
      ))}
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
      {/* FD entre el sol y la cámara: silueta tinta sobre el disco ardiente.
          Se anima por escala del grupo (ver easeSunCore). */}
      <group ref={fdGroup}>
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
            <meshBasicMaterial color="#122a3e" transparent />
          </Text>
        </Billboard>
      </group>
    </group>
  );
}

/** El contenedor geodésico (cromo + vidrio) + el sol central (con el FD) + los
 * nodos. Grupo ESTÁTICO (sin rotación): así las direcciones de los nodos son
 * fijas en el mundo y la cámara los encara con precisión. */
function GraphGroup({
  activeIndex,
  hovered,
  lite,
  reduced,
}: {
  activeIndex: number;
  hovered: number;
  lite: boolean;
  reduced: boolean;
}) {
  return (
    <group scale={S}>
      <Lattice lite={lite} />
      <GraphNodes
        activeIndex={activeIndex}
        hovered={hovered}
        lite={lite}
        reduced={reduced}
      />
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
const _v = new THREE.Vector3();
const _nd = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _z = new THREE.Vector3(0, 0, 1);
const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _lookCur = new THREE.Vector3(); // estado persistente del punto de mira

/** Respuesta de la cámara: base de la caída exponiencial por segundo. Más chico
 * = más "snappy" (buceo rápido + tracking ajustado del scroll → menos residuo al
 * frenar → asienta antes). */
const SETTLE = 0.00002;
/** Umbral de asentado: la cámara hace snap recién cuando la distancia RESTANTE
 * al objetivo es menor a esto (~0.012 unidades a distancia ~5 = ~2-3px,
 * invisible). En lite además deja de pedir frames → el canvas se pausa. */
const SNAP_EPS2 = 0.012 * 0.012;
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
  const aspect = size.width / Math.max(1, size.height);
  // Calibrado contra BALL_R exacto. En pantallas ANGOSTAS (mobile) la cámara se
  // aleja más: el contenedor Y el halo de soles orbitando (r×1.32 + etiquetas)
  // entran completos en el ancho. dist ≥ span/(0.8·tan(fov/2)·aspect).
  const OVER = rBall * Math.max(5.0, 4.75 / aspect); // portada: entero, de frente
  const CLOSE = rBall * Math.max(3.6, 2.6 / aspect); // tópico: grande, sol de frente

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

    // Damping ADAPTATIVO: cerca del objetivo (scroll) = tracking ajustado;
    // lejos (click directo a otra sección: t salta) = planeo suave (~1s) en
    // línea directa — la cámara orbita derecho al nodo, SIN recorrer los
    // waypoints intermedios (nada de speed-scroll mareador).
    const remaining = camera.position.distanceTo(_target);
    const far = THREE.MathUtils.clamp(remaining / (rBall * 3), 0, 1);
    const damp = THREE.MathUtils.lerp(SETTLE, 0.05, far);
    const k = 1 - Math.pow(damp, Math.min(delta, 0.05));
    camera.position.lerp(_target, k);
    _lookCur.lerp(_lookGoal, k);
    camera.lookAt(_lookCur);

    // Asentado: SOLO cuando la distancia RESTANTE es sub-pixel. (Antes se
    // snapeaba cuando el movimiento POR FRAME era chico — con el damping
    // adaptativo el planeo lejano es lento y eso disparaba el snap con ~30px
    // todavía pendientes: el "teletransporte" al final del click.)
    if (
      camera.position.distanceToSquared(_target) > SNAP_EPS2 ||
      _lookCur.distanceToSquared(_lookGoal) > SNAP_EPS2
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
  const sunWorldR = radius * 0.085 * S * 1.3; // radio del sol (promedio con foco)
  useFrame(() => {
    if (!onProject) return;
    _cam.copy(camera.position).normalize();
    const b = buf.current;
    for (let i = 0; i < nodos.length; i++) {
      const d = nodos[i].dir;
      _v.set(d[0], d[1], d[2]).normalize().multiplyScalar(rNode);
      _nd.copy(_v).normalize();
      const front = _nd.dot(_cam) > 0.12;
      const dist = camera.position.distanceTo(_v);
      _v.project(camera);
      let e = b[i];
      if (!e) {
        e = { x: 0, y: 0, front: false, r: 0 };
        b[i] = e;
      }
      e.x = ((_v.x + 1) / 2) * size.width;
      e.y = (1 - (_v.y + 1) / 2) * size.height;
      e.front = front;
      e.r = (sunWorldR / (dist * TAN_HALF_FOV)) * (size.height / 2);
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
  hovered,
  reduced,
  lite,
  onReady,
  onProject,
  onActivity,
}: {
  camRef: RefObject<CamState>;
  activeIndex: number;
  hovered: number;
  reduced: boolean;
  lite: boolean;
  onReady?: () => void;
  onProject?: (p: NodeProj[]) => void;
  onActivity?: () => void;
}) {
  return (
    <>
      {/* El espacio fotográfico de fondo (siempre: ES el diseño). El IBL de la
          galaxia lo setea applySky (solo GPU real). */}
      <SkyDome lite={lite} reduced={reduced} />
      {/* En el espacio la luz clave es DURA (sol lejano, sin atmósfera): un
          direccional fuerte esculpe el cromo y los asteroides con lado de luz y
          lado de sombra bien marcados. En software rendering, ambient de apoyo
          en lugar del envmap. */}
      {lite && <ambientLight intensity={0.5} color="#8fb4d8" />}
      <directionalLight
        position={[2.5, 4.5, 2]}
        intensity={lite ? 1.5 : 1.15}
        color="#fff2df"
      />
      {/* El espacio vivo: bóveda de estrellas nítidas + asteroides en
          tránsito alrededor del grafo. */}
      <Stars lite={lite} reduced={reduced} />
      <Asteroids lite={lite} reduced={reduced} />
      <GraphGroup
        activeIndex={activeIndex}
        hovered={hovered}
        lite={lite}
        reduced={reduced}
      />
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
  /** Índice del sol bajo el puntero (-1 = ninguno): dispara la mini-implosión. */
  hovered?: number;
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
  hovered = -1,
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
          hovered={hovered}
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
      {/* multisampling 0: el MSAA sobre el buffer HDR del composer es otra
          fuente conocida de frames negros en algunos drivers; el DPR alto
          compensa el aliasing. */}
      {!lite && (
        <EffectComposer multisampling={0}>
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

