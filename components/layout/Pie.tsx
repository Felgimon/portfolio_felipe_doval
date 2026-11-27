"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * Pie mínimo: el copyright y dónde está. El año se hornea en el build;
 * `suppressHydrationWarning` evita el error del 1 de enero sin deploy nuevo.
 */
export function Pie() {
  const { perfil } = useIdioma();
  return (
    <footer data-tema="noche" className="pie">
      <span>
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {perfil.nombre}
      </span>
      <span>{perfil.ubicacion}</span>
    </footer>
  );
}
