/**
 * LA CANCIÓN DEL SITIO (v9): la partitura, sin audio (el audio está en
 * lib/sonido.ts). Es puro dato y cuentas, para poder verificarla sin
 * navegador: scripts/afinacion.ts la recorre entera y falla si una nota
 * desafina.
 *
 * Re mayor, 72 negras por minuto, cuatro acordes de dos compases cada uno
 * (un loop de 26,7 s) que se repiten en dos vueltas: la primera con el colchón,
 * el bajo y la cajita de música; la segunda suma una melodía de vidrio.
 *
 *   I   D6/9    re la si mi fa#     (el reposo)
 *   vi  Bm11    si la re mi fa#
 *   IV  Gmaj9   sol la si re fa#
 *   ii  Em9     mi sol si re fa#
 *
 * Arriba de todo, un fa# que no se mueve en los cuatro acordes: la nota fija,
 * como el azul del cianotipo.
 *
 * LA REGLA QUE HACE QUE NADA DESAFINE: lo que toca la interfaz (los hovers, los
 * clics) sale siempre de la pentatónica de re (re mi fa# la si). En estos
 * cuatro acordes, ninguna de esas cinco notas queda a medio tono por encima ni
 * a un tritono de una nota del acorde, así que no hay choque posible, toque
 * cuando toque. Dentro de eso, cada acorde elige sus cinco notas (un arpegio
 * suyo) y faltando menos de un segundo para el cambio se usa el que viene: la
 * nota se anticipa al acorde, como haría un músico.
 */

/** Hz de una nota MIDI (la4 = 69 = 440 Hz). */
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export const BPM = 72;
/** una corchea, en segundos (la grilla de la canción) */
export const CORCHEA = 60 / BPM / 2;
/** corcheas por acorde (dos compases de 4/4) */
export const PASOS = 16;
export const DURACION_ACORDE = PASOS * CORCHEA;

/** clases de altura (0 = do): re mayor y su pentatónica */
export const ESCALA = [2, 4, 6, 7, 9, 11, 1];
export const PENTATONICA = [2, 4, 6, 9, 11];

/** cuánto antes del cambio de acorde un hover ya toca el que viene */
export const ANTICIPO = 1;

/** cuánto sigue sonando cada voz después de su duración (la cola), en segundos */
export const COLAS = { colchon: 2.6, bajo: 1.6, caja: 1.6, melodia: 1.8, interfaz: 1.2 } as const;

export type Acorde = {
  nombre: string;
  bajo: number;
  /** el colchón: cuatro voces, el fa# arriba siempre */
  colchon: number[];
  /** la cajita de música: una figura de cuatro notas */
  celda: number[];
  /** la melodía de la segunda vuelta: [corchea, nota, corcheas que dura] */
  melodia: [number, number, number][];
  /** las cinco notas de la interfaz en este acorde, de grave a agudo (todas de la pentatónica) */
  arpegio: number[];
};

export const ACORDES: Acorde[] = [
  {
    nombre: "D6/9",
    bajo: 50,
    colchon: [57, 59, 64, 66],
    celda: [62, 69, 76, 71],
    melodia: [[0, 78, 6], [6, 81, 4], [10, 76, 6]],
    arpegio: [74, 76, 78, 81, 86],
  },
  {
    nombre: "Bm11",
    bajo: 47,
    colchon: [57, 62, 64, 66],
    celda: [59, 66, 69, 74],
    melodia: [[0, 74, 4], [4, 78, 4], [8, 76, 8]],
    arpegio: [71, 74, 76, 78, 83],
  },
  {
    nombre: "Gmaj9",
    bajo: 43,
    colchon: [57, 59, 62, 66],
    celda: [55, 62, 69, 71],
    melodia: [[0, 74, 6], [6, 71, 4], [10, 69, 4], [14, 71, 2]],
    arpegio: [71, 74, 78, 81, 83],
  },
  {
    nombre: "Em9",
    bajo: 52,
    colchon: [55, 59, 62, 66],
    celda: [64, 71, 74, 78],
    melodia: [[0, 76, 8], [8, 74, 8]],
    arpegio: [76, 78, 81, 83, 88],
  },
];

/** el orden de la cajita en los dos compases (índices de la celda, una por negra) */
const FIGURA = [0, 1, 2, 3, 0, 1, 2, 1];

/** Qué acorde suena a los `s` segundos de arrancada la canción, y cuánto le queda. */
export function acordeEn(s: number) {
  const n = Math.floor(Math.max(0, s) / DURACION_ACORDE);
  return { i: n % ACORDES.length, resta: (n + 1) * DURACION_ACORDE - Math.max(0, s) };
}

/** Las cinco notas que puede tocar la interfaz ahora (con anticipación al cambio). */
export function arpegioEn(s: number) {
  const { i, resta } = acordeEn(s);
  return ACORDES[resta < ANTICIPO ? (i + 1) % ACORDES.length : i].arpegio;
}

/**
 * Las burbujas suenan como las de verdad: cuanto más grande, más grave. Un
 * botón ancho toca la nota más baja del arpegio; uno chico, la más alta.
 */
export function notaPorTamaño(ancho: number, arpegio: number[]) {
  const t = Math.min(1, Math.max(0, (ancho - 44) / 200));
  return arpegio[Math.round((1 - t) * (arpegio.length - 2)) + 1] ?? arpegio[2];
}

export type Evento = {
  voz: "colchon" | "bajo" | "caja" | "melodia";
  midi: number;
  /** 0..1 */
  fuerza: number;
  /** segundos */
  dura: number;
};

/**
 * Lo que suena en la corchea `n` desde el arranque. `azar` devuelve 0..1 (en el
 * sitio, Math.random; en la verificación, uno con semilla): da las pequeñas
 * variaciones que hacen que el loop no canse (una nota que falta, otra que
 * suena una octava arriba, la fuerza de cada una), siempre con notas del acorde.
 */
export function partitura(n: number, azar: () => number): Evento[] {
  const vuelta = Math.floor(n / (PASOS * ACORDES.length));
  const a = ACORDES[Math.floor(n / PASOS) % ACORDES.length];
  const p = n % PASOS;
  const ev: Evento[] = [];
  if (p === 0) {
    for (const m of a.colchon) ev.push({ voz: "colchon", midi: m, fuerza: 1, dura: DURACION_ACORDE });
    ev.push({ voz: "bajo", midi: a.bajo, fuerza: 1, dura: DURACION_ACORDE });
  }
  if (p % 2 === 0) {
    const negra = p / 2;
    const r = azar();
    // la primera negra de cada compás siempre suena; las otras, casi siempre
    if (negra % 4 === 0 || r > 0.12) {
      const octava = negra % 4 !== 0 && r > 0.9 ? 12 : 0;
      ev.push({
        voz: "caja",
        midi: a.celda[FIGURA[negra]] + octava,
        fuerza: (negra % 4 === 0 ? 1 : 0.62) * (0.85 + azar() * 0.15),
        dura: CORCHEA * 3,
      });
    }
  } else if (p === 15 && azar() > 0.6) {
    // a veces, una corchea de levare hacia el acorde que viene
    ev.push({ voz: "caja", midi: a.celda[2], fuerza: 0.4, dura: CORCHEA * 2 });
  }
  if (vuelta % 2 === 1) {
    for (const [paso, m, d] of a.melodia) {
      if (paso === p) ev.push({ voz: "melodia", midi: m, fuerza: 0.9, dura: d * CORCHEA });
    }
  }
  return ev;
}
