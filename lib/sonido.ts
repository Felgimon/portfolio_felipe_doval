import { CORCHEA, COLAS, arpegioEn, hz, notaPorTamaño, partitura, type Evento } from "./musica";

/**
 * EL SONIDO (v9): a Felipe le gusta la música, así que el sitio tiene una
 * canción, y la interfaz se toca encima, siempre en su tonalidad. Apagado de
 * entrada; se prende con el ícono del ecualizador y queda recordado.
 *
 * Todo sintetizado con Web Audio (cero archivos). La partitura y la regla que
 * hace que nada desafine están en lib/musica.ts; acá están las voces:
 *
 *   la canción  colchón (cuatro voces lentas, abiertas en estéreo), bajo,
 *               cajita de música y, en la segunda vuelta, una melodía de vidrio.
 *               Todo pasa por una sala (reverb de convolución con una
 *               respuesta generada) y un compresor suave.
 *   la interfaz la nav toca notas de vidrio simples: cada link es una nota del
 *               acorde que está sonando, y recorrerla es su arpegio. Los
 *               botones suenan a burbuja (un glissando corto que sube y se
 *               apoya en una nota del acorde, más grave cuanto más grande el
 *               botón) con un brillo una quinta arriba. Las filas de la lista,
 *               una cajita una octava abajo, que bajando el mouse es una
 *               escala. El nombre, el acorde entero.
 *
 * La canción se pausa con la pestaña en segundo plano (y retoma donde estaba).
 */
const CLAVE = "sonido";
const EVENTO = "sonido:cambio";
/** cuánto se programa por adelantado (s) y cada cuánto se mira (ms) */
const ADELANTO = 0.3;
const CADA = 60;

export type Toque =
  | { tipo: "nav"; i: number }
  | { tipo: "boton"; ancho: number }
  | { tipo: "fila"; i: number }
  | { tipo: "marca" }
  | { tipo: "sonido" };

type Mezcla = {
  master: GainNode;
  /** la canción (se cambia por una nueva en cada arranque) */
  cancion: GainNode;
  ui: GainNode;
  /** el envío a la sala */
  sala: GainNode;
};

let ctx: AudioContext | null = null;
let mezcla: Mezcla | null = null;
let prendido = false;
let leido = false;
/** el tiempo del contexto en el que arrancó la canción, y la próxima corchea a programar */
let inicio = 0;
let paso = 0;
let reloj: ReturnType<typeof setInterval> | null = null;
let ultimoToque = 0;

function leer() {
  if (leido || typeof window === "undefined") return;
  leido = true;
  try {
    prendido = window.localStorage.getItem(CLAVE) === "1";
  } catch {
    prendido = false;
  }
  // EL PERMISO (v9.2): el navegador sólo deja sonar después de un gesto. Si
  // venía prendido de otra visita, el sonido queda ESPERANDO y arranca con el
  // primer gesto que cuente: un clic, una tecla, o soltar el dedo en el celular
  // (apoyarlo no cuenta, por eso antes en el celular no arrancaba nunca). Los
  // oyentes se van recién cuando suena de verdad.
  if (prendido) {
    for (const ev of GESTOS) window.addEventListener(ev, despertar, { capture: true, passive: true });
    // y por si el navegador ya lo permite (un sitio que el usuario escucha seguido)
    const probar = () => {
      if (!prendido || reloj) return;
      const c = contexto();
      if (c?.state === "running") arrancar();
    };
    if (document.readyState === "complete") setTimeout(probar, 300);
    else window.addEventListener("load", () => setTimeout(probar, 300), { once: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !prendido || !reloj) return;
    // suspendido, el reloj del contexto se frena: al volver, sigue la misma corchea
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

/** los gestos que habilitan el audio (pointerdown sólo cuenta con el mouse) */
const GESTOS = ["pointerdown", "pointerup", "touchend", "keydown", "click"] as const;

function despertar() {
  if (!prendido || reloj) return;
  const c = contexto();
  if (!c) return;
  // la canción espera a que el audio arranque de verdad (las notas de un
  // contexto suspendido se acumularían y sonarían juntas después)
  void c.resume().then(() => {
    if (c.state !== "running") return;
    arrancar();
    for (const ev of GESTOS) window.removeEventListener(ev, despertar, { capture: true });
  });
}

function contexto(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: "interactive" });
      mezcla = armarMezcla(ctx);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function estaPrendido() {
  leer();
  return prendido;
}

export type EstadoSonido = "apagado" | "esperando" | "sonando";

/** apagado; prendido pero esperando un gesto para poder sonar; o sonando */
export function estadoSonido(): EstadoSonido {
  leer();
  return !prendido ? "apagado" : reloj ? "sonando" : "esperando";
}

const avisar = () => window.dispatchEvent(new Event(EVENTO));

export function alCambiar(fn: () => void) {
  window.addEventListener(EVENTO, fn);
  return () => window.removeEventListener(EVENTO, fn);
}

/**
 * El botón (se llama desde un clic: ahí el audio puede arrancar). Si estaba
 * prendido pero esperando el permiso, este clic ES el permiso: suena, no se
 * apaga. Si no, prende o apaga.
 */
export function alternar() {
  leer();
  if (prendido && !reloj) {
    despertar();
    return;
  }
  prendido = !prendido;
  try {
    window.localStorage.setItem(CLAVE, prendido ? "1" : "0");
  } catch {}
  avisar();
  if (prendido) despertar();
  else parar();
}

// ---------------------------------------------------------------- la mezcla

/** Una sala: ruido estéreo que se apaga en `dura` segundos, cada vez más oscuro. */
function sala(c: BaseAudioContext, dura: number) {
  const n = Math.round(c.sampleRate * dura);
  const buf = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const x = i / n;
      // un pasabajos de un polo que se cierra con el tiempo: la cola se oscurece
      const k = 0.55 - 0.45 * x;
      lp += (Math.random() * 2 - 1 - lp) * k;
      d[i] = lp * Math.pow(1 - x, 2.4) * (i < c.sampleRate * 0.012 ? i / (c.sampleRate * 0.012) : 1);
    }
  }
  return buf;
}

