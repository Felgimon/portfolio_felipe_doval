/**
 * Genera la imagen para compartir (Open Graph / Twitter) y los favicons desde
 * el sitio ya compilado, con la letra real: la preview es una captura del
 * inicio y el ícono es la F azul noche sobre celeste.
 *
 *   npm run build && node scripts/gen-marca.mjs
 */
import { writeFileSync } from "node:fs";
import { levantar, navegador } from "./lib/servidor.mjs";

const { base, cerrar } = await levantar(Number(process.env.PORT ?? 3277));
const b = await navegador();
try {
  const p = await b.newPage({ locale: "es-AR", viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);

  const og = await p.screenshot({ type: "jpeg", quality: 90 });
  for (const f of ["app/opengraph-image.jpg", "app/twitter-image.jpg"]) writeFileSync(f, og);

  // redondo: esquinas transparentes, y el PNG sale con canal alfa (el .ico lo exige)
  const icono = async (lado, redondo = true) => {
    await p.evaluate(([lado, redondo]) => {
      document.getElementById("icono")?.remove();
      // la página se apaga: detrás de las esquinas no tiene que quedar nada
      document.documentElement.style.background = document.body.style.background = "transparent";
      for (const hijo of document.body.children) hijo.style.display = "none";
      const d = document.createElement("div");
      d.id = "icono";
      d.textContent = "F";
      d.style.cssText = `position:fixed;left:0;top:0;z-index:999;width:${lado}px;height:${lado}px;display:grid;place-items:center;border-radius:${redondo ? 20 : 0}%;background:#75aadb;color:#0c2340;font:800 ${lado * 0.78}px/1 var(--font-mona);font-stretch:118%`;
      document.body.append(d);
    }, [lado, redondo]);
    return p.locator("#icono").screenshot({ type: "png", omitBackground: true });
  };
  writeFileSync("app/icon.png", await icono(512));
  // el de iOS va opaco: iOS rellena la transparencia con negro
  writeFileSync("app/apple-icon.png", await icono(180, false));

  // ICO con un único PNG de 32×32 embebido (los navegadores modernos lo aceptan).
  const png = await icono(32);
  const cabeza = Buffer.alloc(22);
  cabeza.writeUInt16LE(1, 2);
  cabeza.writeUInt16LE(1, 4);
  cabeza.writeUInt8(32, 6);
  cabeza.writeUInt8(32, 7);
  cabeza.writeUInt16LE(1, 10);
  cabeza.writeUInt16LE(32, 12);
  cabeza.writeUInt32LE(png.length, 14);
  cabeza.writeUInt32LE(22, 18);
  writeFileSync("app/favicon.ico", Buffer.concat([cabeza, png]));
  console.log("listo: opengraph-image.jpg, twitter-image.jpg, icon.png, apple-icon.png, favicon.ico");
} finally {
  await b.close();
  cerrar();
}
