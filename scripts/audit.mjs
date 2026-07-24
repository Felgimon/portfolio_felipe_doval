/**
 * AUDITORÍA DE RIESGO — las funcionalidades con más chance de romperse,
 * elegidas por criterio (no al azar):
 *  1. El POSTER sin WebGL: es el fallback menos ejercitado (nadie navega sin
 *     GPU a mano) y cambió 3 veces (CanvasGuard, chato, regeneraciones).
 *  2. El TECLADO: el HUD es la única navegación accesible; una regresión acá
 *     no se ve en ningún test visual.
 *  3. El portapapeles del email: API con permisos, fácil de romper en silencio.
 *  4. Las rutas de servicio: 404 de slug inválido, OG image, robots, sitemap.
 *  5. "Volver al grafo" desde un case study (navegación de vuelta).
 *
 * Uso: npm run build && node scripts/audit.mjs
 */
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = 3262;
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
const status = (ruta) =>
  new Promise((res) => {
    http
      .get(`${BASE}${ruta}`, (x) => {
        const tipo = x.headers["content-type"] ?? "";
        x.resume();
        res({ code: x.statusCode, tipo });
      })
      .on("error", () => res({ code: 0, tipo: "" }));
  });

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};

const srv = spawn(`npx next start -p ${PORT}`, {
  shell: true,
  stdio: "ignore",
  env: process.env,
});
try {
  await wait(BASE);

  // ---- 4. Rutas de servicio (sin navegador: puro HTTP) ----
  // Las previews al compartir el link. Desde v5.17.9 son una CAPTURA de la home
  // servida como archivo estático (.jpg), no una ImageResponse: si alguien
  // borra el .jpg o le cambia la extensión, el link queda sin preview y no se
  // nota hasta que alguien lo comparte. De ahí que se chequeen las dos.
  const og = await status("/opengraph-image.jpg");
  check(og.code === 200 && og.tipo.startsWith("image/"), `OG image: ${og.code} ${og.tipo}`);
  const tw = await status("/twitter-image.jpg");
  check(tw.code === 200 && tw.tipo.startsWith("image/"), `Twitter image: ${tw.code} ${tw.tipo}`);
  const robots = await status("/robots.txt");
  check(robots.code === 200, `robots.txt: ${robots.code}`);
  const sitemap = await status("/sitemap.xml");
  check(sitemap.code === 200, `sitemap.xml: ${sitemap.code}`);
  const cuatro = await status("/proyectos/buscaminas");
  check(cuatro.code === 404, `slug sin case study → 404 (${cuatro.code})`);
  const inventado = await status("/una-ruta-que-no-existe");
  check(inventado.code === 404, `ruta inventada → 404 (${inventado.code})`);

  const b = await chromium.launch();

  // ---- 1. Poster sin WebGL ----
  {
    const ctx = await b.newContext({
      locale: "es-AR",
      viewport: { width: 1440, height: 900 },
    });
    const p = await ctx.newPage();
    // Bloquear WebGL ANTES de cargar: el sitio debe caer al poster sin drama.
    await p.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...args) {
        if (typeof tipo === "string" && tipo.includes("webgl")) return null;
        return orig.call(this, tipo, ...args);
      };
    });
    const errores = [];
    p.on("pageerror", (e) => errores.push(String(e)));
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(5000);
    const poster = await p.evaluate(() => {
      const img = document.querySelector('img[src*="hero-poster"]');
      return {
        hay: Boolean(img),
        visible: img ? img.getBoundingClientRect().width > 50 : false,
        canvas: Boolean(document.querySelector("canvas")),
      };
    });
    check(
      poster.hay && poster.visible && !poster.canvas,
      `sin WebGL → poster visible y sin canvas (img:${poster.hay} vis:${poster.visible} canvas:${poster.canvas})`,
    );
    check(errores.length === 0, `sin WebGL → 0 errores de página (${errores.length})`);
    await ctx.close();
  }

  // ---- 2. Teclado + 3. Portapapeles + 5. Volver ----
  {
    const ctx = await b.newContext({
      locale: "es-AR",
      viewport: { width: 1440, height: 900 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(6000);

    // Teclado: tab hasta un botón del HUD y Enter navega.
    const llego = await p.evaluate(async () => {
      const objetivo = [
        ...document.querySelectorAll('nav[aria-label] button'),
      ].find((x) => x.textContent.trim() === "Trabajo");
      objetivo?.focus();
      return document.activeElement === objetivo;
    });
    check(llego, "teclado: el botón del HUD es enfocable");
    await p.keyboard.press("Enter");
    await p.waitForTimeout(2200);
    const scrollY = await p.evaluate(() => window.scrollY);
    check(scrollY > 1000, `teclado: Enter navegó a Trabajo (scrollY ${Math.round(scrollY)})`);

    // Portapapeles: click en el email de Contacto lo copia.
    await p.evaluate(() => document.getElementById("contacto").scrollIntoView());
    await p.waitForTimeout(1500);
    await p.locator('#contacto button[aria-label*="email" i], #contacto button[aria-label*="Email" i]').first().click();
    await p.waitForTimeout(400);
    const clip = await p.evaluate(() => navigator.clipboard.readText());
    check(
      clip === "felipeferraridoval@gmail.com",
      `portapapeles: copió el email (${clip})`,
    );

    // Volver al grafo desde el case study.
    await p.goto(`${BASE}/proyectos/superlum`, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    const volver = p.locator("header a", { hasText: /Volver al grafo|Back to the graph/ });
    check((await volver.count()) === 1, `"Volver al grafo" presente en el case study`);
    await volver.click();
    await p.waitForURL(`${BASE}/#trabajo`, { timeout: 15000 }).catch(() => {});
    check(p.url().includes("/#trabajo"), `volver navegó a /#trabajo (${p.url()})`);
    await ctx.close();
  }

  // ---- 6. Navegación con REDUCED-MOTION (regresión v5.17.2) ----
  // Un visitante con "reducir movimiento" del sistema (lo tenía el amigo de
  // Felipe, en Brave y Edge) debe poder navegar igual: la cámara sigue al
  // scroll, solo que sin la inercia. Antes se congelaba en la portada y el sitio
  // quedaba inusable. Esto no se ve en ningún test visual normal (todos corren
  // sin la preferencia), así que va acá. Testigo: los chips del overlay los
  // posiciona la proyección de la cámara — si la cámara se mueve, se mueven.
  {
    const ctx = await b.newContext({
      locale: "es-AR",
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(6000);
    // Centro-x de cada chip VISIBLE del overlay (los ocultos se van a -9999).
    const chips = () =>
      p.evaluate(() => {
        const out = {};
        for (const btn of document.querySelectorAll(".solabels button")) {
          const r = btn.getBoundingClientRect();
          if (r.width > 5 && r.left > -1000 && r.left < window.innerWidth) {
            out[btn.getAttribute("aria-label")] = r.left + r.width / 2;
          }
        }
        return out;
      });
    const portada = await chips();
    await p.evaluate(() => document.getElementById("enfoque")?.scrollIntoView({ block: "center" }));
    await p.waitForTimeout(2500);
    const enfoque = await chips();
    // Desplazamiento medio de los chips visibles en AMBOS estados.
    const comunes = Object.keys(portada).filter((k) => k in enfoque);
    const desp = comunes.length
      ? comunes.reduce((a, k) => a + Math.abs(enfoque[k] - portada[k]), 0) / comunes.length
      : 0;
    check(
      comunes.length >= 2 && desp > 40,
      `reduced-motion: la cámara sigue al scroll (${comunes.length} chips, Δx medio ${Math.round(desp)}px)`,
    );
    await ctx.close();
  }

  await b.close();
  console.log(fallas === 0 ? "✓ AUDITORÍA OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  try {
    execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: "ignore" });
  } catch {}
}
