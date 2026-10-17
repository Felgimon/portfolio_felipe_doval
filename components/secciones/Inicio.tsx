"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { Feli } from "@/components/guia/Feli";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { CopiarMail } from "@/components/ui/CopiarMail";

/**
 * INICIO. En 10 segundos: quién es (el nombre, enorme), qué hace (rol y
 * bajada) y cómo escribirle. Es la única sección con una foto de Felipe (v8.1).
 * Tres burbujas: la grande entre la O y la V de "Doval" (sigue al mouse de
 * lejos) y dos más chicas en el aire de la portada.
 */
export function Inicio() {
  const { perfil, t } = useIdioma();
  const { scrollTo } = useSmoothScroll();

  return (
    <section
      id="inicio"
      aria-labelledby="inicio-titulo"
      className="relative flex flex-col px-4 pt-[104px] md:block md:h-[100svh] md:max-h-[1000px] md:min-h-[640px] md:p-0"
      data-burbujas="0.58 0.24 0.05; 0.5 0.86 0.026"
      data-burbujas-m="0.84 0.3 0.04"
    >
      <Cianotipo nombre="musica" className="max-md:w-[200%]" />
      <h1
        id="inicio-titulo"
        data-placa
        data-burbujas="0.41 0.7 0.115 0.12"
        data-burbujas-m="0.4 0.66 0.085 0"
        aria-label={perfil.nombre}
        className="placa nombre-hero outline-none md:absolute md:top-[17vh] md:left-[var(--margen)]"
      >
        <span aria-hidden>Felipe</span>
        <span aria-hidden>Doval</span>
      </h1>

      <Feli
        pose="inicio"
        prioridad
        sizes="(max-width: 760px) 92vw, 60vw"
        className="order-2 mt-2 w-[92%] self-end md:absolute md:right-[1vw] md:bottom-0 md:mt-0 md:h-[78vh] md:w-auto"
      />

      <div className="order-1 mt-7 md:absolute md:bottom-14 md:left-[var(--margen)] md:mt-0 md:max-w-[560px]">
        <p className="etiqueta">{perfil.hero.kicker}</p>
        <p className="lead mt-3.5">{perfil.hero.lead}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#trabajo"
            onClick={(e) => {
              e.preventDefault();
              const destino = document.getElementById("trabajo");
              if (destino) scrollTo(destino);
            }}
            className="boton boton-solido"
          >
            {t.hero.verTrabajo} <span aria-hidden className="flecha flecha-abajo">↓</span>
          </a>
          <CopiarMail ficha="derecha" />
        </div>
      </div>
    </section>
  );
}
