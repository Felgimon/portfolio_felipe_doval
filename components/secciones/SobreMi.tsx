"use client";
import { useRef } from "react";
import Image from "next/image";
import { CON_MOVIMIENTO, entradas, gsap, useGSAP } from "@/lib/gsap";
import { stack } from "@/content/stack";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Titulo } from "@/components/ui/Titulo";

const mitad = Math.ceil(stack.length / 2);

/**
 * Sobre mí: quién es, en cuatro datos; el stack, en dos cintas de logos que
 * corren en sentidos opuestos con el scroll; y Buenos Aires, que se abre de
 * una ventana a la pantalla entera.
 */
export function SobreMi() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        entradas(raiz.current!);
        const cintas = { trigger: ".stack", start: "top bottom", end: "bottom top", scrub: true };
        gsap.fromTo(".cinta-a", { xPercent: 0 }, { xPercent: -22, ease: "none", scrollTrigger: cintas });
        gsap.fromTo(".cinta-b", { xPercent: -24 }, { xPercent: -2, ease: "none", scrollTrigger: cintas });
        gsap.fromTo(
          ".ciudad-foto",
          { clipPath: "inset(24% 26% 20% 26%)", scale: 1.25 },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none", scrollTrigger: { trigger: ".ciudad", start: "top top", end: "bottom bottom", scrub: true } },
        );
      });
    },
    { scope: raiz, dependencies: [perfil], revertOnUpdate: true },
  );

  const cinta = (items: typeof stack, clase: string) => (
    <ul className={`cinta ${clase}`}>
      {/* tres vueltas: la cinta es más ancha que la pantalla aunque se corra */}
      {[...items, ...items, ...items].map((s, i) => (
        <li key={i} className="chip" aria-hidden={i >= items.length || undefined}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d={s.d} />
          </svg>
          {s.nombre}
        </li>
      ))}
    </ul>
  );

  return (
    <section ref={raiz} id="sobre-mi" data-tema="blanco">
      <div className="seccion">
        <div className="cont sobre-grilla">
          <div className="sobre-foto corte">
            <div data-abre>
              <Image src="/assets/fotos/piensa.webp" alt="Felipe con la cara apoyada en la mano" width={1170} height={1404} sizes="(max-width: 899px) 80vw, 34vw" />
            </div>
          </div>
          <div className="sobre-texto">
            <Titulo texto={t.titulos["sobre-mi"]} />
            <p className="t-lead">{perfil.bio}</p>
            <dl className="datos">
              {perfil.datos.map(([etiqueta, texto]) => (
                <div key={etiqueta}>
                  <dt className="etiqueta">{etiqueta}</dt>
                  <dd>{texto}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="stack">
          <div className="cont">
            <h3 className="etiqueta">{t.sobre.stack}</h3>
          </div>
          {cinta(stack.slice(0, mitad), "cinta-a")}
          {cinta(stack.slice(mitad), "cinta-b")}
        </div>
      </div>

      <div className="ciudad">
        <div className="ciudad-fija">
          <Image
            className="ciudad-foto"
            src="/assets/fotos/nueve-de-julio.webp"
            alt="La avenida 9 de Julio y el Obelisco, en Buenos Aires"
            fill
            sizes="100vw"
          />
          <p className="ciudad-nombre t-nombre">
            Buenos <span className="serif">Aires</span>
          </p>
        </div>
      </div>
    </section>
  );
}
