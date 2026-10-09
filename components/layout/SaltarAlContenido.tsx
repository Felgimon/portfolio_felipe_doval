"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/** "Saltar al contenido": apunta a #contenido, que existe en TODAS las rutas
 * (en la v5 apuntaba a #inicio, que sólo existía en la home). */
export function SaltarAlContenido() {
  const { t } = useIdioma();
  return (
    <a
      href="#contenido"
      className="sr-only rounded-full border-[1.5px] border-tinta bg-lima px-4 py-2 text-sm font-semibold text-tinta focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
    >
      {t.saltar}
    </a>
  );
}
