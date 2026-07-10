/**
 * Shader de "mini sol / estrella" para los nodos (GLSL a mano — la fortaleza; nada
 * de SVG ni post-proceso). Da un orbe radiante: núcleo blanco-caliente, plasma
 * granulado (fbm), caída a oro y un borde tipo corona (Fresnel EN la superficie,
 * no un halo/glow externo). Es ESTÁTICO (sin uTime) → compatible con el render
 * on-demand (el canvas se pausa en reposo) y de costo trivial.
 *
 * Uniforms:
 *   uBright  — multiplicador de brillo (1 normal, ~1.5 para el nodo activo).
 *   uCore/uMid/uEdge — colores del degradado (blanco-caliente → oro → naranja).
 */
export const sunVertex = /* glsl */ `
  varying vec3 vView;   // normal en espacio de vista (z+ = mirando a cámara)
  varying vec3 vLocal;  // posición local (para el plasma, estable con la rotación)
  void main() {
    vView = normalize(normalMatrix * normal);
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sunFragment = /* glsl */ `
  precision highp float;
  uniform float uBright;
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform vec3 uEdge;
  varying vec3 vView;
  varying vec3 vLocal;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
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
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // "facing" = cuánto mira a la cámara (1 al centro visible, 0 en el borde).
    float facing = clamp(vView.z, 0.0, 1.0);
    float fres = pow(1.0 - facing, 2.3); // corona en el borde (sobre la superficie)

    // Plasma: granulado estable en el espacio local del nodo (dos escalas).
    float p = fbm(vLocal * 7.0) * 0.65 + fbm(vLocal * 18.0) * 0.35;

    // Núcleo caliente al centro → oro → naranja en el borde.
    vec3 col = mix(uMid, uCore, smoothstep(0.25, 1.0, facing));
    col = mix(col, uEdge, fres);
    col *= 0.78 + 0.6 * p;            // manchas de plasma (sunspots/fáculas)
    col += uCore * pow(facing, 4.0) * 0.9; // núcleo que satura a blanco (encandila)

    gl_FragColor = vec4(col * uBright, 1.0);
  }
`;
