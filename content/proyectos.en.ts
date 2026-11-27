import type { Proyecto } from "./types";
import { proyectos as base } from "./proyectos";

/**
 * Los proyectos en INGLÉS. Cada entrada parte del objeto español (spread) y
 * pisa SOLO la prosa: slugs, stack, enlaces, capturas (src), acentos y flags
 * viven una única vez en proyectos.ts. Si allá cambia un dato duro, acá se
 * hereda solo. Los `alt` de capturas sí se traducen (los lee el lector de
 * pantalla del visitante).
 */

const es = Object.fromEntries(base.map((p) => [p.slug, p]));

export const proyectosEN: Proyecto[] = [
  {
    ...es.superlum,
    unaLinea:
      "Custom operations workspace for a real company, built in development with them.",
    problema:
      "Taquion runs its whole operation on a generic workspace: flexible, but nobody's. It lacks its own structure, fine-grained per-client permissions and flows designed around how the company actually works. After my internship there (automation with n8n and workflows on their workspace), the proposal was to build them their own tool.",
    solucion:
      "I'm centralizing Taquion's operation in a workspace of their own: client and project management with a per-client access model and row-level scoping (default-deny: nobody sees anything that isn't theirs), plus an agent system for feature validation and design consistency.",
    queHace:
      "Centralizes the operation: clients, projects and access, with the structure and permissions the company needs. It's a prototype in development, and that's the interesting part: each iteration comes from the concrete problems they bring from their current workspace and from whatever they need next.",
    rol: "End-to-end full-stack design and development: architecture, data modeling, UX and product marketing.",
    destacados: [
      "Per-client access model with row-level scoping (default-deny): security is the architecture, not a patch on top.",
      "Agent system to validate features and keep design consistency.",
      "Reference client: Sergio Doval, CEO of Taquion. A prototype moving forward with them.",
      "Presented at TIC Experience, with a TV interview (TN) about the project.",
    ],
    capturas: [
      { ...es.superlum.capturas[0], alt: "Screenshot of the Superlum interface" },
      {
        ...es.superlum.capturas[1],
        alt: "Taquion's Clients base in gallery view, with its saved views (table, by status, stack) and each client's categories",
      },
      {
        ...es.superlum.capturas[2],
        alt: "Workspace admin panel: the activity log with every change and its author, next to the members and access-profile tabs",
      },
    ],
  },
  {
    ...es.futbolvision,
    unaLinea:
      "Predicts football match results with a machine learning model.",
    problema:
      "Predicting how a match ends with what's known before it starts: head-to-head history, each team's form, injuries and the league context.",
    solucion:
      "An XGBoost Regressor with ~60 features, fed by the Sportmonks API (Growth plan), returning the estimated score and the probability of each result. Every prediction opens up to show the parameters behind it.",
    queHace:
      "Predicts a match's score and the home/draw/away probabilities, and breaks the analysis down by parameter: H2H, team form, injuries, league context and xG.",
    rol: "AI/ML and architecture.",
    equipo: [
      { nombre: "Felipe Doval", rol: "AI/ML + architecture" },
      { nombre: "Nicolás Fuksman", rol: "UX/UI" },
      { nombre: "Pedro Henríquez", rol: "Frontend" },
    ],
    destacados: [
      "XGBoost Regressor with ~60 features over Sportmonks data.",
      "Every prediction opens up and shows why: H2H, form, injuries, context and xG.",
      "Predictions are saved and tracked, live or pre-match.",
      "Full marketing plan: audience analysis, competitive analysis and Porter's Five Forces.",
    ],
    capturas: [
      {
        ...es.futbolvision.capturas[0],
        alt: "Arsenal vs Sporting CP prediction: estimated score, the model's three probabilities and the per-parameter analysis behind them (H2H, form, injuries, context and xG)",
      },
      {
        ...es.futbolvision.capturas[1],
        alt: "Saved predictions, filterable between live and pre-match: each with its estimated score, the three probabilities and the model that generated it",
      },
    ],
  },
  {
    ...es.courtside,
    unaLinea: "Real-time NBA tracker with smart player search.",
    queHace:
      "Tracks NBA games and stats by consuming NBA.com endpoints through its own proxy (to dodge CORS and rate limits). It has a basketball-themed animation, dark/light mode and player search with relevance scoring: it weighs matches to rank useful results first, not a plain 'contains the text'.",
    rol: "Full development, solo.",
    destacados: [
      "Own proxy to NBA.com endpoints to get around CORS and rate limits.",
      "Player search with relevance scoring.",
      "Dark / light mode and a basketball-themed animation.",
    ],
    capturas: [
      {
        ...es.courtside.capturas[0],
        alt: "CourtSide's home: today's games and the featured player with his season averages",
      },
    ],
  },
  {
    ...es.buscaminas,
    nombre: "Minesweeper",
    unaLinea:
      "The classic Minesweeper, built from scratch in C++ to be played in the terminal.",
    queHace:
      "A board rendered in the terminal with ANSI colors and Unicode symbols, recursive reveal logic (flood fill) to open empty areas, and adjacent-mine indicators. It involved hand-debugging indicator and recursion bugs, the kind that actually teach you.",
    rol: "Full development, solo.",
    stack: ["Pure C++ (no external libraries)"],
    destacados: [
      "Recursive reveal (flood fill) to open empty areas.",
      "Terminal rendering with ANSI colors and Unicode symbols.",
      "Adjacent-mine indicator computation.",
    ],
    capturas: [
      {
        ...es.buscaminas.capturas[0],
        alt: "The terminal board at game over: adjacent-mine indicators in their ANSI colors, the placed flags and the mine that ended it",
      },
    ],
  },
  {
    ...es.lost,
    unaLinea:
      "Object-tracking platform, delivered with a small team in under 6 months.",
    rol: "Small team, delivered in under 6 months.",
    capturas: [
      {
        ...es.lost.capturas[0],
        alt: "LOST home screen: the brand in the top bar and the two large actions, 'I lost something' and 'I found something', over a background of object icons.",
      },
    ],
  },
  {
    ...es.nindo,
    unaLinea: "Video game built with a small team in under 6 months.",
    rol: "Small team, delivered in under 6 months.",
    capturas: [
      {
        ...es.nindo.capturas[0],
        alt: "Nindo main menu: the PLAY / QUIT / OPTIONS bar over the ninja mask in black and yellow.",
      },
    ],
  },
  {
    ...es.pcbuilder,
    unaLinea: "Component-by-component PC builder/configurator.",
    rol: "Solo.",
    capturas: [
      {
        ...es.pcbuilder.capturas[0],
        alt: "The builder in use: the component catalog on the left, the PC in 3D in the middle and the build summary with the total on the right",
      },
    ],
  },
];
