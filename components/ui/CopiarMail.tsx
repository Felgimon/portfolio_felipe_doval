"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * "Copiar mi mail". La dirección NO está en el HTML ni en el contenido: se
 * arma recién en el clic, desde partes sueltas (anti-scraping, pedido de
 * Felipe). El resultado se anuncia en el mismo botón (aria-live).
 */
const PARTES = [["felipe", "ferrari", "doval"], ["gmail", "com"]] as const;

export function CopiarMail({
  className,
  variante = "vidrio",
}: {
  className?: string;
  /** botón sólido crema o de vidrio ahumado */
  variante?: "solido" | "vidrio";
}) {
  const { t } = useIdioma();
  const [estado, setEstado] = useState<"" | "ok" | "error">("");

  const copiar = async () => {
    const mail = `${PARTES[0].join("")}@${PARTES[1].join(".")}`;
    try {
      await navigator.clipboard.writeText(mail);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    window.setTimeout(() => setEstado(""), 2400);
  };

  const texto = estado === "ok" ? t.contacto.mailCopiado : estado === "error" ? t.contacto.noCopiado : t.hero.copiarMail;

  return (
    <button
      type="button"
      onClick={copiar}
      data-vidrio={variante === "vidrio" ? "" : undefined}
      className={cn(
        "boton",
        variante === "vidrio" ? "vidrio vidrio-pildora boton-vidrio" : "boton-solido",
        className,
      )}
    >
      <span aria-live="polite">{texto}</span>
    </button>
  );
}
