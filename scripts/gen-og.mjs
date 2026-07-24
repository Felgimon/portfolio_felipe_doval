/**
 * Genera la imagen OpenGraph: una CAPTURA REAL de la home, con el sol 3D.
 *
 * Por qué un script y no `ImageResponse` (next/og): Satori dibuja un subconjunto
 * de CSS y NO ejecuta WebGL, así que jamás podría mostrar el estudio ni el sol
 * — la versión anterior era una tarjeta dibujada a mano que además quedó con el
 * tema oscuro viejo. La única forma de que la preview sea el sitio de verdad es
 * capturarlo con un navegador.
 *
 * Se captura a 2x y se baja a 1200x630 (el tamaño canónico de OG): el
 * downscale hace de antialias y deja los bordes del texto limpios.
 *
 * Requiere el sitio ya buildeado. Uso:
 *   npm run build && node scripts/gen-og.mjs
 */
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.OG_PORT ?? 3277);
const BASE = `http://127.0.0.1:${PORT}`;
const W = 1200, H = 630; // proporción 1.91:1, la que piden OG y Twitter

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
    const reintentar = () => (Date.now() - t0 > t ? rej(new Error("timeout")) : setTimeout(go, 600));
    go();
  });
}

const srv = spawn(`npx next start -p ${PORT}`, { shell: true, stdio: "ignore", env: process.env });
try {
  await esperar(BASE);
  const b = await chromium.launch();
  const p = await b.newPage({
    locale: "es-AR",
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  });
  // `fx=full` fuerza la ruta GPU completa: sin esto, en un runner sin GPU el
  // sitio caería al modo lite y la captura no tendría el sol animado.
  await p.goto(`${BASE}/?fx=full`, { waitUntil: "load", timeout: 60000 });
  // Margen generoso: el software rendering compila shaders lento, y las
  // protuberancias del sol tardan unos segundos en erupcionar (sin ellas el sol
  // se ve pelado). NO se usa reduced-motion: ahí las protuberancias no crecen.
  await p.waitForTimeout(14000);
  // Fuera lo que no es la página: preloader, cursor propio y overlay de debug.
  await p.evaluate(() => {
    document.querySelectorAll('[role="status"]').forEach((e) => e.remove());
    document.querySelectorAll(".cursor-dot, .cursor-ring, [data-dev-overlay]").forEach((e) => e.remove());
  });
  await p.waitForTimeout(1200);

  const grande = await p.screenshot({ type: "png" }); // 2400x1260
  /* Se baja a 1200x630 y se guarda en JPEG. El PNG del mismo cuadro pesaba
     621 KB: la escena es FOTOGRÁFICA (el disco del sol, degradados suaves), o
     sea el peor caso para PNG y el mejor para JPEG. Y el peso importa de verdad
     acá: varios clientes de chat no muestran la preview si la imagen es pesada.
     Calidad 0.92 = sin artefactos visibles en el nombre, que es lo único con
     bordes duros. */
  const dataUrl = await p.evaluate(
    async ([b64, w, h]) => {
      const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + b64; });
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      // Fondo blanco explícito: el JPEG no tiene alfa y el sitio es claro.
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, 0, w, h);
      return c.toDataURL("image/jpeg", 0.92);
    },
    [grande.toString("base64"), W, H],
  );
  await b.close();

  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  writeFileSync(join(ROOT, "app", "opengraph-image.jpg"), buf);
  writeFileSync(join(ROOT, "app", "twitter-image.jpg"), buf);
  console.log(`OG generada: ${W}x${H}, ${(buf.length / 1024).toFixed(0)} KB (opengraph-image.jpg + twitter-image.jpg)`);
} finally {
  try { execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: "ignore" }); } catch {}
}
