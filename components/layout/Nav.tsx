"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { secciones } from "@/content/ui";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";

const enLista = secciones.filter((id) => id !== "inicio" && id !== "contacto");

/**
 * La cabecera: una sola barra, siempre igual, en todas las secciones y todas
 * las páginas. El punto amarillo marca la sección que cruza el centro de la
 * pantalla. En el celular las secciones van en una hoja que abre "Menú".
 */
export function Nav() {
  const { t } = useIdioma();
  const ruta = usePathname();
  const { scrollTo } = useSmoothScroll();
  const cab = useRef<HTMLElement>(null);
  const [activa, setActiva] = useState("");
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    let cuadro = 0;
    const leer = () => {
      cuadro = 0;
      // lo que se ve de verdad en el centro: con secciones fijas y apiladas,
      // el orden del documento no alcanza
      const bajo = document.elementsFromPoint(innerWidth / 2, innerHeight / 2).find((e) => !cab.current?.contains(e));
      setActiva(bajo?.closest("section[id]")?.id ?? "");
    };
    const pedir = () => {
      cuadro ||= requestAnimationFrame(leer);
    };
    leer();
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(cuadro);
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
    };
  }, [ruta]);

  // En la home el enlace desliza hasta la sección; desde un caso, navega.
  const ir = (e: React.MouseEvent, id: string) => {
    setAbierta(false);
    const destino = document.getElementById(id);
    if (!destino) return;
    e.preventDefault();
    scrollTo(destino);
    history.replaceState(null, "", id === "inicio" ? "/" : `#${id}`);
  };

  const enlace = (id: (typeof secciones)[number], clase?: string) => (
    <Link href={`/#${id}`} className={clase} aria-current={activa === id || undefined} onClick={(e) => ir(e, id)}>
      {t.secciones[id]}
    </Link>
  );

  return (
    <header ref={cab} className="cab">
      <nav className="cab-barra" aria-label={t.nav.aria}>
        <Link href="/" className="cab-marca" aria-label={t.nav.inicio} onClick={(e) => ir(e, "inicio")}>
          Felipe Doval
        </Link>
        <ul className="cab-lista">
          {enLista.map((id) => (
            <li key={id}>{enlace(id)}</li>
          ))}
        </ul>
        {enlace("contacto", "boton cab-contacto")}
        <button
          type="button"
          className="boton cab-menu"
          aria-expanded={abierta}
          aria-controls="hoja-secciones"
          onClick={() => setAbierta((v) => !v)}
        >
          {abierta ? t.nav.cerrar : t.nav.menu}
        </button>
      </nav>
      {abierta && (
        <ul id="hoja-secciones" className="cab-hoja">
          {secciones.slice(1).map((id) => (
            <li key={id}>{enlace(id)}</li>
          ))}
        </ul>
      )}
    </header>
  );
}
