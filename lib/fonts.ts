import localFont from "next/font/local";
import { Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";

/**
 * Sistema tipográfico del portfolio.
 *
 * - display: Archivo (variable, ejes wght + wdth) — cargada localmente desde
 *   los TTF que provee Felipe. Es la MISMA tipografía del logo FD_ (fundición
 *   Omnibus-Type, Buenos Aires 🇦🇷). Se usa expandida + black para los títulos
 *   grandes: look "scoreboard / transmisión".
 * - body: Hanken Grotesk — grotesca cálida y muy legible para todo el texto.
 * - mono: Spline Sans Mono — números, labels y datos tipo telemetría.
 *
 * Cada una expone una CSS variable que globals.css mapea a un token de Tailwind.
 */

export const fontDisplay = localFont({
  src: "../app/fonts/Archivo-Variable.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: ["system-ui", "sans-serif"],
});

export const fontBody = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const fontMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const fontClassNames = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;
