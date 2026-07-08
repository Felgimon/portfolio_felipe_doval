/**
 * Shader de fondo del hero: un campo de "telemetría" muy sutil — ruido agua
 * lento con viñeta hacia el balón. Escrito a mano (GLSL es la fortaleza; nada
 * de SVG). Se usa con el `<shaderMaterial>` nativo de R3F (sin extend).
 */

export const heroBgVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const heroBgFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec2 uFocus;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float flow = fbm(uv * 2.6 + vec2(uTime * 0.03, uTime * 0.015));
    flow += 0.4 * fbm(uv * 5.0 - vec2(uTime * 0.02, 0.0));

    float glow = smoothstep(0.55, 1.05, flow);

    // Viñeta suave centrada en el balón (uFocus)
    float d = distance(uv, uFocus);
    float vignette = smoothstep(0.85, 0.1, d);

    vec3 col = uColor * glow * vignette * 0.5;
    float alpha = glow * vignette * 0.6;
    gl_FragColor = vec4(col, alpha);
  }
`;
