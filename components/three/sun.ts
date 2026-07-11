/**
 * Soles del grafo — shaders GLSL a mano + materiales compartidos.
 *
 * Técnica estándar de la comunidad para un sol fotorealista en three.js (un sol
 * no es una malla descargable: es una esfera + shading + luz renderizada):
 *  1. Superficie de PLASMA con domain-warping (fbm alimentado por fbm): la
 *     turbulencia real de la referencia, animada con uTime.
 *  2. Salida HDR (valores > 1, toneMapped=false): el BLOOM selectivo del canvas
 *     toma esos píxeles y derrama la luz sobre la escena → encandila de verdad
 *     (luz renderizada del modelo real, no un halo pegado).
 *  3. Llamas/prominencias: shell con máscara de borde (Fresnel) × fbm animado,
 *     aditivo → lenguas de fuego lamiendo la silueta.
 *  4. Corona: textura radial aditiva (canvas) para el resplandor cercano.
 *
 * La animación corre SOLO en los frames renderizados (compatible con el render
 * on-demand: en reposo el sol queda como foto — como la referencia). En modo
 * lite (render por software) se usa la variante estática y barata.
 */
import * as THREE from "three";

/* ---------- chunks GLSL ---------- */

const CHUNK_NOISE = /* glsl */ `
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

export const sunVertex = /* glsl */ `
  varying vec3 vView;   // normal en espacio de vista (z+ = mirando a cámara)
  varying vec3 vLocal;  // posición local (el plasma es estable en el objeto)
  void main() {
    vView = normalize(normalMatrix * normal);
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Superficie FULL: plasma con domain-warping animado + núcleo blanco-caliente
 * HDR + limbo naranja. La paleta sigue la referencia (rojo profundo → naranja →
 * oro → blanco). */
const sunFragmentFull = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uBright;
  uniform float uInvR;
  varying vec3 vView;
  varying vec3 vLocal;
  ${CHUNK_NOISE}

  void main() {
    float facing = clamp(vView.z, 0.0, 1.0);
    vec3 p = vLocal * uInvR * 3.2;
    float t = uTime * 0.2;

    // Domain warp: fbm alimentado por fbm → turbulencia de plasma real.
    vec3 q = vec3(
      fbm(p + vec3(0.0, 0.0, t)),
      fbm(p + vec3(5.2, 1.3, -t)),
      fbm(p + vec3(2.1, 7.4, t * 0.7))
    );
    float v = fbm(p * 1.9 + q * 1.5);
    float g = fbm(p * 4.6 + q * 2.2 + vec3(0.0, t * 2.6, 0.0)); // granulación

    // Paleta de la referencia: rojo profundo → naranja fuego → oro. El grueso
    // del disco queda en rango LDR (textura visible); SOLO el núcleo y el limbo
    // pasan de 1.0 → el bloom recorta ahí (encandila sin lavar el plasma).
    float heat = clamp(v * 0.85 + g * 0.55, 0.0, 1.3);
    vec3 col = mix(vec3(0.45, 0.05, 0.0), vec3(1.0, 0.33, 0.02), smoothstep(0.1, 0.75, heat));
    col = mix(col, vec3(1.0, 0.72, 0.25), smoothstep(0.62, 1.15, heat));
    // Núcleo blanco-caliente FOCALIZADO (no baña todo el disco)
    col = mix(col, vec3(1.0, 0.96, 0.85), pow(facing, 5.0) * 0.75);
    // Limbo naranja intenso en la silueta
    col += vec3(1.0, 0.3, 0.04) * pow(1.0 - facing, 2.0) * 0.85;

    gl_FragColor = vec4(col * uBright, 1.0);
  }
`;

/** Superficie LITE (render por software): un solo fbm estático, misma paleta. */
const sunFragmentLite = /* glsl */ `
  precision highp float;
  uniform float uTime;  // sin uso (interfaz uniforme)
  uniform float uBright;
  uniform float uInvR;
  varying vec3 vView;
  varying vec3 vLocal;
  ${CHUNK_NOISE}

  void main() {
    float facing = clamp(vView.z, 0.0, 1.0);
    float v = fbm(vLocal * uInvR * 4.0);
    vec3 col = mix(vec3(0.7, 0.16, 0.0), vec3(1.0, 0.62, 0.16), v);
    col = mix(col, vec3(1.0, 0.95, 0.82), pow(facing, 5.0) * 0.8);
    col += vec3(1.0, 0.32, 0.05) * pow(1.0 - facing, 2.2) * 0.8;
    gl_FragColor = vec4(col * uBright, 1.0);
  }
`;

/** Llamas / prominencias: shell aditivo — máscara de borde (Fresnel) × fbm
 * animado con deriva ascendente → lenguas de fuego lamiendo la silueta. El
 * centro queda transparente (el disco del sol se ve intacto). */
const flameFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uInvR;
  varying vec3 vView;
  varying vec3 vLocal;
  ${CHUNK_NOISE}

  void main() {
    float facing = clamp(vView.z, 0.0, 1.0);
    float rim = pow(1.0 - facing, 1.5);
    vec3 p = vLocal * uInvR * 2.3;
    float t = uTime * 0.32;

    float n = fbm(p * 1.6 + vec3(0.0, t * 2.2, 0.0) + fbm(p * 3.1 - vec3(t, 0.0, t)) * 1.2);
    float tongue = smoothstep(0.34, 0.88, n * rim * 2.15);
    vec3 col = mix(vec3(1.0, 0.3, 0.02), vec3(1.0, 0.75, 0.25), n);

    gl_FragColor = vec4(col * 1.6, tongue * 0.95);
  }
`;

/** Protuberancia solar: arco de plasma anclado al limbo (como las erupciones en
 * bucle de la referencia). Es un torus parcial; el fuego es ruido animado que
 * REPTA por el arco, desvaneciéndose en los pies. */
const prominenceVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocal;
  void main() {
    vUv = uv;
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const prominenceFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uInvR;
  varying vec2 vUv;
  varying vec3 vLocal;
  ${CHUNK_NOISE}

  void main() {
    // Los pies del arco se funden con la superficie; el lomo brilla.
    float ends = pow(sin(3.14159265 * vUv.x), 0.75);
    float n = fbm(vLocal * uInvR * 5.0 + vec3(0.0, uTime * 0.4, uTime * 0.22));
    float a = ends * smoothstep(0.18, 0.75, n);
    vec3 col = mix(vec3(0.82, 0.14, 0.02), vec3(1.0, 0.52, 0.1), n);
    col += vec3(1.0, 0.82, 0.45) * pow(n, 3.0) * 0.8;
    gl_FragColor = vec4(col * 1.35, a);
  }
`;

export function makeProminenceMaterial(invR: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: prominenceVertex,
    fragmentShader: prominenceFragment,
    transparent: true,
    depthWrite: false,
    // Blending NORMAL (no aditivo): el fuego tiene cuerpo también contra el
    // cielo claro (el aditivo solo suma luz y desaparece sobre nubes blancas).
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uInvR: { value: invR },
    },
  });
}

/** Ráfaga periódica 0..1: una erupción corta por período (curva sin^8 → sube y
 * baja rápido, el resto del período en calma). */
export function burst(time: number, period: number, phase: number): number {
  const s = Math.sin((time / period + phase) * Math.PI * 2);
  return Math.pow(Math.max(0, s), 8);
}

/* ---------- ráfagas que se DESPRENDEN (eyecciones de plasma) ---------- */

export type EjectaSpec = {
  dir: THREE.Vector3; // dirección radial de salida
  axis: THREE.Vector3; // eje de curl (turbulencia en la trayectoria)
  life: number; // duración del ciclo (s)
  phase: number; // desfase (s) — nunca en sincronía
  travel: number; // distancia máxima (en radios del sol)
  size: number; // tamaño base (en radios del sol)
  curl: number; // giro total de la trayectoria (rad)
  fallback: boolean; // ¿recae al sol? (arco balístico, como una prominencia)
};

/** RNG determinista (mulberry32): specs estables entre renders/SSR, sin
 * Math.random en el cuerpo del componente. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeEjectaSpecs(count: number, seed: number): EjectaSpec[] {
  const r = rng(seed);
  const specs: EjectaSpec[] = [];
  for (let i = 0; i < count; i++) {
    // Sesgo hacia el hemisferio frontal (+z): que se vean desde la cámara.
    const dir = new THREE.Vector3(
      r() * 2 - 1,
      r() * 2 - 1,
      r() * 0.9 + 0.15,
    ).normalize();
    const ref =
      Math.abs(dir.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const axis = new THREE.Vector3().crossVectors(dir, ref).normalize();
    specs.push({
      dir,
      axis,
      life: 3.5 + r() * 4,
      phase: r() * 12,
      travel: 0.5 + r() * 0.9,
      size: 0.16 + r() * 0.2,
      curl: (r() - 0.5) * 1.6,
      fallback: r() < 0.45,
    });
  }
  return specs;
}

const _ejDir = new THREE.Vector3();

/**
 * Anima un pool de ráfagas desprendidas: cada partícula nace en el limbo, se
 * DESPRENDE desacelerando (√p: rápida al salir, se frena — como plasma contra
 * la gravedad), con curl turbulento en la trayectoria; se hincha y se DESVANECE.
 * Las "fallback" suben y RECAEN al sol (arco balístico de prominencia real).
 * `strength` 0..1 escala la opacidad (p.ej. el foco del sol).
 */
export function updateEjecta(
  sprites: (THREE.Sprite | null)[],
  specs: EjectaSpec[],
  time: number,
  R: number,
  strength: number,
) {
  for (let i = 0; i < specs.length; i++) {
    const s = sprites[i];
    if (!s) continue;
    const e = specs[i];
    const p = ((time + e.phase) % e.life) / e.life; // progreso 0..1
    const up = e.fallback ? Math.sin(Math.PI * p) : Math.sqrt(p);
    const rad = R * (1.02 + e.travel * up);
    _ejDir.copy(e.dir).applyAxisAngle(e.axis, e.curl * p);
    s.position.copy(_ejDir).multiplyScalar(rad);
    const grow = Math.sin(Math.PI * Math.min(p * 1.25, 1));
    const sc = R * e.size * (0.5 + grow);
    s.scale.set(sc, sc, 1);
    // entrada rápida, desvanecimiento largo
    const o = Math.min(p * 6, 1) * Math.pow(1 - p, 1.6);
    (s.material as THREE.SpriteMaterial).opacity = o * 0.7 * strength;
  }
}

/* ---------- factorías de materiales / texturas ---------- */

export function makeSunMaterial(opts: {
  bright: number;
  invR: number;
  animated: boolean;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: opts.animated ? sunFragmentFull : sunFragmentLite,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uBright: { value: opts.bright },
      uInvR: { value: opts.invR },
    },
  });
}

export function makeFlameMaterial(invR: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: flameFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uInvR: { value: invR },
    },
  });
}

/** Textura de corona: destello radial cálido generado en canvas. Aditiva sobre
 * el cielo, cubre el resplandor cercano; el bloom hace el derrame lejano. */
export function makeCoronaTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,240,210,0.55)");
  g.addColorStop(0.2, "rgba(255,210,120,0.42)");
  g.addColorStop(0.45, "rgba(255,160,60,0.2)");
  g.addColorStop(0.75, "rgba(255,120,34,0.06)");
  g.addColorStop(1, "rgba(255,110,28,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Avanza el tiempo de los shaders acumulando el DELTA de cada frame renderizado
 * (tiempo propio: inmune a cualquier stop/reset del clock de fiber al alternar
 * frameloop). Llamar desde useFrame. */
export function advanceSuns(
  delta: number,
  ...mats: (THREE.ShaderMaterial | null)[]
) {
  const d = Math.min(delta, 0.1);
  for (const m of mats) {
    if (m) m.uniforms.uTime.value += d;
  }
}

/** Rotación lenta de un sol (movimiento inequívoco del plasma: la textura vive
 * en el espacio local del mesh, así que girar el mesh gira el plasma). */
export function spinSun(obj: THREE.Object3D, radPerSec: number, delta: number) {
  obj.rotation.y += radPerSec * Math.min(delta, 0.1);
}
