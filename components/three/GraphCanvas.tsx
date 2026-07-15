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

/**
 * Por qué el CÚMULO no gira (v5.4). Girar el conjunto tenía dos costos que
 * ninguna calibración arregla, porque son geométricos:
 *  1. Un mini-sol que orbita pasa DETRÁS del sol central → deja de verse y de
 *     poder clickearse durante media vuelta.
 *  2. Al girar, dos chips cualesquiera terminan superpuestos en pantalla (los
 *     nodos viven en una esfera; su proyección se junta y se cruza).
 * Además el encuadre se volvía no determinista: el margen de arriba medía
 * entre 13% y 23% según en qué ángulo te agarraba la captura.
 * Las direcciones de `nodos` están elegidas para leerse SEPARADAS de frente, y
 * quietas cumplen esa promesa: cada sección tiene SU lugar fijo en el mapa.
 * El movimiento lo pone el sol central, que gira sobre su propio eje (spinSun)
 * sin mover a nadie de lugar.
 */

/** Estado de cámara derivado del scroll. `t` es el progreso CONTINUO por la
 * ruta de waypoints (0 = portada, 1..N = nodo N de lleno; los decimales son la
 * transición suave entre waypoints — sin saltos al cruzar secciones). `active`
 * es la sección discreta (para HUD / sol activo). */
export type CamState = { t: number; active: number };
/** Proyección 2D de un sol-nodo: posición en px, si mira a cámara, y su RADIO
 * aparente en px (para el hit-area circular del overlay). */
export type NodeProj = { x: number; y: number; front: boolean; r: number };
/** El HUECO que el layout le deja al cúmulo en la portada, en px de pantalla
 * (lo mide GraphHome contra el DOM real). En ancho: a la derecha del nombre y
 * arriba del HUD. En angosto: toda la pantalla, arriba del texto. */
export type Banda = { x0: number; x1: number; y0: number; y1: number };

/* Transición del sol central (mutación imperativa, fuera del componente): en un
 * tópico se ACHICA (el mini-sol de la sección pasa a ser el protagonista); en la
 * portada vuelve a su tamaño pleno. */
