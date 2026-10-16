"use client";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { alCambiar, alternar, estaPrendido } from "@/lib/sonido";

/**
 * Prende o apaga el sonido del sitio (lib/sonido.ts). Dos formas: la píldora
 * de vidrio de la nav (con un ecualizador de tres barras que se mueve cuando
 * suena) y un link de texto, al final de la frase "Música" de Así soy.
 */
export function BotonSonido({ variante = "pildora", className }: { variante?: "pildora" | "texto"; className?: string }) {
  const { t } = useIdioma();
  const prendido = useSyncExternalStore(alCambiar, estaPrendido, () => false);

  if (variante === "texto") {
    return (
      <button type="button" onClick={alternar} aria-pressed={prendido} className={cn("sonido-texto", className)}>
        {prendido ? t.sonido.apagar : t.sonido.prender}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={prendido}
      data-vidrio
      title={prendido ? t.sonido.apagar : t.sonido.prender}
      className={cn("boton vidrio vidrio-pildora boton-vidrio sonido gap-2 px-[15px] text-[14px]", className)}
    >
      <span className="eq" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      {t.sonido.boton}
    </button>
  );
}
