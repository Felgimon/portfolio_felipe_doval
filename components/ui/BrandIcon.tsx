import { github, linkedin, type BrandIconData } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

const iconos: Record<string, BrandIconData> = { github, linkedin };

type BrandIconProps = {
  name: "github" | "linkedin";
  className?: string;
  /** texto accesible; si se omite, el ícono es decorativo (aria-hidden) */
  title?: string;
};

/**
 * Ícono de marca (GitHub / LinkedIn) renderizado desde datos de Simple Icons
 * (CC0, vía Iconify). RSC-safe, offline y mínimo — no bundlea la colección
 * completa ni requiere runtime de Iconify.
 */
export function BrandIcon({ name, className, title }: BrandIconProps) {
  const icon = iconos[name];
  return (
    <svg
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      className={cn("size-5", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}
