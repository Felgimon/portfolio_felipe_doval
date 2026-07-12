// Genera los favicons del portfolio con la identidad "espacio" (v4): el SOL
// dorado dentro de la ventana HEXAGONAL del fullereno (la vista de la portada),
// sobre espacio profundo con estrellas. Hecho SOLO con primitivas
// (<rect>/<circle>/<polygon> de vértices calculados, gradientes): nada de
// <path> dibujado a mano — respeta la regla de oro. Reproducible:
//   node scripts/gen-favicons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

const ESPACIO = "#04080f";
const CROMO = "#c6d8e6"; // el hexágono (struts de cromo)
const ESTRELLA = "#eaf4fc";

// Hexágono "flat-top" (como la ventana frontal del fullereno): 6 vértices
// calculados sobre un círculo de radio R.
const CX = 256;
const CY = 256;
const R_HEX = 196;
const hexPts = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i;
  return `${(CX + R_HEX * Math.cos(a)).toFixed(1)},${(CY + R_HEX * Math.sin(a)).toFixed(1)}`;
}).join(" ");

// Estrellas de fondo (posiciones fijas, fuera del hexágono).
const stars = [
  [52, 84, 5, 0.9],
  [458, 62, 4, 0.7],
  [472, 420, 5, 0.8],
  [70, 434, 3.5, 0.6],
  [244, 34, 3, 0.55],
  [36, 258, 3, 0.5],
  [478, 244, 3, 0.5],
]
  .map(
    ([x, y, r, o]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${ESTRELLA}" opacity="${o}"/>`,
  )
  .join("\n  ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="sol" cx="42%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#fff6d8"/>
      <stop offset="38%" stop-color="#f9c14e"/>
      <stop offset="72%" stop-color="#ef8c2c"/>
      <stop offset="100%" stop-color="#c85a1d"/>
    </radialGradient>
    <radialGradient id="fondo" cx="50%" cy="46%" r="75%">
      <stop offset="0%" stop-color="#0a1626"/>
      <stop offset="100%" stop-color="${ESPACIO}"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#fondo)"/>
  ${stars}
  <circle cx="${CX}" cy="${CY}" r="200" fill="#f9b43e" opacity="0.1"/>
  <circle cx="${CX}" cy="${CY}" r="158" fill="#f9b43e" opacity="0.16"/>
  <circle cx="${CX}" cy="${CY}" r="126" fill="url(#sol)"/>
  <polygon points="${hexPts}" fill="none" stroke="${CROMO}" stroke-width="20" stroke-linejoin="round"/>
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
