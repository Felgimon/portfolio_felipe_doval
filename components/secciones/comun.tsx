import type { ReactNode } from "react";
import { BurbujasCss } from "@/components/escena/BurbujasCss";
import { cn } from "@/lib/utils";

/**
 * Piezas compartidas por las secciones.
 */

/**
 * El título de una sección: una sola palabra, directa ("Trabajo", no "Lo que
 * construí"), en Doval Grotesk extendida y negra. Es una PLACA: con la escena
 * lista se imprime en el fondo y la gota la refracta (ver Escena.tsx).
 */
export function TituloSeccion({
  id,
  children,
  className,
  burbujas,
  burbujasM,
}: {
  id: string;
  children: string;
  className?: string;
  /** las burbujas que viven en el título (Escena.tsx: data-burbujas) */
  burbujas?: string;
  burbujasM?: string;
}) {
  return (
    <h2
      id={id}
      data-placa
      data-burbujas={burbujas}
      data-burbujas-m={burbujasM}
      className={cn("placa titulo-seccion outline-none", className)}
    >
      <span>{children}</span>
      <BurbujasCss d={burbujas} m={burbujasM} />
    </h2>
  );
}

/** Una fila de datos (Rol, Stack…): etiqueta a la izquierda, valor a la derecha. */
export function Dato({ etiqueta, children, ancho = "76px" }: { etiqueta: string; children: ReactNode; ancho?: string }) {
  return (
    <div className="grid gap-x-3.5" style={{ gridTemplateColumns: `${ancho} 1fr` }}>
      <dt className="etiqueta pt-[3px]">{etiqueta}</dt>
      <dd className="text-[15px] leading-[1.45]">{children}</dd>
    </div>
  );
}
