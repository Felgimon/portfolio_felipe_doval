import Image from "next/image";
import { DeviceFrame } from "@/components/ui/DeviceFrame";
import { Placeholder } from "@/components/ui/Placeholder";
import type { Proyecto } from "@/content/types";

type Variant = "browser" | "terminal" | "phone";

const LABELS: Record<string, string> = {
  superlum: "superlum.app",
  futbolvision: "futbolvision.app",
  courtside: "courtside.app",
  pcbuilder: "pc-builder",
  lost: "lost.app",
  nindo: "nindo",
};

function deviceParaProyecto(slug: string): { variant: Variant; label: string } {
  if (slug === "buscaminas")
    return { variant: "terminal", label: "buscaminas — main.cpp" };
  return { variant: "browser", label: LABELS[slug] ?? slug };
}

type ProjectMediaProps = {
  proyecto: Proyecto;
  className?: string;
  contentClassName?: string;
  sizes?: string;
};

/** Media de un proyecto: primera captura (o placeholder honesto) dentro del
 * marco de dispositivo apropiado. */
export function ProjectMedia({
  proyecto,
  className,
  contentClassName,
  sizes = "(max-width: 1024px) 90vw, 50vw",
}: ProjectMediaProps) {
  const cap = proyecto.capturas[0];
  const dev = deviceParaProyecto(proyecto.slug);
  const tieneCaptura = Boolean(cap && !cap.falta && cap.src);

  return (
    <DeviceFrame
      variant={dev.variant}
      label={dev.label}
      className={className}
      contentClassName={contentClassName}
    >
      {tieneCaptura ? (
        <div className="relative h-full w-full">
          <Image
            src={cap.src}
            alt={cap.alt}
            fill
            sizes={sizes}
            className="object-cover object-top"
          />
        </div>
      ) : (
        <Placeholder
          label={cap?.alt ?? "captura del proyecto"}
          className="h-full border-0"
        />
      )}
    </DeviceFrame>
  );
}
