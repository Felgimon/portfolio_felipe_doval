import type { Proyecto } from "./types";

/**
 * Trabajo (lo hecho en Taquion) y proyectos. Solo datos: qué es, rol, stack.
 * Los que tienen `caso` tienen página propia.
 */
export const proyectos: Proyecto[] = [
  // ==========================================================================
  // TRABAJO
  // ==========================================================================
  {
    slug: "superlum",
    nombre: "Superlum",
    grupo: "trabajo",
    caso: true,
    estado: "En producción",
    unaLinea:
      "El workspace operativo de Taquion: clientes, ventas, comunidades y tareas en un solo lugar.",
    rol: "Diseño y desarrollo full-stack: arquitectura, modelo de datos e interfaz.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma", "Supabase", "PostgreSQL"],
    problema:
      "Taquion manejaba toda su operación en un workspace genérico: flexible, pero sin estructura propia, sin permisos finos por cliente y sin flujos pensados para cómo trabaja la empresa.",
    solucion:
      "Un workspace propio. Reúne clientes, oportunidades de venta, contactos, comunidades, tareas y documentos, con un modelo de acceso por fila: nadie ve lo que no le corresponde.",
    queHace:
      "Lo usa el equipo de Taquion en su operación diaria. Cada puesto entra a su propia pantalla de inicio: Dirección, Comercial y las demás áreas.",
    detalles: [
      "Permisos a nivel de fila, cerrados por defecto.",
      "Una pantalla de inicio por puesto.",
      "Más de 2.700 tests automáticos.",
    ],
    capturas: [
      {
        src: "/assets/proyectos/superlum/superlum-screenshot.png",
        alt: "La pantalla de inicio de Superlum con los números del workspace de Taquion",
        w: 1905,
        h: 896,
      },
      {
        src: "/assets/proyectos/superlum/superlum-clientes.png",
        alt: "La base de Clientes en vista galería, con sus vistas guardadas",
        w: 1600,
        h: 1000,
      },
      {
        src: "/assets/proyectos/superlum/superlum-admin-actividad.png",
        alt: "El panel de administración con el registro de actividad",
        w: 1600,
        h: 1000,
      },
    ],
  },
  {
    slug: "taquion",
    nombre: "taquion.com.ar",
    grupo: "trabajo",
    caso: true,
    estado: "En línea",
    unaLinea:
      "El sitio de Taquion: una sola página que se recorre con el scroll, sobre un sistema de partículas en 3D.",
    rol: "Diseño y desarrollo completo.",
    stack: ["Next.js", "React", "Three.js", "GSAP", "Tailwind CSS"],
    queHace:
      "Presenta Comunidades, el producto de Taquion. Un único sistema de partículas en Three.js acompaña todo el recorrido, y una demo arma con IA la comunidad de la marca que escribas.",
    detalles: [
      "Un solo sistema de partículas para todas las escenas.",
      "Recorrido manejado por el scroll.",
      "Demo con IA y formulario de contacto.",
    ],
    sitio: "https://taquion.com.ar",
    capturas: [
      {
        src: "/assets/proyectos/taquion/taquion-comunidades.webp",
        alt: "Una escena de taquion.com.ar: comunidades dibujadas como grupos de partículas de colores sobre negro",
        w: 1512,
        h: 945,
      },
      {
        src: "/assets/proyectos/taquion/taquion-islas.webp",
        alt: "taquion.com.ar: un dato en primer plano y las comunidades alrededor, cada una con su nombre",
        w: 1512,
        h: 945,
      },
      {
        src: "/assets/proyectos/taquion/taquion-inicio.webp",
        alt: "El inicio de taquion.com.ar: «Construimos comunidades» junto a un mapa de comunidades",
        w: 1512,
        h: 945,
      },
    ],
  },
  {
    slug: "tableros",
    nombre: "Tableros de clientes",
    grupo: "trabajo",
    caso: true,
    estado: "En producción",
    unaLinea:
      "La plataforma donde cada cliente de Taquion ve cómo avanza su comunidad: metas, métricas y entregables.",
    rol: "A cargo del desarrollo desde noviembre de 2026. Lo inició Nicolás Piantanida.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "PostgreSQL", "Supabase"],
    queHace:
      "Cada comunidad tiene su tablero. Taquion carga los datos por semana o por mes, una parte en forma automática, y el cliente entra y ve el avance contra lo acordado.",
    detalles: [
      "Un tablero por comunidad, con acceso por cliente.",
      "Cada responsable de cuenta configura su comunidad sin pasar por Tecnología.",
      "Permisos a nivel de fila en la base de datos.",
    ],
    capturas: [
      {
        src: "/assets/proyectos/tableros/tableros-resumen.webp",
        alt: "El resumen ejecutivo de un tablero con datos de demostración: la lectura del período, la meta de miembros y el estado de cada meta",
        w: 1440,
        h: 900,
      },
      {
        src: "/assets/proyectos/tableros/tableros-resumen-completo.webp",
        alt: "El tablero completo con datos de demostración: cronograma de la temporada y gráficos de crecimiento",
        w: 1440,
        h: 1578,
      },
    ],
  },

  // ==========================================================================
  // PROYECTOS
  // ==========================================================================
  {
    slug: "futbolvision",
    nombre: "FutbolVision",
    grupo: "proyecto",
    caso: true,
    unaLinea: "Predice el resultado de partidos de fútbol con un modelo de machine learning.",
    rol: "Machine learning y arquitectura, en equipo de tres.",
    stack: ["Next.js", "FastAPI", "XGBoost", "Python"],
    problema:
      "Predecir cómo termina un partido con lo que se sabe antes de que empiece: los antecedentes entre los dos equipos, la forma de cada uno, las lesiones y el contexto de la liga.",
    solucion:
      "Un XGBoost Regressor de unas 60 variables que devuelve el marcador estimado y la probabilidad de cada resultado. Cada predicción se abre y muestra los parámetros que la sostienen.",
    queHace:
      "Predice el marcador y la probabilidad de local, empate y visitante, y desglosa el análisis: historial entre equipos, forma, lesiones, contexto de liga y goles esperados.",
    detalles: [
      "El modelo corre en un servicio aparte (FastAPI), separado de la interfaz.",
      "Las predicciones se guardan y se siguen, en vivo o antes del partido.",
      "Equipo: Felipe Doval, Nicolás Fuksman (UX/UI) y Pedro Henríquez (frontend).",
    ],
    repo: "https://github.com/Felgimon/FutbolVision",
    capturas: [
      {
        src: "/assets/proyectos/futbolvision/futbolvision-prediccion.png",
        alt: "Una predicción de FutbolVision: marcador estimado, las tres probabilidades y el análisis por parámetro",
        w: 1401,
        h: 876,
      },
      {
        src: "/assets/proyectos/futbolvision/futbolvision-predicciones.png",
        alt: "Las predicciones guardadas, filtrables entre en vivo y antes del partido",
        w: 1600,
        h: 1000,
      },
    ],
  },
  {
    slug: "pcbuilder",
    nombre: "PC Builder",
    grupo: "proyecto",
    unaLinea: "Armador de PC pieza por pieza, con vista 3D en vivo y el total al momento.",
    rol: "Desarrollo, en equipo de dos.",
    stack: ["Next.js", "React", "Three.js", "Zustand", "Supabase"],
    repo: "https://github.com/Felgimon/TP2-ivo",
    capturas: [
      {
        src: "/assets/proyectos/pcbuilder/pcbuilder-armado.png",
        alt: "El armador en uso: el catálogo de componentes, la PC en 3D y el resumen con el total",
        w: 1600,
        h: 1000,
      },
    ],
  },
  {
    slug: "nindo",
    nombre: "Nindo",
    grupo: "proyecto",
    unaLinea: "Juego de acción de ninjas en low-poly, con cámara elevada.",
    rol: "Desarrollo, en equipo de cuatro.",
    stack: ["Unity", "C#", "Blender"],
    repo: "https://github.com/Mateo-Drault/Nindo-VideoJuego-Mateo-Drault-Felipe-Doval-Teo-Gonzalez-Pedro-Henriquez",
    capturas: [
      {
        src: "/assets/proyectos/nindo/nindo-dojo.webp",
        alt: "Nindo: la entrada del dojo, con su portal rojo al final de una escalera",
        w: 960,
        h: 540,
      },
    ],
  },
  {
    slug: "lost",
    nombre: "LOST",
    grupo: "proyecto",
    unaLinea: "Plataforma de objetos perdidos: publicás lo que perdiste o lo que encontraste.",
    rol: "Desarrollo, en equipo de cinco. Proyecto de tercer año en ORT, 2024.",
    stack: ["Node.js", "JavaScript", "HTML", "CSS"],
    // El repo se llama con el punto final (proyecto-3-L.O.S.T.); sin él da 404.
    repo: "https://github.com/3-TIC-ORT/proyecto-3-L.O.S.T.",
    capturas: [
      {
        src: "/assets/proyectos/lost/lost-home.png",
        alt: "El inicio de LOST con sus dos acciones: «Perdí algo» y «Encontré algo»",
        w: 1918,
        h: 1199,
      },
    ],
  },
  {
    slug: "courtside",
    nombre: "CourtSide",
    grupo: "proyecto",
    unaLinea: "Tracker de NBA con los partidos del día y búsqueda de jugadores por relevancia.",
    rol: "Desarrollo completo.",
    stack: ["Astro", "TypeScript", "Vercel"],
    repo: "https://github.com/Felgimon/TP1_Front",
    capturas: [
      {
        src: "/assets/proyectos/courtside/courtside-home.png",
        alt: "El inicio de CourtSide: los partidos del día y el jugador destacado con sus promedios",
        w: 1600,
        h: 1000,
      },
    ],
  },
  {
    slug: "buscaminas",
    nombre: "Buscaminas",
    grupo: "proyecto",
    unaLinea: "El Buscaminas, hecho desde cero en C++ para jugar en la terminal.",
    rol: "Desarrollo completo.",
    stack: ["C++"],
    repo: "https://github.com/Felgimon/Buscaminas",
    capturas: [
      {
        src: "/assets/proyectos/buscaminas/buscaminas-perdida.png",
        alt: "El tablero en la terminal al terminar una partida, con los números en color",
        w: 1083,
        h: 677,
      },
    ],
  },
];

export const casos = proyectos.filter((p) => p.caso);

export function getProyecto(slug: string): Proyecto | undefined {
  return proyectos.find((p) => p.slug === slug);
}
