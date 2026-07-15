"use client";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GraphNodes } from "./GraphNodes";
import { Studio } from "./Studio";
import { BALL_R, NODE_RING, GRAPH_SCALE } from "./scene-config";
import {
  SUN_TEX,
  prepSunTexture,
  makeSunMaterial,
  makeProminenceMaterial,
  updateProminences,
  advanceSuns,
  spinSun,
} from "./sun";
import { isSoftwareRenderer } from "@/lib/gpu";
import { ladoModelo, nodos } from "@/lib/navigation";

/** Escala del grafo. El sol queda centrado; la CÁMARA hace todo el movimiento. */
const S = GRAPH_SCALE;

/** Giro del cúmulo en la PORTADA (rad/s): una vuelta cada ~75s. Vive, no marea.
 * Se frena al entrar a un tópico (ahí manda el sol de la sección). */
const HERO_SPIN = 0.084;

/** Estado de cámara derivado del scroll. `t` es el progreso CONTINUO por la
 * ruta de waypoints (0 = portada, 1..N = nodo N de lleno; los decimales son la
 * transición suave entre waypoints — sin saltos al cruzar secciones). `active`
 * es la sección discreta (para HUD / sol activo). */
export type CamState = { t: number; active: number };
/** Proyección 2D de un sol-nodo: posición en px, si mira a cámara, y su RADIO
 * aparente en px (para el hit-area circular del overlay). */
export type NodeProj = { x: number; y: number; front: boolean; r: number };

/* Transición del sol central (mutación imperativa, fuera del componente): en un
 * tópico se ACHICA (el mini-sol de la sección pasa a ser el protagonista); en la
 * portada vuelve a su tamaño pleno. */
function easeSunCore(g: THREE.Group, inTopic: boolean, delta: number) {
  // Misma curva "épica" que el foco de los nodos (~95% en 0.7s).
  const k = 1 - Math.pow(0.014, Math.min(delta, 0.1));
  const target = inTopic ? 0.45 : 1;
  g.scale.setScalar(g.scale.x + (target - g.scale.x) * k);
}

/* El cúmulo GIRA en la portada (y se frena al entrar a un tópico). */
function applySpin(g: THREE.Group, y: number) {
  g.rotation.y = y;
}

/**
 * SOL CENTRAL — el corazón del grafo, con el logo FD adentro (silueta oscura
 * sobre el disco ardiente, como un eclipse). Capas, de adentro hacia afuera:
 * superficie fotográfica hirviendo (foto NASA/SDO + domain-warp) → 4
 * PROTUBERANCIAS VIVAS (mallas 3D que erupcionan desde el limbo, crecen,
 * colapsan y RENACEN en otro punto — siempre hay ráfagas formándose). El
 * resplandor lo pone el BLOOM (luz HDR real del disco). En la portada la marca
 * es el NOMBRE, así que el sol va limpio (sin el FD encima). En lite:
 * superficie estática.
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
  const promGroups = useRef<(THREE.Group | null)[]>([]);
  const lastCycle = useRef<number[]>([-1, -1, -1, -1]);
  const timeRef = useRef(0);
  // La FOTO solar real (granulación NASA/SDO) — la base del hiperrealismo.
  const solTex = useTexture(SUN_TEX);
  useEffect(() => prepSunTexture(solTex), [solTex]);
  const mat = useMemo(
    () =>
      makeSunMaterial({ bright: 1.3, invR: 1 / R, animated: !lite, map: solTex }),
    [R, lite, solTex],
  );
  // 4 protuberancias, cada una con su MATERIAL propio (uAlpha independiente:
  // cada arco vive y muere en su propio ciclo). Usan blending NORMAL → se ven
  // con cuerpo también sobre el estudio blanco (el aditivo desaparecía).
  const promMats = useMemo(
    () =>
      lite
        ? []
        : Array.from({ length: 4 }, () => makeProminenceMaterial(1 / (R * 0.5))),
    [R, lite],
  );
  useEffect(() => {
    return () => {
      mat.dispose();
      for (const m of promMats) m.dispose();
    };
  }, [mat, promMats]);

  useFrame((_, delta) => {
    if (!reduced) {
      timeRef.current += Math.min(delta, 0.1);
      advanceSuns(delta, mat, ...promMats);
      // Rotación lenta: el plasma gira sobre su eje.
      if (sunMesh.current) spinSun(sunMesh.current, 0.06, delta);
      // El ciclo de vida de las protuberancias (erupción → colapso → renacer).
      updateProminences(
        promGroups.current,
        promMats,
        lastCycle.current,
        timeRef.current,
        R,
      );
    }
    if (group.current) easeSunCore(group.current, activeIndex >= 0, delta);
  });

  return (
    <group ref={group}>
      <mesh ref={sunMesh} material={mat}>
        <sphereGeometry args={[R, 48, 48]} />
      </mesh>
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
    </group>
  );
}

/** El sol central + los mini-soles. GIRA sobre su eje en la portada (`spinRef`,
 * que maneja SpinDriver) y se frena en los tópicos. La cámara y el proyector
 * leen el MISMO ángulo, así que el encuadre de cada tópico es idéntico gire lo
 * que gire (es una rotación rígida alrededor de Y, y el "arriba" de la cámara
 * también es Y). El contenedor de metal se retiró: el sol y los mini-soles
 * quedan solos en el estudio blanco. */
