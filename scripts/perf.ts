/**
 * Medición de performance del grafo (uso interno de dev; NO entra al gate).
 *
 * Levanta `next start`, abre la home, FUERZA el render continuo del canvas
 * (empujando el scroll cada 80ms para que `rendering` no se pause) y mide el
 * frame-time real (cadencia de rAF) durante una ventana. Reporta:
 *   - el renderer de GPU (UNMASKED_RENDERER) → ¿hardware o software?
 *   - FPS promedio en reposo (canvas pausado) vs. en movimiento (canvas activo)
 *
 * Uso:  npm run build && npx tsx scripts/perf.ts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { execSync } from "node:child_process";
import http from "node:http";
import { chromium } from "playwright";

const PORT = Number(process.env.PERF_PORT ?? 3211);
const BASE = `http://127.0.0.1:${PORT}`;

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
      if (Date.now() - inicio > timeoutMs) reject(new Error("timeout server"));
      else setTimeout(intentar, 700);
    };
    intentar();
  });
}

function matarArbol(pid: number | undefined) {
  if (!pid) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    else process.kill(-pid, "SIGKILL");
  } catch {
    /* ya muerto */
  }
}

/** Mide FPS promedio durante `ms`. Si `move` es true, empuja el scroll para
 *  mantener el canvas renderizando. El cuerpo va como STRING (no como función)
 *  para evitar el helper `__name` que inyecta esbuild/tsx al serializar. */
async function medirFps(
  page: import("playwright").Page,
  ms: number,
  move: boolean,
): Promise<number> {
  const src = `(() => new Promise((resolve) => {
    let frames = 0, y = 0, mover = 0;
    const t0 = performance.now();
    if (${move}) {
      mover = window.setInterval(() => {
        y = y === 0 ? 40 : 0;
        window.scrollTo(0, y);
        window.dispatchEvent(new Event('scroll'));
      }, 80);
    }
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - t0 >= ${ms}) {
        if (mover) clearInterval(mover);
        resolve(Math.round((frames * 1000) / (now - t0)));
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }))()`;
  return page.evaluate(src) as Promise<number>;
}

async function main() {
  const server: ChildProcess = spawn(`next start -p ${PORT}`, {
    shell: true,
    stdio: "ignore",
    detached: process.platform !== "win32",
    env: process.env,
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    await esperarServidor(BASE);
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/?stats`, { waitUntil: "load", timeout: 45_000 });
    await page.waitForTimeout(3000); // hidratación + primer render del canvas

    const renderer = (await page.evaluate(`(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 'sin-webgl';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'renderer-oculto';
    })()`)) as string;

    const idle = await medirFps(page, 1500, false);
    const moving = await medirFps(page, 2500, true);

    console.log("──────────── PERF ────────────");
    console.log("GPU renderer :", renderer);
    console.log("FPS reposo   :", idle);
    console.log("FPS moviendo :", moving);
    console.log("──────────────────────────────");
  } finally {
    if (browser) await browser.close();
    matarArbol(server.pid);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
