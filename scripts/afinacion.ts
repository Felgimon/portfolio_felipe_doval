/**
 * ¿DESAFINA ALGO? Recorre la canción del sitio (lib/musica.ts) dos vueltas
 * enteras, con las colas de cada voz, y en cada momento junta lo que suena más
 * todo lo que podría tocar la interfaz si alguien pasa el mouse justo ahí.
 * Falla si encuentra:
 *
 *   - una nota fuera de re mayor (en la canción) o fuera de la pentatónica (en
 *     la interfaz);
 *   - un choque: una nota a medio tono por encima (novena menor) o a un tritono
 *     de otra que suena al mismo tiempo. La séptima mayor (fa# sobre sol) y la
 *     novena (mi sobre re) no cuentan: son el color de estos acordes.
 *
 *   node scripts/afinacion.ts
 */
import {
  ACORDES,
  CORCHEA,
  COLAS,
  DURACION_ACORDE,
  ESCALA,
  PASOS,
  PENTATONICA,
  arpegioEn,
  partitura,
} from "../lib/musica.ts";

const NOMBRE = ["do", "do#", "re", "re#", "mi", "fa", "fa#", "sol", "sol#", "la", "la#", "si"];
const nombre = (m: number) => `${NOMBRE[m % 12]}${Math.floor(m / 12) - 1}`;

// azar con semilla (mulberry32): la verificación siempre recorre lo mismo
function semilla(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Sonando = { midi: number; desde: number; hasta: number; voz: string };
const errores: string[] = [];
const vueltas = 2;
const total = PASOS * ACORDES.length * vueltas;
let comprobadas = 0;

for (const s of [1, 7, 42, 2026]) {
  const azar = semilla(s);
  const notas: Sonando[] = [];
  for (let n = 0; n < total; n++) {
    for (const e of partitura(n, azar)) {
      const desde = n * CORCHEA;
      notas.push({ midi: e.midi, desde, hasta: desde + e.dura + COLAS[e.voz], voz: e.voz });
      if (!ESCALA.includes(e.midi % 12)) errores.push(`${e.voz} ${nombre(e.midi)} fuera de re mayor (corchea ${n})`);
    }
  }
  const choca = (a: number, b: number) => {
    const [bajo, alto] = a < b ? [a, b] : [b, a];
    if (alto === bajo) return false;
    const i = (alto - bajo) % 12;
    return i === 1 || i === 6;
  };
  const fin = total * CORCHEA;
  for (let t = 0; t < fin; t += 0.05) {
    const ahora = notas.filter((x) => x.desde <= t + 1e-6 && x.hasta > t);
    // 1. la canción contra sí misma
    for (let i = 0; i < ahora.length; i++) {
      for (let j = i + 1; j < ahora.length; j++) {
        comprobadas++;
        if (choca(ahora[i].midi, ahora[j].midi)) {
          errores.push(
            `t=${t.toFixed(2)}s: ${ahora[i].voz} ${nombre(ahora[i].midi)} choca con ${ahora[j].voz} ${nombre(ahora[j].midi)}`,
          );
        }
      }
    }
    // 2. lo que tocaría la interfaz en este instante, contra todo lo que suena
    //    mientras dure su cola (también las octavas de abajo, que usan las filas)
    const arpegio = arpegioEn(t);
    const durante = notas.filter((x) => x.desde < t + COLAS.interfaz && x.hasta > t);
    for (const base of arpegio) {
      if (!PENTATONICA.includes(base % 12)) errores.push(`interfaz ${nombre(base)} fuera de la pentatónica`);
      for (const m of [base - 12, base, base + 12]) {
        for (const x of durante) {
          comprobadas++;
          if (choca(m, x.midi)) {
            errores.push(`t=${t.toFixed(2)}s: la interfaz (${nombre(m)}) chocaría con ${x.voz} ${nombre(x.midi)}`);
          }
        }
      }
    }
  }
}

const unicos = [...new Set(errores)];
if (unicos.length) {
  console.error(`✗ ${unicos.length} problemas de afinación:`);
  for (const e of unicos.slice(0, 40)) console.error("  " + e);
  process.exit(1);
}
console.log(
  `✓ afinación: ${comprobadas.toLocaleString("es-AR")} pares de notas sin un choque (${vueltas} vueltas de ${(
    ACORDES.length * DURACION_ACORDE
  ).toFixed(1)} s, 4 semillas, con las colas)`,
);
