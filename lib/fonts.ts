import localFont from "next/font/local";

/**
 * Sistema tipográfico (v7): UNA sola fuente en todo el sitio, Doval Grotesk.
 *
 * Es Archivo (SIL OFL, Omnibus-Type) renombrada, recortada a latín y con
 * flechas propias (↗ → ← ↓ ↑ ↘) que varían con el peso y el ancho, porque
 * Archivo no trae flechas y no queremos que caigan en otra fuente. Se arma con
 * brand/tipografia/doval-grotesk/construir.py.
 *
 * Variable en dos ejes: peso 100 a 900 y ancho 62% a 125%. El ancho extendido
 * y el peso negro hacen de logo y de títulos (la dirección de Tahoe); el ancho
 * normal hace de texto de lectura. Self-hosted: la CSP no deja cargar fuentes
 * de terceros.
 *
 * `display: block`: el nombre y los títulos se dibujan también en el canvas
 * (para que la gota los refracte) y una fuente de reemplazo ahí se vería como
 * un error; prefiero un instante en blanco.
 */
export const fontDoval = localFont({
  src: "../app/fonts/DovalGrotesk.woff2",
  variable: "--font-doval",
  display: "block",
  weight: "100 900",
  style: "normal",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const fontClassNames = fontDoval.variable;
