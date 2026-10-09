import type { Perfil } from "./types";

/**
 * Perfil de Felipe. La voz es de Felipe (voseo rioplatense). El encuadre v2:
 * los proyectos son un MEDIO para mostrar cómo piensa y construye, no el fin —
 * por eso nada de "fútbol × ML" como bandera; el deporte es color personal.
 */
export const perfil: Perfil = {
  nombre: "Felipe Doval",
  apodo: "Feli",
  rol: "Desarrollador full-stack & datos",
  ubicacion: "Buenos Aires, Argentina",

  // Portada. Sin guiones ni viñetas (pedido de Felipe): al lado del nombre van
  // el oficio y una frase, nada de separadores decorativos.
  hero: {
    kicker: "Desarrollador full stack y datos en Buenos Aires",
    lead: "Construyo productos de punta a punta, de la base de datos a la interfaz, con machine learning cuando el problema lo pide.",
  },

  bioCorta:
    "Soy Felipe Doval, estudiante de la especialización TIC en ORT Belgrano, Buenos Aires. Construyo productos de punta a punta, de la base de datos a la interfaz, y me meto con datos y machine learning cuando el problema lo pide. Lo que ves acá es la prueba de cómo pienso y de cómo llevo una idea de cero a algo que funciona; los proyectos son el medio, no el punto.",

  bioLarga: [
    "Arranqué a programar en la escuela y no paré. Hoy tengo cosas que van desde un juego de terminal en C++ hasta plataformas web completas con Next.js, TypeScript y Python, pasando por modelos de machine learning. No me caso con una sola capa del stack: me gusta el ciclo entero (entender el problema, modelar los datos, diseñar la experiencia y shippear), y ese es el hilo que conecta todo lo que hago.",
    "Hice mi pasantía en Taquion automatizando con n8n y workflows sobre su workspace, y de ahí salió Superlum: el workspace a medida que estoy construyendo para la operación diaria de la empresa. Trabajo bien en equipos chicos con deadlines de verdad, y me foguié llevando cada proyecto de la idea hasta algo que alguien usa. El deporte (fútbol y básquet) fue la excusa para empezar a meterle datos a todo, pero lo que me obsesiona es el problema, no la cancha. Lo que viene es más de lo mismo, pero más grande.",
  ],

  enfoque: {
    resumen:
      "Trabajo el ciclo completo: entender el problema, modelar los datos, diseñar la experiencia y shippear. Por eso los proyectos son un medio (una prueba de cómo pienso), no un fin en sí mismos.",
    principios: [
      {
        titulo: "Entender antes de tocar código",
        texto:
          "Primero el problema real, no el ideal del papel. Reemplazar el workspace que una empresa ya usa (como en Superlum) te obliga a mirar cómo trabaja de verdad, no cómo debería.",
      },
      {
        titulo: "Los datos como cimiento",
        texto:
          "Modelo los datos antes que la interfaz. La estructura y la seguridad salen del modelo (en Superlum, permisos por fila con default-deny); agregarlas después sale caro. Y cuando el problema lo pide, entra el machine learning.",
      },
      {
        titulo: "Diseñar y shippear",
        texto:
          "Me hago cargo de la experiencia y de que la cosa llegue a producción. De cero a algo que alguien usa todos los días: ese es el estándar con el que mido lo que hago.",
      },
      {
        titulo: "La misma lógica en cualquier cancha",
        texto:
          "El deporte fue mi puerta de entrada a los datos, pero el método no cambia de dominio: si algo se puede medir, se puede entender y mejorar.",
      },
    ],
  },

  metaDescripcion:
    "Felipe Doval: desarrollador y builder de Buenos Aires. Construyo productos reales de punta a punta, del full-stack a los datos y el machine learning. Portfolio: Superlum y más.",

  links: {
    github: "https://github.com/Felgimon",
    linkedin:
      "https://www.linkedin.com/in/felipe-daniel-doval-ferrari-68977b3a5/",
    // El mail NO va acá: se arma en el cliente recién al copiarlo
    // (components/ui/EmailLink.tsx), así no viaja en el HTML ni en el bundle
    // como texto plano.
    // cv: sin CV por ahora (TODO-FELI)
  },

  stack: [
    { nombre: "Next.js", categoria: "Frontend" },
    { nombre: "React", categoria: "Frontend" },
    { nombre: "TypeScript", categoria: "Frontend" },
    { nombre: "Astro", categoria: "Frontend" },
    { nombre: "Three.js", categoria: "3D / Motion" },
    { nombre: "FastAPI", categoria: "Backend" },
    { nombre: "Prisma", categoria: "Backend" },
    { nombre: "Python", categoria: "Lenguajes" },
    { nombre: "C / C++", categoria: "Lenguajes" },
    { nombre: "XGBoost", categoria: "ML / Datos" },
    { nombre: "scikit-learn", categoria: "ML / Datos" },
    { nombre: "NumPy", categoria: "ML / Datos" },
    { nombre: "n8n", categoria: "Automatización" },
  ],

  // El orden codifica la secuencia del recorrido. TODO(FELI): confirmá orden
  // exacto y fechas (ver TODO-FELI.md). NASA Space Apps y Premios Sadosky se
  // sacaron por completo (cards en v4.3, bio larga en v5.17.5): Felipe nunca
  // participó de esas competencias.
  timeline: [
    {
      orden: 1,
      titulo: "Especialización TIC",
      lugar: "ORT Belgrano",
      periodo: "En curso",
      descripcion:
        "Formación técnica en Tecnología de la Información y Comunicaciones. La base sobre la que fui construyendo todo lo demás.",
      tipo: "educacion",
    },
    {
      orden: 2,
      titulo: "Pasantía",
      lugar: "Taquion",
      descripcion:
        "Automatización con n8n y workflows sobre su workspace. De esta experiencia salió Superlum, el workspace a medida que estoy construyendo para la empresa.",
      tipo: "trabajo",
    },
  ],
};
