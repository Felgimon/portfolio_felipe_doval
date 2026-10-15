"use client";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * Placeholder honesto para lo que todavía no está ("FALTA: ..."). Nunca se
 * inventan capturas ni datos: se muestra esto y se anota en TODO-FELI.md.
 */
export function Placeholder({ label, className }: { label: string; className?: string }) {
  const { t } = useIdioma();
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-linea bg-noche p-6 text-center",
        className,
      )}
    >
      <ImageOff className="size-5 text-crema-2" strokeWidth={1.8} aria-hidden />
      <p className="etiqueta">
        {t.falta}: {label}
      </p>
    </div>
  );
}
