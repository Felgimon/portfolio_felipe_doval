"use client";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { alCambiar, alternar, estadoSonido } from "@/lib/sonido";

/**
 * Prende o apaga el sonido del sitio (lib/sonido.ts).
 *
 * - "icono" (la nav): sólo el ecualizador de tres barras, sin caja. Prendido,
 *   las barras se mueven; apagado, quedan quietas, apagadas y tachadas, que se
 *   lea de un vistazo que está en silencio. El hover es la gota: llega y se
 *   vuelve un círculo de vidrio encima del ícono (Burbuja.tsx).
 * - "fila" (el menú del celular): el mismo ícono con el estado escrito.
 * - "texto" (Así soy, debajo de "Música"): un link de texto.
 *
 * Es un interruptor: el nombre accesible no cambia ("Sonido") y el estado va
 * en aria-pressed; el tooltip dice qué pasa al tocarlo.
 *
 * Tres estados (v9.2, data-estado): apagado (tachado), sonando (las barras se
 * mueven) y ESPERANDO: venía prendido de otra visita pero el navegador todavía
 * no dejó sonar. Ahí las barras quedan quietas y laten como una burbuja, y
 * tocarlo hace sonar la canción (no la apaga).
 */
export function BotonSonido({ variante = "icono", className }: { variante?: "icono" | "fila" | "texto"; className?: string }) {
  const { t } = useIdioma();
  const estado = useSyncExternalStore(alCambiar, estadoSonido, () => "apagado" as const);
  const prendido = estado !== "apagado";
  const accion = estado === "esperando" ? t.sonido.escuchar : prendido ? t.sonido.apagar : t.sonido.prender;

  if (variante === "texto") {
    return (
      <button type="button" onClick={alternar} aria-pressed={prendido} data-estado={estado} className={cn("sonido-texto", className)}>
        {accion}
      </button>
    );
  }
  const eq = (
    <span className="eq" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
  if (variante === "fila") {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={prendido}
        data-estado={estado}
        className={cn("sonido sonido-fila flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-[17px] font-medium", className)}
      >
        {eq}
        {estado === "esperando" ? t.sonido.escuchar : prendido ? t.sonido.prendido : t.sonido.apagado}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={prendido}
      data-estado={estado}
      aria-label={t.sonido.boton}
      title={accion}
      className={cn("sonido sonido-icono", className)}
    >
      {eq}
    </button>
  );
}
