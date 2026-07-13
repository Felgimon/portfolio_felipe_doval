// Genera los favicons del portfolio (v4.3): el monograma "FD·" de la marca
// (Archivo Black + punto dorado) sobre espacio profundo con estrellas.
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

const b = await chromium.launch();
const p = await b.newPage();

const draw = (size) =>
  p.evaluate(
    async ([size, fontB64]) => {
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
      const s = size / 512; // todo se define a 512 y escala

      // Fondo: espacio profundo con un leve resplandor central.
      const g = x.createRadialGradient(
        256 * s, 236 * s, 40 * s,
        256 * s, 256 * s, 380 * s,
      );
      g.addColorStop(0, "#0d1e33");
      g.addColorStop(1, "#04080f");
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);

      // Estrellas (solo se perciben en tamaños grandes; a 32px desaparecen).
      const stars = [
        [64, 88, 5, 0.85],
        [452, 72, 4, 0.7],
        [462, 430, 5, 0.75],
        [76, 428, 3.5, 0.6],
        [250, 40, 3, 0.5],
      ];
      x.fillStyle = "#eaf4fc";
      for (const [sx, sy, r, o] of stars) {
        x.globalAlpha = o;
        x.beginPath();
        x.arc(sx * s, sy * s, r * s, 0, Math.PI * 2);
        x.fill();
      }
      x.globalAlpha = 1;

      // Monograma FD + punto dorado (la marca), centrado ópticamente.
      x.font = `${228 * s}px Archivo`;
      x.textAlign = "left";
      x.textBaseline = "alphabetic";
      const texto = "FD";
      const tw = x.measureText(texto).width;
      const dotR = 25 * s;
      const gap = 12 * s;
      const total = tw + gap + dotR * 2;
      const tx = (size - total) / 2;
      const ty = 338 * s;
      x.fillStyle = "#eaf4fc";
      x.fillText(texto, tx, ty);
      x.fillStyle = "#e8b34c";
      x.beginPath();
      x.arc(tx + tw + gap + dotR, ty - dotR, dotR, 0, Math.PI * 2);
      x.fill();

      return c.toDataURL("image/png");
    },
    [size, FONT_B64],
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