function armarMezcla(c: BaseAudioContext): Mezcla {
  const master = c.createGain();
  master.gain.value = 0;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.3;
  master.connect(comp).connect(c.destination);
  const conv = c.createConvolver();
  conv.buffer = sala(c, 3.4);
  const envio = c.createGain();
  const retorno = c.createGain();
  retorno.gain.value = 0.5;
  envio.connect(conv).connect(retorno).connect(master);
  const ui = c.createGain();
  ui.gain.value = 1.4;
  ui.connect(master);
  const cancion = c.createGain();
  cancion.connect(master);
  return { master, cancion, ui, sala: envio };
}

/** salida seca + envío a la sala, con paneo */
function salida(c: BaseAudioContext, m: Mezcla, bus: AudioNode, envio: number, pan = 0) {
  const p = c.createStereoPanner();
  p.pan.value = pan;
  p.connect(bus);
  if (envio > 0) {
    const e = c.createGain();
    e.gain.value = envio;
    p.connect(e).connect(m.sala);
  }
  return p;
}

function osc(c: BaseAudioContext, tipo: OscillatorType, f: number, amp: number, dest: AudioNode, t: number, fin: number, cents = 0) {
  const o = c.createOscillator();
  o.type = tipo;
  o.frequency.value = f;
  o.detune.value = cents;
  const g = c.createGain();
  g.gain.value = amp;
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(fin);
  return o;
}

// ---------------------------------------------------------------- las voces

type Voz = (c: BaseAudioContext, m: Mezcla, bus: AudioNode, t: number, e: Evento) => void;

/** el colchón: seno y triángulo apenas desafinados entre sí, entra y sale lento */
const colchon: Voz = (c, m, bus, t, e) => {
  const fin = t + e.dura + COLAS.colchon;
  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.05, t + 1.8);
  env.gain.setValueAtTime(0.05, t + e.dura - 0.2);
  env.gain.setTargetAtTime(0, t + e.dura - 0.2, COLAS.colchon / 4);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 950;
  f.Q.value = 0.4;
  // respira: el filtro se abre y se cierra muy despacio
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.09;
  const prof = c.createGain();
  prof.gain.value = 260;
  lfo.connect(prof).connect(f.frequency);
  lfo.start(t);
  lfo.stop(fin);
  const pan = ((e.midi % 7) / 6 - 0.5) * 0.8;
  env.connect(f).connect(salida(c, m, bus, 0.7, pan));
  osc(c, "sine", hz(e.midi), 0.7, env, t, fin, -5);
  osc(c, "triangle", hz(e.midi), 0.45, env, t, fin, 6);
};

