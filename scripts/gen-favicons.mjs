// Genera los favicons del portfolio a partir de un glifo primitivo: un
// micro-balón-grafo (un nodo central + 3 satélites unidos por struts), hecho
// SOLO con <circle>/<line> (primitivas triviales, nada de <path> dibujado a
// mano — respeta la regla de oro). Paleta "verde agua". Reproducible:
//   node scripts/gen-favicons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

const INK = "#0f1e1b";
const JADE = "#47a88c";
const AGUA = "#8fe3c6";
const AGUA_BRIGHT = "#b7f0da";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INK}"/>
  <g stroke="${JADE}" stroke-width="16" stroke-linecap="round">
    <line x1="256" y1="244" x2="256" y2="112"/>
    <line x1="256" y1="244" x2="138" y2="356"/>
    <line x1="256" y1="244" x2="374" y2="356"/>
  </g>
  <circle cx="256" cy="244" r="66" fill="${AGUA}" opacity="0.18"/>
  <circle cx="256" cy="112" r="26" fill="${AGUA}"/>
  <circle cx="138" cy="356" r="26" fill="${AGUA}"/>
  <circle cx="374" cy="356" r="26" fill="${AGUA}"/>
  <circle cx="256" cy="244" r="42" fill="${AGUA_BRIGHT}"/>
</svg>`;

const svgBuf = Buffer.from(svg);

async function png(size) {
  return sharp(svgBuf).resize(size, size).png().toBuffer();
}

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

const [icon512, apple180, png32] = await Promise.all([png(512), png(180), png(32)]);

writeFileSync(join(APP, "icon.png"), icon512);
writeFileSync(join(APP, "apple-icon.png"), apple180);
writeFileSync(join(APP, "favicon.ico"), wrapIco(png32));

console.log("favicons generados: icon.png (512), apple-icon.png (180), favicon.ico (32)");
