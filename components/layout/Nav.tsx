"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { paradas } from "@/lib/navigation";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import type { IdParada } from "@/content/ui";

/**
 * La NAV: una píldora de vidrio fija arriba. En la home, las seis paradas de
 * la visita; la activa lleva debajo una cápsula de líquido (la pinta la
 * escena leyendo `data-nav-activo`) que se desliza al cambiar de parada.
 *
 * Los links son anclas de verdad (#trabajo se puede compartir y el botón Atrás
 * funciona). Al ir a una parada el foco pasa al título de la sección: en la v5
 * el foco se quedaba en la nav y Tab volvía a la nav en vez de al contenido.
 *
 * En el celular la píldora muestra la parada actual en script y un botón
 * "Paradas" que abre la lista. Fuera de la home: "Volver a la visita".
 */
export function Nav() {
  const pathname = usePathname();
  const { t } = useIdioma();
  const enHome = pathname === "/";
  const activa = useActiveSection(paradas) as IdParada;
  const { scrollTo } = useSmoothScroll();
  const [abierta, setAbierta] = useState(false);
  const hoja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierta(false);
      boton.current?.focus();
    };
    window.addEventListener("keydown", esc);
    hoja.current?.querySelector<HTMLElement>("a")?.focus();
    return () => window.removeEventListener("keydown", esc);
  }, [abierta]);

  const ir = (e: React.MouseEvent, id: IdParada) => {
    e.preventDefault();
    setAbierta(false);
    const destino = document.getElementById(id);
    if (!destino) return;
    scrollTo(destino, { immediate: false });
    history.replaceState(null, "", id === "inicio" ? "/" : `#${id}`);
    const titulo = destino.querySelector<HTMLElement>("h1, h2");
    titulo?.setAttribute("tabindex", "-1");
    titulo?.focus({ preventScroll: true });
  };

  if (!enHome) {
    return (
      <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-4 sm:top-5">
        <nav aria-label={t.nav.aria}>
          <Link
            href="/#trabajo"
            data-vidrio
            className="vidrio vidrio-pildora boton-vidrio min-h-[46px] text-[15px]"
          >
            <ArrowLeft className="size-4" aria-hidden strokeWidth={2.4} />
            {t.nav.volverVisita}
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-4 sm:top-5">
      <nav aria-label={t.nav.aria} className="w-full max-w-max">
        {/* desktop */}
        <ul
          data-vidrio
          className="vidrio vidrio-pildora hidden items-center gap-0.5 px-2 py-1.5 lg:flex"
        >
          {paradas.map((id) => (
            <li key={id}>
              <a
                href={id === "inicio" ? "/" : `#${id}`}
                onClick={(e) => ir(e, id)}
                aria-current={activa === id ? "location" : undefined}
                data-nav-activo={activa === id ? "" : undefined}
                className={cn(
                  "relative block rounded-full px-3.5 py-2 text-[15px] transition-[font-weight] xl:px-4",
                  activa === id ? "font-bold" : "font-medium",
                )}
              >
                {t.paradas[id]}
              </a>
            </li>
          ))}
        </ul>

        {/* celular y tablet */}
        <div
          data-vidrio
          className="vidrio vidrio-pildora flex w-[min(92vw,420px)] items-center justify-between py-1 pr-1.5 pl-5 lg:hidden"
        >
          <span className="script translate-y-[2px] text-[30px] [text-shadow:none]" aria-live="off">
            {t.paradas[activa]}
          </span>
          <button
            type="button"
            ref={boton}
            onClick={() => setAbierta((v) => !v)}
            aria-expanded={abierta}
            aria-controls="hoja-paradas"
            className="min-h-[44px] rounded-full px-4 text-[15px] font-semibold"
          >
            {abierta ? t.nav.cerrar : t.nav.paradas}
          </button>
        </div>
        {abierta && (
          <div
            ref={hoja}
            id="hoja-paradas"
            data-vidrio
            className="vidrio mt-2 w-[min(92vw,420px)] p-2 lg:hidden"
          >
            <ul>
              {paradas.map((id) => (
                <li key={id}>
                  <a
                    href={id === "inicio" ? "/" : `#${id}`}
                    onClick={(e) => ir(e, id)}
                    aria-current={activa === id ? "location" : undefined}
                    className={cn(
                      "flex min-h-[48px] items-center rounded-2xl px-4 text-[17px]",
                      activa === id ? "font-bold" : "font-medium",
                    )}
                  >
                    {t.paradas[id]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
