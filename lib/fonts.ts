import localFont from "next/font/local";

/**
 * Sistema tipográfico (v2.1) — 100% self-hosted (cero dependencia de red en
 * build; la fuente nunca "desaparece" por un fetch fallido a Google Fonts).
 *
 * - sans (display + body): Bricolage Grotesque variable (eje wght), woff2.
 * - mono: Spline Sans Mono variable (eje wght), woff2 — labels de nodo y datos.
 *
 * globals.css mapea `--font-sans`/`--font-mono` a los tokens de Tailwind.
 */

export const fontSans = localFont({
  src: "../app/fonts/Bricolage-wght.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
  fallback: ["system-ui", "sans-serif"],
});

export const fontMono = localFont({
  src: "../app/fonts/SplineSansMono-wght.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "300 700",
  fallback: ["ui-monospace", "monospace"],
});

export const fontClassNames = `${fontSans.variable} ${fontMono.variable}`;
