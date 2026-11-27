import type { Idioma } from "@/lib/idioma";

/**
 * Los textos de interfaz en los dos idiomas. Todo texto visible que no viva en
 * `perfil`, `proyectos` o `fotos` sale de acá. Directos: el nombre de la cosa.
 * La metadata y el JSON-LD no se traducen (el HTML servido es siempre español).
 */

export const secciones = ["inicio", "proyectos", "fotos", "sobre-mi", "contacto"] as const;
export type IdSeccion = (typeof secciones)[number];

export type TextosUI = {
  secciones: Record<IdSeccion, string>;
  nav: { aria: string; inicio: string };
  saltar: string;
  proyectos: { verCaso: string; rol: string; equipo: string; stack: string };
  sobre: { stack: string; recorrido: string };
  contacto: { mail: string; copiar: string; copiado: string; copialoAMano: string };
  caso: { problema: string; solucion: string; queHace: string; detalles: string; siguiente: string };
  perdida: { titulo: string; volver: string };
};

export const textosUI: Record<Idioma, TextosUI> = {
  es: {
    secciones: {
      inicio: "Inicio",
      proyectos: "Proyectos",
      fotos: "Fotos",
      "sobre-mi": "Sobre mí",
      contacto: "Contacto",
    },
    nav: { aria: "Secciones", inicio: "Felipe Doval, inicio" },
    saltar: "Saltar al contenido",
    proyectos: { verCaso: "Ver caso", rol: "Rol", equipo: "Equipo", stack: "Stack" },
    sobre: { stack: "Stack", recorrido: "Recorrido" },
    contacto: { mail: "Mail", copiar: "Copiar", copiado: "Copiado", copialoAMano: "Copialo a mano" },
    caso: {
      problema: "Problema",
      solucion: "Solución",
      queHace: "Qué hace",
      detalles: "Detalles",
      siguiente: "Siguiente",
    },
    perdida: { titulo: "Página no encontrada", volver: "Inicio" },
  },
  en: {
    secciones: {
      inicio: "Home",
      proyectos: "Projects",
      fotos: "Photos",
      "sobre-mi": "About",
      contacto: "Contact",
    },
    nav: { aria: "Sections", inicio: "Felipe Doval, home" },
    saltar: "Skip to content",
    proyectos: { verCaso: "View case", rol: "Role", equipo: "Team", stack: "Stack" },
    sobre: { stack: "Stack", recorrido: "Background" },
    contacto: { mail: "Email", copiar: "Copy", copiado: "Copied", copialoAMano: "Copy it by hand" },
    caso: {
      problema: "Problem",
      solucion: "Solution",
      queHace: "What it does",
      detalles: "Details",
      siguiente: "Next",
    },
    perdida: { titulo: "Page not found", volver: "Home" },
  },
};
