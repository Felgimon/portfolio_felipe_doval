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
      "Workspace operativo a medida para una empresa real, en desarrollo con ella.",
    resumen:
      "El case study fuerte: cliente real y trabajo en curso. Un workspace propio para Taquion, con permisos finos por cliente y flujos hechos a la medida de cómo trabajan de verdad. Hoy es un prototipo que avanza con ellos.",
    problema:
      "Taquion maneja toda su operación en un workspace genérico: flexible, pero de nadie. Falta estructura propia, permisos finos por cliente y flujos pensados para cómo trabaja la empresa de verdad. Después de mi pasantía ahí (automatización con n8n y workflows sobre su workspace), la propuesta fue construirles su propia herramienta.",
    solucion:
      "Estoy centralizando la operación de Taquion en un workspace propio: gestión de clientes y proyectos con un modelo de acceso por cliente y scoping a nivel de fila (default-deny: nadie ve nada que no le corresponda), más un sistema de agentes para validación de features y consistencia de diseño.",
    queHace:
      "Centraliza la operación: clientes, proyectos y accesos, con la estructura y los permisos que la empresa necesita. Es un prototipo en desarrollo, y esa es la parte interesante: cada iteración sale de los problemas concretos que traen del workspace que usan hoy y de lo que van necesitando.",
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
      "Cliente referente: Sergio Doval, CEO de Taquion. Prototipo que avanza con ellos.",
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
        src: "/assets/proyectos/superlum/superlum-clientes.png",
        alt: "La base de Clientes de Taquion en vista galería, con sus vistas guardadas (tabla, por estado, stack) y las categorías de cada cliente",
      },
      {
        src: "/assets/proyectos/superlum/superlum-admin-actividad.png",
        alt: "Panel de administración del workspace: el registro de actividad con cada cambio y su autor, junto a las pestañas de miembros y perfiles de acceso",
      },
    ],
    acento: "#6D5BFF", // violeta aurora — marca de Superlum, citada dentro del caso
    anguloSitio:
      "Cliente real + desarrollo en curso. Problema → decisión de arquitectura (row-level default-deny) → un prototipo que itera con el cliente.",
  },
  {
    slug: "futbolvision",
    nombre: "FutbolVision",
    categoria: "destacado",
    unaLinea:
      "Predice el resultado de partidos de fútbol con un modelo de machine learning.",
    resumen:
      "Un proyecto anterior donde me tocó el lado de machine learning: un XGBoost Regressor que predice el marcador y las probabilidades de un partido. Ya no lo sigo, pero muestra bien cómo encaro un problema de datos de punta a punta.",
    problema:
      "Predecir cómo termina un partido con lo que se sabe antes de que empiece: los antecedentes entre los dos equipos, la forma de cada uno, las lesiones y el contexto de la liga.",
    solucion:
      "Un XGBoost Regressor de ~60 features, alimentado por la API de Sportmonks (plan Growth), que devuelve el marcador estimado y la probabilidad de cada resultado. Cada predicción se abre y muestra los parámetros que la sostienen.",
    queHace:
      "Predice el marcador de un partido y la probabilidad de local, empate y visitante, y desglosa el análisis por parámetro: H2H, forma de cada equipo, lesiones, contexto de liga y xG.",
    rol: "IA/ML y arquitectura.",
    equipo: [
      { nombre: "Felipe Doval", rol: "IA/ML + arquitectura" },
      { nombre: "Nicolás Fuksman", rol: "UX/UI" },
      { nombre: "Pedro Henríquez", rol: "Frontend" },
    ],
    stack: ["Next.js", "FastAPI", "XGBoost", "Sportmonks API", "Python"],
    destacados: [
      "XGBoost Regressor con ~60 features sobre datos de Sportmonks.",
      "Cada predicción se abre y muestra por qué: H2H, forma, lesiones, contexto y xG.",
      "Las predicciones se guardan y se siguen, en vivo o pre-match.",
      "Plan de marketing completo: análisis de audiencia, competitivo y Cinco Fuerzas de Porter.",
    ],
    aprendizajes: [
      "Elegir bien las features importa tanto como el modelo: un XGBoost solo es tan bueno como lo que se le da de comer.",
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
        src: "/assets/proyectos/futbolvision/futbolvision-prediccion.png",
        alt: "Predicción de Arsenal vs Sporting CP: marcador estimado, las tres probabilidades del modelo y el análisis por parámetro que las respalda (H2H, forma, lesiones, contexto y xG)",
      },
      {
        src: "/assets/proyectos/futbolvision/futbolvision-predicciones.png",
        alt: "Las predicciones guardadas, filtrables entre en vivo y pre-match: cada una con su marcador estimado, las tres probabilidades y el modelo que la generó",
      },
    ],
    acento: "#47a88c",
    anguloSitio:
      "Evidencia del lado ML: feature engineering y un servicio de modelo separado de la UI. Proyecto anterior.",
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
    // Los secundarios no tienen página de detalle: su card muestra la primera.
    capturas: [
      {
        src: "/assets/proyectos/courtside/courtside-home.png",
        alt: "La home de CourtSide: los partidos del día y el jugador destacado, con sus promedios de la temporada",
      },
    ],
    acento: "#e7a06a",
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
      "Tablero renderizado en terminal con colores ANSI y símbolos Unicode, lógica de revelado recursivo (flood fill) para destapar zonas vacías, y cálculo de indicadores de minas adyacentes. Incluyó debuggear a mano bugs de indicadores y de recursión, de los que enseñan de verdad.",
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
    // Los proyectos secundarios no tienen página de detalle (solo los
    // destacados): su card muestra la PRIMERA captura y nada más. Por eso acá va
    // una sola, y es la del tablero entero destapado: es la que muestra de un
    // vistazo lo que dice el texto (los colores ANSI, los indicadores y la mina).
    capturas: [
      {
        src: "/assets/proyectos/buscaminas/buscaminas-perdida.png",
        alt: "El tablero en la terminal al terminar la partida: los indicadores de minas adyacentes con su color ANSI, las banderas puestas y la mina que la terminó",
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
    acento: "#8fe3c6",
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
      "Configurador de PCs por componentes. (Faltan descripción, features y stack; pendiente de completar.)",
    rol: "En solitario.",
    stack: [],
    enlaces: [
      {
        tipo: "repo",
        label: "Repo en GitHub",
        url: "https://github.com/Felgimon/TP2-ivo",
      },
    ],
    // Los secundarios no tienen página de detalle: su card muestra la primera.
    capturas: [
      {
        src: "/assets/proyectos/pcbuilder/pcbuilder-armado.png",
        alt: "El armador en uso: el catálogo de componentes a la izquierda, la PC en 3D en el medio y el resumen del build con el total a la derecha",
      },
    ],
    acento: "#8fe3c6",
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
