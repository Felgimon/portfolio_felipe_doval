"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { decir } from "@/components/guia/voz";
import { guion } from "@/content/guia";
import type { IdParada } from "@/content/ui";

/**
 * "Copiar mi mail". La dirección NO está en el HTML ni en el contenido: se
 * arma recién en el clic, desde partes sueltas (anti-scraping, pedido de
 * Felipe). En la v5 se armaba durante el render y el server la dejaba escrita
 * en el HTML estático; así ya no pasa.
 *
 * Al copiar, Feli lo comenta en el globo de la parada donde está el botón.
 */
const PARTES = [["felipe", "ferrari", "doval"], ["gmail", "com"]] as const;

export function CopiarMail({
  parada,
  className,
  vidrio = false,
  gotas,
  gotasM,
}: {
  parada: IdParada;
  className?: string;
  /** botón de vidrio (true) o link de texto (false) */
  vidrio?: boolean;
  gotas?: string;
  gotasM?: string;
}) {
  const { t, idioma } = useIdioma();
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const mail = `${PARTES[0].join("")}@${PARTES[1].join(".")}`;
    try {
      await navigator.clipboard.writeText(mail);
      setCopiado(true);
      decir(parada, guion[idioma].copiado, "pulgar");
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      decir(parada, guion[idioma].noCopiado);
    }
  };

  const texto = copiado ? t.contacto.mailCopiado : t.hero.copiarMail;
  const Icono = copiado ? Check : Copy;

  if (vidrio) {
    return (
      <button
        type="button"
        onClick={copiar}
        data-vidrio
        data-gotas={gotas}
        data-gotas-m={gotasM}
        className={cn("vidrio vidrio-pildora boton-vidrio", className)}
      >
        <Icono className="size-[18px]" aria-hidden strokeWidth={2.2} />
        {texto}
      </button>
    );
  }
  return (
    <button type="button" onClick={copiar} className={cn("link", className)}>
      {texto}
    </button>
  );
}
