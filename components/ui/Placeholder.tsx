import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PlaceholderProps = {
  /** qué falta, ej. "captura de Superlum" */
  label: string;
  className?: string;
};

/**
 * Placeholder honesto y visualmente obvio para assets/datos que todavía no están
 * (borde punteado + "FALTA: ..."). Nunca inventamos capturas ni datos: se
 * muestra esto y se registra en TODO-FELI.md.
 */
export function Placeholder({ label, className }: PlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-line p-6 text-center",
        className,
      )}
    >
      <ImageOff className="size-5 text-muted" strokeWidth={1.5} aria-hidden />
      <p className="data text-[0.7rem] tracking-wide text-muted">
        FALTA: {label}
      </p>
    </div>
  );
}
