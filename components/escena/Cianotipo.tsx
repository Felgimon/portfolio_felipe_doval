import { cn } from "@/lib/utils";
import { BurbujasCss } from "./BurbujasCss";

/** Cada cianotipo con su proporción (la del archivo: la escena no lo estira). */
const MEDIDAS = {
  // a sangre (se funden los bordes): el 404
  mapa: [1600, 905],
  // v9.1, escritorio: los objetos dispersos (scripts/componer-cianotipos.py)
  "musica-grande": [1600, 1000],
  "perfil-grande": [1800, 767],
  "enfoque-grande": [1800, 1600],
  "trabajo-grande": [1800, 562],
  "recorrido-grande": [1500, 1600],
  "contacto-grande": [1800, 1000],
  // el celular: una franja arriba de cada título, con menos objetos
  "musica-m": [1600, 900],
  "perfil-m": [1600, 760],
  "enfoque-m": [1600, 760],
  "trabajo-m": [1600, 760],
  "recorrido-m": [1600, 760],
  "contacto-m": [1600, 760],
} as const;

const A_SANGRE = new Set<string>(["mapa"]);

export type NombreCianotipo = keyof typeof MEDIDAS;

/**
 * LOS OBJETOS DE UNA SECCIÓN (v8): un cianotipo de cosas de todos los días.
 * Desde la v9.1, orden adentro y desorden afuera: cada objeto impecable (el
 * cable enrollado y atado, los lápices derechos) pero tirados en la mesa, cada
 * uno girado a su manera. Felipe es las dos cosas: estricto con algunas cosas,
 * y con las ideas todavía sin acomodar. El archivo es un mapa de
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
    >
      <BurbujasCss d={burbujas} />
    </div>
  );
}
