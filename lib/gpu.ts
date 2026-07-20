/**
 * Sonda de GPU (client-only). Detecta si el WebGL corre por SOFTWARE
 * (SwiftShader / llvmpipe / "Microsoft Basic Render") — típico cuando el
 * navegador tiene la aceleración por hardware apagada o la GPU en la blocklist.
 * En ese caso el fill-rate se paga carísimo, así que el canvas baja a un modo
 * "lite" (sin bloom, DPR 1) para sostener los FPS.
 *
 * La sonda crea un contexto WebGL de usar-y-tirar UNA sola vez y cachea el
 * resultado (crear contextos no es gratis).
 */
let _name: string | null = null;
let _soft: boolean | null = null;

function probe(): string {
  if (_name !== null) return _name;
  if (typeof window === "undefined") return (_name = "");
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") ||
      c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return (_name = "sin-webgl");
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    _name = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : "renderer-oculto";
  } catch {
    _name = "error";
  }
  return _name;
}

/** Nombre crudo del renderer (para el overlay `?stats`). */
export function rendererName(): string {
  return probe();
}

/** true → el WebGL NO usa la GPU (render por software) o no hay WebGL.
 * Override de debug: `?fx=full` fuerza la ruta GPU completa (útil para probar
 * shaders/animación en headless) y `?fx=lite` fuerza el modo lite. */
export function isSoftwareRenderer(): boolean {
  if (typeof window !== "undefined") {
    const fx = new URLSearchParams(window.location.search).get("fx");
    if (fx === "full") return false;
    if (fx === "lite") return true;
  }
  if (_soft !== null) return _soft;
  const n = probe().toLowerCase();
  _soft =
    n === "sin-webgl" ||
    /swiftshader|software|llvmpipe|basic render|microsoft basic/.test(n);
  return _soft;
}

/** Lee un override de la query string (debug). Devuelve null si no está. */
function query(clave: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(clave);
}

/** Override de debug `?bloom=0|1`: fuerza el post-procesado apagado/prendido.
 * Sirve para MEDIR cuánto cuesta el bloom por separado del DPR (que era lo que
 * faltaba saber cuando se calibró la calidad adaptativa). null = sin override. */
export function bloomForzado(): boolean | null {
  const b = query("bloom");
  return b === "1" ? true : b === "0" ? false : null;
}

/** Override de debug `?dpr=1.5`: fija el device pixel ratio del canvas. Igual
 * que arriba, para aislar el costo del fill-rate. null = sin override. */
export function dprForzado(): number | null {
  const d = Number(query("dpr"));
  return Number.isFinite(d) && d > 0 ? Math.min(d, 3) : null;
}

/** Override de debug `?comp=0`: apaga la compensación de gradación que corrige
 * el recorte a 8 bits cuando no hay bloom (ver CHUNK_SIN_BLOOM en sun.ts).
 * Sirve para comparar el sol con y sin la corrección. null = sin override. */
export function compensacionForzada(): boolean | null {
  const c = query("comp");
  return c === "1" ? true : c === "0" ? false : null;
}

let _bloom: boolean | null = null;

/** ¿La GPU banca el POSTPROCESADO? El EffectComposer renderiza a buffers
 * half-float, que piden WebGL2 + EXT_color_buffer_(half_)float. En equipos con
 * drivers viejos (netbooks escolares con ANGLE/D3D9: solo WebGL1) el composer
 * no puede crear sus render targets y el canvas entero queda NEGRO — el sol
 * "no aparece" aunque la escena compile perfecta. Antes de montar el Bloom se
 * pregunta acá; si no se puede, el sol se dibuja igual, solo que sin halo. */
export function bloomSupported(): boolean {
  if (_bloom !== null) return _bloom;
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    _bloom =
      !!gl &&
      !!(
        gl.getExtension("EXT_color_buffer_half_float") ||
        gl.getExtension("EXT_color_buffer_float")
      );
  } catch {
    _bloom = false;
  }
  return _bloom;
}
