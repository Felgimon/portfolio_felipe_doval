/**
 * CALIDAD ADAPTATIVA — el seguro para los equipos que no llegan.
 *
 * El vidrio con lente SVG y el canvas 3D están calibrados para una GPU sana. En
 * una máquina flaca esa misma calidad se paga en frames, y el sitio se siente
 * pegajoso justo donde más vidrio hay (Trabajo, Recorrido). En vez de bajarle la
 * calidad a TODOS por si acaso, se MIDE la cadencia real y se degrada sólo al
 * equipo que lo necesita.
 *
 * Decisiones de diseño, para que no moleste:
 *  - Degrada UNA sola vez y no vuelve: nada de subir y bajar la calidad mientras
 *    scrolleás (ese parpadeo se nota más que unos FPS de menos).
 *  - Mide en VENTANAS de frames consecutivos y usa la MEDIANA, no el promedio:
 *    un pico aislado (el compile de un shader, un GC) no debe condenar a un
 *    equipo bueno.
 *  - Deja de vigilar a los ~25s. Para entonces ya pasó la carga y el primer
 *    recorrido, que es cuando se ve la verdad; seguir mirando sería un rAF vivo
 *    para siempre.
 *  - `?perf=bajo` / `?perf=alto` fuerzan el nivel (para probar sin una netbook a
 *    mano), igual que el `?fx=` de lib/gpu.ts.
 */

export type NivelRendimiento = "alto" | "bajo";

/** Frame-time mediano (ms) a partir del cual se considera que el equipo no
 * llega. 26ms ≈ 38fps: por debajo de eso el scroll ya se siente arrastrado. */
const UMBRAL_MS = 26;
/** Frames por ventana de evaluación. */
const VENTANA = 100;
/** Cuántas ventanas malas seguidas hacen falta para degradar (evita condenar a
 * un equipo por un tramo puntualmente pesado). */
const VENTANAS_MALAS = 2;
/** Cuánto se vigila, en ms, antes de dar por bueno al equipo. */
const VIGILANCIA_MS = 25_000;

let nivel: NivelRendimiento = "alto";
const oyentes = new Set<(n: NivelRendimiento) => void>();

/** Nivel actual. En servidor siempre "alto" (no hay nada que medir). */
export function nivelRendimiento(): NivelRendimiento {
  return nivel;
}

/** Se suscribe a los cambios de nivel. Devuelve la baja. */
export function alCambiarRendimiento(
  cb: (n: NivelRendimiento) => void,
): () => void {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function degradar() {
  if (nivel === "bajo") return;
  nivel = "bajo";
  document.documentElement.dataset.perf = "bajo";
  for (const cb of oyentes) cb(nivel);
}

/** Override por query string (debug). Devuelve true si fijó el nivel a mano. */
function forzado(): boolean {
  const p = new URLSearchParams(window.location.search).get("perf");
  if (p === "bajo") {
    degradar();
    return true;
  }
  return p === "alto";
}

/**
 * Arranca la vigilancia. Idempotente por página: llamarla dos veces no duplica
 * el rAF. Devuelve una función para cortarla (cleanup de React).
 */
let vigilando = false;
export function vigilarRendimiento(): () => void {
  if (typeof window === "undefined" || vigilando) return () => {};
  document.documentElement.dataset.perf = "alto";
  if (forzado()) return () => {};
  vigilando = true;

  let raf = 0;
  let anterior = performance.now();
  const inicio = anterior;
  let muestras: number[] = [];
  let malas = 0;
  let vivo = true;

  const paso = () => {
    if (!vivo) return;
    const ahora = performance.now();
    const dt = ahora - anterior;
    anterior = ahora;

    // Un dt monstruoso no es lentitud: es la pestaña volviendo del fondo o el
    // navegador pausando el rAF. Se descarta y se reinicia la ventana.
    if (dt > 250) {
      muestras = [];
    } else {
      muestras.push(dt);
      if (muestras.length >= VENTANA) {
        const orden = [...muestras].sort((a, b) => a - b);
        const mediana = orden[orden.length >> 1];
        malas = mediana > UMBRAL_MS ? malas + 1 : 0;
        muestras = [];
        if (malas >= VENTANAS_MALAS) {
          degradar();
          vivo = false;
          return;
        }
      }
    }

    if (ahora - inicio > VIGILANCIA_MS) {
      vivo = false; // el equipo aguanta: se deja de mirar
      return;
    }
    raf = requestAnimationFrame(paso);
  };
  raf = requestAnimationFrame(paso);

  return () => {
    vivo = false;
    vigilando = false;
    cancelAnimationFrame(raf);
  };
}
