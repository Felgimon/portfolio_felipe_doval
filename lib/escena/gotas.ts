/**
 * Las gotas se declaran en el DOM, ancladas a la caja de un elemento:
 *
 *   data-gotas="fx fy r tono [capa]; fx fy r tono [capa]; ..."
 *
 *   fx, fy  posición en fracción de la caja del elemento (pueden salirse de 0..1)
 *   r       radio en unidades de escena (≈ px a 1000px de lado corto)
 *   tono    0 lima .. 1 jade
 *   capa    0 detrás de Feli (por defecto), 1 delante (pileta)
 *
 * Así el líquido "arma el escenario" de cada parada pegado al contenido real
 * (detrás del globo de Feli, de pedestal de una tarjeta) y nunca hay que
 * coreografiar posiciones a mano en el JS.
 */
export type DefGota = { fx: number; fy: number; r: number; tono: number; capa: number };

export function leerGotas(src: string | undefined): DefGota[] {
  if (!src) return [];
  return src
    .split(";")
    .map((s) => s.trim().split(/\s+/).map(Number))
    .filter((v) => v.length >= 4 && v.every(Number.isFinite))
    .map(([fx, fy, r, tono, capa = 0]) => ({ fx, fy, r, tono, capa }));
}
