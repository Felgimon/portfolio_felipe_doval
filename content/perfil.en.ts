import type { Perfil } from "./types";
import { perfil } from "./perfil";

/** El perfil en inglés: parte del español y pisa solo el texto. */
export const perfilEN: Perfil = {
  ...perfil,
  rol: "Full-stack and data developer",
  presentacion: "I study at ORT Belgrano and work in Technology at Taquion.",
  bio: "I build web products end to end: data, backend and interface. I use machine learning when the problem calls for it.",
  datos: [
    ["School", "IT specialization at ORT Belgrano. Fifth and final year."],
    ["Work", "Technology at Taquion, a Buenos Aires consultancy."],
    ["I build", "Full-stack web, data and video games."],
    ["Also", "Football and basketball."],
  ],
  enfoque: [
    { palabra: "Understand", linea: "The real problem first, and who has it." },
    { palabra: "Model", linea: "Data and permissions before the interface." },
    { palabra: "Design", linea: "The whole experience, not loose screens." },
    { palabra: "Ship", linea: "All the way to production, then adjust with use." },
  ],
  recorrido: [
    {
      ...perfil.recorrido[0],
      titulo: "IT specialization",
      estado: "Fifth year",
      detalle:
        "Technical high school focused on Information and Communication Technologies: programming, databases, web development and video games. I'm in fifth year, the last one.",
      hecho: [
        { texto: "LOST", nota: "Lost and found platform, 2024", ancla: "proyectos" },
        { texto: "CourtSide", nota: "NBA tracker", ancla: "proyectos" },
        { texto: "PC Builder", nota: "3D PC builder", ancla: "proyectos" },
      ],
    },
    {
      ...perfil.recorrido[1],
      titulo: "Technology",
      estado: "Current",
      detalle:
        "A Buenos Aires consultancy that builds communities for brands. I joined as an intern and stayed on the Technology team.",
      hecho: [
        { texto: "n8n automations", nota: "Workflows on the company workspace" },
        { texto: "Superlum", nota: "Taquion's operations workspace", caso: "superlum" },
        { texto: "taquion.com.ar", nota: "The company website", caso: "taquion" },
        { texto: "Client dashboards", nota: "The internal dashboard system I work on today", caso: "tableros" },
      ],
    },
  ],
};
