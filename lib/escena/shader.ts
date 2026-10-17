/**
 * El SHADER de la escena (WebGL 2, GLSL ES 3.00). Un triángulo de pantalla
 * completa; todo lo demás es este fragment shader:
 *
 *  1. ESTUDIO: la luz cobalto que cae a azul noche, con grano.
 *  2. LO IMPRESO EN EL FONDO: las placas (los títulos, dibujados una vez en una
 *     textura con Doval Grotesk) y las fotos de Feli con el pie fundido.
 *  3. LAS BURBUJAS (v9): varias gotas de vidrio claro por sección, hechas con
 *     raymarching de una sola SDF (cada una un huevo que ondula lento, todas
 *     unidas con smin: si se acercan, se funden como líquido). Con el mouse
 *     sobre algo que se toca, las de la pantalla vuelan hasta ahí, se juntan y
 *     se vuelven una sola píldora del tamaño del botón (mezcla de SDFs: huevo
 *     → caja redondeada); al volar se estiran en la dirección en la que van.
 *     Refractan lo impreso con dispersión por canal (IOR 1,47 a 1,515),
 *     reflejan un estudio con softbox y dos tiras de luz, y tienen un brillo duro.
 *  4. VIDRIO AHUMADO: los paneles de la UI (data-vidrio) refractan lo que tienen
 *     detrás con un bisel, se ahuman hacia Noche y llevan un canto de luz. Con
 *     el mouse encima: una lente bajo el puntero, un reflejo que lo sigue y el
 *     canto más encendido de ese lado. Al tocar, una onda recorre el vidrio.
 *
 * Coordenadas: px CSS con origen arriba a la izquierda (como el DOM).
 */

export const MAX_VIDRIOS = 12;
export const MAX_BURBUJAS = 8;

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
uniform vec2 uKF; // cuánto se funden los bordes de cada cianotipo (1 los que van a sangre)
uniform vec4 uB[${MAX_BURBUJAS}];  // cada burbuja: x, y, radio, cuánto es botón (0..1)
uniform vec4 uBF[${MAX_BURBUJAS}]; // su forma de botón (medio ancho, medio alto) y su velocidad (px/s)
uniform int uNB;
uniform float uArriba; // 1 cuando las burbujas son un botón: van encima del vidrio de la UI
uniform vec4 uV[${MAX_VIDRIOS}];
uniform vec4 uVX[${MAX_VIDRIOS}];
uniform int uNV;
uniform vec2 uM;   // el puntero (px)
uniform vec4 uOnda; // la onda al tocar: x, y, edad (s), fuerza

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
vec4 ciano(sampler2D s, vec4 r, vec2 p, float f){
  vec2 q = (p - r.xy) / r.zw;
  if (r.z < 1. || q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) return vec4(0);
  vec4 c = texture(s, q);
  // los que van a sangre se funden contra la sección vecina; las composiciones
  // ya traen su aire alrededor y no se tocan
  float borde = smoothstep(0., .12, q.y) * smoothstep(1., .82, q.y) * smoothstep(0., .03, q.x) * smoothstep(1., .97, q.x);
  c.a *= mix(1., borde, f);
  return c;
}

