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
 *     escena sigue pintando los objetos (cianotipos) al llegar a cada sección.
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
    // v9: cuenta los osciladores que crea el sonido (la canción y los hovers)
    await ctx.addInitScript(() => {
      window.__osciladores = 0;
      const crear = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        window.__osciladores++;
        return crear.call(this);
      };
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(2500);

    // v9: varias burbujas por sección, de distintos tamaños
    const porSeccion = await p.evaluate(() =>
      ["inicio", "perfil", "enfoque", "trabajo", "proyectos", "recorrido", "contacto"].map((id) => {
        const sec = document.getElementById(id);
        const radios = [sec, ...sec.querySelectorAll("[data-burbujas]")]
          .filter((el) => el.dataset.burbujas && el.getBoundingClientRect().width > 0)
          .flatMap((el) => el.dataset.burbujas.split(";").map((t) => Number(t.trim().split(/\s+/)[2])));
        return [id, radios.length, new Set(radios).size];
      }),
    );
    check(
      porSeccion.every(([, n, distintos]) => n >= 2 && distintos >= 2),
      `burbujas: cada sección tiene al menos dos, de tamaños distintos (${porSeccion.map(([id, n]) => `${id} ${n}`).join(", ")})`,
    );

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
    check(vuelve, "nav: al salir, las burbujas vuelven a su lugar");

    // v9: con el mouse sobre un botón, TODAS las burbujas que se ven se juntan en
    // él y son una sola (el reloj de la escena a mano expone dónde está cada una)
    {
      await p.evaluate(() => window.scrollTo(0, document.getElementById("proyectos").offsetTop));
      await p.waitForTimeout(900);
      await p.evaluate(() => {
        window.__relojEscena = performance.now();
        window.__tic = setInterval(() => (window.__relojEscena = performance.now()), 16);
      });
      await p.waitForTimeout(500);
      const antes = await p.evaluate(() => (window.__burbujas ?? []).length);
      const caja = await p.locator("#proyectos a.boton-solido").first().boundingBox();
      await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 3 });
      // sin GPU cada cuadro tarda y el resorte avanza a lo sumo 100 ms por cuadro:
      // se espera a que lleguen (o a que pase el tiempo)
      await p
        .waitForFunction(
          (c) => (window.__burbujas ?? []).every((b) => Math.hypot(b[0] - c.x - c.width / 2, b[1] - c.y - c.height / 2) < 6 && b[3] > 0.9),
          caja,
          { timeout: 40000, polling: 250 },
        )
        .catch(() => {});
      const juntas = await p.evaluate((c) => {
        const bs = window.__burbujas ?? [];
        const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
        return {
          n: bs.length,
          enElBoton: bs.filter((b) => Math.hypot(b[0] - cx, b[1] - cy) < 6 && b[3] > 0.9).length,
          escena: document.documentElement.dataset.escena,
        };
      }, caja);
      check(
        juntas.escena !== "lista" || (antes >= 2 && juntas.enElBoton === juntas.n),
        `burbujas: las ${antes} que se ven se juntan en el botón y son una (${juntas.enElBoton}/${juntas.n} encima, ${juntas.escena})`,
      );
      await p.mouse.move(5, 890);
      await p
        .waitForFunction(() => (window.__burbujas ?? []).every((b) => b[3] < 0.05), null, { timeout: 40000, polling: 250 })
        .catch(() => {});
      await p.waitForTimeout(600);
      const separadas = await p.evaluate(() => {
        const bs = window.__burbujas ?? [];
        let lejos = Infinity;
        for (let i = 0; i < bs.length; i++)
          for (let j = i + 1; j < bs.length; j++) lejos = Math.min(lejos, Math.hypot(bs[i][0] - bs[j][0], bs[i][1] - bs[j][1]));
        return { n: bs.length, lejos, m: Math.max(0, ...bs.map((b) => b[3])) };
      });
      check(
        juntas.escena !== "lista" || (separadas.lejos > 20 && separadas.m < 0.05),
        `burbujas: al salir, cada una vuelve a su lugar (la distancia mínima entre dos: ${Math.round(separadas.lejos)} px)`,
      );
      await p.evaluate(() => {
        clearInterval(window.__tic);
        delete window.__relojEscena;
      });
    }

    // v8.2: la burbuja es el hover de TODO lo que se toca (no sólo la nav)
    for (const [sel, nombre] of [
      ["#inicio a.boton-solido", "un botón de esmalte (Ver el trabajo)"],
      ["#inicio .copiar-boton", "un botón de vidrio (Copiar mi mail)"],
      ["header button.sonido-icono", "el ícono de sonido"],
    ]) {
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(400);
      const caja = await p.locator(sel).first().boundingBox();
      await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 3 });
      await p.waitForTimeout(1300);
      const est = await p.evaluate((s) => ({
        aqui: document.querySelector(s)?.hasAttribute("data-gota-aqui"),
        escena: document.documentElement.dataset.escena,
        modo: document.documentElement.dataset.gotaModo,
      }), sel);
      check(est.aqui && (est.escena !== "lista" || est.modo === "boton"), `burbuja: la gota llega a ${nombre} (${est.escena}, ${est.modo})`);
      await p.mouse.move(5, 890);
      await p.waitForTimeout(600);
    }
    const sonidoIcono = await p.evaluate(() => {
      const b = document.querySelector("header button.sonido-icono");
      return { vidrio: b?.hasAttribute("data-vidrio"), nombre: b?.getAttribute("aria-label"), pressed: b?.getAttribute("aria-pressed") };
    });
    check(!sonidoIcono.vidrio && sonidoIcono.nombre === "Sonido" && sonidoIcono.pressed !== null, `sonido: es sólo el ícono, con nombre y estado (${JSON.stringify(sonidoIcono)})`);

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

    // v8: ¿De qué charlamos? abre el mail con asunto (sin dejar la dirección en el DOM)
    await p.evaluate(() => {
      window.__mailto = [];
      HTMLAnchorElement.prototype.click = function () {
        window.__mailto.push(this.href);
      };
    });
    await p.locator("#contacto button", { hasText: /^Música$/ }).click();
    const mailto = decodeURIComponent((await p.evaluate(() => window.__mailto[0])) ?? "");
    check(mailto.startsWith(`mailto:${MAIL}?subject=Hablemos de música`), `un tema abre el mail con su asunto (${mailto.slice(0, 60)})`);
    check(!(await p.evaluate(() => document.documentElement.innerHTML)).includes(`mailto:${MAIL}`), "el link del mail no queda en el DOM");

    // v8: el sonido se prende, se recuerda y la nav lo muestra
    await p.locator("#perfil .sonido-texto").click();
    const sonido = await p.evaluate(() => ({
      nav: document.querySelector("header button.sonido")?.getAttribute("aria-pressed"),
      guardado: localStorage.getItem("sonido"),
    }));
    check(sonido.nav === "true" && sonido.guardado === "1", `sonido: se prende desde Así soy y la nav lo muestra (${JSON.stringify(sonido)})`);
    // v9: prendido, suena la canción y cada hover toca su nota
    await p.waitForTimeout(1500);
    const cancion = await p.evaluate(() => window.__osciladores);
    await p.mouse.move(5, 5);
    await p.evaluate(() => document.getElementById("contacto").scrollIntoView());
    await p.waitForTimeout(600);
    const tema = await p.locator("#contacto button.tema").first().boundingBox();
    const antesHover = await p.evaluate(() => window.__osciladores);
    await p.mouse.move(tema.x + tema.width / 2, tema.y + tema.height / 2, { steps: 2 });
    await p.waitForTimeout(150);
    const despuesHover = await p.evaluate(() => window.__osciladores);
    check(cancion > 20, `sonido: al prenderlo arranca la canción (${cancion} osciladores en 1,5 s)`);
    check(despuesHover - antesHover >= 2, `sonido: el hover de un botón suena (${despuesHover - antesHover} osciladores nuevos)`);
    await p.locator("header button.sonido").first().click();
    check((await p.evaluate(() => localStorage.getItem("sonido"))) === "0", "sonido: se apaga desde la nav");

    // v8: los cianotipos (el fondo de cada sección) están y la escena los pinta
    const cianos = await p.evaluate(() => [...document.querySelectorAll("[data-cianotipo]")].map((e) => e.dataset.cianotipo));
    check(
      cianos.join() === "musica-grande,musica-m,perfil-m,perfil-grande,enfoque-m,enfoque-grande,trabajo-m,trabajo-grande,recorrido-m,recorrido-grande,contacto-m,contacto-grande",
      `cianotipos en sus secciones, grandes en escritorio y en fila en el celular (${cianos.join()})`,
    );
    const pintado = await p.evaluate(() => ({
      escena: document.documentElement.dataset.escena,
      gente: document.querySelector('[data-cianotipo="contacto-grande"]')?.dataset.pintado !== undefined,
    }));
    check(pintado.escena !== "lista" || pintado.gente, `la escena pinta el cianotipo de la sección a la vista (${JSON.stringify(pintado)})`);

    // Feli acompaña en fotos, no habla (v7): nada de globos ni frases
    const feli = await p.evaluate(() => ({
      fotos: document.querySelectorAll("[data-feli]").length,
      ocultas: [...document.querySelectorAll("[data-feli]")].every((x) => x.getAttribute("aria-hidden") === "true"),
      globos: document.querySelectorAll(".globo, .cartel-vuelvo, [data-globo]").length,
    }));
    // v8.1: una sola foto de Felipe, en la portada; el resto del recorrido son sus objetos
    check(feli.fotos === 1 && feli.ocultas, `Feli: una sola foto, en la portada (${feli.fotos}, aria-hidden)`);
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

  // ---- 9. El 404: una pantalla justa, con el footer, sin scroll ----
  for (const [w, h, loc, titulo] of [[1440, 900, "es-AR", "Página no encontrada"], [393, 659, "en-US", "Page not found"]]) {
    const ctx = await b.newContext({ locale: loc, viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/una-ruta-que-no-existe`, { waitUntil: "load", timeout: 45000 });
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => ({
      sobra: document.documentElement.scrollHeight - innerHeight,
      etiqueta: document.querySelector("main .etiqueta")?.textContent,
      titulo: document.querySelector("h1")?.getAttribute("aria-label"),
      pie: !!document.querySelector("footer") && document.querySelector("footer").getBoundingClientRect().bottom <= innerHeight + 1,
    }));
    check(
      r.sobra <= 0 && r.pie && r.etiqueta === "Error 404" && r.titulo === titulo,
      `404 (${w}×${h}, ${loc}): una pantalla con el footer, sin scroll, "Error 404" y "${titulo}" (${JSON.stringify(r)})`,
    );
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
      pintado: document.querySelector('#perfil [data-cianotipo="perfil-grande"]')?.hasAttribute("data-pintado"),
    }));
    check(r.activo === "Perfil", `reduced-motion: la nav sigue al scroll (${r.activo})`);
    check(
      r.escena !== "lista" || r.pintado,
      `reduced-motion: la escena pinta los objetos al llegar a la sección (${r.escena}, ${r.pintado})`,
    );
    await ctx.close();
  }

  await b.close();
  console.log(fallas === 0 ? "✓ AUDITORÍA OK" : `✗ ${fallas} problema(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  cerrar();
}
