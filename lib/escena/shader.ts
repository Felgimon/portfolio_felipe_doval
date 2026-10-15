/**
 * El SHADER de la escena (WebGL 2, GLSL ES 3.00). Un triángulo de pantalla
 * completa; todo lo demás es este fragment shader:
 *
 *  1. ESTUDIO: la luz cobalto que cae a azul noche, con grano.
 *  2. LO IMPRESO EN EL FONDO: las placas (los títulos, dibujados una vez en una
 *     textura con Doval Grotesk) y las fotos de Feli con el pie fundido.
 *  3. LA GOTA: una gota de vidrio claro hecha con raymarching de una SDF (un
 *     huevo con una ondulación lenta y una gotita satélite unida con smin).
 *     Refracta lo impreso con dispersión por canal (IOR 1,47 a 1,515), refleja
 *     un estudio con softbox y dos tiras de luz, y tiene un brillo duro.
 *  4. VIDRIO AHUMADO: los paneles de la UI (data-vidrio) refractan lo que tienen
 *     detrás con un bisel, se ahuman hacia Noche y llevan un canto de luz.
 *
 * Coordenadas: px CSS con origen arriba a la izquierda (como el DOM).
 */

export const MAX_VIDRIOS = 12;

export const VERTEX = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export const FRAGMENT = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uS, uT, uQ;
uniform sampler2D uP0, uP1, uP2, uF0, uF1;
uniform vec4 uPR0, uPR1, uPR2, uFR0, uFR1;
uniform vec3 uC;
uniform float uR;
uniform vec4 uV[${MAX_VIDRIOS}];
uniform vec4 uVX[${MAX_VIDRIOS}];
uniform int uNV;

const vec3 NOCHE = vec3(.027, .078, .28);
const vec3 COB = vec3(.085, .2, .72);
const vec3 CREMA = vec3(.949, .933, .902);

vec3 estudio(vec2 p){
  vec2 q = p / uRes;
  float d = length((q - vec2(.6, .4)) * vec2(1., 1.25));
  vec3 col = mix(COB, NOCHE, smoothstep(0., .9, d));
  col = mix(col, vec3(.32, .52, 1.), smoothstep(.4, 0., d) * .13);
  col *= 1. - .22 * smoothstep(.7, 1., q.y);
  return col;
}

vec4 tx(sampler2D s, vec4 r, vec2 p){
  vec2 q = (p - r.xy) / r.zw;
  if (r.z < 1. || q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) return vec4(0);
  return texture(s, q);
}

vec3 fondo(vec2 p){
  vec3 col = estudio(p);
  vec4 f = tx(uF0, uFR0, p);
  f.a *= smoothstep(1., .8, (p.y - uFR0.y) / max(uFR0.w, 1.));
  col = mix(col, f.rgb, f.a);
  f = tx(uF1, uFR1, p);
  f.a *= smoothstep(1., .8, (p.y - uFR1.y) / max(uFR1.w, 1.));
  col = mix(col, f.rgb, f.a);
  col = mix(col, CREMA, tx(uP0, uPR0, p).a);
  col = mix(col, CREMA, tx(uP1, uPR1, p).a);
  col = mix(col, CREMA, tx(uP2, uPR2, p).a);
  return col;
}

float smin(float a, float b, float k){
  float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
  return mix(b, a, h) - k * h * (1. - h);
}

float mapa(vec3 p){
  p -= uC;
  float t = uT * .4;
  float d = length(p / vec3(1., 1.18, 1.)) - uR;
  d += uR * .035 * sin(p.x / uR * 3.1 + t) * sin(p.y / uR * 2.7 - t * .8) * sin(p.z / uR * 2.3 + t * .6);
  vec3 g = vec3(uR * .95, -uR * .95 + uR * .12 * sin(t * .7), uR * .15);
  d = smin(d, length(p - g) - uR * .16, uR * .22);
  return d * .85;
}

vec3 nrm(vec3 p){
  vec2 e = vec2(1., 0);
  return normalize(vec3(
    mapa(p + e.xyy) - mapa(p - e.xyy),
    mapa(p + e.yxy) - mapa(p - e.yxy),
    mapa(p + e.yyx) - mapa(p - e.yyx)));
}

vec3 entorno(vec3 d){
  vec3 col = vec3(.01, .025, .09) + vec3(.03, .07, .3) * smoothstep(-.2, .8, -d.y);
  float s1 = smoothstep(.36, .2, length(vec2((d.x + .35) * .8, (d.y + .62) * 1.5)));
  float s2 = smoothstep(.09, .03, abs(d.x - .68)) * smoothstep(.9, .2, abs(d.y + .05));
  float s3 = smoothstep(.08, .02, abs(d.x + .72)) * smoothstep(.7, .1, abs(d.y - .2));
  return col + vec3(1.) * s1 * 2.6 + vec3(1., .72, .38) * s2 * 1.7 + vec3(.45, .75, 1.) * s3 * 1.2;
}

