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

/** Textura fotográfica del sol (Solar System Scope, CC-BY 4.0 — derivada de
 * imágenes NASA/SDO). El realismo base sale de la FOTO; el shader la hace
 * hervir. */
export const SUN_TEX = "/textures/sol.jpg";

/** Prepara la textura solar (mutación imperativa fuera de componentes). */
export function prepSunTexture(t: THREE.Texture) {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
}

export const sunVertex = /* glsl */ `
  varying vec3 vView;   // normal en espacio de vista (z+ = mirando a cámara)
  varying vec3 vLocal;  // posición local (el plasma es estable en el objeto)
  varying vec2 vUv;     // UV equirectangular (para la foto solar)
  void main() {
    vView = normalize(normalMatrix * normal);
    vLocal = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Superficie FULL: la FOTO solar real (granulación NASA/SDO) muestreada con
 * UVs DISTORSIONADAS por el domain-warp animado → la fotografía HIERVE. El
 * calor procedural modula el brillo (fáculas vivas); solo el núcleo y el limbo
 * pasan de 1.0 → el bloom encandila sin lavar el detalle fotográfico. */
const sunFragmentFull = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uBright;
  uniform float uInvR;
  uniform sampler2D uMap;
  varying vec3 vView;
  varying vec3 vLocal;
  varying vec2 vUv;
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
    float heat = clamp(v * 0.8 + g * 0.5, 0.0, 1.25);

    // La foto real, hirviendo: UVs desplazadas por el warp + deriva lenta
    // (rotación diferencial del plasma sobre la superficie).
    vec2 uv = vUv + (vec2(q.x, q.y) - 0.5) * 0.06 + vec2(uTime * 0.0035, 0.0);
    vec3 tex = texture2D(uMap, uv).rgb;

    vec3 col = tex * (0.72 + 0.75 * heat);
    col = mix(col, vec3(1.0, 0.72, 0.25), smoothstep(0.78, 1.2, heat) * 0.3);
    // Núcleo blanco-caliente FOCALIZADO (no baña todo el disco)
    col = mix(col, vec3(1.0, 0.96, 0.88), pow(facing, 5.0) * 0.55);
    // Limbo naranja intenso en la silueta
    col += vec3(1.0, 0.32, 0.05) * pow(1.0 - facing, 2.0) * 0.8;

    gl_FragColor = vec4(col * uBright, 1.0);
  }
`;

/** Superficie LITE (render por software): la foto + un fbm estático. */
const sunFragmentLite = /* glsl */ `
  precision highp float;
  uniform float uTime;  // sin uso (interfaz uniforme)
  uniform float uBright;
  uniform float uInvR;
  uniform sampler2D uMap;
  varying vec3 vView;
  varying vec3 vLocal;
  varying vec2 vUv;
  ${CHUNK_NOISE}

  void main() {
    float facing = clamp(vView.z, 0.0, 1.0);
    vec3 tex = texture2D(uMap, vUv).rgb;
    float v = fbm(vLocal * uInvR * 4.0);
    vec3 col = tex * (0.8 + 0.45 * v);
    col = mix(col, vec3(1.0, 0.95, 0.85), pow(facing, 5.0) * 0.6);
    col += vec3(1.0, 0.32, 0.05) * pow(1.0 - facing, 2.2) * 0.7;
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
  uniform float uAlpha; // sobre de vida (erupción → colapso), desde JS
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
    gl_FragColor = vec4(col * 1.35, a * uAlpha);
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
      uAlpha: { value: 0 },
    },
  });
}

/* ---------- protuberancias VIVAS (erupción → colapso → renacen en otro lado) */

const _pDir = new THREE.Vector3();
const _pX = new THREE.Vector3(1, 0, 0);
const _pQ = new THREE.Quaternion();
const _pQr = new THREE.Quaternion();

function hash1(n: number): number {
  return Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
}

/** Re-ancla un arco en un punto NUEVO del limbo: cada renacimiento erupciona en
 * otro lugar, con otro roll — como las protuberancias reales del SDO. */
function anchorProminence(
  g: THREE.Group,
  cycle: number,
  slot: number,
  R: number,
) {
  const n = cycle * 7.13 + slot * 131.71;
  const az = hash1(n) * Math.PI * 2;
  const z = 0.15 + 0.6 * hash1(n + 1.7); // sesgo frontal (que se vean)
  const s = Math.sqrt(Math.max(0, 1 - z * z));
  _pDir.set(Math.cos(az) * s, Math.sin(az) * s, z).normalize();
  _pQ.setFromUnitVectors(_pX, _pDir);
  _pQr.setFromAxisAngle(_pDir, hash1(n + 3.9) * Math.PI * 2);
  g.quaternion.copy(_pQr.multiply(_pQ));
  g.position.copy(_pDir).multiplyScalar(R * 0.9);
}

/**
 * Ciclo de vida de las protuberancias: cada arco ERUPCIONA desde el limbo
 * (crece anclado a sus pies), se sostiene mientras se sigue estirando, COLAPSA
 * y se desvanece; al renacer lo hace en OTRO punto del limbo — siempre hay
 * ráfagas nuevas formándose y muriendo, nunca en sincronía (vidas distintas).
 */
export function updateProminences(
  groups: (THREE.Group | null)[],
  mats: THREE.ShaderMaterial[],
  lastCycle: number[],
  time: number,
  R: number,
) {
  for (let i = 0; i < mats.length; i++) {
    const g = groups[i];
    if (!g) continue;
    const life = 9 + i * 2.6; // segundos por ciclo (distinto por arco)
    const local = time + i * 4.3;
    const cycle = Math.floor(local / life);
    const p = (local % life) / life;
    if (cycle !== lastCycle[i]) {
      lastCycle[i] = cycle;
      anchorProminence(g, cycle, i, R);
    }
    // Sobre de vida: erupción rápida → meseta (sigue creciendo) → colapso.
    const rise = THREE.MathUtils.smoothstep(p, 0, 0.2);
    const fall = 1 - THREE.MathUtils.smoothstep(p, 0.72, 1);
    const env = rise * fall;
    const grow = 0.8 + 0.35 * p;
    const size = 0.75 + 0.5 * hash1(cycle * 3.7 + i * 17.3);
    g.scale.setScalar(Math.max(env * grow * size, 0.0001));
    mats[i].uniforms.uAlpha.value = env;
  }
}

/** Ráfaga periódica 0..1: una erupción corta por período (curva sin^8 → sube y
 * baja rápido, el resto del período en calma). */
export function burst(time: number, period: number, phase: number): number {
  const s = Math.sin((time / period + phase) * Math.PI * 2);
  return Math.pow(Math.max(0, s), 8);
}

/* ---------- factorías de materiales / texturas ---------- */

export function makeSunMaterial(opts: {
  bright: number;
  invR: number;
  animated: boolean;
  map: THREE.Texture;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: opts.animated ? sunFragmentFull : sunFragmentLite,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uBright: { value: opts.bright },
      uInvR: { value: opts.invR },
      uMap: { value: opts.map },
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
