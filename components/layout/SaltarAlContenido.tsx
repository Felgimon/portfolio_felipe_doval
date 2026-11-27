"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/** "Saltar al contenido": apunta a #contenido, que existe en todas las rutas. */
export function SaltarAlContenido() {
  const { t } = useIdioma();
  return (
    <a
      href="#contenido"
      className="sr-only bg-tinta px-4 py-2 font-bold text-amarillo focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
    >
      {t.saltar}
    </a>
  );
}
