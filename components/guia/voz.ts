import type { IdParada } from "@/content/ui";
import type { PoseId } from "@/content/guia";

/**
 * La VOZ de Feli: cuando pasa algo (copiaste el mail, lo tocaste), el globo de
 * esa parada cambia su frase por una respuesta, y Feli puede cambiar de pose.
 * Un store mínimo para useSyncExternalStore, sin contexto.
 */
export type Respuesta = {
  parada: IdParada;
  texto: string;
  pose?: PoseId;
  n: number;
} | null;

let actual: Respuesta = null;
let n = 0;
const oyentes = new Set<() => void>();

const avisar = () => {
  for (const o of oyentes) o();
};

export function decir(parada: IdParada, texto: string, pose?: PoseId) {
  actual = { parada, texto, pose, n: ++n };
  avisar();
}

/** Vuelve a la frase de la parada (sólo si nadie dijo otra cosa después). */
export function callar(cual: number) {
  if (actual?.n !== cual) return;
  actual = null;
  avisar();
}

export function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}

export function respuesta(): Respuesta {
  return actual;
}
