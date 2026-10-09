/**
 * Genera la imagen para compartir (Open Graph / Twitter): una CAPTURA REAL del
 * inicio, con el líquido, el vidrio y Feli. Satori (next/og) no ejecuta WebGL,
 * así que la única forma de que la preview sea el sitio de verdad es sacarle
 * una foto con un navegador.
 *
 * Se captura a 2x y se baja a 1200x630 (el downscale hace de antialias).
 *
 *   npm run build && node scripts/gen-og.mjs
 */
import { writeFileSync } from "node:fs";
import { levantar, navegador } from "./lib/servidor.mjs";

const W = 1200, H = 630;
const { base, cerrar } = await levantar(Number(process.env.OG_PORT ?? 3277));
try {
  const b = await navegador();
  const p = await b.newPage({ locale: "es-AR", viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  // fx=full: en una máquina sin GPU el sitio bajaría a calidad baja.
  await p.goto(`${base}/?fx=full`, { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForTimeout(4500); // Feli termina de subir del líquido (1,35 s) y sobra
  await p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()));
  const grande = await p.screenshot({ type: "png" });
  const dataUrl = await p.evaluate(
    async ([b64, w, h]) => {
      const img = await new Promise((r) => {
        const i = new Image();
        i.onload = () => r(i);
        i.src = "data:image/png;base64," + b64;
      });
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      g.imageSmoothingQuality = "high";
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, 0, w, h);
      return c.toDataURL("image/jpeg", 0.9);
    },
    [grande.toString("base64"), W, H],
  );
  const jpg = Buffer.from(dataUrl.split(",")[1], "base64");
  for (const f of ["app/opengraph-image.jpg", "app/twitter-image.jpg"]) writeFileSync(f, jpg);
  console.log(`OG: ${W}x${H}, ${(jpg.length / 1024).toFixed(0)} KB`);
  await b.close();
} finally {
  cerrar();
}
