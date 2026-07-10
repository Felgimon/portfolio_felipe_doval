import { cn } from "@/lib/utils";

/**
 * Logo / wordmark de Felipe. Evoluciona el "FD_" de terminal: el guión bajo es un
 * NODO (círculo lleno ORO) que ata la marca al balón-grafo. Primitiva trivial
 * (un círculo), permitida por la regla de oro. SIN glow (decisión v3). `full`
 * muestra el nombre completo; por defecto la marca corta "FD". El tamaño y el
 * color del texto se pasan por className; el nodo va siempre oro.
 */
export function Logo({
  full = false,
  className,
}: {
  full?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "type-display inline-flex items-end leading-none whitespace-nowrap",
        className,
      )}
    >
      {full ? "Felipe Doval" : "FD"}
      <span
        aria-hidden
        className="mb-[0.14em] ml-[0.16em] block shrink-0 rounded-full bg-oro"
        style={{ width: "0.32em", height: "0.32em" }}
      />
    </span>
  );
}
