/**
 * Genera EL PAPEL del fondo (v8.1): de brand/papel.jpg (un pliego de papel
 * cianotipo sin objetos) sale public/assets/papel.webp, sólo su textura en
 * gris: 128 es "ni más claro ni más oscuro". La escena la repite en espejo
 * sobre el estudio cobalto (el color lo sigue poniendo el shader).
 *
 *   node scripts/gen-papel.mjs
 */
import sharp from "sharp";

const LADO = 768;
const { data, info } = await sharp("brand/papel.jpg")
  .resize(LADO, LADO)
  .extractChannel("blue") // el azul es el canal con el grano
  .raw()
  .toBuffer({ resolveWithObject: true });

let suma = 0;
for (const v of data) suma += v;
const media = suma / data.length;
let var2 = 0;
for (const v of data) var2 += (v - media) ** 2;
const desvio = Math.sqrt(var2 / data.length);

// centrado en 128, con un desvío fijo (la intensidad la decide el shader)
const salida = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i++) {
  salida[i] = Math.max(0, Math.min(255, Math.round(128 + ((data[i] - media) / desvio) * 32)));
}
await sharp(salida, { raw: { width: info.width, height: info.height, channels: 1 } })
  .webp({ quality: 55 })
  .toFile("public/assets/papel.webp");
console.log(`public/assets/papel.webp ${LADO}x${LADO} (media ${media.toFixed(1)}, desvío ${desvio.toFixed(1)})`);
