import type { Idioma } from "@/lib/idioma";

/**
 * Los textos de interfaz en los dos idiomas. Todo texto visible que no viva en
 * `perfil` o `proyectos` sale de acá. Directos: el nombre de la cosa.
 * Cada título es [texto, palabra acentuada]: la segunda va en la serif.
 * La metadata y el JSON-LD no se traducen (el HTML servido es siempre español).
 */

export const secciones = ["inicio", "sobre-mi", "enfoque", "trabajo", "proyectos", "recorrido", "contacto"] as const;
export type IdSeccion = (typeof secciones)[number];
type Titulo = [texto: string, acento: string];

export type TextosUI = {
  secciones: Record<IdSeccion, string>;
  titulos: Record<Exclude<IdSeccion, "inicio">, Titulo>;
  nav: { aria: string; inicio: string; menu: string; cerrar: string };
  saltar: string;
  inicio: { verTrabajo: string };
  sobre: { stack: string };
  trabajo: { bajada: string };
  proyectos: { verCaso: string; verSitio: string; rol: string; stack: string };
  recorrido: { hecho: string };
  contacto: { mail: string; abrir: string };
  caso: { problema: string; solucion: string; queHace: string; detalles: string; siguiente: string };
  perdida: { titulo: Titulo; volver: string };
};

export const textosUI: Record<Idioma, TextosUI> = {
  es: {
    secciones: {
      inicio: "Inicio",
      "sobre-mi": "Sobre mí",
      enfoque: "Enfoque",
      trabajo: "Trabajo",
      proyectos: "Proyectos",
      recorrido: "Recorrido",
      contacto: "Contacto",
    },
    titulos: {
      "sobre-mi": ["Sobre", "mí"],
      enfoque: ["Cómo", "trabajo"],
      trabajo: ["Trabajo en", "Taquion"],
      proyectos: ["Otros", "proyectos"],
      recorrido: ["Mi", "recorrido"],
      contacto: ["", "Contacto"],
    },
    nav: { aria: "Secciones", inicio: "Felipe Doval, inicio", menu: "Menú", cerrar: "Cerrar" },
    saltar: "Saltar al contenido",
    inicio: { verTrabajo: "Ver trabajo" },
    sobre: { stack: "Stack" },
    trabajo: { bajada: "Tres productos en uso, hechos para la empresa." },
    proyectos: { verCaso: "Ver caso", verSitio: "Ver sitio", rol: "Rol", stack: "Stack" },
    recorrido: { hecho: "Lo que hice ahí" },
    contacto: { mail: "Mail", abrir: "Abre tu correo" },
    caso: {
      problema: "Problema",
      solucion: "Solución",
      queHace: "Qué hace",
      detalles: "Detalles",
      siguiente: "Siguiente",
    },
    perdida: { titulo: ["Página no", "encontrada"], volver: "Ir al inicio" },
  },
  en: {
    secciones: {
      inicio: "Home",
      "sobre-mi": "About",
      enfoque: "Approach",
      trabajo: "Work",
      proyectos: "Projects",
      recorrido: "Background",
      contacto: "Contact",
    },
    titulos: {
      "sobre-mi": ["About", "me"],
      enfoque: ["How I", "work"],
      trabajo: ["Work at", "Taquion"],
      proyectos: ["Other", "projects"],
      recorrido: ["My", "background"],
      contacto: ["", "Contact"],
    },
    nav: { aria: "Sections", inicio: "Felipe Doval, home", menu: "Menu", cerrar: "Close" },
    saltar: "Skip to content",
    inicio: { verTrabajo: "See work" },
    sobre: { stack: "Stack" },
    trabajo: { bajada: "Three products in use, built for the company." },
    proyectos: { verCaso: "View case", verSitio: "Visit site", rol: "Role", stack: "Stack" },
    recorrido: { hecho: "What I did there" },
    contacto: { mail: "Email", abrir: "Opens your mail app" },
    caso: {
      problema: "Problem",
      solucion: "Solution",
      queHace: "What it does",
      detalles: "Details",
      siguiente: "Next",
    },
    perdida: { titulo: ["Page not", "found"], volver: "Go home" },
  },
};