/** el bajo: redondo, con dos armónicos para que se oiga en un parlante chico */
const bajo: Voz = (c, m, bus, t, e) => {
  const fin = t + e.dura + COLAS.bajo;
  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.075, t + 0.08);
  env.gain.exponentialRampToValueAtTime(0.03, t + e.dura);
  env.gain.setTargetAtTime(0, t + e.dura, COLAS.bajo / 4);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 520;
  env.connect(f).connect(salida(c, m, bus, 0.15));
  const base = hz(e.midi);
  osc(c, "sine", base, 1, env, t, fin);
  osc(c, "sine", base * 2, 0.32, env, t, fin);
  osc(c, "sine", base * 3, 0.1, env, t, fin);
};

/** la cajita de música: una púa que suena y se apaga, con un chispazo agudo al principio */
function pua(c: BaseAudioContext, m: Mezcla, bus: AudioNode, t: number, midi: number, amp: number, cola: number, envio: number) {
  const fin = t + cola;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(amp, t + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, fin);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 2800;
  const pan = ((midi % 12) / 11 - 0.5) * 0.6;
  env.connect(f).connect(salida(c, m, bus, envio, pan));
  const base = hz(midi);
  osc(c, "sine", base, 1, env, t, fin);
  osc(c, "triangle", base, 0.28, env, t, fin);
  osc(c, "sine", base * 3, 0.05, env, t, fin);
  // el chispazo: un parcial inarmónico que dura nada
  const ch = c.createGain();
  ch.gain.setValueAtTime(amp * 0.25, t);
  ch.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  ch.connect(salida(c, m, bus, envio * 0.5, pan));
  osc(c, "sine", base * 7.1, 1, ch, t, t + 0.06);
}

const caja: Voz = (c, m, bus, t, e) => pua(c, m, bus, t, e.midi, 0.06 * e.fuerza, e.dura + COLAS.caja, 0.45);

/** una nota de vidrio: la fundamental y dos parciales inarmónicos, como una copa */
function vidrio(c: BaseAudioContext, m: Mezcla, bus: AudioNode, t: number, midi: number, amp: number, cola: number, ataque = 0.006, envio = 0.35) {
  const fin = t + cola;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(amp, t + ataque);
  env.gain.exponentialRampToValueAtTime(0.0001, fin);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 5200;
  env.connect(f).connect(salida(c, m, bus, envio, ((midi % 12) / 11 - 0.5) * 0.5));
  const base = hz(midi);
  for (const [mult, a] of [[1, 1], [2.76, 0.2], [5.4, 0.06]] as const) osc(c, "sine", base * mult, a, env, t, fin + 0.02);
}

const melodia: Voz = (c, m, bus, t, e) => vidrio(c, m, bus, t, e.midi, 0.042 * e.fuerza, e.dura + COLAS.melodia, 0.04, 0.65);

const VOCES: Record<Evento["voz"], Voz> = { colchon, bajo, caja, melodia };

/** una burbuja: sube de golpe (como una burbuja de verdad al soltarse) y se apoya en la nota */
function burbuja(c: BaseAudioContext, m: Mezcla, t: number, midi: number, amp: number) {
  const fin = t + 0.55;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(amp, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, fin);
  env.connect(salida(c, m, m.ui, 0.3));
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(hz(midi) * 0.62, t);
  o.frequency.exponentialRampToValueAtTime(hz(midi), t + 0.07);
  o.connect(env);
  o.start(t);
  o.stop(fin + 0.02);
}

// ---------------------------------------------------------------- la canción

function programar() {
  const c = ctx;
  const mz = mezcla;
  if (!c || !mz || c.state !== "running") return;
  while (inicio + paso * CORCHEA < c.currentTime + ADELANTO) {
    const t = inicio + paso * CORCHEA;
    // si la pestaña se trabó, no se amontona lo atrasado: se salta
    if (t > c.currentTime - 0.05) for (const e of partitura(paso, Math.random)) VOCES[e.voz](c, mz, mz.cancion, t, e);
    paso++;
  }
}

function arrancar() {
  const c = ctx;
  const mz = mezcla;
  if (!c || !mz || !prendido || reloj) return;
  // un bus nuevo: lo que quedó sonando de la vez anterior se va con el viejo
  mz.cancion = c.createGain();
  mz.cancion.gain.value = 0.85;
  mz.cancion.connect(mz.master);
  const t = c.currentTime;
  mz.master.gain.cancelScheduledValues(t);
  mz.master.gain.setValueAtTime(mz.master.gain.value, t);
  mz.master.gain.linearRampToValueAtTime(0.9, t + 2.5);
  inicio = t + 0.12;
  paso = 0;
  programar();
  reloj = setInterval(programar, CADA);
  avisar();
  // la bienvenida: el arpegio del primer acorde, encima de la canción que entra
  arpegioEn(0).forEach((n, i) => vidrio(c, mz, mz.ui, inicio + 0.25 + i * 0.07, n, 0.035, 1.3));
}

