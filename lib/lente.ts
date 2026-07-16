/**
 * LA LENTE del Liquid Glass: el mapa que hace que el fondo se DOBLE en el borde.
 *
 * Apple define su material por el "lensing" (así lo nombra su documentación):
 * el vidrio no difumina el fondo, lo refracta en el canto. Sin esto es frosted
 * glass, que es lo que había.
 *
 * La física (Snell-Descartes):
 *  - El borde del vidrio es un bisel cuyo perfil de altura es un SQUIRCLE
 *    CONVEXO: y = (1 - (1-x)^4)^(1/4), con x = 0 en el filo y x = 1 donde
 *    arranca la cara plana. Apple usa ese perfil y no una esfera porque mantiene
 *    parejo el gradiente de refracción aunque la forma se estire.
 *  - Un rayo entra derecho y golpea esa superficie inclinada: θ1 es el ángulo
 *    contra la normal, sin(θ2) = sin(θ1)/n con n = 1.5 (vidrio), y el rayo sale
 *    corrido ∝ tan(θ1 - θ2). En el filo la superficie está casi vertical y el
 *    desvío es máximo; en la cara plana la normal es vertical y no hay desvío.
 *    Por eso el fondo se dobla SOLO en el borde.
 *  - El mapa se DESENFOCA a propósito: la pendiente del squircle se dispara en
 *    el último píxel, y sin ese suavizado el desplazamiento no dobla el fondo,
 *    lo desgarra (probado: se ven tajos, no vidrio).
 *
 * Codificación de feDisplacementMap: canal R = desplazamiento en x, G = en y,
 * con 128 = cero. El atributo `scale` del filtro convierte eso a píxeles.
 *
 * Solo Chromium aplica filtros SVG en `backdrop-filter`. En Safari y Firefox no
 * se llama a nada de esto y el vidrio se queda con su frost, que es la razón de
 * que la refracción viva en su propia capa CSS.
 */

/** Perfil de altura del bisel (squircle convexo). x ∈ [0,1]: filo → cara plana. */
const perfil = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4);

/** Distancia con signo a un rectángulo redondeado (negativa adentro). */
function sdf(px: number, py: number, w: number, h: number, r: number) {
  const qx = Math.abs(px) - (w / 2 - r);
  const qy = Math.abs(py) - (h / 2 - r);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
  );
}

/** Índice de refracción del vidrio. */
const INDICE = 1.5;
/** Radio del desenfoque del mapa, en px (reparte el pico del filo). */
const SUAVE = 2;

/**
 * Genera el mapa de desplazamiento de un rectángulo redondeado y devuelve su
 * data URI PNG. `grosor` es el ancho del bisel en px.
 */
export function mapaLente(
  w: number,
  h: number,
  radio: number,
  grosor: number,
): string | null {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  if (typeof document === "undefined" || W < 8 || H < 8) return null;
  const r = Math.min(radio, Math.min(W, H) / 2);
  const t = Math.min(grosor, Math.min(W, H) / 2);

  const vx = new Float32Array(W * H);
  const vy = new Float32Array(W * H);
  let maximo = 0;
  const d = 0.5;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - W / 2;
      const py = y + 0.5 - H / 2;
      const dist = -sdf(px, py, W, H, r);
      if (dist <= 0 || dist >= t) continue;

      // Normal de la silueta = gradiente del SDF (apunta hacia afuera).
      const gx = sdf(px + d, py, W, H, r) - sdf(px - d, py, W, H, r);
      const gy = sdf(px, py + d, W, H, r) - sdf(px, py - d, W, H, r);
      const gl = Math.hypot(gx, gy) || 1;

      // Pendiente del bisel acá → desvío del rayo por Snell.
      const s = dist / t;
      const e = 1e-3;
      const pend =
        (perfil(Math.min(1, s + e)) - perfil(Math.max(0, s - e))) / (2 * e);
      const t1 = Math.atan(pend);
      const s2 = Math.sin(t1) / INDICE;
      if (Math.abs(s2) > 1) continue;
      const desvio = Math.tan(t1 - Math.asin(s2));

      const i = y * W + x;
      vx[i] = (gx / gl) * desvio;
      vy[i] = (gy / gl) * desvio;
      const m = Math.hypot(vx[i], vy[i]);
      if (m > maximo) maximo = m;
    }
  }
  if (!maximo) return null;

  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    img.data[i * 4] = 128 + (vx[i] / maximo) * 127;
    img.data[i * 4 + 1] = 128 + (vy[i] / maximo) * 127;
    img.data[i * 4 + 2] = 128;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // El suavizado va acá y no en el bucle: el canvas lo hace la GPU.
  ctx.filter = `blur(${SUAVE}px)`;
  ctx.drawImage(cv, 0, 0);
  ctx.filter = "none";
  return cv.toDataURL("image/png");
}

/** El bisel que se le da a un elemento: mitad de su lado corto, con un techo.
 * Un bisel más grueso que esto se come la cara del vidrio; más fino no se ve. */
export function grosorBisel(w: number, h: number) {
  return Math.min(Math.min(w, h) / 2, 34);
}

/** Cuántos píxeles corre la lente como máximo (el `scale` del filtro). Sale del
 * grosor del bisel: un bisel más grueso desvía más lejos. */
export function escalaLente(grosor: number) {
  return grosor;
}
