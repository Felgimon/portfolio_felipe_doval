import type { Foto } from "./types";
import type { Idioma } from "@/lib/idioma";

/**
 * Las fotos de la sección Fotos, en el orden en que pasan. Para sumar una:
 * el archivo en public/assets/fotos/ y una entrada acá con su tamaño real.
 * `x`, `y` y `ancho` la ubican en el lienzo de escritorio (en vw); en el
 * celular van una debajo de la otra.
 *
 * Las de objetos son los dibujos del sitio anterior, repintados en amarillo
 * sobre tinta. TODO(FELI): reemplazarlas por fotos tuyas de verdad.
 */
const base: Omit<Foto, "alt" | "pie">[] = [
  { src: "/assets/fotos/espejo.webp", w: 1200, h: 2133, x: 8, y: 4, ancho: 21, vel: 0.5 },
  { src: "/assets/fotos/musica.webp", w: 1600, h: 686, x: 43, y: 15, ancho: 50, vel: 0.2 },
  { src: "/assets/fotos/piensa.webp", w: 1170, h: 1404, fondo: "amarillo", x: 60, y: 44, ancho: 28, vel: 0.7 },
  { src: "/assets/fotos/cancha.webp", w: 1600, h: 686, x: 5, y: 58, ancho: 42, vel: 0.3 },
  { src: "/assets/fotos/cruzado.webp", w: 562, h: 1404, fondo: "tinta", x: 27, y: 86, ancho: 17, vel: 0.9 },
  { src: "/assets/fotos/piano.webp", w: 1600, h: 905, x: 53, y: 94, ancho: 41, vel: 0.25 },
  { src: "/assets/fotos/libros.webp", w: 1600, h: 686, x: 4, y: 136, ancho: 46, vel: 0.4 },
  { src: "/assets/fotos/parado.webp", w: 393, h: 1404, fondo: "amarillo", x: 68, y: 128, ancho: 13, vel: 0.8 },
  { src: "/assets/fotos/mesa.webp", w: 1600, h: 686, x: 38, y: 176, ancho: 54, vel: 0.2 },
];

/** alto del lienzo de escritorio, en vw */
export const altoLienzo = 212;

const textos: Record<Idioma, [alt: string, pie: string][]> = {
  es: [
    ["Felipe sacándose una foto en el espejo con la camiseta de Argentina", "Camiseta de Argentina"],
    ["Auriculares, un vinilo y un cassette", "Música"],
    ["Felipe con la cara apoyada en la mano", ""],
    ["Zapatillas, llaves y una pelota de básquet", "Básquet"],
    ["Felipe de perfil con los brazos cruzados", ""],
    ["Un piano de cola visto desde arriba", "Piano"],
    ["Libros y una pelota de fútbol", "Fútbol"],
    ["Felipe de cuerpo entero, de perfil", ""],
    ["Un mate, un cubo de Rubik, una laptop y un metrónomo", "Mate"],
  ],
  en: [
    ["Felipe taking a mirror photo in the Argentina jersey", "Argentina jersey"],
    ["Headphones, a vinyl record and a cassette", "Music"],
    ["Felipe resting his face on his hand", ""],
    ["Sneakers, keys and a basketball", "Basketball"],
    ["Felipe in profile with his arms crossed", ""],
    ["A grand piano seen from above", "Piano"],
    ["Books and a football", "Football"],
    ["Felipe full length, in profile", ""],
    ["A mate, a Rubik's cube, a laptop and a metronome", "Mate"],
  ],
};

export const fotos = (idioma: Idioma): Foto[] =>
  base.map((f, i) => ({ ...f, alt: textos[idioma][i][0], pie: textos[idioma][i][1] }));
