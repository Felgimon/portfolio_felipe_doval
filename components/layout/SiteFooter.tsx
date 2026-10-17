"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * Footer mínimo (pedido de Felipe): el copyright y dónde está. Tiene un alto
 * fijo (--pie) para que el 404 entre justo en una pantalla con él.
 *
 * El año: el HTML es estático y se hornea en el build; `suppressHydrationWarning`
 * evita el error de hidratación del 1 de enero si no hubo deploy nuevo.
 */
export function SiteFooter() {
  const { t, perfil } = useIdioma();
  return (
    <footer className="capa">
      <div className="flex h-[var(--pie)] justify-between px-4 pt-7 text-[13px] text-crema-2 md:px-[var(--margen)]">
        <span>
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {perfil.nombre}
        </span>
        <span>{t.footer.ubicacion}</span>
      </div>
    </footer>
  );
}