function GraphGroup({
  activeIndex,
  hovered,
  lite,
  reduced,
  spinRef,
}: {
  activeIndex: number;
  hovered: number;
  lite: boolean;
  reduced: boolean;
  spinRef: RefObject<number>;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) applySpin(g.current, spinRef.current);
  });
  return (
    <group ref={g} scale={S}>
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
const _seg = new THREE.Vector3();
const _closest = new THREE.Vector3();
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
/** Cuánto panea la cámara en un tópico (fracción del semiancho visible): el
 * cúmulo entero queda del lado del modelo, sin pisar la columna de texto y con
 * margen del borde. */
const PAN_F = 0.44;
/** ELEVACIÓN del cúmulo (fracción del semialto): mira un poco por DEBAJO del
 * centro → el modelo sube en pantalla. Centra la portada (saca el espacio vacío
 * de arriba) y, en los tópicos, despega los soles de abajo del nav-bar. Se
 * aplica en TODAS las vistas. */
const LIFT = 0.14;
/** Órbita hacia el nodo activo (0 = de frente como la portada, 1 = encarándolo
 * de lleno). Fuerte: la cámara SE VA hacia el sol de la sección y lo pone
 * adelante → se lee clarísimo que la sección es ESE sol. Un poco menos que de
 * lleno para que el giro no maree y el resto del cúmulo quede en cuadro.
 * Que los demás soles sigan clickeables NO depende de esto: depende de
 * `occludedByCore` (solo se desactiva lo que el sol central tapa de verdad). */
const TILT = 0.78;

/* Waypoints de la ruta de cámara: 0 = overview (de frente y quieto: es la
 * portada, donde se VE girar el cúmulo); k = 1..N = nodo k (orbitado hacia su
 * dirección y girado por `spin` junto con el cúmulo → el encuadre del tópico es
 * el mismo sin importar en qué ángulo quedó el giro). */
function wpDir(k: number, spin: number, out: THREE.Vector3) {
  if (k <= 0) {
    out.copy(_z);
    return;
  }
  const d = nodos[k - 1].dir;
  // Interpola entre el frente (+z) y la dirección del nodo por TILT.
  out.set(d[0], d[1], d[2]).normalize().multiplyScalar(TILT);
  out.addScaledVector(_z, 1 - TILT).normalize();
  // ...y acompaña al cúmulo en su giro (rotación rígida alrededor de Y).
  out.applyAxisAngle(_up, spin);
}

/** Avanza el giro del cúmulo: solo mientras se está en la PORTADA (t → 0). Al
 * entrar a un tópico se frena, así la cámara tiene un objetivo quieto y asienta
 * (si girara siempre, nunca dejaría de pedir frames). */
function SpinDriver({
  camRef,
  spinRef,
  reduced,
}: {
  camRef: RefObject<CamState>;
  spinRef: RefObject<number>;
  reduced: boolean;
}) {
  useFrame((_, delta) => {
    if (reduced) return;
    const hero = THREE.MathUtils.clamp(1 - camRef.current.t, 0, 1);
    spinRef.current += HERO_SPIN * hero * Math.min(delta, 0.1);
  });
  return null;
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
  spinRef,
}: {
  camRef: RefObject<CamState>;
  reduced: boolean;
  radius: number;
  /** ping por frame mientras la cámara AÚN se mueve de verdad. */
  onActivity?: () => void;
  spinRef: RefObject<number>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const rBall = radius * S;
  const aspect = size.width / Math.max(1, size.height);
  // Calibrado contra BALL_R exacto. En pantallas ANGOSTAS (mobile) la cámara se
  // aleja más para que el cúmulo entre completo en el ANCHO. Con la órbita
  // parcial (TILT) el cúmulo se mantiene entero en toda sección, así que OVER y
  // CLOSE están cerca: el tópico solo se acerca un poco (el sol activo crece).
  const OVER = rBall * Math.max(4.5, 4.35 / aspect); // portada: entero
  const CLOSE = rBall * Math.max(4.2, 3.55 / aspect); // tópico: cúmulo entero al lado del modelo
  // PORTADA. En pantalla ancha el nombre ocupa la izquierda → el cúmulo se
  // corre a la DERECHA. En pantalla angosta (una sola columna) no hay lados:
  // el cúmulo sube y el nombre queda debajo.
  const ancha = aspect >= 1;
  const heroPan = ancha ? -PAN_F : 0;
  const heroLift = ancha ? LIFT : 0.45;
  const panDe = (k: number) =>
    k <= 0 ? heroPan : (ladoModelo(k - 1) === "right" ? -1 : 1) * PAN_F;
  const liftDe = (k: number) => (k <= 0 ? heroLift : LIFT);

  useFrame((_, delta) => {
    const st = camRef.current;
    const N = nodos.length;
    const t = reduced ? 0 : THREE.MathUtils.clamp(st.t, 0, N);
    const spin = spinRef.current;

    // Segmento actual [iA → iB] + progreso local con easing (suave en ambas
    // puntas del segmento).
    const iA = Math.min(Math.floor(t), N);
    const iB = Math.min(iA + 1, N);
    const f = t - iA;
    const fs = f * f * (3 - 2 * f); // smoothstep

    wpDir(iA, spin, _node);
    wpDir(iB, spin, _v);
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

    // Punto de mira: pan lateral (el cúmulo queda del lado del modelo) + una
    // ELEVACIÓN constante (mira por debajo del centro → el cúmulo sube: portada
    // centrada y soles despegados del nav-bar en los tópicos).
    const pan = THREE.MathUtils.lerp(panDe(iA), panDe(iB), fs);
    const lift = THREE.MathUtils.lerp(liftDe(iA), liftDe(iB), fs);
    _fwd.copy(_dir).negate();
    _right.crossVectors(_fwd, _up).normalize(); // horizontal (y = 0)
    const halfV = dist * TAN_HALF_FOV; // semialto visible a esta distancia
    _lookGoal.copy(_right).multiplyScalar(pan * halfV * aspect);
    _lookGoal.y -= lift * halfV;

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

/** ¿El sol `p` está TAPADO por el sol central? Test real segmento-esfera: el
 * rayo cámara→sol pasa a menos de `r` del origen (donde vive el sol central).
 *
 * Reemplaza al viejo test de "cara de atrás" (dot con la cámara), que era
 * herencia del BALÓN sólido: cuando el contenedor existía, un sol del lado
 * lejano quedaba realmente escondido detrás de él. Sin balón, ese sol SIGUE
 * viéndose (orbita a NODE_RING·S = 1.2, muy por fuera del disco del sol
 * central, 0.7) → debe poder clickearse. Con este test, la cámara puede volver
 * a orbitar fuerte hacia el nodo activo SIN perder la clickeabilidad del resto:
 * solo se desactiva lo que de verdad está tapado. */
function occludedByCore(camPos: THREE.Vector3, p: THREE.Vector3, r: number) {
  _seg.subVectors(p, camPos);
  const dd = _seg.lengthSq();
  if (dd < 1e-6) return false;
  // Punto del SEGMENTO cámara→sol más cercano al origen.
  const t = THREE.MathUtils.clamp(-camPos.dot(_seg) / dd, 0, 1);
  _closest.copy(camPos).addScaledVector(_seg, t);
  return _closest.lengthSq() < r * r;
}

/** Proyecta los nodos a 2D para el overlay clickeable; "front" = visible de
 * verdad (no tapado por el sol central). Corre en los frames renderizados. */
function NodeProjector({
  onProject,
  radius,
  spinRef,
}: {
  onProject?: (p: NodeProj[]) => void;
  radius: number;
  spinRef: RefObject<number>;
}) {
  const { camera, size } = useThree();
  const buf = useRef<NodeProj[]>([]);
  const rNode = NODE_RING * S; // mismo anillo que las posiciones de los mini-soles
  const sunWorldR = radius * 0.085 * S * 1.3; // radio del sol (promedio con foco)
  const coreR = radius * 0.5 * S; // radio del sol central (el único que tapa)
  useFrame(() => {
    if (!onProject) return;
    const b = buf.current;
    const spin = spinRef.current;
    for (let i = 0; i < nodos.length; i++) {
      const d = nodos[i].dir;
      // Misma rotación que el cúmulo → las hit-areas siguen a los soles cuando
      // gira la portada.
      _v.set(d[0], d[1], d[2])
        .normalize()
        .applyAxisAngle(_up, spin)
        .multiplyScalar(rNode);
      // Clickeable si se VE: solo lo tapa el sol central (nada de back-face).
      const front = !occludedByCore(camera.position, _v, coreR);
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
  // Ángulo de giro del cúmulo, compartido por los tres que lo necesitan. Se
  // avanza PRIMERO (SpinDriver va antes que el resto en el árbol → su useFrame
  // corre antes) y el grupo, la cámara y el proyector leen el mismo valor en el
  // mismo frame: nunca se desincronizan.
  const spinRef = useRef(0);
  return (
    <>
      <SpinDriver camRef={camRef} spinRef={spinRef} reduced={reduced} />
      {/* Estudio blanco 3D: cúpula (pared + piso) + sombra del sol en el piso.
          Los soles son shaders sin iluminar → no hacen falta luces. */}
      <Studio />
      <GraphGroup
        activeIndex={activeIndex}
        hovered={hovered}
        lite={lite}
        reduced={reduced}
        spinRef={spinRef}
      />
      <CameraRig
        camRef={camRef}
        reduced={reduced}
        radius={BALL_R}
        onActivity={onActivity}
        spinRef={spinRef}
      />
      <NodeProjector onProject={onProject} radius={BALL_R} spinRef={spinRef} />
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
          (uBright > 1, toneMapped=false) derraman luz; el estudio blanco está
          por debajo de 1.0 y NO florece. Sobre blanco el bloom es más sutil, así
          que se baja la intensidad para que sea un halo cálido, no una mancha. */}
      {/* multisampling 0: el MSAA sobre el buffer HDR del composer es otra
          fuente conocida de frames negros en algunos drivers; el DPR alto
          compensa el aliasing. */}
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.42}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.32}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}

