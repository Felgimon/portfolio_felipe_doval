/**
 * Helpers compartidos por los scripts de Playwright (smoke, audit, gen-og...).
 *
 *  - levantar(port): `next start` del build ya hecho, y espera a que responda.
 *    Lo corta bien en cualquier sistema: en Windows con taskkill (antes era lo
 *    ÚNICO que había, y en Mac/Linux el server quedaba vivo y el script no
 *    terminaba nunca), en Mac/Linux matando el grupo de procesos.
 *  - navegador(): Chromium de Playwright. Si el entorno trae un Chromium de
 *    otra revisión (p. ej. un contenedor), se le pasa la ruta con
 *    PW_CHROMIUM=/ruta/al/chrome. Sin GPU, `GL_SOFT=1` agrega los flags de
 *    SwiftShader para que haya WebGL.
 */
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import { chromium } from "playwright";

function esperar(url, t = 90000) {
  const t0 = Date.now();
  return new Promise((res, rej) => {
    const go = () => {
      const r = http.get(url, (x) => {
        x.resume();
        if (x.statusCode < 500) res();
        else reintentar();
      });
      r.on("error", reintentar);
      r.setTimeout(3000, () => r.destroy());
    };
    const reintentar = () =>
      Date.now() - t0 > t ? rej(new Error(`timeout esperando ${url}`)) : setTimeout(go, 500);
    go();
  });
}

export async function levantar(port) {
  const win = process.platform === "win32";
  const srv = spawn(`npx next start -p ${port}`, {
    shell: true,
    stdio: "ignore",
    detached: !win,
    env: process.env,
  });
  const base = `http://localhost:${port}`;
  await esperar(base);
  const cerrar = () => {
    try {
      if (win) execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: "ignore" });
      else process.kill(-srv.pid, "SIGKILL");
    } catch {
      /* ya estaba muerto */
    }
  };
  return { base, cerrar };
}

export function navegador(extra = {}) {
  const args = [];
  if (process.env.GL_SOFT === "1") {
    args.push("--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader");
  }
  return chromium.launch({
    ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
    args,
    ...extra,
  });
}
