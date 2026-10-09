"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * Footer mínimo (pedido de Felipe): el copyright y el crédito de la fuente.
 * El crédito de la textura solar se fue con el sol (v6). Doval Script es SIL
 * OFL: la licencia no exige crédito visible, pero es honesto decir de dónde
 * sale.
 *
 * El año: el HTML es estático y se hornea en el build; `suppressHydrationWarning`
 * evita el error de hidratación del 1 de enero si no hubo deploy nuevo.
 */
export function SiteFooter() {
  const { t, perfil } = useIdioma();
  return (
    <footer className="capa">
      <div className="contenedor pt-6 pb-10">
        <p className="etiqueta text-tinta-2">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
          {perfil.nombre} · {t.footer.creditoFuente}
        </p>
      </div>
    </footer>
  );
}
