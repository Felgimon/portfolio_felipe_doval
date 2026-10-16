"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { Feli } from "@/components/guia/Feli";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { CopiarMail } from "@/components/ui/CopiarMail";

/**
 * INICIO. En 10 segundos: quién es (el nombre, enorme), qué hace (rol y
 * bajada), qué está haciendo ahora (Superlum, en el panel ámbar) y cómo
 * escribirle. La gota se apoya entre la O y la V de "Doval" y sigue al mouse
 * de lejos.
 */
export function Inicio() {
  const { perfil, t } = useIdioma();
  const { scrollTo } = useSmoothScroll();

  return (
    <section
      id="inicio"
      aria-labelledby="inicio-titulo"
      className="relative flex flex-col px-4 pt-[104px] md:block md:h-[100svh] md:max-h-[1000px] md:min-h-[640px] md:p-0"
      data-gota="0.41 0.7 0.115"
      data-gota-m="0.4 0.66 0.085"
    >
      <Cianotipo nombre="musica" />
      <h1
        id="inicio-titulo"
        data-placa
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

      <div
        data-vidrio
        className="vidrio relative order-3 -mt-24 mb-8 p-[18px_20px] md:absolute md:right-[var(--margen)] md:bottom-14 md:m-0 md:w-[300px]"
      >
        <p className="etiqueta">
          <span className="punto" aria-hidden />
          {t.hero.ahora}
        </p>
        <p className="mt-2 text-[16px] leading-[1.42]">{t.hero.ahoraTexto}</p>
      </div>
    </section>
  );
}
