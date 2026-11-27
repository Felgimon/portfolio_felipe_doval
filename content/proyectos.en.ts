import type { Proyecto } from "./types";
import { proyectos } from "./proyectos";

/**
 * Los proyectos en inglés: cada uno parte del español y pisa solo el texto.
 * Slugs, stack, enlaces y capturas viven una sola vez en proyectos.ts.
 */
const textos: Record<string, Partial<Proyecto>> = {
  superlum: {
    estado: "In production",
    unaLinea: "Taquion's operations workspace: clients, sales, communities and tasks in one place.",
    rol: "Full-stack design and development: architecture, data model and interface.",
    problema:
      "Taquion ran its whole operation on a generic workspace: flexible, but with no structure of its own, no fine-grained permissions per client and no flows built around how the company works.",
    solucion:
      "A workspace of their own. It brings together clients, sales opportunities, contacts, communities, tasks and documents, with row-level access: nobody sees what isn't theirs.",
    queHace:
      "The Taquion team uses it for daily operations. Each position lands on its own home screen: Management, Sales and the other areas.",
    detalles: ["Row-level permissions, closed by default.", "One home screen per position.", "Over 2,700 automated tests."],
  },
  taquion: {
    estado: "Live",
    unaLinea: "Taquion's website: a single page driven by scroll, on top of a 3D particle system.",
    rol: "Complete design and development.",
    queHace:
      "It presents Comunidades, Taquion's product. A single Three.js particle system runs through the whole journey, and a demo uses AI to build the community of the brand you type in.",
    detalles: ["One particle system for every scene.", "A scroll-driven journey.", "AI demo and contact form."],
  },
  tableros: {
    nombre: "Client dashboards",
    estado: "In production",
    unaLinea: "The platform where each Taquion client sees how their community is doing: goals, metrics and deliverables.",
    rol: "Leading development since November 2026. Started by Nicolás Piantanida.",
    queHace:
      "Each community has its dashboard. Taquion loads the data weekly or monthly, partly automatically, and the client logs in to see progress against what was agreed.",
    detalles: [
      "One dashboard per community, with per-client access.",
      "Each account manager configures their community without going through Technology.",
      "Row-level permissions in the database.",
    ],
  },
  futbolvision: {
    unaLinea: "Predicts football match results with a machine learning model.",
    rol: "Machine learning and architecture, in a team of three.",
    problema:
      "Predicting how a match ends with what is known before kickoff: head-to-head history, each team's form, injuries and league context.",
    solucion:
      "An XGBoost Regressor with about 60 features that returns the estimated score and the probability of each result. Every prediction opens up to show the parameters behind it.",
    queHace:
      "It predicts the score and the home, draw and away probabilities, and breaks down the analysis: head-to-head, form, injuries, league context and expected goals.",
    detalles: [
      "The model runs in a separate service (FastAPI), apart from the interface.",
      "Predictions are saved and tracked, live or pre-match.",
      "Team: Felipe Doval, Nicolás Fuksman (UX/UI) and Pedro Henríquez (frontend).",
    ],
  },
  pcbuilder: {
    unaLinea: "Build a PC part by part, with a live 3D view and a running total.",
    rol: "Development, in a team of two.",
  },
  nindo: {
    unaLinea: "A low-poly ninja action game with an elevated camera.",
    rol: "Development, in a team of four.",
  },
  lost: {
    unaLinea: "A lost and found platform: post what you lost or what you found.",
    rol: "Development, in a team of five. Third-year project at ORT, 2024.",
  },
  courtside: {
    unaLinea: "NBA tracker with the day's games and relevance-ranked player search.",
    rol: "Complete development.",
  },
  buscaminas: {
    nombre: "Minesweeper",
    unaLinea: "Minesweeper, built from scratch in C++ to play in the terminal.",
    rol: "Complete development.",
  },
};

export const proyectosEN: Proyecto[] = proyectos.map((p) => ({ ...p, ...textos[p.slug] }));
