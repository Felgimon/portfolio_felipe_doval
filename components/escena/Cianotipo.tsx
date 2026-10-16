import { cn } from "@/lib/utils";

export type NombreCianotipo = "musica" | "curiosidad" | "herramientas" | "movimiento" | "gente" | "mapa";

/**
 * EL FONDO DE UNA SECCIÓN (v8): un cianotipo de objetos de todos los días,
 * ordenados (Felipe es ordenado y el fondo lo dice). El archivo es un mapa de
 * luz (scripts/gen-cianotipos.mjs): la escena lo pinta como luz baja sobre el
 * estudio, debajo de Feli y de los títulos, y la gota lo agranda al pasar.
 *
 * En el DOM es una caja 16:9 arriba de la sección (en el celular, el doble de
 * ancha y pegada a la derecha, donde están los objetos). Sin escena, el mismo
 * archivo va de fondo CSS, con la misma intensidad.
 */
export function Cianotipo({ nombre, className }: { nombre: NombreCianotipo; className?: string }) {
  const src = `/assets/cianotipos/${nombre}.webp`;
  return (
    <div
      aria-hidden
      data-cianotipo={nombre}
      data-src={src}
      className={cn("cianotipo", className)}
      style={{ "--cianotipo": `url(${src})` } as React.CSSProperties}
    />
  );
}
