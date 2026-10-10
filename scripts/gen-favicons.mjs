// Genera los favicons (v6): una GOTA lima con la "F" de Doval Script en tinta.
// Renderizado con canvas de Chromium (la fuente real, no una aproximación).
//   node scripts/gen-favicons.mjs
//
// Por qué una gota y no las letras solas (como en la v5): la barra de pestañas
// puede ser blanca o casi negra, y ningún color solo aguanta en las dos (el
// techo medido era 3,05:1). La gota lima se ve sobre oscuro (8,8:1) y sobre
// claro se recorta igual, porque adentro va la F en tinta (6,65:1 sobre lima).
// No es "una caja detrás": es el líquido del sitio, el mismo material.
//
// El ícono de iOS (apple-icon) es OPACO: iOS rellena la transparencia con negro.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { navegador } from "./lib/servidor.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const FONT_B64 = readFileSync(join(ROOT, "brand", "tipografia", "DovalScript-Regular.ttf")).toString("base64");

const b = await navegador();
const p = await b.newPage();

const draw = (size, opaco) =>
  p.evaluate(
    async ([size, fontB64, opaco]) => {
      const font = new FontFace("Doval", Uint8Array.from(atob(fontB64), (c) => c.charCodeAt(0)).buffer);
      await font.load();
      document.fonts.add(font);
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const x = c.getContext("2d");
      const LIMA = "#78d561", JADE = "#28c18c", TINTA = "#0f3d2e";
      if (opaco) {
        x.fillStyle = LIMA;
        x.fillRect(0, 0, size, size);
      } else {
        // la gota, con su sombra dura jade abajo a la derecha
        const r = size * 0.44, cx = size * 0.48, cy = size * 0.48;
        x.fillStyle = JADE;
        x.beginPath();
        x.arc(cx + size * 0.04, cy + size * 0.04, r, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = LIMA;
        x.beginPath();
        x.arc(cx, cy, r, 0, Math.PI * 2);
        x.fill();
      }
      // la F, medida de verdad y centrada por su caja de glifo
      let fs = size * 0.8;
      x.font = `${fs}px Doval`;
      let m = x.measureText("F");
      const alto = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      fs *= (size * (opaco ? 0.62 : 0.58)) / alto;
      x.font = `${fs}px Doval`;
      m = x.measureText("F");
      const ancho = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const tx = (size - ancho) / 2 + m.actualBoundingBoxLeft - size * (opaco ? 0 : 0.02);
      const ty = (size + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 - size * (opaco ? 0 : 0.02);
      x.fillStyle = TINTA;
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
