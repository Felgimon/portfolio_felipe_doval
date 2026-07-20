/**
 * IDIOMA AUTOMÁTICO — verifica la detección y el contenido en los dos idiomas.
 *
 * La detección prioriza el idioma del navegador (= la configuración de Google
 * en Chrome) y cae a la región si no hay señal. Acá se emulan ambos perfiles
 * con `locale` de Playwright (que setea navigator.languages y Accept-Language):
 *  - es-AR → todo en español, <html lang="es">.
 *  - en-US → todo en inglés, <html lang="en">, incluida la página de detalle.
 * También verifica que NO haya mismatch de hidratación (0 errores de consola).
 *
 * Uso: npm run build && node scripts/idioma.mjs
 */
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = 3261;
const BASE = `http://127.0.0.1:${PORT}`;

function wait(url, t = 90000) {
  const t0 = Date.now();
  return new Promise((res, rej) => {
    const go = () => {
      const r = http.get(url, (x) => {
        x.resume();
        if (x.statusCode < 500) res();
        else retry();
      });
      r.on("error", retry);
      r.setTimeout(3000, () => r.destroy());
    };
    const retry = () =>
      Date.now() - t0 > t ? rej(new Error("timeout")) : setTimeout(go, 600);
    go();
  });
}

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};

const CASOS = [
  {
    locale: "es-AR",
    lang: "es",
    cta: "Hablemos",
    hud: "Perfil",
    problema: "El problema",
  },
  {
    locale: "en-US",
    lang: "en",
    cta: "Let's talk",
    hud: "Profile",
    problema: "The problem",
  },
];

const srv = spawn(`npx next start -p ${PORT}`, {
  shell: true,
  stdio: "ignore",
  env: process.env,
});
try {
  await wait(BASE);
  const b = await chromium.launch();
  for (const caso of CASOS) {
    const ctx = await b.newContext({
      locale: caso.locale,
      viewport: { width: 1440, height: 900 },
    });
    const p = await ctx.newPage();
    const errores = [];
    p.on("console", (m) => {
      if (m.type() === "error") errores.push(m.text());
    });

    // Home
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(4000);
    const home = await p.evaluate(() => ({
      lang: document.documentElement.lang,
      ctas: [...document.querySelectorAll("#inicio button")].map((x) =>
        x.textContent.trim(),
      ),
      hud: [
        ...document.querySelectorAll('nav[aria-label] button'),
      ].map((x) => x.textContent.trim()),
    }));
    check(home.lang === caso.lang, `${caso.locale}: <html lang="${home.lang}">`);
    check(
      home.ctas.some((x) => x.includes(caso.cta)),
      `${caso.locale}: CTA "${caso.cta}" presente (${home.ctas.join(" | ")})`,
    );
    check(
      home.hud.includes(caso.hud),
      `${caso.locale}: HUD dice "${caso.hud}" (${home.hud.join(", ")})`,
    );

    // Detalle de proyecto
    await p.goto(`${BASE}/proyectos/superlum`, {
      waitUntil: "load",
      timeout: 45000,
    });
    await p.waitForTimeout(1500);
    const detalle = await p.evaluate(() =>
      [...document.querySelectorAll("h2")].map((x) => x.textContent.trim()),
    );
    check(
      detalle.some((x) => x.includes(caso.problema)),
      `${caso.locale}: detalle dice "${caso.problema}"`,
    );
    check(
      errores.length === 0,
      `${caso.locale}: 0 errores de consola (hidratación limpia) — hay ${errores.length}`,
    );
    await ctx.close();
  }
  await b.close();
  console.log(fallas === 0 ? "✓ IDIOMA OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  try {
    execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: "ignore" });
  } catch {}
}
