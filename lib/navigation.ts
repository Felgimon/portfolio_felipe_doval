/**
 * Los NODOS del grafo = los tópicos del portfolio. Fuente única de verdad:
 * alimentan (1) las anclas y el IntersectionObserver de sección activa, (2) el
 * HUD de navegación, y (3) las esferas 3D sobre el balón (campo `dir` = dirección
 * unitaria en el espacio local del balón, hemisferio frontal hacia la cámara +z).
 * El orden del array es el orden por defecto del scroll.
 */
export const nodos = [
  {
    id: "perfil",
    label: "Perfil",
    hint: "Quién soy",
    dir: [-0.62, 0.58, 0.53] as [number, number, number],
  },
  {
    id: "enfoque",
    label: "Enfoque",
    hint: "Cómo construyo",
    dir: [0.66, 0.52, 0.48] as [number, number, number],
  },
  {
    id: "trabajo",
    label: "Trabajo",
    hint: "La prueba",
    dir: [0.84, -0.06, 0.42] as [number, number, number],
  },
  {
    id: "recorrido",
    label: "Recorrido",
    hint: "Por dónde pasé",
    dir: [-0.74, -0.48, 0.48] as [number, number, number],
  },
  {
    id: "contacto",
    label: "Contacto",
    hint: "Hablemos",
    dir: [0.42, -0.7, 0.48] as [number, number, number],
  },
] as const;

export type Nodo = (typeof nodos)[number];
export type NodoId = Nodo["id"];

/** Índice formateado 01..05 para el HUD (a partir de la posición en el array). */
export const indiceNodo = (i: number) => String(i + 1).padStart(2, "0");

export const nodoIds = nodos.map((n) => n.id) as NodoId[];

/** El estado de aterrizaje (solo modelo + logo). No es un nodo, es la portada. */
export const INICIO_ID = "inicio";

/** Ids que observa el tracker de sección activa: la portada + los 5 nodos. */
export const seccionIds = [INICIO_ID, ...nodoIds];
