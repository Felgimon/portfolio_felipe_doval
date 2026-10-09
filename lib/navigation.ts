import type { IdParada } from "@/content/ui";

/**
 * Las PARADAS de la visita, en orden. Son los ids de las secciones de la home
 * (anclas reales: /#trabajo se puede compartir) y la fuente única de la nav.
 * Los textos de cada una viven en content/ui.ts (paradas) y content/guia.ts.
 */
export const paradas: IdParada[] = [
  "inicio",
  "perfil",
  "enfoque",
  "trabajo",
  "recorrido",
  "contacto",
];
