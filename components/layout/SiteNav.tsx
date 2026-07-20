"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * Nav global mínima. En la HOME no se renderiza nada: la escena 3D (con el FD
 * dentro del sol) es la marca, y el HUD de abajo la navegación; un logo
 * flotando arriba competía con el modelo (pedido de Felipe, v4.3). En rutas
 * de detalle sí: marca + "volver" al grafo.
 */
export function SiteNav() {
  const { t } = useIdioma();
  const pathname = usePathname();
  const enHome = pathname === "/";
  if (enHome) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[88rem] items-center justify-between px-4 py-4 sm:px-8"
      >
        {/* Logo sin contenedor, con sombra suave para leerse sobre el cielo. */}
        <Link
          href="/"
          aria-label="Felipe Doval: inicio"
          className="rounded-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
        >
          <Logo className="text-lg text-chalk" />
        </Link>

        <Link
          href="/#trabajo"
          data-lente
          className="glass glass-pill inline-flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-wide text-chalk-dim transition-colors hover:text-acento"
        >
          <ArrowLeft className="size-4" />
          {t.volverGrafo}
        </Link>
      </nav>
    </header>
  );
}
