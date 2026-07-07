import { cn } from "@/lib/utils";

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "hero" | "h1" | "h2" | "h3";
  className?: string;
  children: React.ReactNode;
  id?: string;
};

const sizeClass: Record<NonNullable<HeadingProps["size"]>, string> = {
  hero: "type-hero",
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
};

/** Titular display (Archivo expandida). El tamaño visual es independiente del
 * nivel semántico. */
export function Heading({
  as: Tag = "h2",
  size = "h2",
  className,
  children,
  id,
}: HeadingProps) {
  return (
    <Tag id={id} className={cn(sizeClass[size], "text-chalk text-balance", className)}>
      {children}
    </Tag>
  );
}
