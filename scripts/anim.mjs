/**
 * ¿LA GOTA ESTÁ VIVA? Compara dos capturas de la gota del inicio separadas
 * 3 s: ondula sola (y su gotita satélite sube y baja), así que el recorte tiene
 * que cambiar. Si el loop de la escena se cuelga (o el canvas no dibuja), esto
 * lo agarra. Con reduce-motion la gota NO ondula: ahí tiene que quedar quieta.
 *
 * Uso: npm run build && node scripts/anim.mjs
 */
import { levantar, navegador } from "./lib/servidor.mjs";

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};

const { base: BASE, cerrar } = await levantar(3264);
try {
  const b = await navegador();
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const ctx = await b.newContext({ locale: "es-AR", viewport: { width: 1440, height: 900 }, reducedMotion });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/?fx=full`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(3000);
    // la gota se apoya en el nombre, a 41% del ancho y 70% del alto del h1
    const clip = await p.evaluate(() => {
      const r = document.querySelector("h1[data-placa]").getBoundingClientRect();
      return { x: Math.round(r.left + r.width * 0.41 - 130), y: Math.round(r.top + r.height * 0.7 - 150), width: 260, height: 300 };
    });
    const a = await p.screenshot({ clip });
    await p.waitForTimeout(3000);
    const c = await p.screenshot({ clip });
    const distinto = !a.equals(c);
    if (reducedMotion === "reduce") check(!distinto, "reduce-motion: la gota no ondula sola");
    else check(distinto, "la gota ondula sola");
    await ctx.close();
  }
  await b.close();
  console.log(fallas === 0 ? "✓ ANIMACIÓN OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
