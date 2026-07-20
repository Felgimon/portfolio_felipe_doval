import type { Idioma } from "@/lib/idioma";

/**
 * Los STRINGS DE INTERFAZ en los dos idiomas. Todo texto visible que no viva en
 * `perfil` o `proyectos` sale de acá. Los títulos con palabra acentuada van
 * partidos en pre/accent/post para que el span del degradé siga funcionando en
 * cualquier idioma.
 *
 * Lo que NO se traduce, a propósito:
 *  - metadata / JSON-LD / sitemap (el SEO del sitio es "felipe doval" en
 *    español; el HTML estático servido es siempre es).
 *  - El easter egg del Konami (es un chiste rioplatense).
 */

type Titulo = { pre: string; accent: string; post: string };

export type TextosUI = {
  hero: { ctaTrabajo: string; ctaContacto: string };
  nodos: Record<string, { label: string; hint: string }>;
  aria: { secciones: string; cargando: string };
  cargando: string;
  volverGrafo: string;
  perfil: { titulo: Titulo; herramientas: string };
  enfoque: { titulo: Titulo };
  trabajo: {
    titulo: Titulo;
    lead: string;
    casoPrincipal: string;
    verCaso: string;
    enProgreso: string;
    ariaVerCaso: string;
    ariaAbrirRepo: string;
  };
  recorrido: { titulo: Titulo; tipos: Record<string, string> };
  contacto: { titulo: Titulo; lead: string; email: string };
  categoriasStack: Record<string, string>;
  detalle: {
    volver: string;
    caseStudy: string;
    miRol: string;
    equipo: string;
    stack: string;
    problema: string;
    solucion: string;
    decisiones: string;
    capturas: string;
    aprendizajes: string;
    todoTrabajo: string;
    siguiente: string;
  };
  falta: string;
  copiarEmail: string;
  emailCopiado: string;
  footer: {
    bio: string;
    hechoCon: string;
    solCredito: string;
    volverArriba: string;
    ariaEnlaces: string;
  };
};

export const textosUI: Record<Idioma, TextosUI> = {
  es: {
    hero: { ctaTrabajo: "Ver el trabajo", ctaContacto: "Hablemos" },
    nodos: {
      perfil: { label: "Perfil", hint: "Quién soy" },
      enfoque: { label: "Enfoque", hint: "Cómo construyo" },
      trabajo: { label: "Trabajo", hint: "La prueba" },
      recorrido: { label: "Recorrido", hint: "Por dónde pasé" },
      contacto: { label: "Contacto", hint: "Hablemos" },
    },
    aria: { secciones: "Secciones", cargando: "Cargando el sitio" },
    cargando: "cargando",
    volverGrafo: "Volver al grafo",
    perfil: {
      titulo: { pre: "Construyo de ", accent: "punta", post: " a punta" },
      herramientas: "Herramientas",
    },
    enfoque: {
      titulo: {
        pre: "Los proyectos son el ",
        accent: "medio",
        post: ", no el fin",
      },
    },
    trabajo: {
      titulo: { pre: "La ", accent: "prueba", post: ": lo que construí" },
      lead: "Cada uno resolvió un problema real. El grande, Superlum, tiene su historia completa; abajo, el resto de lo que fui armando.",
      casoPrincipal: "Caso principal",
      verCaso: "Ver el caso",
      enProgreso: "en progreso",
      ariaVerCaso: "ver el caso",
      ariaAbrirRepo: "abrir",
    },
    recorrido: {
      titulo: { pre: "Por dónde fui ", accent: "pasando", post: "" },
      tipos: {
        educacion: "Formación",
        competencia: "Competencia",
        trabajo: "Trabajo",
      },
    },
    contacto: {
      titulo: { pre: "¿Tenés algo para ", accent: "construir", post: "?" },
      lead: "Estoy abierto a proyectos, pasantías y buenas ideas. Si algo de lo que viste te resonó, escribime; respondo.",
      email: "Email",
    },
    categoriasStack: {
      Frontend: "Frontend",
      Backend: "Backend",
      "ML / Datos": "ML / Datos",
      Lenguajes: "Lenguajes",
      "3D / Motion": "3D / Motion",
      Automatización: "Automatización",
    },
    detalle: {
      volver: "Volver al trabajo",
      caseStudy: "Case study",
      miRol: "Mi rol",
      equipo: "Equipo",
      stack: "Stack",
      problema: "El problema",
      solucion: "La solución",
      decisiones: "Decisiones y features",
      capturas: "Capturas",
      aprendizajes: "Aprendizajes",
      todoTrabajo: "Todo el trabajo",
      siguiente: "Siguiente caso",
    },
    falta: "FALTA",
    copiarEmail: "Copiar email",
    emailCopiado: "Email copiado",
    footer: {
      bio: "Desarrollador y builder: construyo productos de punta a punta, del full-stack a los datos.",
      hechoCon: "Hecho con",
      solCredito: "Sol",
      volverArriba: "Volver arriba",
      ariaEnlaces: "Enlaces de contacto",
    },
  },
  en: {
    hero: { ctaTrabajo: "See the work", ctaContacto: "Let's talk" },
    nodos: {
      perfil: { label: "Profile", hint: "Who I am" },
      enfoque: { label: "Approach", hint: "How I build" },
      trabajo: { label: "Work", hint: "The proof" },
      recorrido: { label: "Journey", hint: "Where I've been" },
      contacto: { label: "Contact", hint: "Let's talk" },
    },
    aria: { secciones: "Sections", cargando: "Loading the site" },
    cargando: "loading",
    volverGrafo: "Back to the graph",
    perfil: {
      titulo: { pre: "I build ", accent: "end", post: " to end" },
      herramientas: "Tools",
    },
    enfoque: {
      titulo: {
        pre: "Projects are the ",
        accent: "means",
        post: ", not the end",
      },
    },
    trabajo: {
      titulo: { pre: "The ", accent: "proof", post: ": what I've built" },
      lead: "Each one solved a real problem. The big one, Superlum, has its full story; below, the rest of what I've been building.",
      casoPrincipal: "Main case",
      verCaso: "Read the case",
      enProgreso: "in progress",
      ariaVerCaso: "read the case",
      ariaAbrirRepo: "open",
    },
    recorrido: {
      titulo: { pre: "Where I've ", accent: "been", post: "" },
      tipos: {
        educacion: "Education",
        competencia: "Competition",
        trabajo: "Work",
      },
    },
    contacto: {
      titulo: { pre: "Got something to ", accent: "build", post: "?" },
      lead: "I'm open to projects, internships and good ideas. If anything you saw resonated, write me; I reply.",
      email: "Email",
    },
    categoriasStack: {
      Frontend: "Frontend",
      Backend: "Backend",
      "ML / Datos": "ML / Data",
      Lenguajes: "Languages",
      "3D / Motion": "3D / Motion",
      Automatización: "Automation",
    },
    detalle: {
      volver: "Back to the work",
      caseStudy: "Case study",
      miRol: "My role",
      equipo: "Team",
      stack: "Stack",
      problema: "The problem",
      solucion: "The solution",
      decisiones: "Decisions & features",
      capturas: "Screenshots",
      aprendizajes: "What I learned",
      todoTrabajo: "All the work",
      siguiente: "Next case",
    },
    falta: "MISSING",
    copiarEmail: "Copy email",
    emailCopiado: "Email copied",
    footer: {
      bio: "Developer and builder: I make products end to end, from full-stack to data.",
      hechoCon: "Built with",
      solCredito: "Sun",
      volverArriba: "Back to top",
      ariaEnlaces: "Contact links",
    },
  },
};
