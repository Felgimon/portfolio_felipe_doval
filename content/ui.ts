import type { Idioma } from "@/lib/idioma";

/**
 * Los STRINGS DE INTERFAZ en los dos idiomas. Todo texto visible que no viva en
 * `perfil` o `proyectos` sale de acá.
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
  | "proyectos"
  | "recorrido"
  | "contacto";

export type TextosUI = {
  paradas: Record<IdParada, string>;
  nav: { aria: string; menu: string; cerrar: string; volver: string; hablemos: string; inicio: string };
  sonido: { boton: string; prender: string; apagar: string; prendido: string; apagado: string };
  saltar: string;
  hero: { verTrabajo: string; copiarMail: string };
  perfil: { stack: string; asiSoy: string };
  trabajo: {
    enProgreso: string;
    anterior: string;
    verCaso: string;
    repoPrivado: string;
    rol: string;
    stack: string;
    ariaVerCaso: string;
    ariaAbrirRepo: string;
  };
  recorrido: { tipos: Record<string, string>; falta: string };
  contacto: {
    lead: string;
    copiarMail: string;
    mailCopiado: string;
    noCopiado: string;
    enPortapapeles: string;
    copialoAMano: string;
    temasTitulo: string;
    temasAyuda: string;
    saludo: string;
    temas: { etiqueta: string; asunto: string }[];
  };
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
  perdida: { etiqueta: string; titulo: string[]; volver: string };
  falta: string;
  footer: { ubicacion: string };
};

export const textosUI: Record<Idioma, TextosUI> = {
  es: {
    paradas: {
      inicio: "Inicio",
      perfil: "Perfil",
      enfoque: "Enfoque",
      trabajo: "Trabajo",
      proyectos: "Proyectos",
      recorrido: "Recorrido",
      contacto: "Contacto",
    },
    nav: {
      aria: "Secciones",
      menu: "Menú",
      cerrar: "Cerrar",
      volver: "Volver",
      hablemos: "Hablemos",
      inicio: "Felipe Doval, inicio",
    },
    sonido: {
      boton: "Sonido",
      prender: "Prender el sonido",
      apagar: "Apagar el sonido",
      prendido: "Sonido prendido",
      apagado: "Sonido apagado",
    },
    saltar: "Saltar al contenido",
    hero: {
      verTrabajo: "Ver el trabajo",
      copiarMail: "Copiar mi mail",
    },
    perfil: { stack: "Con qué construyo", asiSoy: "Así soy" },
    trabajo: {
      enProgreso: "En progreso",
      anterior: "Proyecto anterior",
      verCaso: "Ver el caso",
      repoPrivado: "Repo privado",
      rol: "Rol",
      stack: "Stack",
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
      noCopiado: "No se pudo copiar",
      enPortapapeles: "En tu portapapeles",
      copialoAMano: "Copialo a mano",
      temasTitulo: "¿De qué charlamos?",
      temasAyuda: "Elegí uno y se abre tu mail con el asunto listo.",
      saludo: "Hola, Felipe:",
      temas: [
        { etiqueta: "Un proyecto", asunto: "Hablemos de un proyecto" },
        { etiqueta: "Un laburo", asunto: "Una propuesta de laburo" },
        { etiqueta: "Música", asunto: "Hablemos de música" },
        { etiqueta: "Algo nuevo", asunto: "Vi algo nuevo y pensé en vos" },
      ],
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
    perdida: { etiqueta: "Error 404", titulo: ["Página no", "encontrada"], volver: "Volver al inicio" },
    falta: "FALTA",
    footer: { ubicacion: "Buenos Aires" },
  },
  en: {
    paradas: {
      inicio: "Home",
      perfil: "Profile",
      enfoque: "Approach",
      trabajo: "Work",
      proyectos: "Projects",
      recorrido: "Journey",
      contacto: "Contact",
    },
    nav: {
      aria: "Sections",
      menu: "Menu",
      cerrar: "Close",
      volver: "Back",
      hablemos: "Let's talk",
      inicio: "Felipe Doval, home",
    },
    sonido: {
      boton: "Sound",
      prender: "Turn the sound on",
      apagar: "Turn the sound off",
      prendido: "Sound on",
      apagado: "Sound off",
    },
    saltar: "Skip to content",
    hero: {
      verTrabajo: "See the work",
      copiarMail: "Copy my email",
    },
    perfil: { stack: "What I build with", asiSoy: "This is me" },
    trabajo: {
      enProgreso: "In progress",
      anterior: "Previous project",
      verCaso: "Read the case",
      repoPrivado: "Private repo",
      rol: "Role",
      stack: "Stack",
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
      noCopiado: "Couldn't copy it",
      enPortapapeles: "On your clipboard",
      copialoAMano: "Copy it by hand",
      temasTitulo: "What shall we talk about?",
      temasAyuda: "Pick one and your email opens with the subject ready.",
      saludo: "Hi Felipe,",
      temas: [
        { etiqueta: "A project", asunto: "Let's talk about a project" },
        { etiqueta: "A job", asunto: "A job opportunity" },
        { etiqueta: "Music", asunto: "Let's talk about music" },
        { etiqueta: "Something new", asunto: "I saw something new and thought of you" },
      ],
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
    perdida: { etiqueta: "Error 404", titulo: ["Page", "not found"], volver: "Back to the start" },
    falta: "MISSING",
    footer: { ubicacion: "Buenos Aires" },
  },
};
