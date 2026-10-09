import medidas from "./poses.generado.json";
import type { Idioma } from "@/lib/idioma";

/**
 * EL GUÍA: qué pose usa Feli en cada parada y qué dice.
 *
 * Regla de la visita: una parada, una frase. Corta, en voseo, apuntando a la
 * cosa concreta de esa sección. Nada de "¡Hola, soy Feli 👋!".
 *
 * POSES: cada pose de la sesión de fotos tiene un id. Mientras la sesión no
 * esté hecha, cada id apunta a la foto interina más parecida (los 4 recortes
 * viejos). Cuando lleguen las fotos nuevas: recorte con fondo transparente en
 * contenido/guia/<id>.png → `node scripts/gen-guia.mjs` → acá, cambiar el
 * archivo de esa pose por su propio id. Ver TODO-FELI.md (sesión de fotos).
 */

type Archivo = keyof typeof medidas;

export const POSES = {
  saludo: "apoyado", // FALTA foto: saludando, apoyado de frente
  apoyado: "apoyado",
  sentado: "piensa", // FALTA foto: sentado de costado, señalando el texto
  sostiene: "cruzado", // FALTA foto: sosteniendo una burbuja con las dos manos
  senala: "parado", // FALTA foto: de perfil, señalando con el brazo extendido
  camina: "cruzado", // FALTA foto: caminando de perfil
  celular: "apoyado", // FALTA foto: celular en la mano, señalando a cámara
  pulgar: "apoyado", // FALTA foto: pulgar arriba
  mira: "piensa", // FALTA foto: apoyado de costado, mano en el mentón
  encoge: "parado", // FALTA foto: encogido de hombros, palmas arriba
} as const satisfies Record<string, Archivo>;

export type PoseId = keyof typeof POSES;

export function pose(id: PoseId) {
  const archivo = POSES[id];
  const { w, h } = medidas[archivo];
  return { src: `/assets/guia/${archivo}.webp`, w, h };
}

export type ParadaGuia = { pose: PoseId; frase: string };

type Guion = {
  etiqueta: string;
  paradas: Record<
    "inicio" | "perfil" | "enfoque" | "trabajo" | "recorrido" | "contacto",
    ParadaGuia
  >;
  detalle: Record<string, string>;
  perdida: string;
  copiado: string;
  noCopiado: string;
  toques: string[];
  ahoraVuelvo: string;
  volvi: string;
  ariaTocar: string;
};

export const guion: Record<Idioma, Guion> = {
  es: {
    etiqueta: "Feli, tu guía",
    paradas: {
      inicio: {
        pose: "saludo",
        frase: "Hola. Te hago la visita, son dos minutos. Ahora estoy armando Superlum.",
      },
      perfil: {
        pose: "sentado",
        frase: "La versión corta: estudio en ORT y construyo de la base de datos a la interfaz.",
      },
      enfoque: {
        pose: "sostiene",
        frase: "Así laburo. Si estás apurado, leé sólo los títulos.",
      },
      trabajo: {
        pose: "senala",
        frase: "Esto es lo que estoy construyendo ahora. Lo demás, más abajo.",
      },
      recorrido: {
        pose: "camina",
        frase: "Por acá pasé. Es corto, pero cada parada es real.",
      },
      contacto: {
        pose: "celular",
        frase: "Fin de la visita. Si te quedó algo, escribime.",
      },
    },
    detalle: {
      superlum: "Este lo estoy haciendo ahora. Te cuento cómo está hecho por dentro.",
      futbolvision: "Este ya no lo sigo, pero te cuento qué aprendí.",
    },
    perdida: "Uy, esta parada no existe. Volvamos al recorrido.",
    copiado: "Copiado. Te leo cuando me escribas.",
    noCopiado: "No pude copiarlo. Probá de nuevo o escribime por LinkedIn.",
    toques: [
      "¡Ey! Eso hace cosquillas.",
      "Dale, bajá que se pone bueno.",
      "Te juro que hay proyectos más abajo.",
      "Bueno, me tomo un recreo.",
    ],
    ahoraVuelvo: "Ahora vuelvo",
    volvi: "Listo, ya volví. ¿Seguimos?",
    ariaTocar: "Tocar a Feli",
  },
  en: {
    etiqueta: "Feli, your guide",
    paradas: {
      inicio: {
        pose: "saludo",
        frase: "Hi. I'll show you around, it takes two minutes. Right now I'm building Superlum.",
      },
      perfil: {
        pose: "sentado",
        frase: "The short version: I study at ORT and build from the database to the interface.",
      },
      enfoque: {
        pose: "sostiene",
        frase: "This is how I work. In a hurry? Just read the titles.",
      },
      trabajo: {
        pose: "senala",
        frase: "This is what I'm building right now. The rest is further down.",
      },
      recorrido: {
        pose: "camina",
        frase: "Where I've been. It's short, but every stop is real.",
      },
      contacto: {
        pose: "celular",
        frase: "End of the tour. If anything stuck, write to me.",
      },
    },
    detalle: {
      superlum: "I'm building this one right now. Let me show you how it works inside.",
      futbolvision: "I'm not maintaining this one anymore, but here's what I learned.",
    },
    perdida: "Oops, this stop doesn't exist. Let's get back on the route.",
    copiado: "Copied. I read everything you send.",
    noCopiado: "I couldn't copy it. Try again or reach me on LinkedIn.",
    toques: [
      "Hey! That tickles.",
      "Come on, scroll down, it gets good.",
      "I swear there are projects below.",
      "Okay, I'm taking a break.",
    ],
    ahoraVuelvo: "Back soon",
    volvi: "Okay, I'm back. Shall we?",
    ariaTocar: "Poke Feli",
  },
};
