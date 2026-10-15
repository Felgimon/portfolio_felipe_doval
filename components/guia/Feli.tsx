import Image from "next/image";
import { cn } from "@/lib/utils";
import { pose, type PoseId } from "@/content/guia";

/**
 * FELI: una foto recortada de Felipe que acompaña la sección.
 *
 * En el DOM es una caja con el aspect-ratio exacto de la foto (CLS 0). La
 * escena (components/escena/Escena.tsx) la lee por `data-feli` y la pinta
 * DENTRO del shader, sobre el estudio y con el pie fundido, así la gota puede
 * refractarla cuando pasa por encima. El <img> es el respaldo sin WebGL, y se
 * oculta en cuanto la textura está en la GPU (data-pintado).
 *
 * Es decorativa (aria-hidden): quién es Felipe ya lo dicen el h1 y el texto.
 */
export function Feli({
  pose: poseId,
  prioridad = false,
  className,
  sizes = "(max-width: 760px) 80vw, 40vw",
}: {
  pose: PoseId;
  /** la foto del primer pantallazo: carga con prioridad */
  prioridad?: boolean;
  className?: string;
  sizes?: string;
}) {
  const p = pose(poseId);
  return (
    <div
      aria-hidden
      data-feli
      data-pose-src={p.src}
      className={cn("feli", className)}
      style={{ aspectRatio: `${p.w} / ${p.h}` }}
    >
      <Image
        src={p.src}
        alt=""
        width={p.w}
        height={p.h}
        sizes={sizes}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : "auto"}
        unoptimized
        draggable={false}
      />
    </div>
  );
}
