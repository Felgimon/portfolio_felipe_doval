/**
 * EL SONIDO (v8): a Felipe le gusta la música, así que el sitio suena. Apagado
 * de entrada; se prende con el botón "Sonido" y queda recordado.
 *
 * Todo sintetizado con Web Audio (cero archivos): una nota de vidrio, una
 * campanita corta (la fundamental más dos parciales inarmónicos, como una copa)
 * con ataque rápido y una cola de un segundo.
 *
 * Cada link de la nav es una nota de un acorde de Do mayor con novena
 * (do, mi, sol, si, re): recorrer la nav con el mouse es un arpegio.
 */
const CLAVE = "sonido";
const EVENTO = "sonido:cambio";

/** do5, mi5, sol5, si5, re6 */
export const NOTAS = [523.25, 659.25, 783.99, 987.77, 1174.66] as const;

let ctx: AudioContext | null = null;
let prendido = false;
let leido = false;

function leer() {
  if (leido || typeof window === "undefined") return;
  leido = true;
  try {
    prendido = window.localStorage.getItem(CLAVE) === "1";
  } catch {
    prendido = false;
  }
  // el navegador sólo deja arrancar el audio después de un gesto: si venía
  // prendido de otra visita, se despierta con el primer clic o tecla
  if (prendido) {
    const despertar = () => {
      contexto();
      window.removeEventListener("pointerdown", despertar);
      window.removeEventListener("keydown", despertar);
    };
    window.addEventListener("pointerdown", despertar);
    window.addEventListener("keydown", despertar);
  }
}

function contexto(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
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

export function alCambiar(fn: () => void) {
  window.addEventListener(EVENTO, fn);
  return () => window.removeEventListener(EVENTO, fn);
}

/** Prende o apaga (se llama desde un clic: ahí el audio puede arrancar). */
export function alternar() {
  leer();
  prendido = !prendido;
  try {
    window.localStorage.setItem(CLAVE, prendido ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVENTO));
  // el arpegio de bienvenida espera a que el audio arranque de verdad (las notas
  // de un contexto suspendido se acumularían y sonarían juntas después)
  if (prendido) void contexto()?.resume().then(acorde);
}

/** Una nota de vidrio. `cuando` en segundos desde ahora. */
export function nota(frec: number, cuando = 0, fuerza = 1) {
  if (!estaPrendido()) return;
  const c = contexto();
  if (!c || c.state !== "running") return;
  const t = c.currentTime + cuando;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.05 * fuerza, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  const filtro = c.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = 5200;
  env.connect(filtro).connect(c.destination);
  for (const [mult, amp] of [[1, 1], [2.76, 0.22], [5.4, 0.07]] as const) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = frec * mult;
    const g = c.createGain();
    g.gain.value = amp;
    o.connect(g).connect(env);
    o.start(t);
    o.stop(t + 1.15);
  }
}

/** El acorde entero, arpegiado (al prender el sonido). */
export function acorde() {
  NOTAS.forEach((f, i) => nota(f, i * 0.06, 0.7));
}

/** Dos notas que suben: algo salió bien (copiar el mail, elegir un tema). */
export function listo() {
  nota(NOTAS[2], 0, 0.8);
  nota(NOTAS[0] * 2, 0.09, 0.8);
}
