import type { Perfil } from "./types";

/**
 * Perfil de Felipe. Texto directo (pedido de Felipe): qué hace, dónde y con
 * qué. Sin frases de opinión, sin rayas, sin viñetas.
 */
export const perfil: Perfil = {
  nombre: "Felipe Doval",
  rol: "Desarrollador full-stack y datos",
  ubicacion: "Buenos Aires",

  bio: "Estudio TIC en ORT Belgrano, Buenos Aires. Hago productos web de punta a punta: datos, backend e interfaz. Uso machine learning cuando el problema lo pide.",

  metaDescripcion:
    "Felipe Doval, desarrollador full-stack y datos de Buenos Aires. Proyectos: Superlum, FutbolVision, CourtSide y más.",

  links: {
    github: "https://github.com/Felgimon",
    linkedin:
      "https://www.linkedin.com/in/felipe-daniel-doval-ferrari-68977b3a5/",
    // El mail no va acá: se arma en el cliente al copiarlo (lib/mail.ts).
  },

  stack: [
    "Next.js",
    "React",
    "TypeScript",
    "Astro",
    "Three.js",
    "FastAPI",
    "Prisma",
    "Python",
    "C / C++",
    "XGBoost",
    "scikit-learn",
    "NumPy",
    "n8n",
  ],

  // TODO(FELI): faltan las fechas (año de egreso de ORT, período en Taquion).
  recorrido: [
    {
      lugar: "ORT Belgrano",
      titulo: "Especialización TIC",
      detalle: "En curso",
    },
    {
      lugar: "Taquion",
      titulo: "Pasantía",
      detalle: "Automatización con n8n",
    },
  ],
};
