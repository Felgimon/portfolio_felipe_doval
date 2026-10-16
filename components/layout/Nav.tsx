"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { paradas } from "@/lib/navigation";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import type { IdParada } from "@/content/ui";

/**
 * La NAV: el nombre a la izquierda (vuelve al inicio), una píldora de vidrio
 * con las secciones en el centro y "Hablemos" sólido a la derecha.
 *
 * El hover es la GOTA: con el mouse (o el foco del teclado) sobre un link, la
 * gota de vidrio grande que flota sobre los títulos vuela hasta ahí y se achica
 * tomando la forma del link, como una píldora de vidrio. Al salir, vuelve a su
 * título. El link marca a dónde ir con data-gota-aqui (lo lee Escena.tsx).
 * Sin escena (o con reducir movimiento) el hover es un fondo más claro.
 *
 * Los links son anclas de verdad (#trabajo se puede compartir y el botón Atrás
 * funciona). Al ir a una sección el foco pasa a su título.
 *
 * En el celular la píldora no entra: queda el nombre, "Menú" (abre la lista)
 * y "Hablemos". Fuera de la home, "Volver" lleva a la sección de donde vino.
 */
const enNav = paradas.filter((id) => id !== "inicio" && id !== "contacto");

export function Nav() {
  const pathname = usePathname();
  const { t } = useIdioma();
  const enHome = pathname === "/";
  const activa = useActiveSection(paradas) as IdParada;
  const { scrollTo } = useSmoothScroll();
  const [abierta, setAbierta] = useState(false);
  const hoja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [sobre, setSobre] = useState<IdParada | null>(null);

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
    if (!enHome) return;
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

  const href = (id: IdParada) => (id === "inicio" ? "/" : `/#${id}`);
  const volverA = pathname.startsWith("/proyectos/superlum") ? "/#trabajo" : "/#proyectos";

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 py-4 md:px-[var(--margen)] md:py-[22px]">
      <nav aria-label={t.nav.aria} className="grid grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
      <Link
        href="/"
        onClick={(e) => ir(e, "inicio")}
        aria-label={t.nav.inicio}
        className="marca justify-self-start"
      >
        Felipe Doval
      </Link>

        {enHome ? (
          <ul
            data-vidrio
            onPointerLeave={() => setSobre(null)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobre(null);
            }}
            className="vidrio vidrio-pildora relative hidden items-center gap-0.5 p-[5px] lg:flex"
          >
            {enNav.map((id) => (
              <li key={id} className="relative">
                <a
                  href={href(id)}
                  data-id={id}
                  onClick={(e) => ir(e, id)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setSobre(id)}
                  onFocus={() => setSobre(id)}
                  aria-current={activa === id ? "location" : undefined}
                  data-gota-aqui={sobre === id ? "" : undefined}
                  className={cn(
                    "nav-link relative block rounded-full px-[15px] py-[9px] text-[14px] font-medium transition-colors duration-300",
                    sobre === id || (!sobre && activa === id) ? "text-crema" : "text-crema-2",
                  )}
                >
                  {t.paradas[id]}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Link href={volverA} data-vidrio className="boton vidrio vidrio-pildora boton-vidrio hidden min-h-[42px] text-[14px] lg:inline-flex">
            <span aria-hidden className="flecha flecha-izq">←</span> {t.nav.volver}
          </Link>
        )}

        <div className="flex items-center gap-2 justify-self-end">
          {!enHome && (
            <Link href={volverA} data-vidrio className="boton vidrio vidrio-pildora boton-vidrio min-h-[44px] px-[18px] text-[14px] lg:hidden">
              <span aria-hidden className="flecha flecha-izq">←</span> {t.nav.volver}
            </Link>
          )}
          {enHome && (
            <button
              type="button"
              ref={boton}
              onClick={() => setAbierta((v) => !v)}
              aria-expanded={abierta}
              aria-controls="hoja-secciones"
              data-vidrio
              className="boton vidrio vidrio-pildora boton-vidrio min-h-[44px] px-[18px] text-[14px] lg:hidden"
            >
              {abierta ? t.nav.cerrar : t.nav.menu}
            </button>
          )}
          <a
            href={href("contacto")}
            onClick={(e) => ir(e, "contacto")}
            className="boton boton-solido min-h-[44px] px-[18px] text-[14px]"
          >
            {t.nav.hablemos}
          </a>
        </div>

        {abierta && (
          <div
            ref={hoja}
            id="hoja-secciones"
            data-vidrio
            className="vidrio absolute top-[68px] right-4 left-4 p-2 lg:hidden"
          >
            <ul>
              {paradas.map((id) => (
                <li key={id}>
                  <a
                    href={href(id)}
                    onClick={(e) => ir(e, id)}
                    aria-current={activa === id ? "location" : undefined}
                    className={cn(
                      "flex min-h-[48px] items-center rounded-2xl px-4 text-[17px]",
                      activa === id ? "bg-[var(--activo)] font-semibold" : "font-medium",
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
