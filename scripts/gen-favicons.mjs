// Genera los favicons (v7): la "F" de Doval Grotesk extendida y negra, en
// crema, sobre un cuadrado redondeado con la misma luz de estudio del sitio
// (cobalto que cae a noche). Renderizado con canvas de Chromium y la fuente
// real.
//   node scripts/gen-favicons.mjs
//
// Por qué un cuadrado y no la letra sola: la barra de pestañas puede ser
// blanca o casi negra. El cobalto se recorta sobre blanco (9,1:1) y sobre
// oscuro manda la F crema (15,1:1 sobre noche).
//
// El ícono de iOS (apple-icon) es OPACO: iOS rellena la transparencia con negro.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { navegador } from "./lib/servidor.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const FONT_B64 = readFileSync(join(ROOT, "app", "fonts", "DovalGrotesk.woff2")).toString("base64");

const b = await navegador();
const p = await b.newPage();

const draw = (size, opaco) =>
  p.evaluate(
    async ([size, fontB64, opaco]) => {
      const font = new FontFace("DovalG", Uint8Array.from(atob(fontB64), (c) => c.charCodeAt(0)).buffer, {
        weight: "100 900",
        stretch: "62% 125%",
      });
      await font.load();
      document.fonts.add(font);
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const x = c.getContext("2d");
      const NOCHE = "#071447", COBALTO = "#1736bd", CREMA = "#f2eee6";
      const g = x.createRadialGradient(size * 0.62, size * 0.36, 0, size * 0.62, size * 0.36, size * 0.9);
      g.addColorStop(0, COBALTO);
      g.addColorStop(1, NOCHE);
      x.fillStyle = g;
      if (opaco) x.fillRect(0, 0, size, size);
      else {
        x.beginPath();
        x.roundRect(0, 0, size, size, size * 0.22);
        x.fill();
      }
      // la F, medida de verdad y centrada por su caja de glifo
      let fs = size * 0.8;
      x.fontStretch = "expanded";
      x.font = `900 ${fs}px DovalG`;
      let m = x.measureText("F");
      const alto = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      fs *= (size * 0.56) / alto;
      x.font = `900 ${fs}px DovalG`;
      m = x.measureText("F");
      const ancho = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const tx = (size - ancho) / 2 + m.actualBoundingBoxLeft;
      const ty = (size + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      x.fillStyle = CREMA;
      x.fillText("F", tx, ty);
      return c.toDataURL("image/png");
    },
    [size, FONT_B64, opaco],
  );

const toBuf = (dataUrl) => Buffer.from(dataUrl.split(",")[1], "base64");

// ICO con un único PNG de 32×32 embebido (los navegadores modernos lo aceptan).
function wrapIco(png32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png32.length, 8);
  entry.writeUInt32LE(6 + 16, 12);
  return Buffer.concat([header, entry, png32]);
}

writeFileSync(join(APP, "icon.png"), toBuf(await draw(512, false)));
writeFileSync(join(APP, "apple-icon.png"), toBuf(await draw(180, true)));
writeFileSync(join(APP, "favicon.ico"), wrapIco(toBuf(await draw(32, false))));
await b.close();

console.log("favicons generados: icon.png (512), apple-icon.png (180), favicon.ico (32)");
