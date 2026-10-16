"use client";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { armarMail } from "@/lib/mail";
import { listo } from "@/lib/sonido";

/**
 * "Copiar mi mail". La dirección NO está en el HTML ni en el contenido: se
 * arma recién en el clic (lib/mail.ts). Recién después de que la persona la
 * copió, se muestra.
 *
 * Que se lea como lo que es: el ícono de copiar (dos hojas) en una insignia; al
 * pasar el mouse las hojas se separan. Al copiar:
 *  1. las hojas se juntan y se dibuja un tilde,
 *  2. el texto sube a "Copiado",
 *  3. una onda recorre el vidrio (la lanza la escena; en el de esmalte, un aro),
 *  4. aparece una ficha con la dirección copiada (sólida: es un aviso y tiene
 *     que leerse aunque tenga texto detrás).
 * Si el portapapeles falla, la ficha muestra la dirección para copiarla a mano.
 */

export function CopiarMail({
  className,
  variante = "vidrio",
  ficha = "arriba",
}: {
  className?: string;
  /** botón sólido crema o de vidrio ahumado */
  variante?: "solido" | "vidrio";
  /** dónde aparece la ficha con la dirección (en desktop; en el celular, siempre arriba) */
  ficha?: "arriba" | "derecha";
}) {
  const { t } = useIdioma();
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  const [mail, setMail] = useState("");
  const reloj = useRef(0);
  const boton = useRef<HTMLButtonElement>(null);
  const aviso = useId();

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const copiar = async () => {
    const m = armarMail();
    setMail(m);
    // la respuesta es inmediata (optimista): el portapapeles casi nunca falla,
    // y si falla se pasa al estado de error con la dirección a la vista
    setEstado("ok");
    listo();
    if (boton.current) {
      const r = boton.current.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent("vidrio:onda", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
    }
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setEstado(""), 2600);
    try {
      await navigator.clipboard.writeText(m);
    } catch {
      setEstado("error");
      window.clearTimeout(reloj.current);
      reloj.current = window.setTimeout(() => setEstado(""), 7000);
    }
  };

  return (
    <span
      className={cn("copiar relative inline-flex", ficha === "derecha" && "copiar-derecha", className)}
      data-estado={estado || undefined}
    >
      <button
        ref={boton}
        type="button"
        onClick={copiar}
        data-vidrio={variante === "vidrio" ? "" : undefined}
        aria-describedby={aviso}
        className={cn(
          "boton copiar-boton gap-2.5 pl-[7px]",
          variante === "vidrio" ? "vidrio vidrio-pildora boton-vidrio" : "boton-solido",
        )}
      >
        <span className="copiar-insignia" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect className="hoja hoja-atras" x="9" y="3" width="11" height="13" rx="2.5" />
            <rect className="hoja hoja-adelante" x="4" y="8" width="11" height="13" rx="2.5" />
            <path className="tilde" d="M5.5 12.5l4.2 4.2L18.5 7.5" />
          </svg>
        </span>
        <span className="copiar-texto">
          <span className="copiar-normal">{t.hero.copiarMail}</span>
          <span className="copiar-hecho" aria-hidden>
            {estado === "error" ? t.contacto.noCopiado : t.contacto.mailCopiado}
          </span>
        </span>
      </button>
      <span id={aviso} role="status" aria-live="polite" className="copiar-aviso">
        {estado && (
          <span className="copiar-ficha">
            <span className="etiqueta block text-[11px]">
              {estado === "ok" ? t.contacto.enPortapapeles : t.contacto.copialoAMano}
            </span>
            <span className="copiar-direccion">{mail}</span>
          </span>
        )}
      </span>
    </span>
  );
}
