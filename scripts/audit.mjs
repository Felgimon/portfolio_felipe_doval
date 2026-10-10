/**
 * AUDITORÍA DE RIESGO (v6) — lo que más chance tiene de romperse en silencio:
 *  1. Rutas de servicio: OG/Twitter, robots, sitemap, 404 de slug y de ruta.
 *  2. SIN WebGL: el póster, Feli como <img> y el vidrio sólido (nadie navega
 *     sin GPU a mano, así que nadie lo vería romperse).
 *  3. TECLADO: la nav lleva a la parada Y el foco pasa al contenido (en la v5
 *     el foco se quedaba en la nav).
 *  4. El mail: se copia al portapapeles, Feli lo comenta, y NO está en el HTML.
 *  5. "Volver a la visita" desde un caso.
 *  6. REDUCIR MOVIMIENTO: la navegación no se congela (regresión v5.17.2): la
 *     escena sigue pintando a Feli al llegar a cada parada.
 *  7. Reglas de texto de Felipe: cero rayas en el texto visible y nunca la
 *     palabra de la herramienta de workspace que no se nombra.
 *  8. El huevo de pascua de tocar a Feli.
 *
 * Uso: npm run build && node scripts/audit.mjs
 * (PW_CHROMIUM / GL_SOFT: ver scripts/lib/servidor.mjs)
 */
import http from "node:http";
import { levantar, navegador } from "./lib/servidor.mjs";

const MAIL = ["felipe", "ferrari", "doval"].join("") + "@" + ["gmail", "com"].join(".");
const PROHIBIDA = ["No", "tion"].join(""); // ni en este archivo se escribe entera

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};

const { base: BASE, cerrar } = await levantar(3262);
const pedir = (ruta) =>
  new Promise((res) => {
    http
      .get(`${BASE}${ruta}`, (x) => {
        let cuerpo = "";
        x.setEncoding("utf8");
        x.on("data", (c) => (cuerpo += c));
        x.on("end", () => res({ code: x.statusCode, tipo: x.headers["content-type"] ?? "", cuerpo }));
      })
      .on("error", () => res({ code: 0, tipo: "", cuerpo: "" }));
  });

