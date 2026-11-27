"use client";
import { useRef } from "react";
import Image from "next/image";
import { CON_MOVIMIENTO, engordar, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Peso } from "@/components/ui/Peso";

/**
 * Sobre mí: cuatro datos. Qué hace (el texto se entinta palabra por palabra
 * con el scroll), dónde (la foto de Buenos Aires se abre de una ventana a la
 * pantalla entera), con qué (dos cintas de stack que corren en sentidos
 * opuestos) y por dónde pasó (el recorrido, en filas).
 */
export function SobreMi() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const mitad = Math.ceil(perfil.stack.length / 2);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        engordar(raiz.current!);
        gsap.fromTo(
          ".sobre-bio span",
          { color: "#d6a200" },
          {
            color: "#15120e",
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ".sobre-bio", start: "top 82%", end: "bottom 55%", scrub: true },
          },
        );
        const cintas = { trigger: ".cintas", start: "top bottom", end: "bottom top", scrub: true };
        gsap.fromTo(".cinta-a", { xPercent: 4 }, { xPercent: -34, ease: "none", scrollTrigger: cintas });
        gsap.fromTo(".cinta-b", { xPercent: -38 }, { xPercent: 0, ease: "none", scrollTrigger: cintas });
        gsap.fromTo(
          ".ciudad-foto",
          { clipPath: "inset(26% 30% 14% 30%)", scale: 1.3 },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none", scrollTrigger: { trigger: ".ciudad", start: "top top", end: "bottom bottom", scrub: true } },
        );
        gsap.fromTo(
          ".sobre-foto",
          { yPercent: 14 },
          { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".sobre-cuerpo", start: "top bottom", end: "bottom bottom", scrub: true } },
        );
      });
    },
    { scope: raiz, dependencies: [perfil], revertOnUpdate: true },
  );

  const cinta = (items: string[], clase: string) => (
    <p className={`cinta gigante ${clase}`}>
      {/* dos vueltas: la cinta es más ancha que la pantalla aunque se corra */}
      {[...items, ...items].map((s, i) => (
        <span key={i} aria-hidden={i >= items.length || undefined}>
          {s}
        </span>
      ))}
    </p>
  );

  return (
    <section ref={raiz} id="sobre-mi" data-tema="amarillo" className="sobre">
      <h2 className="gigante titulo">
        <Peso>{t.secciones["sobre-mi"]}</Peso>
      </h2>
      <div className="sobre-cuerpo">
        <p className="sobre-bio">
          {perfil.bio.split(" ").map((palabra, i) => (
            <span key={i}>{palabra} </span>
          ))}
        </p>
        <Image
          className="sobre-foto"
          src="/assets/fotos/piensa.webp"
          alt=""
          width={1170}
          height={1404}
          sizes="(max-width: 767px) 78vw, 27vw"
        />
      </div>

      <div className="ciudad">
        <div className="ciudad-fija">
          <Image
            className="ciudad-foto"
            src="/assets/fotos/buenos-aires.webp"
            alt="La avenida 9 de Julio y el Obelisco, en Buenos Aires"
            fill
            sizes="100vw"
          />
          <p className="ciudad-nombre gigante">
            <Peso>{perfil.ubicacion}</Peso>
          </p>
        </div>
      </div>

      <div className="cintas">
        <h3 className="dato">{t.sobre.stack}</h3>
        {cinta(perfil.stack.slice(0, mitad), "cinta-a")}
        {cinta(perfil.stack.slice(mitad), "cinta-b")}
      </div>

      <div className="sobre-bloque">
        <h3 className="dato">{t.sobre.recorrido}</h3>
        <ol className="recorrido">
          {perfil.recorrido.map((r) => (
            <li key={r.lugar}>
              <span className="recorrido-lugar">{r.lugar}</span>
              <span className="recorrido-dato">
                {r.titulo}. {r.detalle}.
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
