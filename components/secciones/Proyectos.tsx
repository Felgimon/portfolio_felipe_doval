"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CON_MOVIMIENTO, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha, Peso } from "@/components/ui/Peso";

/**
 * Proyectos: un carril horizontal. La sección queda fija y el scroll vertical
 * mueve la pista hacia la izquierda, un píxel por píxel; el alto del carril se
 * calcula del ancho de la pista. Cada captura se destapa al entrar y se
 * desplaza un poco más lento que su marco.
 */
export function Proyectos() {
  const { t, proyectos } = useIdioma();
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        const carril = raiz.current!.querySelector<HTMLElement>(".carril")!;
        const pista = raiz.current!.querySelector<HTMLElement>(".pista")!;
        const recorrido = () => pista.scrollWidth - window.innerWidth;
        const medir = () => gsap.set(carril, { height: window.innerHeight + recorrido() });
        medir();
        ScrollTrigger.addEventListener("refreshInit", medir);

        const tramo = { trigger: carril, start: "top top", end: "bottom bottom", scrub: true };
        const avance = gsap.to(pista, {
          x: () => -recorrido(),
          ease: "none",
          scrollTrigger: { ...tramo, invalidateOnRefresh: true },
        });
        gsap.fromTo(".carril-progreso i", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: tramo });

        // el título engorda mientras la sección sube sobre el inicio
        gsap.fromTo(
          ".pista-titulo [data-peso]",
          { fontWeight: 100 },
          { fontWeight: 900, ease: "none", scrollTrigger: { trigger: raiz.current, start: "top bottom", end: "top top", scrub: true } },
        );

        gsap.utils.toArray<HTMLElement>(".pieza").forEach((pieza) => {
          const enPista = { trigger: pieza, containerAnimation: avance, scrub: true };
          gsap.fromTo(
            pieza.querySelector(".pieza-captura"),
            { clipPath: "inset(0 0 0 100%)" },
            { clipPath: "inset(0 0 0 0%)", ease: "none", scrollTrigger: { ...enPista, start: "left 98%", end: "left 45%" } },
          );
          gsap.fromTo(
            pieza.querySelector("img"),
            { xPercent: -5 },
            { xPercent: 5, ease: "none", scrollTrigger: { ...enPista, start: "left right", end: "right left" } },
          );
        });

        return () => ScrollTrigger.removeEventListener("refreshInit", medir);
      });
    },
    { scope: raiz, dependencies: [proyectos], revertOnUpdate: true },
  );

  return (
    <section ref={raiz} id="proyectos" data-tema="tinta" className="proyectos">
      <div className="carril">
        <div className="carril-fijo">
          <div className="pista">
            <h2 className="pista-titulo gigante">
              <Peso>{t.secciones.proyectos}</Peso>
            </h2>
            {proyectos.map((p) => {
              const caso = p.categoria === "destacado";
              const captura = p.capturas[0];
              const foto = (
                <Image src={captura.src} alt={captura.alt} width={1600} height={1000} sizes="(max-width: 767px) 95vw, 60vw" />
              );
              return (
                <article key={p.slug} className="pieza">
                  <h3 className="pieza-nombre gigante">{p.nombre}</h3>
                  {caso ? (
                    <Link href={`/proyectos/${p.slug}`} className="pieza-captura" aria-label={`${p.nombre}, ${t.proyectos.verCaso}`}>
                      {foto}
                    </Link>
                  ) : (
                    <div className="pieza-captura">{foto}</div>
                  )}
                  <div className="pieza-info">
                    <p className="pieza-linea">{p.unaLinea}</p>
                    <dl className="pieza-datos">
                      <div>
                        <dt className="dato">{t.proyectos.rol}</dt>
                        <dd>{p.rol}</dd>
                      </div>
                      {p.stack.length > 0 && (
                        <div>
                          <dt className="dato">{t.proyectos.stack}</dt>
                          <dd>{p.stack.join(", ")}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="pieza-enlaces">
                      {caso && (
                        <Link href={`/proyectos/${p.slug}`} className="enlace">
                          {t.proyectos.verCaso}
                        </Link>
                      )}
                      {p.enlaces.map((e) => (
                        <a key={e.url} href={e.url} target="_blank" rel="noreferrer" className="enlace">
                          GitHub <Flecha />
                        </a>
                      ))}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="carril-progreso" aria-hidden>
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}
