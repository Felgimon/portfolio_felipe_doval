/**
 * Genera los CIANOTIPOS del fondo: de cada original en brand/cianotipos/*.jpg
 * (papel azul de Prusia con los objetos en claro) sale
 * public/assets/cianotipos/<nombre>.webp, un mapa de LUZ: color celeste fijo y
 * la luz de los objetos en el canal alfa (el papel queda transparente).
 *
 * La escena lo pinta como luz sobre el estudio (usa rgb y alfa) y, sin WebGL,
 * el mismo archivo va de fondo CSS: por eso el papel tiene que ser alfa 0 y no
 * negro.
 *
 *   node scripts/gen-cianotipos.mjs
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ORIGEN = "brand/cianotipos";
const DESTINO = "public/assets/cianotipos";
const ANCHO = 1600; // el alto sale de la proporción de cada original
const LUZ = [168, 191, 255]; // #a8bfff, el celeste de un cianotipo lavado

// desde la v9.1 sólo el mapa del 404 va entero (a sangre): las secciones usan
// composiciones de objetos sueltos (scripts/componer-cianotipos.py)
const A_SANGRE = ["mapa.jpg"];
for (const archivo of (await readdir(ORIGEN)).filter((f) => A_SANGRE.includes(f))) {
  const nombre = path.basename(archivo, ".jpg");
  const { data, info } = await sharp(path.join(ORIGEN, archivo))
    .resize({ width: ANCHO })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // el papel: la mediana; lo más claro: el percentil 99,5
  const hist = new Array(256).fill(0);
  for (const v of data) hist[v]++;
  let acc = 0, p50 = 0, p995 = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (!p50 && acc > data.length * 0.5) p50 = i;
    if (!p995 && acc > data.length * 0.995) p995 = i;
  }
  const bajo = p50 + 10;
  const alto = Math.max(p995, bajo + 40);

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < data.length; i++) {
    // el grano del papel no suma luz: lo que queda muy bajo, a cero
    const a = Math.min(1, Math.max(0, ((data[i] - bajo) / (alto - bajo) - 0.05) / 0.95));
    rgba[i * 4] = LUZ[0];
    rgba[i * 4 + 1] = LUZ[1];
    rgba[i * 4 + 2] = LUZ[2];
    rgba[i * 4 + 3] = Math.round(Math.pow(a, 0.9) * 255);
  }
  const salida = path.join(DESTINO, `${nombre}.webp`);
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 50, alphaQuality: 70 })
    .toFile(salida);
  console.log(`${salida} ${info.width}x${info.height} (papel ${p50}, luz ${p995})`);
}