vec3 fondo(vec2 p){
  vec3 col = estudio(p);
  // EL FONDO DE LA SECCIÓN: los objetos de todos los días, como luz baja sobre
  // el estudio (que se lea el título); la gota encima los agranda
  vec4 k = ciano(uK0, uKR0, p, uKF.x);
  col = mix(col, k.rgb, k.a * .24);
  k = ciano(uK1, uKR1, p, uKF.y);
  col = mix(col, k.rgb, k.a * .24);
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

// las burbujas cerca del píxel que se está pintando (las demás no se evalúan)
int cerca[${MAX_BURBUJAS}];
int nCerca;

// una burbuja sola
float burbuja(vec3 p, int i){
  vec4 B = uB[i], F = uBF[i];
  vec3 q = p - vec3(B.xy, 0.);
  float r = B.z, m = B.w;
  // volando, se estira en la dirección en la que va (como una gota que cae)
  float v = length(F.zw);
  if (v > 1.) {
    vec2 u = F.zw / v;
    float s = min(v / 1800., .45) * (1. - m);
    q.xy -= u * dot(q.xy, u) * (s / (1. + s));
  }
  float t = uT * .4 + float(i) * 1.7;
  // un huevo que ondula lento (cada una a su ritmo)
  float d = length(q / vec3(1., 1.18, 1.)) - r;
  d += r * .035 * (1. - .6 * m) * sin(q.x / r * 3.1 + t) * sin(q.y / r * 2.7 - t * .8) * sin(q.z / r * 2.3 + t * .6);
  // hecha botón: una píldora de vidrio de su tamaño
  if (m > .001) {
    float hy = max(F.y, 1.);
    d = mix(d, sdCaja(q, vec3(max(F.x, hy), hy, hy * .85), hy * .98), m);
  }
  return d;
}

// todas juntas: smin las funde cuando se tocan; hechas botón, la unión es exacta
float mapa(vec3 p){
  float d = 1e5;
  for (int j = 0; j < ${MAX_BURBUJAS}; j++) {
    if (j >= nCerca) break;
    int i = cerca[j];
    float e = burbuja(p, i);
    d = j == 0 ? e : smin(d, e, uB[i].z * .6 * (1. - uB[i].w) + 1.);
  }
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
  // cuáles están cerca de este píxel (con margen para el puente que hace smin)
  nCerca = 0;
  float rmax = 0., mmax = 0.;
  for (int i = 0; i < ${MAX_BURBUJAS}; i++) {
    if (i >= uNB) break;
    vec4 B = uB[i], F = uBF[i];
    float s = min(length(F.zw) / 1800., .45) * (1. - B.w);
    float ext = mix(B.z * 1.2 * (1. + s), max(F.x, F.y) * 1.05, B.w) + B.z * .6 * (1. - B.w) + 6.;
    if (B.z > 1. && length(p - B.xy) < ext) {
      cerca[nCerca] = i;
      nCerca++;
      rmax = max(rmax, max(B.z, F.y));
      mmax = max(mmax, B.w);
    }
  }
  if (nCerca == 0) return col;
  // hecha botón, la vista es frontal (sin perspectiva): una píldora tan chica
  // y tan arriba se vería torcida
  vec3 ro = vec3(p, rmax * 3.), rd = normalize(vec3((p - uRes * .5) * .00035 * (1. - mmax), -1.));
  float t = rmax * 1.2;
  bool hit = false;
  vec3 pos;
  int pasos = uQ > .5 ? 80 : 44;
  for (int i = 0; i < 80; i++) {
    if (i >= pasos) break;
    pos = ro + rd * t;
    float d = mapa(pos);
    if (d < .4) { hit = true; break; }
    t += d;
    if (t > rmax * 5.) break;
  }
  if (!hit) return col;
  // la burbuja que manda en este punto (para su brillo y su canto de botón)
  int h = cerca[0];
  float mejor = 1e5;
  for (int j = 0; j < ${MAX_BURBUJAS}; j++) {
    if (j >= nCerca) break;
    float e = burbuja(pos, cerca[j]);
    if (e < mejor) { mejor = e; h = cerca[j]; }
  }
  vec2 C = uB[h].xy;
  float R = uB[h].z;
  vec3 forma = vec3(uBF[h].xy, uB[h].w);
  float m = forma.z;
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
    else { float s = (-R * .55 - q.z) / rd3.z; v = fondo(q.xy + rd3.xy * s); }
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
    vec2 rel = (pos.xy - C.xy) / vec2(max(forma.x, 1.), max(forma.y, 1.));
    float borde = 1. - clamp(n.z, 0., 1.);
    vec2 nd = n.xy / max(length(n.xy), 1e-4);
    float luz = dot(nd, normalize(vec2(-.55, -.83)));
    vec3 pil = g * 1.12 + vec3(.012, .02, .05);
    float canto = smoothstep(.5, .9, borde);
    // el espesor: justo antes del canto el vidrio se ve un poco más oscuro
    pil *= 1. - .14 * smoothstep(.12, .45, borde) * (1. - canto);
    pil = mix(pil, CREMA, canto * (.85 * smoothstep(-.2, .9, luz) + .32 * smoothstep(.1, -.9, luz)));
    float bx = clamp((uM.x - C.x) / max(forma.x, 1.), -.7, .7) * .55 - .2;
    float brillo = exp(-pow((rel.x - bx) * 1.9, 2.)) * smoothstep(-.3, -.62, rel.y) * smoothstep(.05, .3, borde) * (1. - canto * .7);
    pil = mix(pil, CREMA, brillo * .62);
    g = mix(g, pil, m);
    // el borde, suavizado con la silueta exacta (el raymarching lo deja dentado)
    float d2 = sdRR(p - C.xy, vec2(max(forma.x, forma.y), forma.y), forma.y);
    g = mix(col, g, mix(1., clamp(.5 - d2, 0., 1.), m));
  }
  return g;
}

