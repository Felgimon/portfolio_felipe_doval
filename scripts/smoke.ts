/**
 * Smoke test del portfolio (corre en el gate de todas las fases).
 *
 * Requiere un build de producción previo (`npm run build`). Levanta
 * `next start`, abre las rutas indicadas con Chromium (Playwright), captura
 * screenshots y FALLA (exit 1) si hay errores de consola o excepciones.
 *
 * Uso:  npm run build && npm run smoke
 * Env:
 *   SMOKE_ROUTES   rutas separadas por coma (default: "/")
 *   SMOKE_VIEWPORT "ancho,alto" (default: "1440,900"); ej. mobile "390,844"
 *   SMOKE_PORT     puerto (default: 3210)
 */
import { spawn, type ChildProcess } from "node:child_process";
import { execSync } from "node:child_process";
import http from "node:http";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type ConsoleMessage } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "__smoke__");

const PORT = Number(process.env.SMOKE_PORT ?? 3210);
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = (process.env.SMOKE_ROUTES ?? "/")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const [vw, vh] = (process.env.SMOKE_VIEWPORT ?? "1440,900")
  .split(",")
  .map((n) => Number(n.trim()));

// Ruido esperado que NO cuenta como fallo (favicons, extensiones, etc.)
const IGNORAR = [
  /favicon/i,
  /downloadable font/i,
  /Failed to load resource: the server responded with a status of 404/i,
];

function esRuido(texto: string): boolean {
  return IGNORAR.some((re) => re.test(texto));
}

function esperarServidor(url: string, timeoutMs = 90_000): Promise<void> {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intentar = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else reintentar();
      });
      req.on("error", reintentar);
      req.setTimeout(4000, () => req.destroy());
    };
    const reintentar = () => {
      if (Date.now() - inicio > timeoutMs) {
        reject(new Error(`El servidor no respondió en ${timeoutMs}ms`));
      } else {
        setTimeout(intentar, 700);
      }
    };
    intentar();
  });
}

function matarArbol(pid: number | undefined) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    /* ya estaba muerto */
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`[smoke] Levantando next start en ${BASE} ...`);
  const server: ChildProcess = spawn(`next start -p ${PORT}`, {
    shell: true,
    stdio: "ignore",
    detached: process.platform !== "win32",
    env: process.env,
  });

  const problemas: string[] = [];
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    await esperarServidor(BASE);
    console.log("[smoke] Servidor arriba. Lanzando Chromium...");
    browser = await chromium.launch();
    const context = await browser.newContext({
      // es-AR: sin esto Playwright usa en-US y el sitio (con detección de
      // idioma automática) se probaría en inglés.
      locale: "es-AR",
      viewport: { width: vw, height: vh },
    });

    for (const ruta of ROUTES) {
      const page = await context.newPage();
      const erroresRuta: string[] = [];

      page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() === "error" && !esRuido(msg.text())) {
          erroresRuta.push(`console.error: ${msg.text()}`);
        }
      });
      page.on("pageerror", (err: Error) => {
        if (!esRuido(err.message)) {
          erroresRuta.push(`pageerror: ${err.message}`);
        }
      });

      const url = `${BASE}${ruta}`;
      console.log(`[smoke] → ${url}`);
      // "load" (no "networkidle"): la home tiene un canvas 3D que mantiene la
      // red/animación activas, así que networkidle no se alcanza.
      const resp = await page.goto(url, {
        waitUntil: "load",
        timeout: 45_000,
      });
      if (!resp || !resp.ok()) {
        erroresRuta.push(`HTTP ${resp?.status()} en ${ruta}`);
      }
      await page.waitForTimeout(2500); // margen para hidratación / canvas / efectos

      const nombre = ruta === "/" ? "home" : ruta.replace(/\W+/g, "-").replace(/^-|-$/g, "");
      const shot = path.join(OUT_DIR, `${nombre}--${vw}x${vh}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      console.log(`[smoke]   screenshot: ${path.relative(process.cwd(), shot)}`);

      if (erroresRuta.length) {
        problemas.push(`\n  ${ruta}:\n    ${erroresRuta.join("\n    ")}`);
      }
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    matarArbol(server.pid);
  }

  if (problemas.length) {
    console.error(`\n[smoke] ✗ FALLÓ con errores de consola/página:${problemas.join("")}`);
    process.exit(1);
  }
  console.log(`\n[smoke] ✓ OK — ${ROUTES.length} ruta(s), sin errores de consola.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke] ✗ Error inesperado:", err);
  process.exit(1);
});
