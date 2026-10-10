/**
 * ¿EL LÍQUIDO SE MUEVE? Compara dos capturas del inicio separadas 3 s: las
 * gotas flotan solas, así que un recorte con líquido tiene que cambiar. Si el
 * loop de la escena se cuelga (o el canvas no dibuja), esto lo agarra.
 * Con reduce-motion las gotas NO flotan solas: ahí tiene que quedar quieto.
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
    // el borde derecho del inicio: ahí siempre hay líquido
    const clip = { x: 1180, y: 120, width: 260, height: 300 };
    const a = await p.screenshot({ clip });
    await p.waitForTimeout(3000);
    const c = await p.screenshot({ clip });
    const distinto = !a.equals(c);
    if (reducedMotion === "reduce") check(!distinto, "reduce-motion: el líquido no flota solo");
    else check(distinto, "el líquido se mueve solo");
    await ctx.close();
  }
  await b.close();
  console.log(fallas === 0 ? "✓ ANIMACIÓN OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
