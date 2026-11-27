import type { Perfil } from "./types";
import { perfil } from "./perfil";

/** El perfil en inglés: parte del español y pisa solo el texto. */
export const perfilEN: Perfil = {
  ...perfil,
  rol: "Full-stack and data developer",
  bio: "I study IT at ORT Belgrano, Buenos Aires. I build web products end to end: data, backend and interface. I use machine learning when the problem calls for it.",
  recorrido: [
    { lugar: "ORT Belgrano", titulo: "IT specialization", detalle: "In progress" },
    { lugar: "Taquion", titulo: "Internship", detalle: "Automation with n8n" },
  ],
};
