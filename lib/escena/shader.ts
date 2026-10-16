/**
 * El SHADER de la escena (WebGL 2, GLSL ES 3.00). Un triángulo de pantalla
 * completa; todo lo demás es este fragment shader:
 *
 *  1. ESTUDIO: la luz cobalto que cae a azul noche, con grano.
 *  2. LO IMPRESO EN EL FONDO: las placas (los títulos, dibujados una vez en una
 *     textura con Doval Grotesk) y las fotos de Feli con el pie fundido.
 *  3. LA GOTA: una gota de vidrio claro hecha con raymarching de una SDF (un
 *     huevo con una ondulación lenta y una gotita satélite unida con smin).
 *     Con el mouse sobre un link de la nav, vuela hasta ahí y se transforma en
 *     una píldora del tamaño del link (mezcla de SDFs: huevo → caja redondeada).
 *     Refracta lo impreso con dispersión por canal (IOR 1,47 a 1,515), refleja
 *     un estudio con softbox y dos tiras de luz, y tiene un brillo duro.
 *  4. VIDRIO AHUMADO: los paneles de la UI (data-vidrio) refractan lo que tienen
 *     detrás con un bisel, se ahuman hacia Noche y llevan un canto de luz. Con
 *     el mouse encima: una lente bajo el puntero, un reflejo que lo sigue y el
 *     canto más encendido de ese lado. Al tocar, una onda recorre el vidrio.
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
uniform sampler2D uP0, uP1, uP2, uF0, uF1, uK0, uK1, uPapel;
uniform float uGrano; // 0 hasta que carga el papel
uniform vec4 uPR0, uPR1, uPR2, uFR0, uFR1, uKR0, uKR1;
uniform vec3 uC;
uniform float uR;
uniform vec4 uV[${MAX_VIDRIOS}];
uniform vec4 uVX[${MAX_VIDRIOS}];
uniform int uNV;
uniform vec2 uM;   // el puntero (px)
uniform vec4 uOnda; // la onda al tocar: x, y, edad (s), fuerza
uniform vec3 uForma; // la gota hecha botón: medio ancho, medio alto, cuánto (0 gota, 1 botón)

const vec3 NOCHE = vec3(.027, .078, .28);
const vec3 COB = vec3(.085, .2, .72);
const vec3 CREMA = vec3(.949, .933, .902);

vec3 estudio(vec2 p){
  vec2 q = p / uRes;
  float d = length((q - vec2(.6, .4)) * vec2(1., 1.25));
  vec3 col = mix(COB, NOCHE, smoothstep(0., .9, d));
  col = mix(col, vec3(.32, .52, 1.), smoothstep(.4, 0., d) * .13);
  col *= 1. - .22 * smoothstep(.7, 1., q.y);
  // EL PAPEL (v8.1): el estudio es un pliego de papel cianotipo. El grano fino
  // y, mucho más grande, la exposición despareja del sol (la misma textura)
  float grano = texture(uPapel, p / 620.).r - .5;
  float mancha = texture(uPapel, p / 2600. + .37).r - .5;
  col *= 1. + uGrano * (grano * .32 + mancha * .24);
  return col;
}

vec4 tx(sampler2D s, vec4 r, vec2 p){
  vec2 q = (p - r.xy) / r.zw;
  if (r.z < 1. || q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) return vec4(0);
  return texture(s, q);
}

// un cianotipo: luz celeste donde estaban los objetos (alfa), que se funde en
// los bordes de su caja para no cortar en seco contra la sección vecina
vec4 ciano(sampler2D s, vec4 r, vec2 p){
  vec2 q = (p - r.xy) / r.zw;
  if (r.z < 1. || q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) return vec4(0);
  vec4 c = texture(s, q);
  c.a *= smoothstep(0., .12, q.y) * smoothstep(1., .82, q.y) * smoothstep(0., .03, q.x) * smoothstep(1., .97, q.x);
  return c;
}

vec3 fondo(vec2 p){
  vec3 col = estudio(p);
  // EL FONDO DE LA SECCIÓN: los objetos de todos los días, como luz baja sobre
  // el estudio (que se lea el título); la gota encima los agranda
  vec4 k = ciano(uK0, uKR0, p);
  col = mix(col, k.rgb, k.a * .12);
  k = ciano(uK1, uKR1, p);
  col = mix(col, k.rgb, k.a * .12);
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

// una caja redondeada (con extremos de media caña es una píldora)
float sdCaja(vec3 q, vec3 b, float r){
  vec3 d = abs(q) - b + r;
  return length(max(d, 0.)) + min(max(d.x, max(d.y, d.z)), 0.) - r;
}

float mapa(vec3 p){
  p -= uC;
  float t = uT * .4, m = uForma.z;
  // la gota: un huevo que ondula lento
  float d = length(p / vec3(1., 1.18, 1.)) - uR;
  d += uR * .035 * (1. - .6 * m) * sin(p.x / uR * 3.1 + t) * sin(p.y / uR * 2.7 - t * .8) * sin(p.z / uR * 2.3 + t * .6);
  // la gota hecha botón: una píldora de vidrio del tamaño del link
  if (m > .001) {
    float hy = max(uForma.y, 1.);
    float pil = sdCaja(p, vec3(max(uForma.x, hy), hy, hy * .85), hy * .98);
    d = mix(d, pil, m);
  }
  // la gotita satélite se reabsorbe cuando la gota se vuelve botón
  vec3 g = vec3(uR * .95, -uR * .95 + uR * .12 * sin(t * .7), uR * .15);
  if (m < .99) d = smin(d, length(p - g) - uR * .16 * (1. - m), uR * .22 * (1. - m) + .01);
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

float sdRR(vec2 p, vec2 b, float r){
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r;
}

vec3 gota(vec2 p, vec3 col){
  if (uR < 2. || length(p - uC.xy) > max(uR * 1.8, uForma.x * uForma.z * 1.3 + uR * 1.2)) return col;
  float m = uForma.z;
  // hecha botón, la vista es frontal (sin perspectiva): una píldora tan chica
  // y tan arriba se vería torcida
  vec3 ro = vec3(p, uR * 3.), rd = normalize(vec3((p - uRes * .5) * .00035 * (1. - m), -1.));
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
    // reflexión total: en la gota grande, el entorno; en la píldora, que es
    // finita, la luz igual cruza (sin esto el canto se ve como goma negra)
    if (dot(rd3, rd3) < .01) v = mix(entorno(reflect(rd2, n2)), fondo(q.xy) * 1.35 + .05, m);
    else { float s = (-uR * .55 - q.z) / rd3.z; v = fondo(q.xy + rd3.xy * s); }
    rgb[k] = v[k];
  }
  rgb *= exp(-ti * vec3(.0005, .00025, .0001));
  vec3 g = mix(rgb, refl, fr);
  g += vec3(1.) * pow(max(dot(reflect(rd, n), normalize(vec3(-.5, -.7, .6))), 0.), 140.) * 1.6 * (1. - m);
  if (m > .001) {
    // LA PÍLDORA. Una burbuja chata: el centro es una lente clara (aclara lo
    // que tiene debajo, a diferencia del vidrio ahumado de la nav), el canto es
    // una línea de luz (fuerte arriba a la izquierda, de donde viene la luz; más
    // suave abajo, donde la luz que la cruzó se junta) y arriba tiene un brillo
    // que se corre con el puntero, como un reflejo de verdad.
    vec2 rel = (pos.xy - uC.xy) / vec2(max(uForma.x, 1.), max(uForma.y, 1.));
    float borde = 1. - clamp(n.z, 0., 1.);
    vec2 nd = n.xy / max(length(n.xy), 1e-4);
    float luz = dot(nd, normalize(vec2(-.55, -.83)));
    vec3 pil = g * 1.12 + vec3(.012, .02, .05);
    float canto = smoothstep(.5, .9, borde);
    // el espesor: justo antes del canto el vidrio se ve un poco más oscuro
    pil *= 1. - .14 * smoothstep(.12, .45, borde) * (1. - canto);
    pil = mix(pil, CREMA, canto * (.85 * smoothstep(-.2, .9, luz) + .32 * smoothstep(.1, -.9, luz)));
    float bx = clamp((uM.x - uC.x) / max(uForma.x, 1.), -.7, .7) * .55 - .2;
    float brillo = exp(-pow((rel.x - bx) * 1.9, 2.)) * smoothstep(-.3, -.62, rel.y) * smoothstep(.05, .3, borde) * (1. - canto * .7);
    pil = mix(pil, CREMA, brillo * .62);
    g = mix(g, pil, m);
    // el borde, suavizado con la silueta exacta (el raymarching lo deja dentado)
    float d2 = sdRR(p - uC.xy, vec2(max(uForma.x, uForma.y), uForma.y), uForma.y);
    g = mix(col, g, mix(1., clamp(.5 - d2, 0., 1.), m));
  }
  return g;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uS - gl_FragCoord.y) / uS;
  vec3 col = fondo(p);
  // la sombra suave que la gota deja en el estudio
  float sh = uR < 2. ? 0. : smoothstep(uR * 1.6, uR * .3, length((p - (uC.xy + vec2(uR * .3, uR * .25))) * vec2(.7, .9)));
  col *= 1. - .22 * sh * (1. - uForma.z);
  // la gota va debajo del vidrio de la UI... salvo cuando se vuelve botón: ahí
  // se apoya ENCIMA de la nav, como una píldora de vidrio sobre el link
  bool encima = uForma.z > .5;
  if (!encima) col = gota(p, col);

  // VIDRIO de la UI. Por panel (uVX): x radio, y hover (0..1), z presencia
  // (0..1: las filas se vuelven vidrio al pasar el mouse), w tipo (0 ahumado,
  // 1 claro, como una gota). Si hay paneles anidados gana el último del DOM.
  float mejor = 1e5;
  vec4 R = vec4(0), X = vec4(0);
  for (int i = 0; i < ${MAX_VIDRIOS}; i++) {
    if (i >= uNV) break;
    vec4 r = uV[i];
    float rad = min(uVX[i].x, min(r.z, r.w) * .5);
    float d = sdRR(p - r.xy - r.zw * .5, r.zw * .5, rad);
    if (d < 0.) { mejor = d; R = r; X = uVX[i]; X.x = rad; }
  }
  if (mejor < 0.) {
    vec2 c = R.xy + R.zw * .5, hb = R.zw * .5;
    vec2 g = vec2(
      sdRR(p - c + vec2(1, 0), hb, X.x) - sdRR(p - c - vec2(1, 0), hb, X.x),
      sdRR(p - c + vec2(0, 1), hb, X.x) - sdRR(p - c - vec2(0, 1), hb, X.x));
    g /= max(length(g), 1e-4);
    float h = X.y, claro = X.w, chico = min(R.z, R.w);
    float W = min(18., chico * .3);
    float bis = pow(1. - clamp(-mejor / W, 0., 1.), 2.2);
    vec2 o2 = g * ((30. + 14. * claro) * bis);
    // la lente: con el mouse encima, lo que está debajo del puntero se agranda
    vec2 dm = p - uM;
    float rl = max(chico * .9, 34.);
    float lente = h * exp(-dot(dm, dm) / (rl * rl));
    vec2 base = c + (p - c) * (.94 - .05 * claro) - dm * .16 * lente;
    // la onda al tocar: un frente circular que dobla el vidrio
    vec2 dr = p - uOnda.xy;
    float rr = length(dr);
    float onda = uOnda.w * exp(-uOnda.z * 2.8) * exp(-pow((rr - uOnda.z * 520.) / 24., 2.));
    o2 += dr / max(rr, 1.) * onda * 16.;
    vec3 v;
    if (uQ > .5) v = vec3(fondo(base + o2 * .94).r, fondo(base + o2).g, fondo(base + o2 * 1.08).b);
    else v = fondo(base + o2);
    if (!encima) v = gota(base + o2, v);
    // la píldora flota apenas sobre la nav: deja una sombra corta debajo
    else {
      float ds = sdRR(p - uC.xy - vec2(0., 3.), vec2(max(uForma.x, uForma.y), uForma.y), uForma.y);
      v *= 1. - .38 * uForma.z * smoothstep(7., -3., ds);
    }
    // el ahumado se aclara con el hover (el vidrio "se enciende"); el claro casi no ahúma
    v = mix(v, NOCHE, .42 - .3 * claro - .2 * h);
    // con el hover el panel toma volumen de cúpula: más luz arriba, menos abajo
    v *= 1. + .1 * h * clamp(-(p.y - c.y) / max(hb.y, 1.), -1., 1.);
    // el reflejo: una mancha de luz que sigue al puntero, corrida hacia la luz
    vec2 qb = (dm + vec2(.12, .28) * chico) / vec2(max(R.w * 1.5, 56.), max(R.w * .62, 26.));
    v = mix(v, CREMA, h * exp(-dot(qb, qb)) * .26);
    // el canto: la luz de arriba a la izquierda, más el lado que mira al puntero;
    // con el hover se engrosa
    float luz = dot(g, normalize(vec2(-.6, -.8)));
    float canto = smoothstep(1.6 + 1.4 * h, 0., -mejor);
    float lado = h * smoothstep(0., 1., dot(g, normalize(uM - c + vec2(1e-3))));
    v = mix(v, CREMA, canto * (smoothstep(-.2, .8, luz) * .55 + lado * .4 + onda * .4));
    // el vidrio claro tiene además el aro interno de una burbuja
    float aro = smoothstep(5., 1.5, -mejor) * (1. - canto);
    v = mix(v, CREMA, aro * claro * smoothstep(.1, .9, luz) * .3);
    col = mix(col, v, X.z);
  }
  if (encima) col = gota(p, col);
  float gr = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (gr - .5) * .028;
  o = vec4(col, 1.);
}`;
