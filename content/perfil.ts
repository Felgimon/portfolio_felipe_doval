import type { Perfil } from "./types";

/**
 * Perfil de Felipe. Textos tomados de contenido/bio.md y contenido/links.md
 * (la voz es de Felipe). Los links ya vienen cargados en el contenido.
 */
export const perfil: Perfil = {
  nombre: "Felipe Doval",
  apodo: "Feli",
  rol: "Estudiante · builder · fútbol × ML",
  ubicacion: "Buenos Aires, Argentina",

  bioCorta:
    "Soy Felipe Doval, estudiante de la especialización TIC en ORT Belgrano, Buenos Aires. Construyo productos reales: un workspace operativo que una empresa usa todos los días, y una plataforma de analítica de fútbol con machine learning. Me muevo entre el full-stack y los modelos de ML, con el deporte como mi excusa favorita para meterle datos a todo.",

  bioLarga: [
    "Arranqué a programar en la escuela y no paré: hoy tengo proyectos que van desde un juego de terminal en C++ hasta plataformas web completas con Next.js, TypeScript y Python. Hice mi pasantía en Taquion trabajando con automatización (n8n) y workflows de Notion — y de esa experiencia salió Superlum, el workspace a medida que construí para reemplazar justamente a Notion en la operación diaria de la empresa. Me gusta el ciclo completo: entender el problema, modelar los datos, diseñar la experiencia y shippear.",
    "La otra mitad de mi cabeza está en el deporte. Soy fanático del fútbol y del básquet, y esa obsesión terminó en código: FutbolVision, una plataforma de predicciones con XGBoost que apuesta por entender el juego (y explícitamente NO por apostar), y CourtSide, un tracker de NBA. Participé en competencias como NASA Space Apps y Premios Sadosky, trabajo bien en equipos chicos con deadlines reales, y lo que viene es más de lo mismo pero más grande: seguir construyendo.",
  ],

  metaDescripcion:
    "Felipe Doval — estudiante y builder de Buenos Aires. Construyo productos reales entre el full-stack y el machine learning, con el fútbol como excusa para meterle datos a todo. Superlum, FutbolVision y más.",

  links: {
    github: "https://github.com/Felgimon",
    linkedin:
      "https://www.linkedin.com/in/felipe-daniel-doval-ferrari-68977b3a5/",
    email: "felipeferraridoval@gmail.com",
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
  // exacto y fechas (ver TODO-FELI.md).
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
      titulo: "NASA Space Apps Challenge",
      lugar: "Competencia",
      descripcion:
        "Participación en el hackathon global de la NASA: resolver un desafío con datos, en equipo y contra reloj.",
      tipo: "competencia",
    },
    {
      orden: 3,
      titulo: "Premios Sadosky",
      lugar: "Competencia",
      descripcion:
        "Participación en los premios a la innovación y el talento en tecnología de Argentina.",
      tipo: "competencia",
    },
    {
      orden: 4,
      titulo: "Pasantía",
      lugar: "Taquion",
      descripcion:
        "Automatización con n8n y workflows de Notion. De esta experiencia salió Superlum, el workspace a medida que después construí para la empresa.",
      tipo: "trabajo",
    },
  ],
};
