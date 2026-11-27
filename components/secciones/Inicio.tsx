"use client";
import { useRef } from "react";
import Image from "next/image";
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/**
 * El inicio: el nombre a pantalla entera y la foto delante. Queda fijo mientras
 * se scrollea: "Felipe" se va a la izquierda y adelgaza, "Doval" se va a la
 * derecha y engorda (el peso pasa de una palabra a la otra), y después
 * Proyectos sube y lo tapa.
 */
export function Inicio() {
  const { perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        // entrada sin opacidad: si el navegador frena la animación, igual se ve todo
        gsap.from(".inicio-nombre span", { yPercent: 35, duration: 0.9, ease: "power3.out", stagger: 0.1 });
        gsap.from(".inicio-foto", { yPercent: 10, duration: 1, ease: "power3.out" });

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: raiz.current, start: "top top", end: "bottom bottom", scrub: true },
          })
          .to(".n1", { xPercent: -42, fontWeight: 100 }, 0)
          .to(".n2", { xPercent: 42, fontWeight: 900 }, 0)
          .to(".inicio-foto", { scale: 1.22 }, 0)
          .to(".inicio-dato", { opacity: 0, duration: 0.15 }, 0);
      });
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="inicio" data-tema="amarillo" className="inicio">
      <div className="inicio-fija">
        <h1 className="inicio-nombre gigante" aria-label={perfil.nombre}>
          <span className="n1" aria-hidden>
            Felipe
          </span>
          <span className="n2" aria-hidden>
            Doval
          </span>
        </h1>
        <Image
          className="inicio-foto"
          src="/assets/fotos/apoyado.webp"
          alt="Felipe Doval, de brazos cruzados"
          width={1414}
          height={1404}
          sizes="(max-width: 767px) 120vw, 70vh"
          priority
        />
        <p className="inicio-dato left-[var(--margen)]">{perfil.rol}</p>
        <p className="inicio-dato right-[var(--margen)]">{perfil.ubicacion}</p>
      </div>
    </section>
  );
}
