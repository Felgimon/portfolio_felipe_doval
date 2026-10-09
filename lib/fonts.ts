import localFont from "next/font/local";

/**
 * Sistema tipográfico (v6), 100% self-hosted (la CSP no deja cargar fuentes
 * de terceros, y así la fuente nunca "desaparece" por un fetch fallido).
 *
 * - script (display): Doval Script, la script de cartel propia derivada de
 *   Norican (SIL OFL). Sólo para 1 a 3 palabras: el nombre y los títulos de
 *   parada. `display: block` porque el nombre en una fuente de reemplazo
 *   cursiva genérica se vería peor que un instante en blanco.
 * - sans (cuerpo): Bricolage Grotesque variable.
 * - mono (etiquetas): Spline Sans Mono variable.
 *
 * Cada una expone su propia variable CSS; globals.css las mapea a los tokens
 * de Tailwind (font-script / font-sans / font-mono).
 */

export const fontScript = localFont({
  src: "../app/fonts/DovalScript.woff2",
  variable: "--font-doval-script",
  display: "block",
  weight: "400",
  style: "normal",
  fallback: ["cursive"],
  adjustFontFallback: false,
});

export const fontSans = localFont({
  src: "../app/fonts/Bricolage-wght.woff2",
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800",
  fallback: ["system-ui", "sans-serif"],
});

export const fontMono = localFont({
  src: "../app/fonts/SplineSansMono-wght.woff2",
  variable: "--font-spline",
  display: "swap",
  weight: "300 700",
  fallback: ["ui-monospace", "monospace"],
});

export const fontClassNames = `${fontScript.variable} ${fontSans.variable} ${fontMono.variable}`;
