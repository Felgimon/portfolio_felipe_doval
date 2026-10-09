"use client";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { guion } from "@/content/guia";
import type { IdParada } from "@/content/ui";
import { callar, respuesta, suscribir } from "./voz";

/**
 * El GLOBO de Feli: un panel de vidrio con su frase de la parada. El líquido
 * se junta detrás (data-gotas) para que el vidrio tenga algo que doblar: sobre
 * papel blanco liso la refracción no se vería.
 *
 * Cuando Feli contesta algo (copiaste el mail, lo tocaste) la frase cambia un
 * rato y vuelve sola. La respuesta se anuncia a lectores de pantalla por una
 * región aria-live aparte, que NO repite la frase fija de cada parada.
 */
export function Globo({
  parada,
  children,
  className,
  gotas,
  gotasM,
}: {
  parada: IdParada;
  children: ReactNode;
  className?: string;
  gotas?: string;
  gotasM?: string;
}) {
  const { idioma } = useIdioma();
  const r = useSyncExternalStore(suscribir, respuesta, () => null);
  const mia = r && r.parada === parada ? r : null;

  useEffect(() => {
    if (!mia) return;
    const t = window.setTimeout(() => callar(mia.n), 7000);
    return () => window.clearTimeout(t);
  }, [mia]);

  return (
    <div
      data-vidrio
      data-gotas={gotas}
      data-gotas-m={gotasM}
      className={cn("vidrio relative max-w-[22rem] px-5 py-4", className)}
    >
      <p className="etiqueta">{guion[idioma].etiqueta}</p>
      <p className="mt-1.5 text-[15px] leading-[1.38] font-medium sm:text-[17px]">
        {mia ? mia.texto : children}
      </p>
      <span className="sr-only" aria-live="polite">
        {mia?.texto ?? ""}
      </span>
    </div>
  );
}
