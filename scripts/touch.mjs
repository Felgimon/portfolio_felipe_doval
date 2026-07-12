// Prueba de INTERACCIÓN TÁCTIL con los soles: emula un iPhone (touch real,
// nada de clicks de mouse) y verifica que tocar un sol navega a su sección,
// que las hit-areas cumplen el mínimo táctil de 44px, que dentro de un tópico
// (mobile) se apagan para no robar taps al contenido, y que desktop no
// regresionó. Falla (exit 1) ante cualquier incumplimiento o error de consola.
// Uso: npm run build && npm run touch
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import { chromium } from "playwright";

const PORT = 3229;
const BASE = `http://127.0.0.1:${PORT}`;
const NODO = "Trabajo"; // sol a tocar (aria-label exacto de la hit-area)

function wait(url, t = 90000) {
  const t0 = Date.now();
  return new Promise((res, rej) => {
    const go = () => {
      const r = http.get(url, (x) => { x.resume(); if (x.statusCode < 500) res(); else retry(); });
      r.on("error", retry); r.setTimeout(3000, () => r.destroy());
    };
    const retry = () => (Date.now() - t0 > t ? rej(new Error("timeout")) : setTimeout(go, 600));
    go();
  });
}

// Las hit-areas son <button tabindex="-1" aria-label="{label}"> (el HUD usa
// "label — hint", así que el match exacto no lo agarra).
const hit = (label) => `button[tabindex="-1"][aria-label="${label}"]`;
const estadoHits = () =>
  [...document.querySelectorAll('button[tabindex="-1"][aria-label]')].map((b) => ({
    label: b.getAttribute("aria-label"),
    pe: b.style.pointerEvents,
    w: parseFloat(b.style.width) || 0,
  }));

let fallas = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fallas++;
};

const srv = spawn(`npx next start -p ${PORT}`, { shell: true, stdio: "ignore", env: process.env });
try {
  await wait(BASE);
  const browser = await chromium.launch();

  // ---- MOBILE (iPhone: viewport angosto + touch + DPR 3) ----
  console.log("— mobile 390×844 (touch) —");
  const ctxM = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const errsM = [];
  const pm = await ctxM.newPage();
  pm.on("pageerror", (e) => errsM.push(String(e)));
  pm.on("console", (m) => { if (m.type() === "error") errsM.push(m.text()); });
  await pm.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
  await pm.waitForTimeout(9000); // suspense + settle (SwiftShader es lento)

  const antes = await pm.evaluate(estadoHits);
  check(antes.length === 5, `existen las 5 hit-areas (hay ${antes.length})`);
  const activas = antes.filter((b) => b.pe === "auto");
  check(activas.length >= 1, `hay hit-areas activas en la portada (${activas.length})`);
  check(activas.every((b) => b.w >= 44), `target táctil ≥ 44px (min ${Math.min(...activas.map((b) => b.w))}px)`);

  const box = await pm.locator(hit(NODO)).boundingBox();
  check(!!box, `la hit-area de "${NODO}" tiene posición en pantalla`);
  if (box) {
    await pm.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await pm.waitForTimeout(1400);
    const scrollY = await pm.evaluate(() => window.scrollY);
    const hudActivo = await pm.evaluate(
      () => document.querySelector('button[aria-current="true"]')?.textContent ?? "",
    );
    check(scrollY > 100, `el TAP navegó (scrollY = ${Math.round(scrollY)})`);
    check(hudActivo === NODO, `el HUD marca "${NODO}" activo (marca "${hudActivo}")`);
    const enTopico = await pm.evaluate(estadoHits);
    check(
      enTopico.every((b) => b.pe !== "auto"),
      "dentro del tópico (mobile) las hit-areas se apagan (no roban taps al texto)",
    );
    await pm.evaluate(() => window.scrollTo(0, 0));
    await pm.waitForTimeout(1200);
    const deVuelta = await pm.evaluate(estadoHits);
    check(
      deVuelta.some((b) => b.pe === "auto"),
      "de vuelta en la portada las hit-areas reviven",
    );
  }
  check(errsM.length === 0, `0 errores de consola en mobile (hay ${errsM.length})`);
  if (errsM.length) console.log(errsM.join("\n"));
  await ctxM.close();

  // ---- DESKTOP (regresión: hover + click de mouse siguen igual) ----
  console.log("— desktop 1440×900 (mouse) —");
  const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const errsD = [];
  const pd = await ctxD.newPage();
  pd.on("pageerror", (e) => errsD.push(String(e)));
  pd.on("console", (m) => { if (m.type() === "error") errsD.push(m.text()); });
  await pd.goto(`${BASE}/`, { waitUntil: "load", timeout: 45000 });
  await pd.waitForTimeout(9000);

  const boxD = await pd.locator(hit(NODO)).boundingBox();
  check(!!boxD, `desktop: hit-area de "${NODO}" presente`);
  if (boxD) {
    await pd.mouse.move(boxD.x + boxD.width / 2, boxD.y + boxD.height / 2); // hover (implosión)
    await pd.waitForTimeout(400);
    await pd.mouse.down();
    await pd.mouse.up();
    await pd.waitForTimeout(1400);
    const hudD = await pd.evaluate(
      () => document.querySelector('button[aria-current="true"]')?.textContent ?? "",
    );
    check(hudD === NODO, `desktop: click navega a "${NODO}" (marca "${hudD}")`);
    const topicoD = await pd.evaluate(estadoHits);
    check(
      topicoD.some((b) => b.pe === "auto"),
      "desktop: dentro del tópico las hit-areas SIGUEN activas (muted es solo mobile)",
    );
  }
  check(errsD.length === 0, `0 errores de consola en desktop (hay ${errsD.length})`);
  if (errsD.length) console.log(errsD.join("\n"));
  await ctxD.close();

  await browser.close();
  console.log(fallas === 0 ? "✓ TOUCH OK" : `✗ ${fallas} falla(s)`);
  process.exitCode = fallas === 0 ? 0 : 1;
} finally {
  try { execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: "ignore" }); } catch {}
}
