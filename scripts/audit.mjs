/**
 * AUDITORÍA DE RIESGO (v7) — lo que más chance tiene de romperse en silencio:
 *  1. Rutas de servicio: OG/Twitter, robots, sitemap, 404 de slug y de ruta.
 *  2. SIN WebGL: el estudio en CSS, el nombre como texto, Feli como <img> y
 *     el vidrio sólido (nadie navega
 *     sin GPU a mano, así que nadie lo vería romperse).
 *  3. TECLADO: la nav lleva a la sección Y el foco pasa al contenido (en la v5
 *     el foco se quedaba en la nav).
 *  4. El mail: se copia al portapapeles, el botón lo confirma, y NO está en
 *     el HTML.
 *  5. "Volver" desde un caso.
 *  6. REDUCIR MOVIMIENTO: la navegación no se congela (regresión v5.17.2): la
 *     escena sigue pintando a Feli al llegar a cada sección.
 *  7. Reglas de texto de Felipe: cero rayas en el texto visible y nunca la
 *     palabra de la herramienta de workspace que no se nombra.
 *  8. v7: Feli sólo en fotos (sin globos), UNA sola fuente en todo el sitio y
 *     los títulos pintados por la escena.
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
      const h1 = document.querySelector("h1[data-placa]");
      return {
        estado: document.documentElement.dataset.escena,
        feli: img ? img.getBoundingClientRect().width > 50 && getComputedStyle(img).visibility !== "hidden" : false,
        canvas: cv ? getComputedStyle(cv).display : "sin canvas",
        vidrio: vid ? getComputedStyle(vid).backgroundColor : "",
        nombre: h1 ? getComputedStyle(h1).color : "",
      };
    });
    check(r.estado === "poster", `sin WebGL → modo póster (${r.estado})`);
    check(r.canvas === "none", `sin WebGL → canvas oculto (${r.canvas})`);
    check(r.feli, "sin WebGL → Feli visible como <img>");
    check(r.vidrio === "rgb(15, 35, 127)", `sin WebGL → vidrio sólido (${r.vidrio})`);
    check(r.nombre === "rgb(242, 238, 230)", `sin WebGL → el nombre se ve como texto (${r.nombre})`);
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
    check(nav.foco === "trabajo-titulo", `teclado: el foco pasó al título de la sección (${nav.foco})`);
    check(p.url().endsWith("#trabajo"), `la URL quedó en #trabajo (${p.url()})`);

    // el hover de la nav: la gota vuela al link y se vuelve una píldora; al salir, vuelve
    const enlace = await p.locator('header a[data-id="proyectos"]').boundingBox();
    await p.mouse.move(enlace.x + enlace.width / 2, enlace.y + enlace.height / 2, { steps: 4 });
    await p.waitForTimeout(1300);
    const sobre = await p.evaluate(() => ({
      aqui: document.querySelector('header a[data-id="proyectos"]').hasAttribute("data-gota-aqui"),
      escena: document.documentElement.dataset.escena,
      modo: document.documentElement.dataset.gotaModo,
    }));
    check(sobre.aqui, "nav: el link con el mouse encima llama a la gota (data-gota-aqui)");
    check(sobre.escena !== "lista" || sobre.modo === "boton", `nav: la gota se volvió píldora sobre el link (${sobre.escena}, ${sobre.modo})`);
    await p.mouse.move(5, 890);
    await p.waitForTimeout(1300);
    const vuelve = await p.evaluate(() => !document.querySelector("[data-gota-aqui]") && !document.documentElement.dataset.gotaModo);
    check(vuelve, "nav: al salir, la gota vuelve a su título");

    await p.evaluate(() => document.getElementById("contacto").scrollIntoView());
    await p.waitForTimeout(1200);
    await p.locator("#contacto button", { hasText: /Copiar mi mail/ }).first().click();
    await p.waitForTimeout(500);
    const clip = await p.evaluate(() => navigator.clipboard.readText());
    check(clip === MAIL, "portapapeles: copió el mail");
    const dice = await p.evaluate(() => {
      const c = document.querySelector("#contacto .copiar");
      return { estado: c?.getAttribute("data-estado"), ficha: c?.querySelector(".copiar-direccion")?.textContent ?? "" };
    });
    check(dice.estado === "ok", `el botón confirma que se copió (${dice.estado})`);
    check(dice.ficha === MAIL, "la ficha muestra la dirección recién después de copiar");

    // Feli acompaña en fotos, no habla (v7): nada de globos ni frases
    const feli = await p.evaluate(() => ({
      fotos: document.querySelectorAll("[data-feli]").length,
      ocultas: [...document.querySelectorAll("[data-feli]")].every((x) => x.getAttribute("aria-hidden") === "true"),
      globos: document.querySelectorAll(".globo, .cartel-vuelvo, [data-globo]").length,
    }));
    check(feli.fotos >= 4 && feli.ocultas, `Feli: ${feli.fotos} fotos decorativas (aria-hidden)`);
    check(feli.globos === 0, `Feli: sin globos ni comentarios (${feli.globos})`);

    // una sola fuente en todo el sitio
    const familias = await p.evaluate(() => [...new Set([...document.querySelectorAll("body *")].map((x) => getComputedStyle(x).fontFamily.split(",")[0].trim()))]);
    check(familias.length === 1 && /doval/i.test(familias[0]), `una sola fuente: ${familias.join(" | ")}`);

    // con la escena lista, los títulos los pinta el shader (el DOM queda transparente)
    const placas = await p.evaluate(() => ({
      escena: document.documentElement.dataset.escena,
      color: getComputedStyle(document.querySelector("h1[data-placa]")).color,
    }));
    check(placas.escena !== "lista" || placas.color === "rgba(0, 0, 0, 0)", `placa: el nombre lo pinta la escena (${placas.escena}, ${placas.color})`);

    const texto = await p.evaluate(() => document.body.innerText);
    check(!texto.includes("—"), "texto visible sin rayas (—)");

    await p.goto(`${BASE}/proyectos/superlum`, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    const volver = p.locator("header a:visible", { hasText: /Volver|Back/ });
    check((await volver.count()) === 1, `"Volver" en el caso`);
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
      activo: document.querySelector("nav [aria-current=location]")?.textContent?.trim(),
      pintado: document.querySelector("#perfil [data-feli]")?.hasAttribute("data-pintado"),
    }));
    check(r.activo === "Perfil", `reduced-motion: la nav sigue al scroll (${r.activo})`);
    check(
      r.escena !== "lista" || r.pintado,
      `reduced-motion: la escena pinta a Feli al llegar a la sección (${r.escena}, ${r.pintado})`,
    );
    await ctx.close();
  }

  await b.close();
  console.log(fallas === 0 ? "✓ AUDITORÍA OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
