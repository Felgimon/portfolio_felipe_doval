/**
 * Constantes de la escena 3D (compartidas por GraphCanvas y GraphNodes, sin
 * ciclos de import). Antes vivían junto al contenedor de metal; ese modelo se
 * retiró (v5) y el sol + los mini-soles quedaron solos en el estudio blanco.
 */

/** Radio de referencia de la escena (unidades locales, antes del scale global). */
export const BALL_R = 1;

/** Distancia de los mini-soles al sol central (en unidades de BALL_R). Sin el
 * contenedor de metal que los empujaba afuera, orbitan MÁS CERCA del sol. */
export const NODE_RING = 0.86;

/** Escala global del grafo (el sol queda centrado; la cámara hace el trabajo). */
export const GRAPH_SCALE = 1.4;
