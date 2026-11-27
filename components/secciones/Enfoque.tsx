"use client";
import { useRef } from "react";
import { CON_MOVIMIENTO, entradas, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Titulo } from "@/components/ui/Titulo";

/**
 * Enfoque: cuatro pasos, una línea cada uno. El sol baja por la línea con el
 * scroll y cada paso se enciende cuando el sol llega.
 */
export function Enfoque() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        entradas(raiz.current!);
        const lista = raiz.current!.querySelector<HTMLElement>(".pasos")!;
        const tramo = { trigger: lista, start: "top 62%", end: "bottom 62%", scrub: true };
        gsap.fromTo(".pasos-avance", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: tramo });
        gsap.fromTo(
          ".pasos-sol",
          { y: 0 },
          { y: () => lista.offsetHeight - 28, ease: "none", scrollTrigger: { ...tramo, invalidateOnRefresh: true } },
        );
        gsap.utils.toArray<HTMLElement>(".paso h3").forEach((h) => {
          gsap.fromTo(
            h,
            { color: "#52698a" },
            { color: "#f5f7f9", ease: "none", scrollTrigger: { trigger: h, start: "top 66%", end: "top 58%", scrub: true } },
          );
        });
      });
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="enfoque" data-tema="noche" className="seccion">
      <div className="cont enfoque-grilla">
        <Titulo texto={t.titulos.enfoque} />
        <div className="pasos">
          <span className="pasos-avance" aria-hidden />
          <span className="pasos-sol" aria-hidden />
          <ol>
            {perfil.enfoque.map((p) => (
              <li key={p.palabra} className="paso">
                <h3 className="t-sub">{p.palabra}</h3>
                <p>{p.linea}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
