/**
 * Genera el PÓSTER del líquido: lo que se ve de fondo cuando no hay WebGL o
 * el equipo no llega (html[data-escena="poster"]). Es un render real del
 * shader, sin contenido arriba: se esconde todo el DOM y se sacan Feli y el
 * vidrio, así queda sólo el líquido del inicio.
 *
 *   npm run build && node scripts/gen-poster.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { levantar, navegador } from "./lib/servidor.mjs";

mkdirSync("public/assets/escena", { recursive: true });
const { base, cerrar } = await levantar(Number(process.env.POSTER_PORT ?? 3278));
try {
  const b = await navegador();
  for (const [nombre, w, h] of [["poster", 1600, 1000], ["poster-movil", 430, 932]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: nombre === "poster" ? 1 : 2 });
    await p.goto(`${base}/?fx=full`, { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(() => {
      document.querySelectorAll("[data-feli],[data-vidrio],[data-nav-activo]").forEach((e) => {
        e.removeAttribute("data-feli");
        e.removeAttribute("data-vidrio");
        e.removeAttribute("data-nav-activo");
      });
      const css = document.createElement("style");
      css.textContent = ".capa, header, footer, nextjs-portal { visibility: hidden !important }";
      document.head.appendChild(css);
    });
    await p.waitForTimeout(2500);
    const png = await p.screenshot({ type: "png" });
    await sharp(png).webp({ quality: 80 }).toFile(`public/assets/escena/${nombre}.webp`);
    console.log(`${nombre}: listo`);
    await p.close();
  }
  await b.close();
} finally {
  cerrar();
}
