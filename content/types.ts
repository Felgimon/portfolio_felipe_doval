/**
 * Tipos del contenido. content/ es la única fuente de verdad: las secciones y
 * las páginas de caso leen desde acá. Nada inventado: si un dato falta, el
 * campo no está y la interfaz no lo muestra.
 */

export interface EnlaceProyecto {
  label: string;
  url: string;
}

export interface Captura {
  src: string;
  alt: string;
}

export interface MiembroEquipo {
  nombre: string;
  rol: string;
}

export interface Proyecto {
  slug: string;
  nombre: string;
  /** destacado → tiene página de caso en /proyectos/<slug> */
  categoria: "destacado" | "secundario";
  unaLinea: string;
  problema?: string;
  solucion?: string;
  queHace?: string;
  rol: string;
  equipo?: MiembroEquipo[];
  stack: string[];
  destacados?: string[];
  enlaces: EnlaceProyecto[];
  capturas: Captura[];
}

export interface ItemRecorrido {
  lugar: string;
  titulo: string;
  detalle: string;
}

export interface Foto {
  src: string;
  alt: string;
  pie: string;
  /** tamaño real del archivo, para que la página no salte al cargar */
  w: number;
  h: number;
  /** recorte sin fondo: va sobre un bloque de color */
  fondo?: "amarillo" | "tinta";
  /** lugar en el lienzo de escritorio, en vw: columna, fila y ancho */
  x: number;
  y: number;
  ancho: number;
  /** cuánto se adelanta al scroll (parallax) */
  vel: number;
}

export interface Perfil {
  nombre: string;
  rol: string;
  ubicacion: string;
  bio: string;
  metaDescripcion: string;
  links: { github: string; linkedin: string };
  stack: string[];
  recorrido: ItemRecorrido[];
}
