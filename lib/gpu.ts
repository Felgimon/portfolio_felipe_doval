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

/** true → el WebGL NO usa la GPU (render por software) o no hay WebGL. */
export function isSoftwareRenderer(): boolean {
  if (_soft !== null) return _soft;
  const n = probe().toLowerCase();
  _soft =
    n === "sin-webgl" ||
    /swiftshader|software|llvmpipe|basic render|microsoft basic/.test(n);
  return _soft;
}
