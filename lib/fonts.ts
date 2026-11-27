import { Piazzolla } from "next/font/google";

/**
 * Una sola letra en todo el sitio: Piazzolla (Huerta Tipográfica, Argentina,
 * SIL OFL). Variable en peso (100 a 900) y tamaño óptico, con cursiva.
 *
 * Por qué esta: es de acá, lleva el nombre de un músico, y dibuja como se
 * mueve Felipe. Las curvas no son redondas: se quiebran en ángulos, y el paso
 * de grueso a fino es corto y abrupto, sin transición lenta (rápido, directo).
 * Los remates son cuñas cortadas, no bolitas ni serifas finas (firme, sin
 * adorno). La cursiva negra se inclina hacia adelante (en movimiento) y la
 * hairline es la misma letra hablando bajito: el sitio usa las dos puntas.
 *
 * next/font la baja en el build y la sirve desde el mismo origen (la CSP no
 * deja cargar fuentes de terceros). `display: block`: el nombre ocupa la
 * pantalla entera y una letra de reemplazo ahí se vería como un error.
 */
export const piazzolla = Piazzolla({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-piazzolla",
  display: "block",
});
