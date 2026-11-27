import type { Perfil } from "./types";

/**
 * Perfil de Felipe. Texto directo (pedido de Felipe): qué hace, dónde y con
 * qué. Sin frases de opinión, sin rayas, sin viñetas.
 */
export const perfil: Perfil = {
  nombre: "Felipe Doval",
  rol: "Desarrollador full-stack y datos",
  ubicacion: "Buenos Aires, Argentina",

  presentacion: "Estudio en ORT Belgrano y trabajo en Tecnología en Taquion.",

  bio: "Hago productos web de punta a punta: datos, backend e interfaz. Uso machine learning cuando el problema lo pide.",

  datos: [
    ["Estudio", "Especialización TIC en ORT Belgrano. Quinto año, el último."],
    ["Trabajo", "Tecnología en Taquion, consultora de Buenos Aires."],
    ["Hago", "Web full-stack, datos y videojuegos."],
    ["Además", "Fútbol y básquet."],
  ],

  enfoque: [
    { palabra: "Entender", linea: "Primero el problema real y quién lo tiene." },
    { palabra: "Modelar", linea: "Los datos y los permisos, antes que la interfaz." },
    { palabra: "Diseñar", linea: "La experiencia completa, no pantallas sueltas." },
    { palabra: "Publicar", linea: "Hasta producción, y se ajusta con el uso." },
  ],

  // TODO(FELI): faltan las fechas (año de ingreso a ORT, desde cuándo en Taquion).
  recorrido: [
    {
      lugar: "ORT Belgrano",
      titulo: "Especialización TIC",
      estado: "Quinto año",
      detalle:
        "Secundario técnico con orientación en Tecnologías de la Información y la Comunicación: programación, bases de datos, desarrollo web y videojuegos. Estoy en quinto año, el último.",
      hecho: [
        { texto: "LOST", nota: "Plataforma de objetos perdidos, 2024", ancla: "proyectos" },
        { texto: "CourtSide", nota: "Tracker de NBA", ancla: "proyectos" },
        { texto: "PC Builder", nota: "Armador de PC en 3D", ancla: "proyectos" },
      ],
    },
    {
      lugar: "Taquion",
      titulo: "Tecnología",
      estado: "Actual",
      detalle:
        "Consultora de Buenos Aires que construye comunidades para marcas. Entré con una pasantía y sigo en el área de Tecnología.",
      hecho: [
        { texto: "Automatizaciones con n8n", nota: "Flujos sobre el workspace de la empresa" },
        { texto: "Superlum", nota: "El workspace operativo de Taquion", caso: "superlum" },
        { texto: "taquion.com.ar", nota: "El sitio de la empresa", caso: "taquion" },
        { texto: "Tableros de clientes", nota: "El sistema interno de tableros, en el que trabajo hoy", caso: "tableros" },
      ],
    },
  ],

  metaDescripcion:
    "Felipe Doval, desarrollador full-stack y datos de Buenos Aires. Trabajo en Taquion: Superlum, taquion.com.ar y Tableros de clientes.",

  links: {
    github: "https://github.com/Felgimon",
    linkedin:
      "https://www.linkedin.com/in/felipe-daniel-doval-ferrari-68977b3a5/",
    // El mail no va acá: se arma en el cliente (lib/mail.ts).
  },
};
