import type { Proyecto } from "./types";

/**
 * Los 7 proyectos, tal como vienen de contenido/proyectos/*.
 * - `capturas` con falta:true → la UI muestra un placeholder punteado honesto.
 * - `incompleto:true` → faltan datos reales que Felipe tiene que completar
 *   (PC Builder, Nindo, LOST). Ver TODO-FELI.md.
 */
export const proyectos: Proyecto[] = [
  // ==========================================================================
  // DESTACADOS
  // ==========================================================================
  {
    slug: "superlum",
    nombre: "Superlum",
    categoria: "destacado",
    unaLinea:
      "Workspace operativo a medida que reemplazó a Notion en la operación diaria de una empresa real.",
    resumen:
      "El case study fuerte: cliente real, producto en uso. Un workspace propio para Taquion, con permisos finos por cliente y flujos hechos a la medida de cómo trabajan de verdad.",
    problema:
      "Taquion manejaba toda su operación en Notion: flexible, pero genérico. Faltaba estructura propia, permisos finos por cliente y flujos pensados para cómo trabaja la empresa de verdad. Después de mi pasantía ahí (automatización con n8n y workflows de Notion), la propuesta fue construirles su propia herramienta.",
    solucion:
      "Centralicé la operación de Taquion en un workspace propio: gestión de clientes y proyectos con un modelo de acceso por cliente y scoping a nivel de fila (default-deny: nadie ve nada que no le corresponda), más un sistema de agentes para validación de features y consistencia de diseño.",
    queHace:
      "Reemplaza a Notion como centro de operaciones: clientes, proyectos y accesos, todo con la estructura y los permisos que la empresa necesitaba.",
    rol: "Diseño y desarrollo full-stack de punta a punta: arquitectura, modelado de datos, UX y marketing del producto.",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Prisma",
      "SQLite (dev)",
      "Supabase / PostgreSQL (prod)",
    ],
    destacados: [
      "Modelo de acceso por cliente con scoping a nivel de fila (default-deny): la seguridad es la arquitectura, no un parche encima.",
      "Sistema de agentes para validar features y mantener la consistencia de diseño.",
      "Cliente referente: Sergio Doval, CEO de Taquion. Producto en uso real.",
      "Presentado en TIC Experience y con entrevista en TN sobre el proyecto.",
    ],
    aprendizajes: [
      "Diseñar la seguridad desde el modelo de datos (default-deny) sale mucho más barato que agregarla después.",
      "Reemplazar una herramienta genérica que la gente ya usa obliga a entender el flujo real, no el ideal.",
    ],
    // La identidad 'aurora' es la marca de Superlum (no la del portfolio):
    // se cita solo acá dentro.
    enlaces: [],
    capturas: [
      {
        src: "/assets/proyectos/superlum/superlum-screenshot.png",
        alt: "Captura de la interfaz de Superlum",
      },
      {
        src: "",
        alt: "Vista de cliente con scoping de permisos (falta captura)",
        falta: true,
      },
      {
        src: "",
        alt: "Sistema de permisos / default-deny (falta captura)",
        falta: true,
      },
    ],
    acento: "#6D5BFF", // violeta aurora — marca de Superlum, citada dentro del caso
    anguloSitio:
      "Cliente real + producto en uso. Problema → decisión de arquitectura (row-level default-deny) → resultado.",
  },
  {
    slug: "futbolvision",
    nombre: "FutbolVision",
    categoria: "destacado",
    unaLinea:
      "Plataforma de analítica de fútbol con predicciones por machine learning — para entender el juego, no para apostar.",
    tagline: "Entendé el fútbol, no apuestes en él.",
    resumen:
      "El cruce de mis dos mundos: fútbol × ML. Un modelo XGBoost baja la capa de datos que suele estar encerrada en clubes y casas de apuestas, y se la da al hincha que quiere entender por qué pasa lo que pasa en la cancha.",
    problema:
      "La analítica de fútbol seria está encerrada en clubes y casas de apuestas. FutbolVision baja esa capa de datos al hincha que quiere entender por qué pasa lo que pasa en la cancha.",
    solucion:
      "Predice y analiza partidos con un modelo XGBoost de ~60 features alimentado por la API de Sportmonks (plan Growth). Targets: goles, precisión de pases, índice de agresividad y duración del partido.",
    queHace:
      "Predice y explica partidos: goles, precisión de pases, índice de agresividad y duración, con un posicionamiento ético explícito anti-apuestas.",
    rol: "IA/ML y arquitectura.",
    equipo: [
      { nombre: "Felipe Doval", rol: "IA/ML + arquitectura" },
      { nombre: "Nicolás Fuksman", rol: "UX/UI" },
      { nombre: "Pedro Henríquez", rol: "Frontend" },
    ],
    stack: ["Next.js", "FastAPI", "XGBoost", "Sportmonks API", "Python"],
    destacados: [
      "Modelo XGBoost con ~60 features sobre datos de Sportmonks.",
      "Cuatro targets: goles, precisión de pases, índice de agresividad y duración del partido.",
      "Posicionamiento ético anti-apuestas como parte de la identidad del proyecto.",
      "Plan de marketing completo: análisis de audiencia, competitivo y Cinco Fuerzas de Porter.",
    ],
    aprendizajes: [
      "Elegir bien los targets importa tanto como el modelo: predecir para entender no es lo mismo que predecir para apostar.",
      "Separar frontend (Next.js) y servicio de ML (FastAPI) mantiene el modelo independiente de la UI.",
    ],
    enlaces: [
      {
        tipo: "repo",
        label: "Repo en GitHub",
        url: "https://github.com/Felgimon/FutbolVision",
      },
    ],
    capturas: [
      {
        src: "",
        alt: "Predicción de un partido (falta captura)",
        falta: true,
      },
      { src: "", alt: "Dashboard de estadísticas (falta captura)", falta: true },
      {
        src: "",
        alt: "Visualización del modelo ML (falta captura)",
        falta: true,
      },
    ],
    acento: "#74acdf",
    anguloSitio:
      "El cruce perfecto de mis dos mundos (fútbol × ML) y el posicionamiento ético como diferencial.",
  },

  // ==========================================================================
  // SECUNDARIOS
  // ==========================================================================
  {
    slug: "courtside",
    nombre: "CourtSide NBA Tracker",
    categoria: "secundario",
    unaLinea: "Tracker de NBA en tiempo real con búsqueda inteligente de jugadores.",
    resumen:
      "La otra mitad deportiva (básquet) y un buen ejemplo de resolver problemas reales de integración de APIs: proxy para esquivar CORS y rate limits, y búsqueda con scoring de relevancia.",
    queHace:
      "Sigue partidos y estadísticas de la NBA consumiendo endpoints de NBA.com a través de un proxy propio (para esquivar CORS y rate limits). Tiene animación temática de básquet, dark/light mode y búsqueda de jugadores con scoring de relevancia: pondera coincidencias para ordenar primero los resultados útiles, no un simple 'contiene el texto'.",
    rol: "Desarrollo completo, en solitario.",
    stack: ["Astro", "JavaScript / TypeScript", "Vercel"],
    destacados: [
      "Proxy propio a endpoints de NBA.com para sortear CORS y rate limits.",
      "Búsqueda de jugadores con scoring de relevancia.",
      "Dark / light mode y animación temática de básquet.",
    ],
    enlaces: [
      {
        tipo: "repo",
        label: "Repo en GitHub",
        url: "https://github.com/Felgimon/TP1_Front",
      },
    ],
    capturas: [
      { src: "", alt: "Home con partidos (falta captura)", falta: true },
      { src: "", alt: "Búsqueda de jugadores (falta captura)", falta: true },
    ],
    acento: "#e08a3c",
    anguloSitio:
      "La otra mitad deportiva (básquet) y resolución de problemas reales de integración de APIs.",
  },
  {
    slug: "buscaminas",
    nombre: "Buscaminas",
    categoria: "secundario",
    unaLinea: "El clásico Buscaminas, hecho desde cero en C++ para jugarse en la terminal.",
    resumen:
      "Las bases sin frameworks en el medio: estructuras de datos, recursión y punteros. Un buen contrapeso 'de fundamentos' frente a los proyectos web.",
    queHace:
      "Tablero renderizado en terminal con colores ANSI y símbolos Unicode, lógica de revelado recursivo (flood fill) para destapar zonas vacías, y cálculo de indicadores de minas adyacentes. Incluyó debuggear a mano bugs de indicadores y de recursión — de los que enseñan de verdad.",
    rol: "Desarrollo completo, en solitario.",
    stack: ["C++ puro (sin librerías externas)"],
    destacados: [
      "Revelado recursivo (flood fill) para destapar zonas vacías.",
      "Render en terminal con colores ANSI y símbolos Unicode.",
      "Cálculo de indicadores de minas adyacentes.",
    ],
    enlaces: [
      {
        tipo: "repo",
        label: "Repo en GitHub",
        url: "https://github.com/Felgimon/Buscaminas",
      },
    ],
    capturas: [
      {
        src: "",
        alt: "Tablero en la terminal con colores ANSI (falta captura)",
        falta: true,
      },
    ],
    acento: "#7fd1a3",
    anguloSitio:
      "Las bases: estructuras de datos, recursión y punteros sin frameworks en el medio.",
  },
  {
    slug: "lost",
    nombre: "LOST",
    categoria: "secundario",
    unaLinea:
      "Plataforma de tracking de objetos, entregada con un equipo chico en menos de 6 meses.",
    resumen:
      "Demuestra que sé entregar en equipo con un deadline real. (Faltan detalles del producto.)",
    rol: "Equipo chico, entrega en menos de 6 meses.",
    stack: [],
    enlaces: [],
    capturas: [{ src: "", alt: "Captura de LOST (falta)", falta: true }],
    acento: "#74acdf",
    incompleto: true,
    anguloSitio: "Entrega en equipo con deadline real.",
  },
  {
    slug: "nindo",
    nombre: "Nindo",
    categoria: "secundario",
    unaLinea: "Videojuego desarrollado con un equipo chico en menos de 6 meses.",
    resumen:
      "El proyecto más lúdico del portfolio; muestra rango más allá de las webs. (Faltan detalles de género, engine y rol.)",
    rol: "Equipo chico, entrega en menos de 6 meses.",
    stack: [],
    enlaces: [
      {
        tipo: "repo",
        label: "Repo en GitHub",
        url: "https://github.com/Mateo-Drault/Nindo-VideoJuego-Mateo-Drault-Felipe-Doval-Teo-Gonzalez-Pedro-Henriquez",
      },
    ],
    capturas: [{ src: "", alt: "Gameplay de Nindo (falta captura)", falta: true }],
    acento: "#c77dff",
    incompleto: true,
    anguloSitio: "El proyecto más lúdico; rango más allá de las webs.",
  },
  {
    slug: "pcbuilder",
    nombre: "PC Builder",
    categoria: "secundario",
    unaLinea: "Armador / configurador de PCs por componentes.",
    resumen:
      "Configurador de PCs por componentes. (Faltan descripción, features y stack — pendiente de completar.)",
    rol: "En solitario.",
    stack: [],
    enlaces: [
      {
        tipo: "repo",
        label: "Repo en GitHub",
        url: "https://github.com/Felgimon/TP2-ivo",
      },
    ],
    capturas: [{ src: "", alt: "Captura de PC Builder (falta)", falta: true }],
    acento: "#74acdf",
    incompleto: true,
    anguloSitio: "Configurador por componentes.",
  },
];

export const proyectosDestacados = proyectos.filter(
  (p) => p.categoria === "destacado",
);
export const proyectosSecundarios = proyectos.filter(
  (p) => p.categoria === "secundario",
);

export function getProyecto(slug: string): Proyecto | undefined {
  return proyectos.find((p) => p.slug === slug);
}
