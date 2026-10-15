/**
 * IDIOMA AUTOMÁTICO — verifica la detección y el contenido en los dos idiomas
 * (sin selector: lo decide la configuración del navegador).
 *  - es-AR → todo en español, <html lang="es">, Feli habla en español.
 *  - en-US → todo en inglés, <html lang="en">, incluida la página del caso.
 * También verifica que NO haya mismatch de hidratación (0 errores de consola).
 *
 * Uso: npm run build && node scripts/idioma.mjs
 */
import { levantar, navegador } from "./lib/servidor.mjs";

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};
const ruido = (t) => /_vercel\/insights|status of 404/.test(t);

const CASOS = [
  { locale: "es-AR", lang: "es", cta: "Ver el trabajo", nav: "Perfil", ahora: "Construyendo Superlum", problema: "El problema" },
  { locale: "en-US", lang: "en", cta: "See the work", nav: "Profile", ahora: "Building Superlum", problema: "The problem" },
];

const { base: BASE, cerrar } = await levantar(3261);
try {
  const b = await navegador();
  for (const caso of CASOS) {
    const ctx = await b.newContext({ locale: caso.locale, viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errores = [];
    p.on("console", (m) => m.type() === "error" && !ruido(m.text()) && errores.push(m.text()));
    p.on("pageerror", (e) => errores.push(String(e)));

    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(2500);
    const home = await p.evaluate(() => ({
      lang: document.documentElement.lang,
      inicio: document.getElementById("inicio")?.innerText ?? "",
      nav: [...document.querySelectorAll("nav[aria-label] a")].map((x) => x.textContent.trim()),
    }));
    check(home.lang === caso.lang, `${caso.locale}: <html lang="${home.lang}">`);
    check(home.inicio.includes(caso.cta), `${caso.locale}: botón "${caso.cta}"`);
    check(home.inicio.includes(caso.ahora), `${caso.locale}: el panel Ahora dice "${caso.ahora}…"`);
    check(home.nav.includes(caso.nav), `${caso.locale}: la nav dice "${caso.nav}"`);

    await p.goto(`${BASE}/proyectos/superlum`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(1500);
    const h2 = await p.evaluate(() => [...document.querySelectorAll("h2")].map((x) => x.textContent.trim()));
    check(h2.some((x) => x.includes(caso.problema)), `${caso.locale}: el caso dice "${caso.problema}"`);
    check(errores.length === 0, `${caso.locale}: 0 errores de consola (hay ${errores.length}) ${errores[0] ?? ""}`);
    await ctx.close();
  }
  await b.close();
  console.log(fallas === 0 ? "✓ IDIOMA OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
