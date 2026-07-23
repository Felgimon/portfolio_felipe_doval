import { type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

/**
 * Envoltorio de un tópico/nodo (UI espacial). SIN scrim ni capa extra: el texto
 * flota directamente sobre el espacio y el balón (luz celeste sobre espacio
 * profundo = legible). El modelo se corre a un costado (lo maneja GraphHome con
 * la cámara); el contenido se ancla al lado opuesto. El kicker va sin bullet.
 */
export function TopicPanel({
  id,
  kicker,
  children,
  contentClassName,
  align = "left",
}: {
  id: string;
  kicker: string;
  children: ReactNode;
  contentClassName?: string;
  /** Lado donde se ancla el TEXTO (el modelo va al opuesto). */
  align?: "left" | "right";
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-dvh scroll-mt-20 items-center pt-28 pb-36 sm:pt-32"
    >
      <Container
        size="wide"
        className={cn(
          "relative flex",
          align === "right" ? "justify-end" : "justify-start",
        )}
      >
        {/* `pointer-events-auto`: el wrapper de contenido de GraphHome va en
            `none` para que el vacío al costado deje pasar los clicks a los
            mini-soles, que ahora viven en una capa de abajo. Esta columna, que
            es el contenido de verdad, recupera la interacción. */}
        <div
          className={cn(
            "pointer-events-auto w-full max-w-2xl",
            align === "right" && "text-right",
          )}
        >
          <p className="eyebrow">{kicker}</p>
          <div className={cn("mt-8", contentClassName)}>{children}</div>
        </div>
      </Container>
    </section>
  );
}
