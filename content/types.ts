/**
 * Tipos del contenido. content/ es la única fuente de verdad: las secciones y
 * las páginas de caso leen desde acá. Nada inventado: si un dato falta, el
 * campo no está y la interfaz no lo muestra.
 */

export interface Captura {
  src: string;
  alt: string;
  w: number;
  h: number;
}

export interface Proyecto {
  slug: string;
  nombre: string;
  /** trabajo → lo hecho en Taquion; proyecto → el resto */
  grupo: "trabajo" | "proyecto";
  /** tiene página propia en /proyectos/<slug> */
  caso?: boolean;
  /** En producción, En línea */
  estado?: string;
  unaLinea: string;
  rol: string;
  stack: string[];
  problema?: string;
  solucion?: string;
  queHace?: string;
  detalles?: string[];
  /** sitio público o repo */
  sitio?: string;
  repo?: string;
  capturas: Captura[];
}

export interface Paso {
  palabra: string;
  linea: string;
}

export interface ItemRecorrido {
  lugar: string;
  titulo: string;
  estado: string;
  detalle: string;
  /** lo hecho ahí; `caso` enlaza a su página, `ancla` a una sección */
  hecho: { texto: string; nota?: string; caso?: string; ancla?: string }[];
}

export interface Perfil {
  nombre: string;
  rol: string;
  ubicacion: string;
  /** dos líneas para el inicio */
  presentacion: string;
  bio: string;
  datos: [etiqueta: string, texto: string][];
  enfoque: Paso[];
  recorrido: ItemRecorrido[];
  metaDescripcion: string;
  links: { github: string; linkedin: string };
}
