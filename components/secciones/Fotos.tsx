"use client";
import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/lib/gsap";
import { altoLienzo } from "@/content/fotos";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Peso } from "@/components/ui/Peso";

/**
 * Fotos: la palabra queda fija en el centro y las fotos le pasan por delante,
 * cada una a su velocidad (las de más `vel` se adelantan al scroll). En
 * escritorio están sueltas sobre un lienzo; en el celular, una bajo la otra.
 */
export function Fotos() {
  const { t, fotos } = useIdioma();
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        gsap.fromTo(
          "[data-peso]",
          { fontWeight: 100 },
          { fontWeight: 900, ease: "none", scrollTrigger: { trigger: raiz.current, start: "top 60%", end: "bottom bottom", scrub: true } },
        );
        gsap.utils.toArray<HTMLElement>(".foto").forEach((foto) => {
          const vel = Number(foto.dataset.vel);
          gsap.fromTo(
            foto,
            { y: vel * 160 },
            { y: vel * -160, ease: "none", scrollTrigger: { trigger: foto, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });
      });
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="fotos" data-tema="papel" className="fotos">
      <div className="fotos-fija">
        <h2 className="gigante">
          <Peso>{t.secciones.fotos}</Peso>
        </h2>
      </div>
      <div className="lienzo" style={{ "--alto": altoLienzo } as CSSProperties}>
        {fotos.map((f) => (
          <figure
            key={f.src}
            className={f.fondo ? "foto foto-recorte" : "foto"}
            data-vel={f.vel}
            style={{ "--x": f.x, "--y": f.y, "--w": f.ancho } as CSSProperties}
          >
            <div className="foto-marco" data-fondo={f.fondo}>
              <Image src={f.src} alt={f.alt} width={f.w} height={f.h} sizes={`(max-width: 767px) 80vw, ${f.ancho}vw`} />
            </div>
            {f.pie && <figcaption>{f.pie}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