function easeSunCore(g: THREE.Group, inTopic: boolean, delta: number) {
  // Misma curva "épica" que el foco de los nodos (~95% en 0.7s).
  const k = 1 - Math.pow(0.014, Math.min(delta, 0.1));
  const target = inTopic ? 0.45 : 1;
  g.scale.setScalar(g.scale.x + (target - g.scale.x) * k);
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
      // El sol gira sobre su PROPIO eje: el plasma cruza el disco y el sol se
      // lee vivo sin mover a nadie de lugar. Es el único giro de la escena
      // (el cúmulo quedó quieto), así que va un toque más rápido que antes.
      if (sunMesh.current) spinSun(sunMesh.current, 0.085, delta);
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

/** El sol central + los mini-soles, QUIETOS (ver la nota de arriba): cada
 * sección tiene su lugar fijo en el mapa y la cámara es la que se mueve. El
 * contenedor de metal se retiró: el sol y los mini-soles quedan solos en el
 * estudio blanco. */
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
 * centro → el modelo sube en pantalla. Despega los soles de abajo del nav-bar
 * en los tópicos. */
const LIFT = 0.14;

/* ---- Encuadre de la PORTADA: la cámara llena el HUECO que deja el layout ----
 * En la portada el cúmulo no va "a la derecha, a ojo": va CENTRADO en la banda
 * que le deja libre la columna de texto, y a la distancia justa para llenarla
 * sin pisar nada. La banda la mide GraphHome contra el DOM real y se la pasa
 * acá; no hay ninguna fórmula de CSS copiada en este archivo.
 *
 * Por qué no alcanzaban tres números fijos: el contenedor centrado (max-w-88rem)
 * mueve el borde derecho del nombre del 35% del ancho (1440) al 47% (1920), y el
 * cúmulo se dimensiona contra el ALTO. Un pan constante calibrado en 1920 dejaba
 * el cúmulo a 4% del borde en 1440 y a 3.7% en 1366x768. Con la banda medida,
 * cada pantalla se resuelve sola: si cambia la tipografía, el copy o el
 * contenedor, el encuadre se recalibra sin tocar una constante.
 *
 * Resultado en 1920x941 (hero-metrics.mjs): arriba 135px · derecha 135px ·
 * abajo hasta el HUD 135px · gap con el nombre 144px. Antes: 214 / 196 / 176 /
 * 427, y el de arriba variaba entre 13% y 23% según en qué ángulo del giro te
 * agarrara la captura.
 */
/**
 * Extensión GEOMÉTRICA del cúmulo quieto (unidades de mundo desde el sol
 * central): hasta dónde llega el sol más saliente en cada dirección. Se DERIVA
 * de los nodos, así que si cambian las direcciones, el anillo o el tamaño de
 * los soles, el encuadre las sigue solo: no hay números medidos que se pudran.
 * No es simétrica (los nodos no lo son), así que el centro óptico del cúmulo no
 * es el sol central; `encuadreHero` lo corrige.
 *
 * Se encuadra la GEOMETRÍA y no el halo del bloom, por dos razones. Una
 * estética: el halo es luz difusa, y dejar que derrame sobre el aire del borde
 * es lo que hace cualquier foto de una fuente de luz (se encuadra el objeto, no
 * su resplandor). Y una dura: el halo NO es modelable en unidades de mundo.
 * Medido, se extiende ~60px en 1920 y casi nada en un celular (donde los soles
 * miden 10px y el resplandor no llega a destacarse) — o sea que cualquier
 * constante que lo incluyera sería correcta en una pantalla y falsa en la otra.
 * Ese fue el error que dejaba el cúmulo un 24% más chico de lo que podía ser en
 * el celular. El aire de HERO_MARGEN se lo banca.
 */
const CL = (() => {
  const rNodo = NODE_RING * S;
  const rSol = BALL_R * 0.085 * S * 1.15; // +15%: el sol late y crece al hover
  const rCore = BALL_R * 0.5 * S; // por si algún día los nodos orbitan más cerca
  const v = new THREE.Vector3();
  const e = { r: rCore, l: rCore, t: rCore, b: rCore };
  for (const n of nodos) {
    v.set(n.dir[0], n.dir[1], n.dir[2]).normalize().multiplyScalar(rNodo);
    e.r = Math.max(e.r, v.x + rSol);
    e.l = Math.max(e.l, -v.x + rSol);
    e.t = Math.max(e.t, v.y + rSol);
    e.b = Math.max(e.b, -v.y + rSol);
  }
  // Los nodos están en el hemisferio frontal, o sea MÁS CERCA de la cámara que
  // el sol central: proyectan un poco más grandes que su x/y. La magnificación
  // va de 1.04 (celular, cámara lejos) a 1.11 (escritorio); se toma el medio y
  // el ±3% lo absorbe el aire.
  const PERSP = 1.08;
  return { r: e.r * PERSP, l: e.l * PERSP, t: e.t * PERSP, b: e.b * PERSP };
})();

/** Aire entre el cúmulo y los bordes de su banda, como fracción de pantalla.
 * Tiene que bancarse el halo del bloom, que no entra en CL (ver arriba). Es más
 * generoso a lo ANCHO que a lo alto porque son cosas distintas: a los costados
 * el aire separa al cúmulo del nombre y del borde (es composición), mientras que
 * arriba y abajo, en el celular, cada píxel de aire se lo saca al modelo (que es
 * justo donde falta). En escritorio manda el ancho, así que el de alto ni se
 * nota. */
const HERO_MARGEN_X = 0.09;
const HERO_MARGEN_Y = 0.035;
/** Lugar que hay que reservarle a las ETIQUETAS, en PÍXELES de pantalla: son
 * HTML y no escalan con la escena, así que su espacio no se puede expresar en
 * unidades de mundo ni como fracción. `X` es lo que sobresale una pastilla más
 * allá de su sol (la más ancha es RECORRIDO, y es también la del sol más a la
 * izquierda); `Y` es lo que la pastilla sobresale por arriba o por abajo. */
const LABEL_X = 26;
const LABEL_Y = 38;
/** Retroceso de la cámara a mitad de camino ENTRE dos nodos (arco de respiro:
 * pasa por afuera en vez de rozar el sol). Explícito, en unidades de rBall: si
 * se derivara de (OVER - CLOSE) cambiaría de signo cada vez que se recalibra
 * una de las dos distancias. */
const BREATHE = 0.3;

/** Salida de `encuadreHero`, ya en la convención de la CÁMARA (pan/lift son a
 * dónde MIRA; el cúmulo aparece del lado contrario). Se reusa por frame. */
const _hero = { dist: 0, pan: 0, lift: 0 };

/**
 * Distancia + pan + lift para que el cúmulo entre CENTRADO en `banda`.
 * Se aleja lo justo para cumplir la más exigente de las dos restricciones (que
 * entre a lo alto y que entre a lo ancho) y después centra su bbox real —
 * corrigiendo la asimetría de los chips— dentro de la banda.
 */
function encuadreHero(medida: Banda, w: number, h: number) {
  // Sin medir todavía (el canvas es lazy: en la práctica GraphHome mide antes
  // del primer frame, pero no depende de eso): la banda es la pantalla entera.
  const banda =
    medida.x1 > medida.x0 && medida.y1 > medida.y0
      ? medida
      : { x0: 0, x1: w, y0: 0, y1: h };
  const aspect = w / Math.max(1, h);
  // La banda ÚTIL para los soles: la libre menos el aire de los bordes y menos
  // el lugar de las etiquetas (en px, porque son HTML y no escalan).
  const ux0 = banda.x0 + HERO_MARGEN_X * w + LABEL_X;
  const ux1 = banda.x1 - HERO_MARGEN_X * w - LABEL_X;
  const uy0 = banda.y0 + HERO_MARGEN_Y * h + LABEL_Y;
  const uy1 = banda.y1 - HERO_MARGEN_Y * h - LABEL_Y;
  // → NDC. Ojo: en y el NDC crece hacia ARRIBA y los px hacia abajo.
  const nx0 = (2 * ux0) / w - 1;
  const nx1 = (2 * ux1) / w - 1;
  const ny0 = 1 - (2 * uy1) / h;
  const ny1 = 1 - (2 * uy0) / h;
  // Guarda contra una banda absurda (un layout roto no puede meter la cámara
  // adentro del sol).
  const bw = Math.max(0.2, nx1 - nx0);
  const bh = Math.max(0.2, ny1 - ny0);
  const dist = Math.max(
    (CL.t + CL.b) / (bh * TAN_HALF_FOV),
    (CL.r + CL.l) / (bw * TAN_HALF_FOV * aspect),
  );
  const hv = dist * TAN_HALF_FOV; // semialto visible a esa distancia
  const hw = hv * aspect;
  _hero.dist = dist;
  // Centro de la banda, corrido para que el centro del BBOX (no el del sol)
  // caiga justo ahí. El signo se invierte: la cámara mira al lado opuesto de
  // donde queremos que aparezca el cúmulo.
  _hero.pan = -((nx0 + nx1) / 2 + (CL.l - CL.r) / (2 * hw));
  _hero.lift = (ny0 + ny1) / 2 + (CL.b - CL.t) / (2 * hv);
}
/** Órbita hacia el nodo activo (0 = de frente como la portada, 1 = encarándolo
 * de lleno). Fuerte: la cámara SE VA hacia el sol de la sección y lo pone
 * adelante → se lee clarísimo que la sección es ESE sol. Un poco menos que de
 * lleno para que el giro no maree y el resto del cúmulo quede en cuadro.
 * Que los demás soles sigan clickeables NO depende de esto: depende de
 * `occludedByCore` (solo se desactiva lo que el sol central tapa de verdad). */
const TILT = 0.78;

/* Waypoints de la ruta de cámara: 0 = overview (la portada, de frente); k =
 * 1..N = nodo k (orbitado hacia su dirección). Con el cúmulo quieto el objetivo
 * de cada tópico es una constante: la cámara siempre llega al mismo encuadre. */
function wpDir(k: number, out: THREE.Vector3) {
  if (k <= 0) {
    out.copy(_z);
    return;
  }
  const d = nodos[k - 1].dir;
  // Interpola entre el frente (+z) y la dirección del nodo por TILT.
  out.set(d[0], d[1], d[2]).normalize().multiplyScalar(TILT);
  out.addScaledVector(_z, 1 - TILT).normalize();
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
  bandaRef,
}: {
  camRef: RefObject<CamState>;
  reduced: boolean;
  radius: number;
  /** ping por frame mientras la cámara AÚN se mueve de verdad. */
  onActivity?: () => void;
  bandaRef: RefObject<Banda>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const rBall = radius * S;
  const aspect = size.width / Math.max(1, size.height);
  // Distancia en un TÓPICO. Calibrada contra BALL_R exacto; en pantallas
  // angostas la cámara se aleja para que el cúmulo entre completo a lo ancho
  // (por eso /aspect). Con la órbita parcial (TILT) el cúmulo se mantiene
  // entero en toda sección.
  //
  // Este número NO se toca para agrandar el modelo: está en su límite. Bajarlo
  // a 3.95 (un 6% más grande) deja el sol de Enfoque con el centro a 45px del
  // borde superior en la vista de Contacto, o sea cortado. Para dejarle 70px de
  // aire la distancia no puede bajar de 4.17. El pedido de "más grande" lo
  // absorbe la PORTADA, que es donde sobraba lugar.
  const CLOSE = rBall * Math.max(4.2, 3.55 / aspect);
  const panDe = (k: number, heroPan: number) =>
    k <= 0 ? heroPan : (ladoModelo(k - 1) === "right" ? -1 : 1) * PAN_F;
  const liftDe = (k: number, heroLift: number) => (k <= 0 ? heroLift : LIFT);

  useFrame((_, delta) => {
    const st = camRef.current;
    const N = nodos.length;
    const t = reduced ? 0 : THREE.MathUtils.clamp(st.t, 0, N);

    // El encuadre de la PORTADA sale de la banda libre, que se mide contra el
    // DOM y cambia sin re-render (resize, carga de la fuente) → se resuelve por
    // frame. Son cuatro divisiones: más barato que un re-render de React.
    encuadreHero(bandaRef.current, size.width, size.height);
    const OVER = _hero.dist;

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
    // respiro) en vez de rozar el sol.
    if (iA >= 1 && iB >= 1 && iA !== iB) {
      dist += Math.sin(Math.PI * fs) * rBall * BREATHE;
    }
    _target.copy(_dir).multiplyScalar(dist);

    // Punto de mira: pan lateral (el cúmulo queda del lado del modelo) + una
    // ELEVACIÓN constante (mira por debajo del centro → el cúmulo sube: portada
    // centrada y soles despegados del nav-bar en los tópicos).
    const pan = THREE.MathUtils.lerp(
      panDe(iA, _hero.pan),
      panDe(iB, _hero.pan),
      fs,
    );
    const lift = THREE.MathUtils.lerp(
      liftDe(iA, _hero.lift),
      liftDe(iB, _hero.lift),
      fs,
    );
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
}: {
  onProject?: (p: NodeProj[]) => void;
  radius: number;
}) {
  const { camera, size } = useThree();
  const buf = useRef<NodeProj[]>([]);
  const rNode = NODE_RING * S; // mismo anillo que las posiciones de los mini-soles
  const sunWorldR = radius * 0.085 * S * 1.3; // radio del sol (promedio con foco)
  const coreR = radius * 0.5 * S; // radio del sol central (el único que tapa)
  useFrame(() => {
    if (!onProject) return;
    const b = buf.current;
    for (let i = 0; i < nodos.length; i++) {
      const d = nodos[i].dir;
      // Misma posición (fija) que los mini-soles en GraphNodes.
      _v.set(d[0], d[1], d[2]).normalize().multiplyScalar(rNode);
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
  bandaRef,
}: {
  camRef: RefObject<CamState>;
  activeIndex: number;
  hovered: number;
  reduced: boolean;
  lite: boolean;
  onReady?: () => void;
  onProject?: (p: NodeProj[]) => void;
  onActivity?: () => void;
  bandaRef: RefObject<Banda>;
}) {
  return (
    <>
      {/* Estudio blanco 3D: cúpula (pared + piso) + sombra del sol en el piso.
          Los soles son shaders sin iluminar → no hacen falta luces. */}
      <Studio />
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
        bandaRef={bandaRef}
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
  /** El hueco que el layout le deja al cúmulo en la portada (medido en el DOM). */
  bandaRef: RefObject<Banda>;
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
  bandaRef,
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
          bandaRef={bandaRef}
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

