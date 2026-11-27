"use client";
import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { CON_MOVIMIENTO, entradas, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha, Titulo } from "@/components/ui/Titulo";

const TEMAS = ["noche", "celeste", "cielo"];

/**
 * Trabajo: lo hecho en Taquion, en tres tarjetas que se apilan. Cada una queda
 * fija arriba y la siguiente sube y la tapa; la tapada se achica un poco.
 */
export function Trabajo() {
  const { t, proyectos } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const lista = proyectos.filter((p) => p.grupo === "trabajo");

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        entradas(raiz.current!);
        const tarjetas = gsap.utils.toArray<HTMLElement>(".tarjeta");
        tarjetas.slice(0, -1).forEach((tarjeta, i) => {
          gsap.to(tarjeta, {
            scale: 0.93,
            ease: "none",
            scrollTrigger: { trigger: tarjetas[i + 1], start: "top bottom", end: "top 20%", scrub: true },
          });
        });
      });
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="trabajo" data-tema="blanco" className="seccion">
      <div className="cont">
        <div className="cabeza">
          <Titulo texto={t.titulos.trabajo} />
          <p className="t-lead">{t.trabajo.bajada}</p>
        </div>
        {lista.map((p, i) => (
          <article key={p.slug} data-tema={TEMAS[i % TEMAS.length]} className="tarjeta corte" style={{ "--i": i } as CSSProperties}>
            <div className="tarjeta-texto">
              <p className="etiqueta">{p.estado}</p>
              <h3 className="t-sub">{p.nombre}</h3>
              <p>{p.unaLinea}</p>
              <dl className="ficha">
                <div>
                  <dt className="etiqueta">{t.proyectos.rol}</dt>
                  <dd>{p.rol}</dd>
                </div>
                <div>
                  <dt className="etiqueta">{t.proyectos.stack}</dt>
                  <dd>{p.stack.join(", ")}</dd>
                </div>
              </dl>
              <p className="acciones">
                <Link href={`/proyectos/${p.slug}`} className="boton">
                  {t.proyectos.verCaso}
                </Link>
                {p.sitio && (
                  <a href={p.sitio} target="_blank" rel="noreferrer" className="enlace">
                    {t.proyectos.verSitio} <Flecha />
                  </a>
                )}
              </p>
            </div>
            <Link href={`/proyectos/${p.slug}`} className="captura corte" aria-label={`${p.nombre}, ${t.proyectos.verCaso}`}>
              <Image src={p.capturas[0].src} alt={p.capturas[0].alt} width={p.capturas[0].w} height={p.capturas[0].h} sizes="(max-width: 899px) 90vw, 52vw" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
