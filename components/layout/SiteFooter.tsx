"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * Footer mínimo (pedido de Felipe): el copyright y dónde está.
 *
 * El año: el HTML es estático y se hornea en el build; `suppressHydrationWarning`
 * evita el error de hidratación del 1 de enero si no hubo deploy nuevo.
 */
export function SiteFooter() {
  const { t, perfil } = useIdioma();
  return (
    <footer className="capa">
      <div className="flex justify-between px-4 pt-7 pb-9 text-[13px] text-crema-2 md:px-[var(--margen)]">
        <span>
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {perfil.nombre}
        </span>
        <span>{t.footer.ubicacion}</span>
      </div>
    </footer>
  );
}
