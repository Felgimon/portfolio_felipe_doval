"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Piezas compartidas por las paradas.
 */

/** Título de parada: una palabra en la script de cartel. */
export function TituloParada({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={cn("script titulo-parada outline-none", className)}>
      {children}
    </h2>
  );
}

/**
 * Una frase con una palabra convertida en link (p. ej. "Superlum" → #trabajo).
 * La frase vive entera en content/guia.ts; acá sólo se marca la palabra.
 */
export function ConEnlace({
  frase,
  palabra,
  href,
}: {
  frase: string;
  palabra: string;
  href: string;
}) {
  const i = frase.indexOf(palabra);
  if (i < 0) return <>{frase}</>;
  return (
    <>
      {frase.slice(0, i)}
      <a href={href} className="link font-bold">
        {palabra}
      </a>
      {frase.slice(i + palabra.length)}
    </>
  );
}

/**
 * El filete: el trazo de pincel bajo el nombre, como el subrayado de un cartel
 * pintado a mano. Es dibujo (no ícono): un solo trazo con la misma sombra dura
 * que las letras.
 */
export function Filete({ className }: { className?: string }) {
  const d =
    "M8 46 C 140 20, 330 8, 520 16 C 610 20, 690 30, 752 22 C 700 40, 560 46, 420 44 C 300 42, 170 44, 60 56";
  return (
    <svg
      viewBox="0 0 760 64"
      className={cn("h-auto w-full max-w-[640px]", className)}
      aria-hidden
      focusable="false"
    >
      <path d={d} fill="none" stroke="var(--lima)" strokeWidth="9" strokeLinecap="round" transform="translate(6 5)" />
      <path d={d} fill="none" stroke="var(--tinta)" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
