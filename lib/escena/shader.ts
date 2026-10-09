/**
 * EL SHADER DE LA ESCENA — una sola pasada de pantalla completa (WebGL 1).
 *
 * Pinta, de atrás para adelante:
 *   papel → líquido de fondo (capa 0) → Feli (sticker + sombra dura jade)
 *   → pileta (capa 1, tapa el corte recto de la foto) → vidrio.
 *
 * Todo en coordenadas de VIEWPORT en px CSS (y hacia abajo), igual que
 * getBoundingClientRect: el JS le pasa los rects tal cual los mide.
 *
 * Por qué el vidrio vive acá y no en un backdrop-filter: el filtro SVG de la
 * v5 sólo andaba en Chromium y costaba el 78% del frame sobre un fondo
 * animado. Acá la refracción es muestrear la escena en un punto desplazado
 * dentro de cada rectángulo redondeado: una pasada, todos los navegadores.
 *
 * El líquido está "pintado", no es plástico: dos bandas (lado iluminado / lado
 * en sombra) con terminador corto, un especular blanco DURO, un rebote suave y
 * una línea tinta sólo del lado en sombra (el mismo filete que las letras).
 * Una sola luz, de arriba a la izquierda, para todo el sitio.
 */

export const MAX_GOTAS = 16;
export const MAX_VIDRIOS = 10;

export const VERTEX = `
attribute vec2 a;
void main(){ gl_Position = vec4(a, 0., 1.); }
`;

