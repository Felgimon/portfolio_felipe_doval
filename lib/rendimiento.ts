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

/** Los tres escalones de calidad, de mejor a peor:
 *  - `alto`   — todo: lente SVG, DPR del dispositivo, bloom.
 *  - `bajo`   — sin lente SVG y DPR 1. Es el escalón que arregla el 90% de los
 *               casos, porque el cuello medido era el DOM (v5.14). CONSERVA el
 *               bloom: sacarlo cambiaría la gradación del sol.
 *  - `minimo` — además sin bloom. Sólo se llega acá si el equipo sigue sin dar
 *               después de `bajo`, o sea que el problema es la GPU y no el DOM.
 *               Desde v5.15 esto ya NO cuesta calidad de color: el shader
 *               compensa el recorte a 8 bits (CHUNK_SIN_BLOOM en sun.ts), así
 *               que se pierde el halo pero el sol conserva su gradación. */
export type NivelRendimiento = "alto" | "bajo" | "minimo";
const ESCALA: NivelRendimiento[] = ["alto", "bajo", "minimo"];

/** Frame-time mediano (ms) a partir del cual se considera que el equipo no
 * llega. 26ms ≈ 38fps: por debajo de eso el scroll ya se siente arrastrado. */
const UMBRAL_MS = 26;
/** Frames por ventana de evaluación. */
const VENTANA = 100;
/** Cuántas ventanas malas seguidas hacen falta para degradar (evita condenar a
 * un equipo por un tramo puntualmente pesado). */
const VENTANAS_MALAS = 2;
/** Cuánto se vigila CADA escalón, en ms, antes de darlo por bueno. Al degradar
 * el reloj se reinicia: el escalón nuevo merece su propia evaluación. */
const VIGILANCIA_MS = 25_000;
/** Ventanas que se DESCARTAN justo después de degradar: cambiar el DPR y soltar
 * los filtros provoca un reflow y un recompile de shaders que ensuciarían la
 * primera medición del escalón nuevo (y lo condenarían injustamente). */
const GRACIA = 1;

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

/** Baja un escalón. Devuelve false si ya estaba en el último. */
function degradar(): boolean {
  const i = ESCALA.indexOf(nivel);
  if (i >= ESCALA.length - 1) return false;
  nivel = ESCALA[i + 1];
  document.documentElement.dataset.perf = nivel;
  for (const cb of oyentes) cb(nivel);
  return true;
}

/** Override por query string (debug): `?perf=alto|bajo|minimo`. Devuelve true
 * si fijó el nivel a mano (y entonces no hay que vigilar nada). */
function forzado(): boolean {
  const p = new URLSearchParams(window.location.search).get("perf");
  if (p !== "alto" && p !== "bajo" && p !== "minimo") return false;
  while (nivel !== p && degradar());
  return true;
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
  let inicioEscalon = anterior;
  let muestras: number[] = [];
  let malas = 0;
  let gracia = 0;
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
        muestras = [];
        if (gracia > 0) {
          gracia--; // ventana sucia por el cambio de calidad: no cuenta
        } else {
          malas = mediana > UMBRAL_MS ? malas + 1 : 0;
          if (malas >= VENTANAS_MALAS) {
            // Si ya no queda escalón, no hay más que hacer: se deja de mirar.
            if (!degradar()) {
              vivo = false;
              return;
            }
            malas = 0;
            gracia = GRACIA;
            inicioEscalon = ahora; // el escalón nuevo se evalúa desde cero
          }
        }
      }
    }

    if (ahora - inicioEscalon > VIGILANCIA_MS) {
      vivo = false; // este escalón aguanta: se deja de mirar
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