function parar() {
  const c = ctx;
  const mz = mezcla;
  if (!c || !mz) return;
  if (reloj) clearInterval(reloj);
  reloj = null;
  avisar();
  const t = c.currentTime;
  mz.master.gain.cancelScheduledValues(t);
  mz.master.gain.setValueAtTime(mz.master.gain.value, t);
  mz.master.gain.linearRampToValueAtTime(0, t + 0.5);
  const viejo = mz.cancion;
  setTimeout(() => {
    viejo.disconnect();
    if (!prendido) void c.suspend();
  }, 650);
}

// ---------------------------------------------------------------- la interfaz

/** Cada cosa que se toca, su voz (todas con notas del arpegio `arp`). */
function sonar(c: BaseAudioContext, mz: Mezcla, t: number, arp: number[], toque: Toque) {
  switch (toque.tipo) {
    case "nav":
      vidrio(c, mz, mz.ui, t, arp[toque.i % arp.length], 0.05, COLAS.interfaz);
      break;
    case "boton": {
      const n = notaPorTamaño(toque.ancho, arp);
      burbuja(c, mz, t, n, 0.07);
      // el brillo: dos notas más arriba en el arpegio, apenas después
      vidrio(c, mz, mz.ui, t + 0.06, arp[Math.min(arp.indexOf(n) + 2, arp.length - 1)], 0.018, 0.9);
      break;
    }
    case "fila":
      pua(c, mz, mz.ui, t, arp[arp.length - 1 - (toque.i % arp.length)] - 12, 0.075, 1.1, 0.35);
      break;
    case "marca":
      arp.slice(0, 4).forEach((n, i) => vidrio(c, mz, mz.ui, t + i * 0.05, n, 0.03, 1.1));
      break;
    case "sonido":
      vidrio(c, mz, mz.ui, t, arp[0] + 12, 0.025, 1);
      break;
  }
}

/**
 * Lo que suena al pasar el mouse (o el foco) por algo que se toca. Siempre en
 * la tonalidad: las notas salen del arpegio del acorde que está sonando.
 */
export function tocar(toque: Toque) {
  if (!estaPrendido() || !reloj) return;
  const c = ctx;
  const mz = mezcla;
  if (!c || !mz || c.state !== "running") return;
  const t = c.currentTime;
  // pasar rápido por encima de diez cosas no es una ráfaga de diez notas
  if (t - ultimoToque < 0.035) return;
  ultimoToque = t;
  sonar(c, mz, t, arpegioEn(t - inicio), toque);
}

/**
 * Una burbuja que nace (v9.3): un ¡pup! corto, una octava arriba y bajito,
 * siempre en el arpegio del acorde que suena. Cada burbuja, otra nota.
 */
export function nacer(n: number) {
  if (!estaPrendido() || !reloj) return;
  const c = ctx;
  const mz = mezcla;
  if (!c || !mz || c.state !== "running") return;
  const arp = arpegioEn(c.currentTime - inicio);
  burbuja(c, mz, c.currentTime, arp[(n * 2) % arp.length] + 12, 0.03);
}

/** Dos notas que suben: algo salió bien (copiar el mail, elegir un tema). */
export function listo() {
  if (!estaPrendido() || !reloj) return;
  const c = ctx;
  const mz = mezcla;
  if (!c || !mz || c.state !== "running") return;
  const t = c.currentTime;
  const arp = arpegioEn(t - inicio);
  vidrio(c, mz, mz.ui, t, arp[2], 0.05, COLAS.interfaz);
  vidrio(c, mz, mz.ui, t + 0.09, arp[4], 0.05, COLAS.interfaz);
}

/**
 * Sólo para la verificación (scripts/sonido.mjs): la canción y unos toques de
 * la interfaz, en un contexto offline, con las mismas voces del sitio.
 */
export function ensayar(c: BaseAudioContext, segundos: number, toques: [number, Toque][] = []) {
  const mz = armarMezcla(c);
  mz.master.gain.value = 0.9;
  mz.cancion.gain.value = 0.85;
  for (let n = 0; n * CORCHEA < segundos; n++) {
    for (const e of partitura(n, Math.random)) VOCES[e.voz](c, mz, mz.cancion, n * CORCHEA, e);
  }
  for (const [t, toque] of toques) sonar(c, mz, t, arpegioEn(t), toque);
}
