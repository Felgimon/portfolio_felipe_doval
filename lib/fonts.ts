import { Gloock, Mona_Sans } from "next/font/google";

/**
 * Las dos letras del sitio (las eligió Felipe entre cuatro opciones):
 *  - Mona Sans, variable en peso y en ancho: todo el texto. Los títulos la
 *    usan ancha y pesada; el cuerpo, en su ancho normal.
 *  - Gloock, una serif de contraste alto: solo la palabra acentuada de cada
 *    título.
 * next/font las baja en el build y las sirve desde el mismo origen (la CSP no
 * deja cargar fuentes de terceros).
 */
const mona = Mona_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-mona",
  display: "swap",
});

const gloock = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gloock",
  display: "swap",
});

export const fuentes = `${mona.variable} ${gloock.variable}`;
