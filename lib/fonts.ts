import { Bricolage_Grotesque, Spline_Sans_Mono } from "next/font/google";

/**
 * Sistema tipográfico del portfolio (v2 — "verde agua").
 *
 * - sans (display + body): Bricolage Grotesque — grotesca VARIABLE con carácter
 *   (ejes `opsz` + `wght`). Cortes editoriales, nada "default de IA". Se usa para
 *   todo el texto: en display se aprieta el interlineado y se ESTIRA con
 *   `transform: scaleX/scaleY` + tracking (Bricolage no tiene eje `wdth`); en
 *   body queda tranquila. Una sola familia = coherencia.
 * - mono: Spline Sans Mono — labels de nodo, índices y datos tipo telemetría.
 *
 * globals.css mapea `--font-sans`/`--font-mono` a los tokens de Tailwind
 * (`--font-display`, `--font-body`, `--font-mono`).
 */

export const fontSans = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
  fallback: ["system-ui", "sans-serif"],
});

export const fontMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const fontClassNames = `${fontSans.variable} ${fontMono.variable}`;