export const FRAGMENT = `
precision highp float;
uniform vec2 uRes;      // viewport en px CSS
uniform float uScale;   // px de canvas por px CSS
uniform float uTime;
uniform float uU;       // unidad de escala (≈ lado corto / 1000)
uniform float uQ;       // calidad: 1 alto, 0 bajo
uniform float uK;       // suavidad de la unión (smin)
uniform vec4 uB[${MAX_GOTAS}];   // x, y, radio, tono (0 lima .. 1 jade)
uniform float uBL[${MAX_GOTAS}]; // capa: 0 fondo, 1 pileta (delante de Feli)
uniform int uNB;
uniform vec4 uNav;      // cápsula bajo el link activo: cx, cy, medio largo, radio
uniform vec4 uR[${MAX_VIDRIOS}];  // vidrio: x, y, w, h
uniform vec4 uRX[${MAX_VIDRIOS}]; // radio, presión, barrido, 0
uniform int uNR;
uniform vec4 uF[2];     // Feli: x, y, w, h (w = 0 → apagado)
uniform float uFS[2];   // cuánto está hundido (px)
uniform sampler2D uT0;
uniform sampler2D uT1;

const vec3 TINTA = vec3(.0588, .2392, .1804);
const vec3 LIMA  = vec3(.4706, .8353, .3804);
const vec3 JADE  = vec3(.1569, .7569, .5490);
const vec3 PAPEL = vec3(1.);
const vec3 L = vec3(-.5, -.62, .6);

// unión suave con mezcla de color (iq, cuadrática): k bajo → cuello visible
vec2 sminC(vec2 a, float b, float cb, float k){
  float h = 1. - min(abs(a.x - b) / (4. * k), 1.);
  float w = h * h; float m = w * .5; float s = w * k;
  return a.x < b ? vec2(a.x - s, mix(a.y, cb, m)) : vec2(b - s, mix(cb, a.y, m));
}

vec2 campo(vec2 p, float capa){
  vec2 r = vec2(1e5, 0.);
  for (int i = 0; i < ${MAX_GOTAS}; i++){
    if (i >= uNB) break;
    if (abs(uBL[i] - capa) > .5) continue;
    vec4 b = uB[i];
    r = sminC(r, length(p - b.xy) - b.z, b.w, uK);
  }
  if (capa < .5 && uNav.w > 0.){
    float d = length(vec2(max(abs(p.x - uNav.x) - uNav.z, 0.), p.y - uNav.y)) - uNav.w;
    r = sminC(r, d, 0., uK * .5);
  }
  return r;
}

// pinta el líquido de una capa sobre col; devuelve su cobertura
float liquido(vec2 p, float capa, inout vec3 col){
  vec2 f = campo(p, capa);
  float d = f.x;
  // sombra de contacto sobre el papel (tinta muy suave, corrida con la luz)
  if (uQ > .5 && d < 60. * uU && capa < .5){
    float ds = campo(p - vec2(10., 14.) * uU, capa).x;
    col = mix(col, TINTA, (1. - smoothstep(-16. * uU, 22. * uU, ds)) * .07);
  }
  if (d > 1.5) return 0.;
  float e = 1.5;
  vec2 g = vec2(campo(p + vec2(e, 0.), capa).x - d, campo(p + vec2(0., e), capa).x - d);
  g = g / max(length(g), 1e-4);
  float R = 95. * uU;
  float s = clamp(-d / R, 0., 1.);
  float rho = 1. - s;
  // normal de hemisferio continua (sin el "cono" del centro)
  vec3 N = normalize(vec3(g * rho * .95, sqrt(max(1. - rho * rho, 0.)) + .08));
  vec3 l = normalize(L);
  float dif = dot(N, l);
  vec3 base = mix(LIMA, JADE, f.y);
  vec3 sombra = mix(mix(LIMA, JADE, .8), JADE * .8, f.y);
  vec3 c = mix(sombra, base, smoothstep(.18, .46, dif));
  // rebote suave del lado opuesto a la luz
  float reb = smoothstep(.55, .85, rho) * smoothstep(0., .5, dot(g, -normalize(L.xy)));
  c = mix(c, mix(base, PAPEL, .35), reb * .45);
  // especular duro
  float sp = pow(max(dot(N, normalize(l + vec3(0., 0., 1.))), 0.), 60.);
  c = mix(c, PAPEL, smoothstep(.62, .67, sp) * (capa > .5 ? .45 : 1.));
  // burbujas de gas subiendo adentro del líquido (sólo calidad alta)
  if (uQ > .5 && s > .12){
    vec2 q = p / (34. * uU);
    q.y += uTime * .55;
    vec2 id = floor(q);
    vec2 fr = fract(q) - .5;
    float h = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    if (h > .86){
      vec2 o = vec2(fract(h * 17.3) - .5, fract(h * 91.7) - .5) * .5;
      float rr = .1 + .12 * fract(h * 7.1);
      float dd = length(fr - o);
      float anillo = smoothstep(rr, rr - .05, dd) - smoothstep(rr - .07, rr - .12, dd);
      c = mix(c, PAPEL, anillo * .55 * smoothstep(.12, .3, s));
    }
  }
  // filete tinta del lado en sombra
  float rim = smoothstep(-2.6 * uU, -.5, d) * smoothstep(.2, -.5, dot(g, normalize(L.xy)));
  c = mix(c, TINTA, rim * .5);
  float a = smoothstep(1., -1., d);
  col = mix(col, c, a);
  return a;
}

vec4 muestraT(int i, vec2 q){
  if (i == 0) return texture2D(uT0, q);
  return texture2D(uT1, q);
}

void feli(vec2 p, int i, inout vec3 col){
  vec4 r = i == 0 ? uF[0] : uF[1];
  float hundido = i == 0 ? uFS[0] : uFS[1];
  if (r.z < 1. || p.y > r.y + r.w || p.y < r.y - 20.) return;
  vec2 q = (p - r.xy - vec2(0., hundido)) / r.zw;
  // la foto no puede asomar por debajo de su base (la tapa la pileta)
  if (p.y > r.y + r.w) return;
  vec2 o = vec2(11., 11.) * uU / r.zw;
  vec2 q2 = q - o;
  float sa = 0.;
  if (q2.x > 0. && q2.x < 1. && q2.y > 0. && q2.y < 1.) sa = muestraT(i, q2).a;
  col = mix(col, JADE, sa);
  if (q.x > 0. && q.x < 1. && q.y > 0. && q.y < 1.){
    vec4 t = muestraT(i, q);
    col = mix(col, t.rgb, t.a);
  }
}

vec3 escena(vec2 p){
  vec3 col = PAPEL;
  liquido(p, 0., col);
  feli(p, 0, col);
  feli(p, 1, col);
  liquido(p, 1., col);
  return col;
}

float sdRR(vec2 p, vec2 b, float r){
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;
  float mejor = 1e5; vec4 R = vec4(0.); vec4 X = vec4(0.);
  for (int i = 0; i < ${MAX_VIDRIOS}; i++){
    if (i >= uNR) break;
    vec4 r = uR[i];
    if (r.z < 2.) continue;
    float rad = min(uRX[i].x, min(r.z, r.w) * .5);
    float d = sdRR(p - r.xy - r.zw * .5, r.zw * .5, rad);
    if (d < mejor){ mejor = d; R = r; X = uRX[i]; X.x = rad; }
  }
  vec3 col;
  if (mejor < 0.){
    vec2 c = R.xy + R.zw * .5, hb = R.zw * .5;
    vec2 g = vec2(sdRR(p - c + vec2(1., 0.), hb, X.x) - sdRR(p - c - vec2(1., 0.), hb, X.x),
                  sdRR(p - c + vec2(0., 1.), hb, X.x) - sdRR(p - c - vec2(0., 1.), hb, X.x));
    g = g / max(length(g), 1e-4);
    // bisel: el centro magnifica un poco, el borde empuja hacia afuera
    float W = min(20., min(X.x + 4., min(R.z, R.w) * .3));
    float t = clamp(-mejor / W, 0., 1.);
    float bisel = pow(1. - t, 2.2);
    float k = (44. + X.y * 24.) * bisel + X.y * 5.;
    vec2 base = c + (p - c) * (.86 - X.y * .05);
    vec2 o = g * k;
    if (uQ > .5 && bisel > .03){
      // aberración cromática sólo en el bisel: el borde cian
      col = vec3(escena(base + o * .93).r, escena(base + o).g, escena(base + o * 1.1).b);
    } else {
      col = escena(base + o);
    }
    col = mix(col, PAPEL, .28); // escarcha: garantiza contraste AA de la tinta
    float luz = dot(g, normalize(L.xy));
    float canto = smoothstep(2.4, 0., -mejor);
    col = mix(col, PAPEL, canto * smoothstep(-.1, .6, luz) * .95);
    col = mix(col, TINTA, canto * smoothstep(.1, -.7, luz) * .38);
    float interior = smoothstep(7., 4., -mejor) * smoothstep(3., 4.5, -mejor);
    col = mix(col, PAPEL, interior * smoothstep(.2, .9, luz) * .5);
    if (X.z > 0.){
      float sw = ((p.x - R.x) + (p.y - R.y) * .6) / (R.z + R.w * .6);
      float banda = smoothstep(.07, 0., abs(sw - (X.z * 1.5 - .25)));
      col = mix(col, PAPEL, banda * .55);
    }
  } else {
    col = escena(p);
    if (mejor < 26.){
      vec2 c = R.xy + R.zw * .5;
      float ds = sdRR(p - c - vec2(0., 6.), R.zw * .5, X.x);
      col = mix(col, TINTA, (1. - smoothstep(-2., 14., ds)) * .10);
    }
  }
  // dither contra el banding
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453)
          + fract(sin(dot(gl_FragCoord.xy + 1.7, vec2(39.3468, 11.135))) * 24634.6345) - 1.;
  gl_FragColor = vec4(col + n / 255., 1.);
}
`;
