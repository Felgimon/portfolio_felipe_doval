import type { Perfil } from "./types";
import { perfil as base } from "./perfil";

/**
 * El perfil en INGLÉS. Misma estructura y mismos datos duros que el español
 * (links, stack, orden): solo cambia la prosa. Los campos que no son texto se
 * REUSAN del objeto base para que nunca puedan divergir (si Felipe suma una
 * tecnología al stack, aparece en los dos idiomas sola).
 */
export const perfilEN: Perfil = {
  ...base,
  rol: "Full-stack & data developer",
  ubicacion: "Buenos Aires, Argentina",

  hero: {
    kicker: "Full stack and data developer in Buenos Aires",
    lead: "I build products end to end, from the database to the interface, with machine learning when the problem calls for it.",
  },

  bioCorta:
    "I'm Felipe Doval, a student in the ICT specialization at ORT Belgrano, Buenos Aires. I build products end to end, from the database to the interface, and I dive into data and machine learning when the problem calls for it. What you see here is proof of how I think and how I take an idea from zero to something that works; the projects are the means, not the point.",

  bioLarga: [
    "I started programming in school and never stopped. Today I have work ranging from a C++ terminal game to full web platforms with Next.js, TypeScript and Python, machine learning models included. I don't marry a single layer of the stack: I like the whole cycle (understanding the problem, modeling the data, designing the experience and shipping), and that's the thread that connects everything I do.",
    "I did my internship at Taquion automating with n8n and workflows on their workspace, and out of that came Superlum: the custom workspace I'm building for the company's daily operations. I work well in small teams with real deadlines, and I got tempered taking each project from an idea to something people actually use. Sports (football and basketball) were my excuse to start throwing data at everything, but what obsesses me is the problem, not the pitch. What's next is more of the same, but bigger.",
  ],

  enfoque: {
    resumen:
      "I work the full cycle: understand the problem, model the data, design the experience and ship. That's why projects are a means (proof of how I think), not an end in themselves.",
    principios: [
      {
        titulo: "Understand before touching code",
        texto:
          "The real problem first, not the ideal one on paper. Replacing something people already use (like the workspace in Superlum) forces you to look at how they actually work, not how they should.",
      },
      {
        titulo: "Data as the foundation",
        texto:
          "I model the data before the interface. Structure and security come from the model (in Superlum, row-level permissions with default-deny); bolting them on later is expensive. And when the problem calls for it, machine learning comes in.",
      },
      {
        titulo: "Design and ship",
        texto:
          "I own the experience and getting the thing to production. From zero to something someone uses every day: that's the standard I measure my work against.",
      },
      {
        titulo: "The same logic on any field",
        texto:
          "Sports were my gateway into data, but the method doesn't change with the domain: if something can be measured, it can be understood and improved.",
      },
    ],
  },

  metaDescripcion: base.metaDescripcion,

  timeline: [
    {
      orden: 1,
      titulo: "ICT specialization",
      lugar: "ORT Belgrano",
      periodo: "Ongoing",
      descripcion:
        "Technical training in Information and Communication Technologies. The base I've been building everything else on.",
      tipo: "educacion",
    },
    {
      orden: 2,
      titulo: "Internship",
      lugar: "Taquion",
      descripcion:
        "Automation with n8n and workflows on their workspace. Out of this experience came Superlum, the custom workspace I later started building for the company.",
      tipo: "trabajo",
    },
  ],
};
