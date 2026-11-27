"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

const RAYOS = Array.from({ length: 16 }, (_, i) => i);

/**
 * El inicio es la bandera: celeste, blanco y celeste. El nombre va en la
 * franja blanca y el sol asoma atrás del retrato. Queda fijo mientras se
 * scrollea: el sol gira y sube, y después la franja blanca se abre hasta
 * ocupar la pantalla, que es el fondo de la sección que sigue.
 */
export function Inicio() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const [nombre, apellido] = perfil.nombre.split(" ");

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: raiz.current, start: "top top", end: "bottom bottom", scrub: true },
          })
          .to(".sol-rayos", { rotation: 135, svgOrigin: "50 50", duration: 1 }, 0)
          .to(".sol", { yPercent: -14, scale: 1.12, duration: 0.45 }, 0)
          .to(".retrato", { scale: 1.06, duration: 0.45 }, 0)
          .to(".franja", { clipPath: "inset(0% 0 0% 0)", duration: 0.4 }, 0.45)
          .to(".retrato", { yPercent: 62, duration: 0.4 }, 0.45)
          .to(".sol", { scale: 0, duration: 0.3 }, 0.5);
      });
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="inicio" data-tema="celeste" className="inicio">
      <div className="inicio-fija" data-tema="celeste">
        <p className="inicio-dato arriba">{perfil.rol}</p>
        <p className="inicio-dato abajo">{perfil.ubicacion}</p>
        <div className="franja" />
        <svg className="sol" viewBox="0 0 100 100" aria-hidden>
          <g className="sol-rayos">
            {RAYOS.map((i) => (
              <polygon key={i} points={i % 2 ? "50,10 52.6,27 47.4,27" : "50,3 53,27 47,27"} transform={`rotate(${i * 22.5} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="21" />
        </svg>
        <div className="inicio-banda">
          <div className="cont">
            <h1 className="t-nombre inicio-nombre">
              {nombre}
              <br />
              <span className="serif">{apellido}</span>
            </h1>
            <div className="inicio-desc">
              <p className="t-lead">{perfil.presentacion}</p>
              <Link href="/#trabajo" className="boton mt-5">
                {t.inicio.verTrabajo}
              </Link>
            </div>
          </div>
        </div>
        <div className="retrato">
          <Image src="/assets/fotos/apoyado.webp" alt="Felipe Doval" width={1414} height={1404} sizes="(max-width: 899px) 60vh, 82vh" priority />
        </div>
      </div>
    </section>
  );
}
