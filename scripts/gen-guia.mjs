/**
 * Genera las poses del GUÍA (Feli) a partir de recortes con fondo transparente.
 *
 *   node scripts/gen-guia.mjs
 *
 * Entrada:  contenido/guia/<pose>.png   (recorte RGBA, fondo transparente)
 * Salida:   public/assets/guia/<pose>.webp  + content/poses.generado.json
 *
 * Qué le hace a cada foto:
 *  1. Recorta el aire transparente (bbox del alfa).
 *  2. La lleva a ALTO px de alto (nunca agranda).
 *  3. Limpia el halo claro del recorte: erosiona el alfa ~2px (los recortes
 *     automáticos dejan un borde del fondo original que sobre verde se ve).
 *  4. Hornea el borde blanco de STICKER (troquel): dilata el alfa BORDE px y
 *     lo rellena de blanco. El borde NO baja por debajo del corte inferior: la
 *     base de la foto queda recta, para que la tape la pileta de líquido.
 *  5. WebP con alfa.
 *
 * La sombra dura jade NO va horneada: la pinta el shader (y el CSS cuando no
 * hay WebGL), así puede moverse con la luz del sitio.
 *
 * Para la sesión de fotos nueva: recortá cada foto (fondo transparente), poné
 * el PNG en contenido/guia/ con el nombre de la pose (ver content/guia.ts) y
 * corré este script. Nada más.
 */
import sharp from "sharp";
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const ENTRADA = "contenido/guia";
const SALIDA = "public/assets/guia";
const ALTO = 1400;
const BORDE = 22; // px del troquel blanco a ALTO px de alto
const EROSION = 2; // px que se comen del borde para matar el halo

mkdirSync(SALIDA, { recursive: true });

/** Bounding box del alfa (umbral bajo para no comerse el pelo). */
function bbox(data, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Morfología aproximada sobre un canal: desenfoque + umbral. */
async function umbral(canal, w, h, sigma, corte) {
  const blur = await sharp(canal, { raw: { width: w, height: h, channels: 1 } })
    .blur(sigma)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const out = Buffer.alloc(w * h);
  for (let i = 0; i < out.length; i++) out[i] = blur[i] >= corte ? 255 : 0;
  // antialias del borde resultante
  return sharp(out, { raw: { width: w, height: h, channels: 1 } })
    .blur(0.7)
    .extractChannel(0)
    .raw()
    .toBuffer();
}

const medidas = {};
for (const archivo of readdirSync(ENTRADA).filter((f) => f.endsWith(".png"))) {
  const pose = basename(archivo, ".png");
  const src = sharp(join(ENTRADA, archivo)).ensureAlpha();
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const caja = bbox(data, info.width, info.height);

  const escala = Math.min(1, ALTO / caja.height);
  const w = Math.round(caja.width * escala);
  const h = Math.round(caja.height * escala);
  const pad = BORDE + 4;
  const W = w + pad * 2;
  const H = h + pad; // sin margen abajo: la base queda recta

  const foto = await sharp(join(ENTRADA, archivo))
    .ensureAlpha()
    .extract(caja)
    .resize(w, h)
    .extend({ top: pad, left: pad, right: pad, bottom: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer();

  // alfa original
  const alfa = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) alfa[i] = foto[i * 4 + 3];

  // 3. erosión (mata el halo): desenfoque y umbral ALTO
  const limpio = await umbral(alfa, W, H, EROSION * 0.6, 235);
  // 4. troquel: desenfoque y umbral BAJO sobre el alfa limpio
  const troquel = await umbral(limpio, W, H, BORDE * 0.55, 18);

  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(limpio[i], alfa[i]) / 255; // foto
    const t = troquel[i] / 255; // blanco
    const r = foto[i * 4], g = foto[i * 4 + 1], b = foto[i * 4 + 2];
    rgba[i * 4] = Math.round(r * a + 255 * (1 - a));
    rgba[i * 4 + 1] = Math.round(g * a + 255 * (1 - a));
    rgba[i * 4 + 2] = Math.round(b * a + 255 * (1 - a));
    rgba[i * 4 + 3] = Math.round(255 * Math.max(a, t));
  }

  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(join(SALIDA, `${pose}.webp`));
  medidas[pose] = { w: W, h: H };
  console.log(`${pose}: ${W}x${H}`);
}

writeFileSync(
  "content/poses.generado.json",
  JSON.stringify(medidas, null, 2) + "\n",
);
