import { type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

/**
 * Envoltorio de un tópico/nodo (UI espacial). SIN scrim ni capa oscura: el texto
 * flota directamente sobre el cielo y el balón (tinta oscura sobre cielo claro =
 * legible). El modelo se corre a un costado (lo maneja GraphHome con un transform
 * del canvas); el contenido se ancla al lado opuesto. El kicker va sin bullet.
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
        <div
          className={cn(
            "w-full max-w-2xl",
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
