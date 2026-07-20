/**
 * IDIOMA — detección automática, sin selector (pedido de Felipe).
 *
 * Prioridad:
 *  1. El idioma configurado en el NAVEGADOR (`navigator.languages`): en Chrome
 *     es literalmente la configuración de idioma de Google del usuario, que es
 *     la prioridad que pidió Felipe. Se mira el primero de la lista (el
 *     preferido): si es español (es, es-AR, es-ES...) → es; cualquier otro → en.
 *  2. La REGIÓN, solo como fallback si el navegador no informa idiomas (raro):
 *     el huso horario delata el país sin pedir permisos ni geolocalización.
 *
 * La detección corre en el cliente DESPUÉS de hidratar (ver IdiomaProvider):
 * el HTML servido es siempre español (la identidad y el SEO del sitio: la
 * búsqueda que importa es "felipe doval" en español) y para un visitante en
 * inglés el contenido cambia apenas monta. Así no hay mismatch de hidratación
 * ni hace falta volver dinámico un sitio 100% estático.
 */

export type Idioma = "es" | "en";

/** Husos horarios de países hispanohablantes (fallback de región). */
const TZ_ES =
  /Argentina|Montevideo|Santiago|Bogota|Lima|Mexico|Madrid|Canary|Caracas|Asuncion|La_Paz|Guayaquil|Havana|Santo_Domingo|Guatemala|Tegucigalpa|Managua|El_Salvador|Costa_Rica|Panama|Hermosillo|Tijuana|Monterrey|Cancun/;

export function detectarIdioma(): Idioma {
  if (typeof navigator === "undefined") return "es";
  // 1. Configuración de idioma del navegador (Google), en orden de preferencia.
  const lista = navigator.languages?.length
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];
  if (lista.length > 0) {
    return lista[0].toLowerCase().startsWith("es") ? "es" : "en";
  }
  // 2. Fallback de región por huso horario: región hispana → es, el resto → en.
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return TZ_ES.test(tz) ? "es" : "en";
  } catch {
    // Sin señal alguna: el idioma nativo del sitio.
    return "es";
  }
}
