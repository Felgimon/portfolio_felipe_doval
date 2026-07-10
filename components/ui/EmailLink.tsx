"use client";
import { useState } from "react";
import { Copy, Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Email ofuscado (anti-scraping). La dirección NO viaja en el HTML/RSC: se
 * arma en el cliente desde partes que solo están en el bundle JS. Dos modos:
 *  - "link": abre el cliente de correo.
 *  - "copy": copia al portapapeles con feedback de "copiado".
 */

// Partes separadas a propósito (no concatenar en una constante).
const USER = ["felipe", "ferrari", "doval"].join("");
const DOMAIN = ["gmail", "com"].join(".");

function armarEmail(): string {
  return `${USER}@${DOMAIN}`;
}

type EmailLinkProps = {
  mode?: "link" | "copy";
  className?: string;
  /** contenido visual; por defecto muestra el email armado en cliente */
  children?: React.ReactNode;
  showText?: boolean;
};

export function EmailLink({
  mode = "link",
  className,
  children,
  showText = true,
}: EmailLinkProps) {
  const [copiado, setCopiado] = useState(false);
  const email = armarEmail();

  if (mode === "copy") {
    const copiar = async () => {
      try {
        await navigator.clipboard.writeText(email);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
      } catch {
        setCopiado(false);
      }
    };
    return (
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? "Email copiado" : "Copiar email"}
        className={cn("group inline-flex items-center gap-2", className)}
      >
        {showText && <span className="data">{email}</span>}
        {children}
        {copiado ? (
          <Check className="size-4 text-ok" aria-hidden />
        ) : (
          <Copy
            className="size-4 text-muted transition-colors group-hover:text-acento"
            aria-hidden
          />
        )}
      </button>
    );
  }

  return (
    <a
      href={`mailto:${email}`}
      className={cn("group inline-flex items-center gap-2", className)}
    >
      <Mail className="size-4" aria-hidden />
      {showText && <span>{email}</span>}
      {children}
    </a>
  );
}