// EL VIDRIO de la UI, una vez que se sabe qué tiene detrás (v): el ahumado,
// la cúpula, el reflejo, el canto y, si las burbujas están encima, su sombra
vec4 vR, vX;
vec2 vC, vHB, vG;
float vMejor, vOnda;
vec3 cristal(vec3 v, vec2 p, bool encima){
  float h = vX.y, claro = vX.w, chico = min(vR.z, vR.w);
  vec2 dm = p - uM;
  // la píldora flota apenas sobre la nav: deja una sombra corta debajo
  if (encima) {
    for (int i = 0; i < ${MAX_BURBUJAS}; i++) {
      if (i >= uNB) break;
      vec4 B = uB[i], F = uBF[i];
      if (B.w < .05) continue;
      float ds = sdRR(p - B.xy - vec2(0., 3.), vec2(max(F.x, F.y), F.y), F.y);
      v *= 1. - .38 * B.w * smoothstep(7., -3., ds);
    }
  }
  // el ahumado se aclara con el hover (el vidrio "se enciende"); el claro casi no ahúma
  v = mix(v, NOCHE, .42 - .3 * claro - .2 * h);
  // con el hover el panel toma volumen de cúpula: más luz arriba, menos abajo
  v *= 1. + .1 * h * clamp(-(p.y - vC.y) / max(vHB.y, 1.), -1., 1.);
  // el reflejo: una mancha de luz que sigue al puntero, corrida hacia la luz
  vec2 qb = (dm + vec2(.12, .28) * chico) / vec2(max(vR.w * 1.5, 56.), max(vR.w * .62, 26.));
  v = mix(v, CREMA, h * exp(-dot(qb, qb)) * .26);
  // el canto: la luz de arriba a la izquierda, más el lado que mira al puntero;
  // con el hover se engrosa
  float luz = dot(vG, normalize(vec2(-.6, -.8)));
  float canto = smoothstep(1.6 + 1.4 * h, 0., -vMejor);
  float lado = h * smoothstep(0., 1., dot(vG, normalize(uM - vC + vec2(1e-3))));
  v = mix(v, CREMA, canto * (smoothstep(-.2, .8, luz) * .55 + lado * .4 + vOnda * .4));
  // el vidrio claro tiene además el aro interno de una burbuja
  float aro = smoothstep(5., 1.5, -vMejor) * (1. - canto);
  return mix(v, CREMA, aro * claro * smoothstep(.1, .9, luz) * .3);
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uS - gl_FragCoord.y) / uS;
  vec3 col = fondo(p);
  // la sombra suave que cada burbuja deja en el estudio
  float sh = 0.;
  for (int i = 0; i < ${MAX_BURBUJAS}; i++) {
    if (i >= uNB) break;
    vec4 B = uB[i];
    if (B.z < 2.) continue;
    sh = max(sh, (1. - B.w) * smoothstep(B.z * 1.6, B.z * .3, length((p - (B.xy + vec2(B.z * .3, B.z * .25))) * vec2(.7, .9))));
  }
  col *= 1. - .22 * sh;

  // VIDRIO de la UI. Por panel (uVX): x radio, y hover (0..1), z presencia
  // (0..1: las filas se vuelven vidrio al pasar el mouse), w tipo (0 ahumado,
  // 1 claro, como una gota). Si hay paneles anidados gana el último del DOM.
  vMejor = 1e5;
  vR = vec4(0);
  vX = vec4(0);
  for (int i = 0; i < ${MAX_VIDRIOS}; i++) {
    if (i >= uNV) break;
    vec4 r = uV[i];
    float rad = min(uVX[i].x, min(r.z, r.w) * .5);
    float d = sdRR(p - r.xy - r.zw * .5, r.zw * .5, rad);
    if (d < 0.) { vMejor = d; vR = r; vX = uVX[i]; vX.x = rad; }
  }
  bool enVidrio = vMejor < 0.;
  vec3 v = col;
  vec2 detras = p;
  if (enVidrio) {
    vC = vR.xy + vR.zw * .5;
    vHB = vR.zw * .5;
    vG = vec2(
      sdRR(p - vC + vec2(1, 0), vHB, vX.x) - sdRR(p - vC - vec2(1, 0), vHB, vX.x),
      sdRR(p - vC + vec2(0, 1), vHB, vX.x) - sdRR(p - vC - vec2(0, 1), vHB, vX.x));
    vG /= max(length(vG), 1e-4);
    float h = vX.y, claro = vX.w, chico = min(vR.z, vR.w);
    float W = min(18., chico * .3);
    float bis = pow(1. - clamp(-vMejor / W, 0., 1.), 2.2);
    vec2 o2 = vG * ((30. + 14. * claro) * bis);
    // la lente: con el mouse encima, lo que está debajo del puntero se agranda
    vec2 dm = p - uM;
    float rl = max(chico * .9, 34.);
    float lente = h * exp(-dot(dm, dm) / (rl * rl));
    vec2 base = vC + (p - vC) * (.94 - .05 * claro) - dm * .16 * lente;
    // la onda al tocar: un frente circular que dobla el vidrio
    vec2 dr = p - uOnda.xy;
    float rr = length(dr);
    vOnda = uOnda.w * exp(-uOnda.z * 2.8) * exp(-pow((rr - uOnda.z * 520.) / 24., 2.));
    o2 += dr / max(rr, 1.) * vOnda * 16.;
    detras = base + o2;
    // lo de atrás, con dispersión (un canal por vez: un solo fondo() en el código)
    int canales = uQ > .5 ? 3 : 1;
    for (int k = 0; k < 3; k++) {
      if (k >= canales) break;
      vec3 f = fondo(base + o2 * (canales == 1 ? 1. : .94 + .07 * float(k)));
      if (canales == 1) v = f;
      else v[k] = f[k];
    }
  }

  // LAS BURBUJAS van debajo del vidrio de la UI (y el vidrio las refracta)...
  // salvo cuando se vuelven un botón: ahí se apoyan ENCIMA, como una píldora de
  // vidrio sobre el link. Una sola llamada a gota() por píxel: cada llamada se
  // compila entera y una GPU por software la paga en toda la pantalla.
  bool encima = uArriba > .5;
  bool debajo = !encima && enVidrio;
  if (encima && enVidrio) col = mix(col, cristal(v, p, true), vX.z);
  vec3 sale = gota(debajo ? detras : p, debajo ? v : col);
  col = debajo ? mix(col, cristal(sale, p, false), vX.z) : sale;

  float gr = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (gr - .5) * .028;
  o = vec4(col, 1.);
}`;
