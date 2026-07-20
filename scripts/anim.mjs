// Prueba de ANIMACIÓN del sol: fuerza la ruta GPU completa (?fx=full), saca
// tres capturas del sol central separadas 3.5s y compara hashes de píxeles.
// Falla (exit 1) si el sol está estático. Uso: npm run build && npm run anim
import { spawn, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import http from "node:http";
import { chromium } from "playwright";

const PORT = 3228;
const BASE = `http://127.0.0.1:${PORT}`;

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
const md5 = (b) => createHash("md5").update(b).digest("hex");

const srv = spawn(`npx next start -p ${PORT}`, { shell: true, stdio: "ignore", env: process.env });
try {
  await wait(BASE);
  const b = await chromium.launch();
  const p = await b.newPage({ locale: "es-AR", viewport: { width: 1440, height: 900 } });
  await p.goto(`${BASE}/?fx=full`, { waitUntil: "load", timeout: 45000 });
  await p.waitForTimeout(9000); // suspense + settle (SwiftShader es lento)

  // Recorte centrado en el sol central (sin UI alrededor).
  const clip = { x: 620, y: 350, width: 200, height: 200 };
  const s1 = await p.screenshot({ clip });
  await p.waitForTimeout(3500);
  const s2 = await p.screenshot({ clip });
  await p.waitForTimeout(3500);
  const s3 = await p.screenshot({ clip });
  await b.close();

  const h1 = md5(s1), h2 = md5(s2), h3 = md5(s3);
  console.log("hash t0   :", h1);
  console.log("hash t+3.5:", h2);
  console.log("hash t+7  :", h3);
  const moving = h1 !== h2 && h2 !== h3;
  console.log(moving ? "✓ SOL ANIMADO (los píxeles cambian entre frames)" : "✗ ESTÁTICO (píxeles idénticos)");
  process.exitCode = moving ? 0 : 1;
} finally {
  try { execSync(`taskkill /pid ${srv.pid} /T /F`, { stdio: "ignore" }); } catch {}
}
