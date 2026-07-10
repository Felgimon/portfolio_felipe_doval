import { cn } from "@/lib/utils";

type EyebrowProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** número de sección (ej. "02") — marcador solo donde el orden es real */
  index?: string;
};

/**
 * Kicker/eyebrow: label en mono, tracking amplio, azul profundo. SIN punto ni
 * viñeta (regla v3). Opcionalmente con un índice numerado (usarlo solo donde la
 * secuencia codifica información real).
 */
export function Eyebrow({ index, className, children, ...props }: EyebrowProps) {
  return (
    <span
      className={cn("eyebrow inline-flex items-center gap-2", className)}
      {...props}
    >
      {index && (
        <>
          <span aria-hidden className="text-muted">
            {index}
          </span>
          <span aria-hidden className="h-px w-6 bg-line" />
        </>
      )}
      {children}
    </span>
  );
}
