"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CON_MOVIMIENTO, entradas, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha, Titulo } from "@/components/ui/Titulo";
import type { Proyecto } from "@/content/types";

/**
 * Proyectos: dos columnas desfasadas. Con el scroll la derecha sube más rápido
 * que la izquierda, y cada captura se destapa al entrar.
 */
export function Proyectos() {
  const { t, proyectos } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const lista = proyectos.filter((p) => p.grupo === "proyecto");
  const columnas = [lista.filter((_, i) => i % 2 === 0), lista.filter((_, i) => i % 2 === 1)];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(CON_MOVIMIENTO, () => entradas(raiz.current!));
      mm.add(`${CON_MOVIMIENTO} and (min-width: 900px)`, () => {
        gsap.fromTo(
          ".columna + .columna",
          { y: 70 },
          { y: -90, ease: "none", scrollTrigger: { trigger: ".grilla", start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: raiz },
  );

  const pieza = (p: Proyecto) => {
    const destino = p.caso ? `/proyectos/${p.slug}` : p.repo!;
    const foto = (
      <span data-abre className="block h-full">
        <Image src={p.capturas[0].src} alt={p.capturas[0].alt} width={p.capturas[0].w} height={p.capturas[0].h} sizes="(max-width: 899px) 90vw, 44vw" />
      </span>
    );
    return (
      <article key={p.slug} className="pieza">
        {p.caso ? (
          <Link href={destino} className="captura corte" aria-label={`${p.nombre}, ${t.proyectos.verCaso}`}>
            {foto}
          </Link>
        ) : (
          <a href={destino} target="_blank" rel="noreferrer" className="captura corte" aria-label={`${p.nombre}, GitHub`}>
            {foto}
          </a>
        )}
        <h3 className="t-sub">{p.nombre}</h3>
        <p>{p.unaLinea}</p>
        <p className="stack-linea">{p.stack.join(", ")}</p>
        {p.caso ? (
          <Link href={destino} className="enlace">
            {t.proyectos.verCaso}
          </Link>
        ) : (
          <a href={destino} target="_blank" rel="noreferrer" className="enlace">
            GitHub <Flecha />
          </a>
        )}
      </article>
    );
  };

  return (
    <section ref={raiz} id="proyectos" data-tema="cielo" className="seccion">
      <div className="cont">
        <div className="cabeza">
          <Titulo texto={t.titulos.proyectos} />
        </div>
        <div className="grilla">
          {columnas.map((columna, i) => (
            <div key={i} className="columna">
              {columna.map(pieza)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