vec3 gota(vec2 p, vec3 col){
  if (uR < 2. || length(p - uC.xy) > uR * 1.8) return col;
  vec3 ro = vec3(p, uR * 3.), rd = normalize(vec3((p - uRes * .5) * .00035, -1.));
  float t = uR * 1.2;
  bool hit = false;
  vec3 pos;
  int pasos = uQ > .5 ? 80 : 44;
  for (int i = 0; i < 80; i++) {
    if (i >= pasos) break;
    pos = ro + rd * t;
    float d = mapa(pos);
    if (d < .4) { hit = true; break; }
    t += d;
    if (t > uR * 5.) break;
  }
  if (!hit) return col;
  vec3 n = nrm(pos);
  float fr = .04 + .96 * pow(1. - max(dot(-rd, n), 0.), 4.);
  vec3 refl = entorno(reflect(rd, n));
  vec3 rd2 = refract(rd, n, 1. / 1.48), q = pos + rd2 * 2.;
  float ti = 0.;
  int adentro = uQ > .5 ? 48 : 24;
  for (int i = 0; i < 48; i++) {
    if (i >= adentro) break;
    float d = -mapa(q);
    if (d < .4) break;
    q += rd2 * max(d, 1.);
    ti += max(d, 1.);
  }
  vec3 n2 = -nrm(q), rgb;
  float iors[3] = float[3](1.47, 1.49, 1.515);
  for (int k = 0; k < 3; k++) {
    vec3 rd3 = refract(rd2, n2, iors[k]);
    vec3 v;
    if (dot(rd3, rd3) < .01) v = entorno(reflect(rd2, n2));
    else { float s = (-uR * .55 - q.z) / rd3.z; v = fondo(q.xy + rd3.xy * s); }
    rgb[k] = v[k];
  }
  rgb *= exp(-ti * vec3(.0005, .00025, .0001));
  vec3 g = mix(rgb, refl, fr);
  g += vec3(1.) * pow(max(dot(reflect(rd, n), normalize(vec3(-.5, -.7, .6))), 0.), 140.) * 1.6;
  return g;
}

float sdRR(vec2 p, vec2 b, float r){
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uS - gl_FragCoord.y) / uS;
  vec3 col = fondo(p);
  // la sombra suave que la gota deja en el estudio
  float sh = uR < 2. ? 0. : smoothstep(uR * 1.6, uR * .3, length((p - (uC.xy + vec2(uR * .3, uR * .25))) * vec2(.7, .9)));
  col *= 1. - .22 * sh;
  col = gota(p, col);

  // vidrio ahumado de la UI: el panel más cercano
  float mejor = 1e5;
  vec4 R = vec4(0), X = vec4(0);
  for (int i = 0; i < ${MAX_VIDRIOS}; i++) {
    if (i >= uNV) break;
    vec4 r = uV[i];
    float rad = min(uVX[i].x, min(r.z, r.w) * .5);
    float d = sdRR(p - r.xy - r.zw * .5, r.zw * .5, rad);
    if (d < mejor) { mejor = d; R = r; X = uVX[i]; X.x = rad; }
  }
  if (mejor < 0.) {
    vec2 c = R.xy + R.zw * .5, hb = R.zw * .5;
    vec2 g = vec2(
      sdRR(p - c + vec2(1, 0), hb, X.x) - sdRR(p - c - vec2(1, 0), hb, X.x),
      sdRR(p - c + vec2(0, 1), hb, X.x) - sdRR(p - c - vec2(0, 1), hb, X.x));
    g /= max(length(g), 1e-4);
    float W = min(18., min(R.z, R.w) * .3);
    float bis = pow(1. - clamp(-mejor / W, 0., 1.), 2.2);
    vec2 o2 = g * (30. * bis);
    vec2 base = c + (p - c) * .94;
    vec3 v;
    if (uQ > .5) v = vec3(fondo(base + o2 * .94).r, fondo(base + o2).g, fondo(base + o2 * 1.08).b);
    else v = fondo(base + o2);
    v = gota(base + o2, v);
    v = mix(v, NOCHE, .42);
    float luz = dot(g, normalize(vec2(-.6, -.8)));
    float canto = smoothstep(1.6, 0., -mejor);
    v = mix(v, CREMA, canto * smoothstep(-.2, .8, luz) * .55);
    col = v;
  }
  float gr = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (gr - .5) * .028;
  o = vec4(col, 1.);
}`;
