import { cn } from "@/lib/utils";

/** Cada cianotipo con su proporción (la del archivo: la escena no lo estira). */
const MEDIDAS = {
  // a sangre (se funden los bordes)
  musica: [1600, 905],
  mapa: [1600, 905],
  // filas compactas (el celular)
  curiosidad: [1600, 686],
  enfoque: [1600, 1194],
  herramientas: [1600, 686],
  movimiento: [1600, 686],
  gente: [1600, 686],
  // composiciones grandes (escritorio): scripts/componer-cianotipos.py
  "perfil-grande": [1398, 696],
  "enfoque-grande": [1338, 998],
  "trabajo-grande": [2030, 628],
  "recorrido-grande": [1020, 928],
  "contacto-grande": [1068, 560],
} as const;

const A_SANGRE = new Set<string>(["musica", "mapa"]);

export type NombreCianotipo = keyof typeof MEDIDAS;

/**
 * LOS OBJETOS DE UNA SECCIÓN (v8): un cianotipo de cosas de todos los días,
 * ordenadas (Felipe es ordenado y el fondo lo dice). El archivo es un mapa de
 * luz (scripts/gen-cianotipos.mjs): la escena lo pinta como luz baja sobre el
 * papel, debajo de los títulos, y las burbujas que flotan encima lo agrandan.
 *
 * Dónde va lo decide cada sección (className): siempre en un lugar vacío, al
 * lado del título o donde no hay texto, nunca debajo de un párrafo. La caja
 * mantiene la proporción del archivo.
 *
 * Sin escena, el mismo archivo va de fondo CSS, con la misma intensidad.
 */
export function Cianotipo({
  nombre,
  className,
  burbujas,
}: {
  nombre: NombreCianotipo;
  className?: string;
  /** burbujas encima de los objetos (agrandan una lamparita, una taza): data-burbujas */
  burbujas?: string;
}) {
  const src = `/assets/cianotipos/${nombre}.webp`;
  const [w, h] = MEDIDAS[nombre];
  return (
    <div
      aria-hidden
      data-cianotipo={nombre}
      data-src={src}
      data-funde={A_SANGRE.has(nombre) ? "" : undefined}
      data-burbujas={burbujas}
      className={cn("cianotipo", className)}
      style={{ "--cianotipo": `url(${src})`, aspectRatio: `${w} / ${h}` } as React.CSSProperties}
    />
  );
}
