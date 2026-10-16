/**
 * Tipos del contenido del portfolio.
 * content/ es la ÚNICA fuente de verdad: las secciones y las páginas de
 * detalle leen desde acá. Todo lo que falte se marca con `falta`/`incompleto`
 * para que la UI muestre un placeholder honesto (nunca datos inventados).
 */

export type CategoriaProyecto = "destacado" | "secundario";

export type TipoEnlace = "repo" | "demo" | "caso" | "nota" | "figma";

export interface EnlaceProyecto {
  tipo: TipoEnlace;
  label: string;
  url: string;
}

export interface Captura {
  src: string;
  alt: string;
  /** true → todavía no hay captura real; la UI muestra un placeholder punteado */
  falta?: boolean;
}

export interface MiembroEquipo {
  nombre: string;
  rol: string;
}

export interface Proyecto {
  slug: string;
  nombre: string;
  categoria: CategoriaProyecto;
  /** título de una línea; si falta, se marca incompleto */
  unaLinea: string;
  tagline?: string;
  /** resumen breve para la card (1–2 frases) */
  resumen: string;
  problema?: string;
  solucion?: string;
  queHace?: string;
  rol: string;
  equipo?: MiembroEquipo[];
  stack: string[];
  /** hitos, decisiones técnicas, features destacadas */
  destacados?: string[];
  aprendizajes?: string[];
  enlaces: EnlaceProyecto[];
  capturas: Captura[];
  /** color de acento del case study (hex) */
  acento: string;
  anguloSitio?: string;
  año?: string;
  /** true → faltan datos reales (PC Builder / Nindo / LOST) */
  incompleto?: boolean;
}

export type CategoriaStack =
  | "Frontend"
  | "Backend"
  | "ML / Datos"
  | "Lenguajes"
  | "3D / Motion"
  | "Automatización";

export interface ItemStack {
  nombre: string;
  categoria: CategoriaStack;
}

/** Un principio del "Enfoque": cómo trabaja Felipe. Se renderiza numerado
 * (01/02/03), sin viñetas. */
export interface PrincipioEnfoque {
  titulo: string;
  texto: string;
}

export interface Enfoque {
  resumen: string;
  principios: PrincipioEnfoque[];
}

/** Copy de la PORTADA. Regla de Felipe: acá no entran guiones ni viñetas (ni
 * separadores decorativos): al lado del nombre mandan el nombre y una frase. */
export interface Hero {
  /** línea de oficio, arriba del nombre */
  kicker: string;
  /** la frase que explica qué hace, debajo del nombre */
  lead: string;
}

export type TipoTimeline = "trabajo" | "educacion" | "competencia";

export interface ItemTimeline {
  orden: number;
  titulo: string;
  lugar: string;
  periodo?: string;
  descripcion: string;
  tipo: TipoTimeline;
}

export interface Perfil {
  nombre: string;
  apodo: string;
  rol: string;
  ubicacion: string;
  hero: Hero;
  bioCorta: string;
  bioLarga: string[];
  enfoque: Enfoque;
  metaDescripcion: string;
  links: {
    github: string;
    linkedin: string;
    cv?: string;
  };
  stack: ItemStack[];
  timeline: ItemTimeline[];
  /** Así soy: cómo es, en sus palabras (Perfil, debajo del stack) */
  rasgos: Rasgo[];
}

export interface Rasgo {
  titulo: string;
  texto: string;
  /** un control al final de la frase (hoy: prender el sonido) */
  accion?: "sonido";
}
