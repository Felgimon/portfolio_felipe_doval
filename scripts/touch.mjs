/**
 * EL CELULAR DE VERDAD — 393x659 (un iPhone con las barras del navegador; el
 * emulador de 390x844 inventaba 185px de alto, ver DECISIONS v5.6).
 *  - Sin scroll horizontal en ninguna parada.
 *  - La nav: la píldora muestra la parada actual, "Paradas" abre la lista, y
 *    tocar una parada lleva ahí y la cierra.
 *  - Todos los objetivos táctiles de la nav miden ≥ 44px de alto.
 *
 * Uso: npm run build && node scripts/touch.mjs
 */
import { levantar, navegador } from "./lib/servidor.mjs";

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};

const { base: BASE, cerrar } = await levantar(3263);
try {
  const b = await navegador();
  const ctx = await b.newContext({
    locale: "es-AR",
    viewport: { width: 393, height: 659 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
  });
  const p = await ctx.newPage();
  for (const ruta of ["/", "/proyectos/superlum", "/proyectos/futbolvision"]) {
    await p.goto(`${BASE}${ruta}`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(1500);
    const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
    check(ancho <= 393, `${ruta}: sin scroll horizontal (${ancho}px)`);
  }

  await p.goto(`${BASE}/`, { waitUntil: "load" });
  await p.waitForTimeout(1500);
  const boton = p.locator("header button[aria-controls='hoja-paradas']");
  check((await boton.count()) === 1, "nav: botón Paradas");
  const alto = (await boton.boundingBox())?.height ?? 0;
  check(alto >= 44, `nav: Paradas mide ${Math.round(alto)}px de alto`);
  await boton.tap();
  await p.waitForTimeout(400);
  const items = p.locator("#hoja-paradas a");
  check((await items.count()) === 6, `nav: la lista tiene las 6 paradas (${await items.count()})`);
  const altos = await items.evaluateAll((xs) => xs.map((x) => x.getBoundingClientRect().height));
  check(altos.every((h) => h >= 44), `nav: cada parada ≥ 44px (${altos.map(Math.round).join(", ")})`);
  await items.filter({ hasText: "Contacto" }).tap();
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => ({
    abierta: Boolean(document.getElementById("hoja-paradas")),
    top: document.getElementById("contacto")?.getBoundingClientRect().top ?? 9999,
  }));
  check(!r.abierta, "nav: la lista se cierra al elegir");
  check(Math.abs(r.top) < 120, `nav: llevó a Contacto (top ${Math.round(r.top)}px)`);

  await b.close();
  console.log(fallas === 0 ? "✓ CELULAR OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
