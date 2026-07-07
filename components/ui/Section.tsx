import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  /** índice numerado del eyebrow (solo donde el orden es info real) */
  index?: string;
  title?: string;
  /** tamaño del contenedor interno */
  size?: "narrow" | "default" | "wide" | "full";
  /** sin container interno (para secciones full-bleed que manejan su layout) */
  bare?: boolean;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
};

/**
 * Banda de sección con ritmo vertical consistente y anclaje (`id`). Renderiza
 * un header opcional (eyebrow + título). El `id` sirve de ancla para la nav.
 */
export function Section({
  id,
  eyebrow,
  index,
  title,
  size = "default",
  bare = false,
  className,
  containerClassName,
  children,
}: SectionProps) {
  const header = (eyebrow || title) && (
    <header className="mb-10 flex flex-col gap-4 sm:mb-14">
      {eyebrow && <Eyebrow index={index}>{eyebrow}</Eyebrow>}
      {title && <Heading size="h2">{title}</Heading>}
    </header>
  );

  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 py-20 sm:py-28 lg:py-36", className)}
    >
      {bare ? (
        <>
          {header}
          {children}
        </>
      ) : (
        <Container size={size} className={containerClassName}>
          {header}
          {children}
        </Container>
      )}
    </section>
  );
}
