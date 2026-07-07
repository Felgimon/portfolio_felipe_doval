/**
 * Genera lib/brand-icons.ts con SOLO los íconos de marca que usamos
 * (GitHub, LinkedIn) extraídos de Simple Icons (licencia CC0) vía Iconify.
 *
 * lucide-react ya no incluye íconos de marca; el brief autoriza Iconify para
 * los que falten. Esto los mete OFFLINE y mínimos: nunca se bundlea la
 * colección entera de Simple Icons, solo estos dos objetos.
 *
 *   node scripts/gen-brand-icons.mjs
 */
import { icons } from "@iconify-json/simple-icons";
import { getIconData } from "@iconify/utils";
import { writeFileSync } from "node:fs";

const WANTED = ["github", "linkedin"];

const salida = {};
for (const nombre of WANTED) {
  const data = getIconData(icons, nombre);
  if (!data) {
    console.error(`✗ No se encontró el ícono "${nombre}" en simple-icons`);
    process.exit(1);
  }
  salida[nombre] = data;
}

const min = (d) => ({ width: d.width ?? 24, height: d.height ?? 24, body: d.body });

const contenido = `// GENERADO por scripts/gen-brand-icons.mjs — NO editar a mano.
// Íconos de marca de Simple Icons (https://simpleicons.org), licencia CC0.
// Extraídos vía Iconify porque lucide-react ya no incluye íconos de marca.

export type BrandIconData = { width: number; height: number; body: string };

export const github: BrandIconData = ${JSON.stringify(min(salida.github))};
export const linkedin: BrandIconData = ${JSON.stringify(min(salida.linkedin))};
`;

writeFileSync(new URL("../lib/brand-icons.ts", import.meta.url), contenido);
console.log("✓ lib/brand-icons.ts generado (github, linkedin)");
