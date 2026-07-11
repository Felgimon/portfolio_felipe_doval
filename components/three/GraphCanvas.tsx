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
  makeProminenceMaterial,
  makeCoronaTexture,
  makeEjectaSpecs,
  updateEjecta,
  advanceSuns,
  spinSun,
  burst,
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

/* Ráfagas/jets del sol central: erupciones periódicas de luz en el limbo
 * (cada una con su período y fase → nunca en sincronía, como un sol real). */
const JETS = [
  { dir: new THREE.Vector3(0.9, 0.35, 0.2).normalize(), period: 7, phase: 0.15, rot: -0.38 },
  { dir: new THREE.Vector3(-0.75, 0.6, 0.15).normalize(), period: 9.5, phase: 0.55, rot: 2.45 },
  { dir: new THREE.Vector3(-0.2, -0.95, 0.25).normalize(), period: 8.2, phase: 0.8, rot: 1.78 },
];
function pulseJets(sprites: (THREE.Sprite | null)[], t: number, R: number) {
  for (let i = 0; i < JETS.length; i++) {
    const s = sprites[i];
    if (!s) continue;
    const b = burst(t, JETS[i].period, JETS[i].phase);
    (s.material as THREE.SpriteMaterial).opacity = b * 0.85;
    s.scale.set(R * (1.2 + 1.7 * b), R * 0.55, 1);
  }
}

/**
 * SOL CENTRAL — el corazón del grafo, con el logo FD adentro (silueta oscura
 * sobre el disco ardiente, como un eclipse). Capas, de adentro hacia afuera:
 * superficie de plasma animada (domain-warp, HDR) → shell de LLAMAS → dos
 * PROTUBERANCIAS en arco ancladas al limbo (como la referencia) que derivan
 * lentamente → RÁFAGAS periódicas (jets que erupcionan y se apagan) → corona →
 * una luz puntual que ilumina el balón desde adentro. El FD va en un Billboard
 * entre el sol y la cámara. En lite: superficie estática, sin fuegos.
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
  const flareGroup = useRef<THREE.Group>(null);
  const jetRefs = useRef<(THREE.Sprite | null)[]>([]);
  const ejRefs = useRef<(THREE.Sprite | null)[]>([]);
  const fdGroup = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  // Ráfagas desprendidas: 10 partículas con trayectorias/vidas propias.
  const ejSpecs = useMemo(() => makeEjectaSpecs(10, 7), []);
  const mat = useMemo(
    () => makeSunMaterial({ bright: 1.3, invR: 1 / R, animated: !lite }),
    [R, lite],
  );
  const flame = useMemo(
    () => (lite ? null : makeFlameMaterial(1 / (R * 1.42))),
    [R, lite],
  );
  const prom = useMemo(
    () => (lite ? null : makeProminenceMaterial(1 / (R * 0.5))),
    [R, lite],
  );
  const corona = useMemo(() => makeCoronaTexture(), []);
  // Anclajes de las protuberancias: local +X del arco = dirección radial del
  // limbo (los pies tocan la superficie, el bucle sale hacia afuera).
  const arcs = useMemo(() => {
    const X = new THREE.Vector3(1, 0, 0);
    const mk = (d: THREE.Vector3, roll: number, arcR: number) => {
      const dir = d.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(X, dir);
      const qRoll = new THREE.Quaternion().setFromAxisAngle(dir, roll);
      return { q: qRoll.multiply(q), pos: dir.clone().multiplyScalar(R * 0.9), arcR };
    };
    return [
      mk(new THREE.Vector3(0.85, 0.45, -0.12), 0.4, R * 0.5),
      mk(new THREE.Vector3(-0.8, -0.35, -0.28), 2.1, R * 0.4),
    ];
  }, [R]);
  useEffect(() => {
    return () => {
      mat.dispose();
      flame?.dispose();
      prom?.dispose();
      corona.dispose();
    };
  }, [mat, flame, prom, corona]);

  useFrame((_, delta) => {
    if (!reduced) {
      timeRef.current += Math.min(delta, 0.1);
      advanceSuns(delta, mat, flame, prom);
      // Rotación lenta: el plasma gira; las llamas contra-rotan; las
      // protuberancias derivan por el limbo (independientes del disco).
      if (sunMesh.current) spinSun(sunMesh.current, 0.06, delta);
      if (flameMesh.current) spinSun(flameMesh.current, -0.04, delta);
      if (flareGroup.current) spinSun(flareGroup.current, 0.045, delta);
      pulseJets(jetRefs.current, timeRef.current, R);
      updateEjecta(ejRefs.current, ejSpecs, timeRef.current, R, 1);
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
      {/* Protuberancias en arco + ráfagas periódicas (solo GPU real). */}
      {prom && (
        <group ref={flareGroup}>
          {arcs.map((a, i) => (
            <group key={i} position={a.pos} quaternion={a.q}>
              <mesh material={prom} rotation={[0, 0, -Math.PI * 0.575]}>
                <torusGeometry args={[a.arcR, R * 0.055, 8, 40, Math.PI * 1.15]} />
              </mesh>
            </group>
          ))}
          {JETS.map((j, i) => (
            <sprite
              key={i}
              ref={(el) => {
                jetRefs.current[i] = el;
              }}
              position={j.dir.clone().multiplyScalar(R * 1.05)}
              scale={[R * 1.2, R * 0.55, 1]}
            >
              {/* Blending normal: la ráfaga tiene cuerpo contra el cielo claro. */}
              <spriteMaterial
                map={corona}
                rotation={j.rot}
                depthWrite={false}
                transparent
                opacity={0}
                toneMapped={false}
              />
            </sprite>
          ))}
          {/* Ráfagas que se DESPRENDEN: nacen en el limbo, se alejan
              desacelerando con curl, se hinchan y se desvanecen; algunas
              recaen al sol (arco de prominencia). Animadas en updateEjecta. */}
          {ejSpecs.map((_, i) => (
            <sprite
              key={`ej-${i}`}
              ref={(el) => {
                ejRefs.current[i] = el;
              }}
              scale={[R * 0.2, R * 0.2, 1]}
            >
              <spriteMaterial
                map={corona}
                depthWrite={false}
                transparent
                opacity={0}
                toneMapped={false}
              />
            </sprite>
          ))}
        </group>
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

