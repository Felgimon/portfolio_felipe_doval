/**
 * ESCUCHAR LA CANCIÓN SIN PARLANTES: renderiza en Chromium (OfflineAudioContext)
 * un minuto de la canción del sitio con hovers encima, con las mismas voces de
 * lib/sonido.ts, y mide:
 *
 *   - que no sature (pico por debajo de 0 dBFS) y que el volumen sea tranquilo;
 *   - que la energía caiga en las notas de re mayor (un cromagrama del audio
 *     real, no de la partitura: si una voz sonara corrida, se vería acá);
 *   - que los hovers se escuchen por encima de la canción.
 *
 * Deja el audio en scripts/__smoke__/cancion.wav para escucharlo.
 *
 *   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/sonido.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { chromium } from "playwright";

const SEGUNDOS = 60;
const SR = 44100;
const js = (f) =>
  stripTypeScriptTypes(readFileSync(f, "utf8"), { mode: "strip" }).replace(/from "\.\/musica"/, 'from "./musica.js"');

const navegador = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const p = await navegador.newPage();
await p.route("http://prueba.local/**", (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === "/") return r.fulfill({ contentType: "text/html", body: "<!doctype html><title>sonido</title>" });
  const f = { "/musica.js": "lib/musica.ts", "/sonido.js": "lib/sonido.ts" }[u.pathname];
  return f ? r.fulfill({ contentType: "text/javascript", body: js(f) }) : r.fulfill({ status: 404 });
});
await p.goto("http://prueba.local/");

const salida = await p.evaluate(
  async ({ SEGUNDOS, SR }) => {
    const { ensayar } = await import("/sonido.js");
    const toques = [];
    // alguien que recorre la nav, pasa por botones y baja por la lista de proyectos
    for (let t = 4; t < SEGUNDOS - 2; t += 3.7) {
      for (let i = 0; i < 5; i++) toques.push([t + i * 0.16, { tipo: "nav", i }]);
      toques.push([t + 1.3, { tipo: "boton", ancho: 180 }]);
      toques.push([t + 1.9, { tipo: "boton", ancho: 64 }]);
      for (let i = 0; i < 4; i++) toques.push([t + 2.4 + i * 0.22, { tipo: "fila", i }]);
    }
    const render = async (conToques) => {
      const c = new OfflineAudioContext(2, SR * SEGUNDOS, SR);
      ensayar(c, SEGUNDOS - 3, conToques ? toques : []);
      const b = await c.startRendering();
      return [b.getChannelData(0), b.getChannelData(1)];
    };
    const [l, r] = await render(true);
    const [l0] = await render(false);
    let pico = 0, suma = 0, suma0 = 0;
    for (let i = 0; i < l.length; i++) {
      pico = Math.max(pico, Math.abs(l[i]), Math.abs(r[i]));
      suma += l[i] * l[i];
      suma0 += l0[i] * l0[i];
    }
    // el audio, en 16 bits para el wav
    const pcm = new Int16Array(l.length * 2);
    for (let i = 0; i < l.length; i++) {
      pcm[i * 2] = Math.max(-1, Math.min(1, l[i])) * 32767;
      pcm[i * 2 + 1] = Math.max(-1, Math.min(1, r[i])) * 32767;
    }
    // cromagrama: Goertzel en cada nota de 3 octavas (re3 a re6), sumado por clase
    const croma = new Array(12).fill(0);
    const N = 8192;
    for (let ini = SR; ini + N < l0.length; ini += N * 4) {
      for (let midi = 50; midi < 86; midi++) {
        const f = 440 * 2 ** ((midi - 69) / 12);
        const w = (2 * Math.PI * f) / SR;
        const k = 2 * Math.cos(w);
        let s1 = 0, s2 = 0;
        for (let i = 0; i < N; i++) {
          const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
          const s0 = l0[ini + i] * hann + k * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        croma[midi % 12] += s1 * s1 + s2 * s2 - k * s1 * s2;
      }
    }
    let bin = "";
    const bytes = new Uint8Array(pcm.buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return {
      pico,
      rms: Math.sqrt(suma / l.length),
      rms0: Math.sqrt(suma0 / l0.length),
      croma,
      wav: btoa(bin),
    };
  },
  { SEGUNDOS, SR },
);
await navegador.close();

// el wav
const datos = Buffer.from(salida.wav, "base64");
const cab = Buffer.alloc(44);
cab.write("RIFF", 0);
cab.writeUInt32LE(36 + datos.length, 4);
cab.write("WAVEfmt ", 8);
cab.writeUInt32LE(16, 16);
cab.writeUInt16LE(1, 20);
cab.writeUInt16LE(2, 22);
cab.writeUInt32LE(SR, 24);
cab.writeUInt32LE(SR * 4, 28);
cab.writeUInt16LE(4, 32);
cab.writeUInt16LE(16, 34);
cab.write("data", 36);
cab.writeUInt32LE(datos.length, 40);
mkdirSync("scripts/__smoke__", { recursive: true });
writeFileSync("scripts/__smoke__/cancion.wav", Buffer.concat([cab, datos]));

const db = (x) => (20 * Math.log10(x)).toFixed(1);
const NOMBRE = ["do", "do#", "re", "re#", "mi", "fa", "fa#", "sol", "sol#", "la", "la#", "si"];
const ESCALA = [2, 4, 6, 7, 9, 11, 1];
const total = salida.croma.reduce((a, b) => a + b, 0);
const dentro = ESCALA.reduce((a, c) => a + salida.croma[c], 0) / total;
const fuera = salida.croma
  .map((v, i) => [NOMBRE[i], v / total])
  .filter((_, i) => !ESCALA.includes(i))
  .sort((a, b) => b[1] - a[1]);

let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) ok = false;
};
check(salida.pico < 0.95, `no satura: pico ${db(salida.pico)} dBFS`);
check(salida.rms0 > 0.008 && salida.rms0 < 0.08, `la canción sola, tranquila: ${db(salida.rms0)} dBFS RMS`);
check(salida.rms > salida.rms0 * 1.05, `con hovers se oye más (${db(salida.rms)} dBFS RMS)`);
check(dentro > 0.95, `energía en re mayor: ${(dentro * 100).toFixed(1)}% (lo de afuera, el mayor: ${fuera[0][0]} ${(fuera[0][1] * 100).toFixed(2)}%)`);
console.log(
  "  cromagrama: " +
    salida.croma
      .map((v, i) => [NOMBRE[i], v / total])
      .sort((a, b) => b[1] - a[1])
      .map(([n, v]) => `${n} ${(v * 100).toFixed(1)}%`)
      .join(" · "),
);
console.log("  audio: scripts/__smoke__/cancion.wav");
process.exit(ok ? 0 : 1);
