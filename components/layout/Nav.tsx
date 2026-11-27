"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { secciones } from "@/content/ui";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";

/**
 * La nav: el nombre y las secciones, sin fondo. Toma el color del campo que
 * tiene debajo (cada sección declara su `data-tema`) y marca la sección que
 * cruza el centro de la pantalla. Arriba, una línea que se llena con el scroll.
 */
export function Nav() {
  const { t } = useIdioma();
  const ruta = usePathname();
  const { scrollTo } = useSmoothScroll();
  const nav = useRef<HTMLElement>(null);
  const progreso = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState("");

  useEffect(() => {
    let cuadro = 0;
    const leer = () => {
      cuadro = 0;
      const yo = nav.current;
      if (!yo) return;
      // lo que se ve de verdad en ese punto: con secciones fijas y tapadas, el
      // orden del documento no alcanza
      const bajo = (y: number) =>
        document.elementsFromPoint(innerWidth / 2, y).find((e) => !yo.contains(e) && e !== progreso.current);
      const tema = bajo(yo.offsetHeight / 2)?.closest<HTMLElement>("[data-tema]")?.dataset.tema;
      if (tema) document.documentElement.dataset.nav = tema;
      setActiva(bajo(innerHeight / 2)?.closest("section[id]")?.id ?? "");
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

  useGSAP(
    () => {
      gsap.to(progreso.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: true },
      });
    },
    { dependencies: [ruta], revertOnUpdate: true },
  );

  // En la home el enlace desliza hasta la sección; desde un caso, navega.
  const ir = (e: React.MouseEvent, id: string) => {
    const destino = document.getElementById(id);
    if (!destino) return;
    e.preventDefault();
    scrollTo(destino);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <div ref={progreso} className="nav-progreso" aria-hidden />
      <header ref={nav} className="nav">
        <Link href="/" className="nav-marca" aria-label={t.nav.inicio} onClick={(e) => ir(e, "inicio")}>
          <span className="max-sm:hidden">Felipe Doval</span>
          <span className="sm:hidden">FD</span>
        </Link>
        <nav aria-label={t.nav.aria}>
          <ul className="nav-lista">
            {secciones.slice(1).map((id) => (
              <li key={id}>
                <Link href={`/#${id}`} aria-current={activa === id || undefined} onClick={(e) => ir(e, id)}>
                  {t.secciones[id]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