try {
  // ---- 1. Rutas de servicio ----
  const og = await pedir("/opengraph-image.jpg");
  check(og.code === 200 && og.tipo.startsWith("image/"), `OG image: ${og.code} ${og.tipo}`);
  const tw = await pedir("/twitter-image.jpg");
  check(tw.code === 200 && tw.tipo.startsWith("image/"), `Twitter image: ${tw.code} ${tw.tipo}`);
  check((await pedir("/robots.txt")).code === 200, "robots.txt");
  check((await pedir("/sitemap.xml")).code === 200, "sitemap.xml");
  check((await pedir("/proyectos/buscaminas")).code === 404, "slug sin caso → 404");
  check((await pedir("/una-ruta-que-no-existe")).code === 404, "ruta inventada → 404");

  // ---- 4b / 7. El HTML servido ----
  for (const ruta of ["/", "/proyectos/superlum", "/proyectos/futbolvision"]) {
    const { cuerpo } = await pedir(ruta);
    check(!cuerpo.includes(MAIL), `${ruta}: el mail NO está en el HTML`);
    check(!cuerpo.toLowerCase().includes(PROHIBIDA.toLowerCase()), `${ruta}: sin la palabra prohibida`);
    check(/<main[\s>]/.test(cuerpo), `${ruta}: tiene <main>`);
  }

  const b = await navegador();

  // ---- 2. Sin WebGL ----
  {
    const ctx = await b.newContext({ locale: "es-AR", viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
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
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const img = document.querySelector("[data-feli] img");
      const vid = document.querySelector(".vidrio");
      const cv = document.querySelector("canvas.escena");
      return {
        estado: document.documentElement.dataset.escena,
        feli: img ? img.getBoundingClientRect().width > 50 && getComputedStyle(img).visibility !== "hidden" : false,
        canvas: cv ? getComputedStyle(cv).display : "sin canvas",
        vidrio: vid ? getComputedStyle(vid).backgroundColor : "",
      };
    });
    check(r.estado === "poster", `sin WebGL → modo póster (${r.estado})`);
    check(r.canvas === "none", `sin WebGL → canvas oculto (${r.canvas})`);
    check(r.feli, "sin WebGL → Feli visible como <img>");
    check(r.vidrio === "rgb(255, 255, 255)", `sin WebGL → vidrio sólido (${r.vidrio})`);
    check(errores.length === 0, `sin WebGL → 0 errores de página (${errores.length})`);
    await ctx.close();
  }

  // ---- 3. Teclado · 4. Mail · 8. Huevo · 5. Volver ----
  {
    const ctx = await b.newContext({
      locale: "es-AR",
      viewport: { width: 1440, height: 900 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(2500);

    const llego = await p.evaluate(() => {
      const a = [...document.querySelectorAll("nav[aria-label] a")].find((x) => x.textContent.trim() === "Trabajo");
      a?.focus();
      return document.activeElement === a;
    });
    check(llego, "teclado: el link Trabajo de la nav es enfocable");
    await p.keyboard.press("Enter");
    await p.waitForTimeout(2200);
    const nav = await p.evaluate(() => ({ y: window.scrollY, foco: document.activeElement?.id }));
    check(nav.y > 1000, `teclado: Enter llevó a Trabajo (scrollY ${Math.round(nav.y)})`);
    check(nav.foco === "trabajo-titulo", `teclado: el foco pasó al título de la parada (${nav.foco})`);
    check(p.url().endsWith("#trabajo"), `la URL quedó en #trabajo (${p.url()})`);

    await p.evaluate(() => document.getElementById("contacto").scrollIntoView());
    await p.waitForTimeout(1200);
    await p.locator("#contacto button", { hasText: /Copiar mi mail/ }).first().click();
    await p.waitForTimeout(500);
    const clip = await p.evaluate(() => navigator.clipboard.readText());
    check(clip === MAIL, "portapapeles: copió el mail");
    const dice = await p.locator("#contacto [data-vidrio]", { hasText: /Copiado/ }).count();
    check(dice > 0, "Feli comenta que se copió");

    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(800);
    const feli = p.locator("#inicio [data-feli]");
    for (let i = 0; i < 5; i++) {
      await feli.click();
      await p.waitForTimeout(150);
    }
    const huevo = await p.evaluate(() => ({
      hundido: document.querySelector("#inicio [data-feli]")?.hasAttribute("data-hundir"),
      cartel: document.querySelector(".cartel-vuelvo")?.textContent,
    }));
    check(huevo.hundido && huevo.cartel === "Ahora vuelvo", `huevo: a la quinta Feli se va (${huevo.cartel})`);

    const texto = await p.evaluate(() => document.body.innerText);
    check(!texto.includes("—"), "texto visible sin rayas (—)");

    await p.goto(`${BASE}/proyectos/superlum`, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    const volver = p.locator("header a", { hasText: /Volver a la visita|Back to the tour/ });
    check((await volver.count()) === 1, `"Volver a la visita" en el caso`);
    await volver.click();
    await p.waitForURL(/#trabajo$/, { timeout: 15000 }).catch(() => {});
    check(p.url().includes("/#trabajo"), `volver navegó a /#trabajo (${p.url()})`);
    await ctx.close();
  }

  // ---- 6. Reducir movimiento: la navegación no se congela ----
  {
    const ctx = await b.newContext({
      locale: "es-AR",
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.getElementById("perfil")?.scrollIntoView());
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => ({
      escena: document.documentElement.dataset.escena,
      activo: document.querySelector("[data-nav-activo]")?.textContent?.trim(),
      pintado: document.querySelector("#perfil [data-feli]")?.hasAttribute("data-pintado"),
    }));
    check(r.activo === "Perfil", `reduced-motion: la nav sigue al scroll (${r.activo})`);
    check(
      r.escena !== "lista" || r.pintado,
      `reduced-motion: la escena pinta a Feli al llegar a la parada (${r.escena}, ${r.pintado})`,
    );
    await ctx.close();
  }

  await b.close();
  console.log(fallas === 0 ? "✓ AUDITORÍA OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
