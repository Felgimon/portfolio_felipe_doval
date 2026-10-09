import type { Idioma } from "@/lib/idioma";

/**
 * Los STRINGS DE INTERFAZ en los dos idiomas. Todo texto visible que no viva en
 * `perfil`, `proyectos` o `guia` (lo que dice Feli) sale de acá.
 *
 * Lo que NO se traduce, a propósito:
 *  - metadata / JSON-LD / sitemap (el SEO del sitio es "felipe doval" en
 *    español; el HTML estático servido es siempre es).
 *  - El easter egg del Konami (es un chiste rioplatense).
 *
 * Reglas de texto (de Felipe): voseo, cero rayas, cero viñetas.
 */

export type IdParada =
  | "inicio"
  | "perfil"
  | "enfoque"
  | "trabajo"
  | "recorrido"
  | "contacto";

export type TextosUI = {
  paradas: Record<IdParada, string>;
  nav: { aria: string; paradas: string; cerrar: string; volverVisita: string };
  saltar: string;
  hero: { empezar: string; copiarMail: string };
  perfil: { stack: string };
  trabajo: {
    enProgreso: string;
    anterior: string;
    verCaso: string;
    repoPrivado: string;
    rol: string;
    stack: string;
    otros: string;
    ariaVerCaso: string;
    ariaAbrirRepo: string;
  };
  recorrido: { tipos: Record<string, string>; falta: string };
  contacto: { lead: string; copiarMail: string; mailCopiado: string };
  categoriasStack: Record<string, string>;
  detalle: {
    miRol: string;
    equipo: string;
    stack: string;
    problema: string;
    solucion: string;
    decisiones: string;
    capturas: string;
    aprendizajes: string;
    siguiente: string;
  };
  perdida: { titulo: string; volver: string };
  falta: string;
  footer: { creditoFuente: string };
};

export const textosUI: Record<Idioma, TextosUI> = {
  es: {
    paradas: {
      inicio: "Inicio",
      perfil: "Perfil",
      enfoque: "Enfoque",
      trabajo: "Trabajo",
      recorrido: "Recorrido",
      contacto: "Contacto",
    },
    nav: {
      aria: "Paradas de la visita",
      paradas: "Paradas",
      cerrar: "Cerrar",
      volverVisita: "Volver a la visita",
    },
    saltar: "Saltar al contenido",
    hero: { empezar: "Empezar la visita", copiarMail: "Copiar mi mail" },
    perfil: { stack: "Con qué construyo" },
    trabajo: {
      enProgreso: "En progreso",
      anterior: "Proyecto anterior",
      verCaso: "Ver el caso",
      repoPrivado: "Repo privado",
      rol: "Rol",
      stack: "Stack",
      otros: "Lo que me trajo hasta acá",
      ariaVerCaso: "ver el caso",
      ariaAbrirRepo: "abrir",
    },
    recorrido: {
      tipos: { educacion: "Formación", trabajo: "Trabajo", competencia: "Competencia" },
      falta: "período",
    },
    contacto: {
      lead: "Estoy abierto a proyectos, pasantías y buenas ideas. Si algo de lo que viste te resonó, escribime; respondo.",
      copiarMail: "Copiar mi mail",
      mailCopiado: "Mail copiado",
    },
    categoriasStack: {
      Frontend: "Frontend",
      Backend: "Backend",
      "ML / Datos": "ML y datos",
      Lenguajes: "Lenguajes",
      "3D / Motion": "3D y motion",
      Automatización: "Automatización",
    },
    detalle: {
      miRol: "Mi rol",
      equipo: "Equipo",
      stack: "Stack",
      problema: "El problema",
      solucion: "La solución",
      decisiones: "Decisiones y features",
      capturas: "Capturas",
      aprendizajes: "Lo que aprendí",
      siguiente: "Siguiente caso",
    },
    perdida: { titulo: "Parada perdida", volver: "Volver al inicio" },
    falta: "FALTA",
    footer: {
      creditoFuente: "Doval Script, derivada de Norican (SIL OFL)",
    },
  },
  en: {
    paradas: {
      inicio: "Home",
      perfil: "Profile",
      enfoque: "Approach",
      trabajo: "Work",
      recorrido: "Journey",
      contacto: "Contact",
    },
    nav: {
      aria: "Tour stops",
      paradas: "Stops",
      cerrar: "Close",
      volverVisita: "Back to the tour",
    },
    saltar: "Skip to content",
    hero: { empezar: "Start the tour", copiarMail: "Copy my email" },
    perfil: { stack: "What I build with" },
    trabajo: {
      enProgreso: "In progress",
      anterior: "Previous project",
      verCaso: "Read the case",
      repoPrivado: "Private repo",
      rol: "Role",
      stack: "Stack",
      otros: "What got me here",
      ariaVerCaso: "read the case",
      ariaAbrirRepo: "open",
    },
    recorrido: {
      tipos: { educacion: "Education", trabajo: "Work", competencia: "Competition" },
      falta: "dates",
    },
    contacto: {
      lead: "I'm open to projects, internships and good ideas. If anything you saw resonated, write me; I reply.",
      copiarMail: "Copy my email",
      mailCopiado: "Email copied",
    },
    categoriasStack: {
      Frontend: "Frontend",
      Backend: "Backend",
      "ML / Datos": "ML and data",
      Lenguajes: "Languages",
      "3D / Motion": "3D and motion",
      Automatización: "Automation",
    },
    detalle: {
      miRol: "My role",
      equipo: "Team",
      stack: "Stack",
      problema: "The problem",
      solucion: "The solution",
      decisiones: "Decisions and features",
      capturas: "Screenshots",
      aprendizajes: "What I learned",
      siguiente: "Next case",
    },
    perdida: { titulo: "Lost stop", volver: "Back to the start" },
    falta: "MISSING",
    footer: {
      creditoFuente: "Doval Script, derived from Norican (SIL OFL)",
    },
  },
};
