"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { guion, pose, type PoseId } from "@/content/guia";
import type { IdParada } from "@/content/ui";
import { decir, respuesta, suscribir } from "./voz";

/**
 * FELI, el guía de la visita.
 *
 * En el DOM es un botón con la caja exacta de la foto (aspect-ratio fijo:
 * CLS 0). La escena (components/escena/Escena.tsx) lo lee por `data-feli` y lo
 * pinta DENTRO del shader: así el líquido le pasa por delante (la pileta tapa
 * el corte recto de la foto), sube desde el líquido cuando llega su parada y
 * el vidrio lo puede doblar. El <img> de adentro es el respaldo sin WebGL.
 *
 * Huevo de pascua: tocarlo. Las primeras veces contesta; a la quinta se hunde
 * en la pileta y deja un cartel "Ahora vuelvo".
 */
export function Feli({
  pose: poseId,
  parada,
  intro = false,
  className,
  sizes = "(max-width: 760px) 60vw, 40vw",
}: {
  pose: PoseId;
  parada: IdParada;
  /** la primera foto de la página: sube del líquido al cargar */
  intro?: boolean;
  className?: string;
  sizes?: string;
}) {
  const { idioma } = useIdioma();
  const g = guion[idioma];
  const r = useSyncExternalStore(suscribir, respuesta, () => null);
  const activa = r && r.parada === parada && r.pose ? r.pose : poseId;
  const p = pose(activa);
  const [toques, setToques] = useState(0);
  const [afuera, setAfuera] = useState(false);
  const reloj = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const tocar = () => {
    if (afuera) return;
    if (toques < g.toques.length) {
      decir(parada, g.toques[toques]);
      setToques(toques + 1);
      return;
    }
    setAfuera(true);
    setToques(0);
    reloj.current = window.setTimeout(() => {
      setAfuera(false);
      decir(parada, g.volvi);
    }, 6000);
  };

  return (
    <button
      type="button"
      onClick={tocar}
      aria-label={g.ariaTocar}
      data-feli
      data-pose-src={p.src}
      data-intro={intro ? "" : undefined}
      data-hundir={afuera ? "" : undefined}
      className={cn("feli", className)}
      style={{ aspectRatio: `${p.w} / ${p.h}` }}
    >
      <Image
        src={p.src}
        alt=""
        width={p.w}
        height={p.h}
        sizes={sizes}
        loading={intro ? "eager" : "lazy"}
        fetchPriority={intro ? "high" : "auto"}
        unoptimized
        draggable={false}
      />
      {afuera && (
        <span className="cartel-vuelvo script script-jade">{g.ahoraVuelvo}</span>
      )}
    </button>
  );
}
