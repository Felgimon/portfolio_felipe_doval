"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * Nav global mínima: solo la marca arriba-izquierda (el HUD de nodos, en la
 * home, lo maneja GraphHome). En rutas de detalle suma un "volver" al grafo.
 * Se acabaron las píldoras de sección: la navegación de la home ES el grafo.
 */
export function SiteNav() {
  const pathname = usePathname();
  const enHome = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[88rem] items-center justify-between px-4 py-4 sm:px-8"
      >
        <Link
          href="/"
          aria-label="Felipe Doval — inicio"
          className="rounded-full border border-line bg-ink/70 px-4 py-2 backdrop-blur-md transition-colors hover:border-agua/50"
        >
          <Logo className="text-lg text-chalk" />
        </Link>

        {!enHome && (
          <Link
            href="/#trabajo"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/70 px-4 py-2 font-mono text-xs tracking-wide text-chalk-dim backdrop-blur-md transition-colors hover:border-agua/50 hover:text-agua"
          >
            <ArrowLeft className="size-4" />
            Volver al grafo
          </Link>
        )}
      </nav>
    </header>
  );
}
