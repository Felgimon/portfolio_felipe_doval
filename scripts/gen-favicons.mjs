// Genera los favicons del portfolio: el monograma "FD·" de la marca (Archivo
// Black + punto) SIN caja de fondo — solo las letras y el punto, en transparente.
// Renderizado con canvas de Chromium (tipografía real, no aproximada) y
// exportado en los tres tamaños. Reproducible:
//   node scripts/gen-favicons.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const FONT_B64 = readFileSync(
  join(APP, "fonts", "ArchivoBlack-Regular.ttf"),
).toString("base64");

/* EL COLOR — la decisión menos obvia de este archivo.
 *
 * Sin caja de fondo, el monograma se apoya directo sobre la barra de pestañas
 * del navegador, que puede ser BLANCA o CASI NEGRA según el tema del sistema. Un
 * solo color tiene que leerse en las dos. Medido (contraste WCAG contra
 * #ffffff / #dee1e6 / #35363a / #202124):
 *   --acento  #0b5385 → 8.11 en claro pero 1.49 en oscuro (desaparece)
 *   --oro     #d99a1e → 6.59 en oscuro pero 1.86 en claro (desaparece)
 *   --acento-hi #1d74b0 → 2.40 en oscuro, corto
 * Por eso el punto YA NO va dorado: en una pestaña clara sería invisible.
 *
 * #2b86c6 es el punto MEDIO del degradado de identidad (accent-grad va
 * #083d66 → #1370ad → #3fa0d8), corrido apenas para maximizar el contraste: da
 * 3.01 como mínimo en los cuatro fondos. No es una elección estética libre —
 * 3.05 es el TECHO teórico que puede alcanzar cualquier color contra #dee1e6 y
 * #35363a a la vez, así que este tono está en el óptimo. */
const MARCA = "#2b86c6";

const b = await chromium.launch();
const p = await b.newPage();

const draw = (size) =>
  p.evaluate(
    async ([size, fontB64, marca]) => {
      const font = new FontFace(
        "Archivo",
        Uint8Array.from(atob(fontB64), (c) => c.charCodeAt(0)).buffer,
      );
      await font.load();
      document.fonts.add(font);

      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const x = c.getContext("2d");
      // Sin fillRect: el canvas queda TRANSPARENTE. Es todo el punto del cambio.

      x.textAlign = "left";
      x.textBaseline = "alphabetic";
      x.fillStyle = marca;

      const texto = "FD";
      // Proporciones del punto respecto del cuerpo de la letra.
      const rDot = 0.115; // radio
      const rGap = 0.055; // aire entre la D y el punto

      // El monograma ocupa el 90% del lienzo: sin caja que lo contenga, si es
      // chico se pierde en la pestaña. Se mide de verdad y se reescala (nada de
      // constantes a ojo, que se rompen si cambia la fuente).
      const objetivo = size * 0.9;
      let fs = size * 0.6;
      for (let i = 0; i < 3; i++) {
        x.font = `${fs}px Archivo`;
        const w = x.measureText(texto).width + fs * rGap + fs * rDot * 2;
        fs *= objetivo / w;
      }
      x.font = `${fs}px Archivo`;

      const m = x.measureText(texto);
      const tw = m.width;
      const dotR = fs * rDot;
      const gap = fs * rGap;
      const total = tw + gap + dotR * 2;

      // Centrado ÓPTICO: se usa la caja real de los glifos (no el alto de línea,
      // que trae aire de la fuente y deja la marca corrida hacia arriba).
      const tx = (size - total) / 2;
      const ty =
        (size + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;

      x.fillText(texto, tx, ty);
      // El punto se apoya en la línea de base, como un punto final.
      x.beginPath();
      x.arc(tx + tw + gap + dotR, ty - dotR, dotR, 0, Math.PI * 2);
      x.fill();

      return c.toDataURL("image/png");
    },
    [size, FONT_B64, MARCA],
  );

const toBuf = (dataUrl) => Buffer.from(dataUrl.split(",")[1], "base64");

// ICO con un único PNG de 32×32 embebido (los navegadores modernos lo aceptan).
function wrapIco(png32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(png32.length, 8); // size
  entry.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([header, entry, png32]);
}

writeFileSync(join(APP, "icon.png"), toBuf(await draw(512)));
writeFileSync(join(APP, "apple-icon.png"), toBuf(await draw(180)));
writeFileSync(join(APP, "favicon.ico"), wrapIco(toBuf(await draw(32))));
await b.close();

console.log("favicons generados: icon.png (512), apple-icon.png (180), favicon.ico (32)");
