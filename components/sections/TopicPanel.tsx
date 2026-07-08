import { type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

/**
 * Envoltorio de un tópico/nodo. Ocupa el alto de la pantalla, ancla el
 * contenido a la izquierda (el balón fijo respira a la derecha) y aplica un
 * scrim direccional para que el texto se lea sobre el 3D. El índice + kicker
 * arman la etiqueta del nodo en mono.
 */
export function TopicPanel({
  id,
  kicker,
  children,
  contentClassName,
  scrim = "edge",
}: {
  id: string;
  kicker: string;
  children: ReactNode;
  contentClassName?: string;
  /** "edge" (default): scrim direccional, el balón respira a la derecha.
   * "strong": para nodos con más contenido — atenúa casi toda la pantalla. */
  scrim?: "edge" | "strong";
}) {
  const bg =
    scrim === "strong"
      ? "linear-gradient(100deg, var(--ink) 0%, var(--ink) 52%, rgba(15,30,27,0.9) 76%, rgba(15,30,27,0.6) 100%)"
      : "linear-gradient(100deg, var(--ink) 0%, var(--ink) 24%, rgba(15,30,27,0.86) 46%, rgba(15,30,27,0.3) 66%, transparent 86%)";
  return (
    <section
      id={id}
      className="relative flex min-h-dvh scroll-mt-20 items-center pt-28 pb-36 sm:pt-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: bg }}
      />
      <Container size="wide" className="relative">
        <p className="eyebrow flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-agua shadow-[0_0_8px_-1px_var(--agua)]"
          />
          <span>{kicker}</span>
        </p>
        <div className={cn("mt-8", contentClassName)}>{children}</div>
      </Container>
    </section>
  );
}
