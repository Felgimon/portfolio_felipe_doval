"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { secciones, seccionIds } from "@/lib/navigation";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { perfil } from "@/content/perfil";
import { cn } from "@/lib/utils";

/**
 * Nav fija. En la home resalta la sección activa (IntersectionObserver) y hace
 * scroll suave a las anclas. En rutas de detalle, los links vuelven a la home
 * (`/#seccion`).
 */
export function SiteNav() {
  const pathname = usePathname();
  const enHome = pathname === "/";
  const active = useActiveSection(enHome ? seccionIds : []);
  const { scrollTo } = useSmoothScroll();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const NAV_OFFSET = 92; // alto aprox. de la nav fija

  const irA = (id: string) => (e: React.MouseEvent) => {
    if (!enHome) return; // dejar navegar a /#id
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      scrollTo(Math.max(0, y));
    }
    setMenuAbierto(false);
    history.replaceState(null, "", `#${id}`);
  };

  const Logo = (
    <Link
      href="/"
      aria-label="Felipe Doval — inicio"
      className="type-display text-lg tracking-tight text-chalk transition-colors hover:text-agua"
      onClick={enHome ? irA("inicio") : undefined}
    >
      FD<span className="text-agua">_</span>
    </Link>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-[88rem] items-center justify-between px-6 py-4 sm:px-8 lg:px-12"
      >
        <div className="rounded-full border border-line/60 bg-ink/70 px-4 py-2 backdrop-blur-md">
          {Logo}
        </div>

        {/* Desktop */}
        <ul className="hidden items-center gap-1 rounded-full border border-line/60 bg-ink/70 px-2 py-1.5 backdrop-blur-md md:flex">
          {secciones.map((s) => {
            const href = enHome ? `#${s.id}` : `/#${s.id}`;
            const isActive = enHome && active === s.id;
            return (
              <li key={s.id}>
                <Link
                  href={href}
                  onClick={irA(s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 font-mono text-xs tracking-wide transition-colors",
                    isActive
                      ? "text-ink"
                      : "text-chalk-dim hover:text-chalk",
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 -z-10 rounded-full bg-agua" />
                  )}
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          className="flex size-11 items-center justify-center rounded-full border border-line/60 bg-ink/70 text-chalk backdrop-blur-md md:hidden"
        >
          {menuAbierto ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuAbierto && (
        <div
          id="menu-movil"
          className="mx-6 rounded-2xl border border-line bg-panel/95 p-4 backdrop-blur-lg md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {secciones.map((s) => (
              <li key={s.id}>
                <Link
                  href={enHome ? `#${s.id}` : `/#${s.id}`}
                  onClick={irA(s.id)}
                  className={cn(
                    "block rounded-lg px-4 py-3 font-mono text-sm tracking-wide transition-colors",
                    enHome && active === s.id
                      ? "bg-agua/15 text-agua"
                      : "text-chalk-dim hover:bg-panel-2 hover:text-chalk",
                  )}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line-soft px-4 pt-3 font-mono text-xs text-muted">
            {perfil.ubicacion}
          </p>
        </div>
      )}
    </header>
  );
}
