"use client";
import { ArrowDown } from "lucide-react";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { CopiarMail } from "@/components/ui/CopiarMail";
import { guion } from "@/content/guia";
import { ConEnlace, Filete } from "./comun";

/**
 * INICIO. En 10 segundos tiene que quedar claro: quién es (el nombre), qué
 * hace (rol + bajada), qué está haciendo ahora (Superlum, en el globo) y cómo
 * escribirle (copiar el mail). Y la cuarta cosa que ningún template contesta:
 * cómo es él. Feli apoyado en la pileta, subiendo del líquido al cargar.
 */
export function Inicio() {
  const { perfil, t, idioma } = useIdioma();
  const g = guion[idioma].paradas.inicio;
  const { scrollTo } = useSmoothScroll();

  return (
    <section
      id="inicio"
      aria-labelledby="inicio-titulo"
      className="relative"
      data-gotas="0.93 0.3 205 0; 1.03 0.74 150 1; -0.03 1.04 128 0; 0.36 1.1 100 1; 0.64 0.1 40 0"
      data-gotas-m="1.08 0.78 200 0; -0.1 1.04 150 1; 1.0 0.12 48 1"
    >
      <div className="contenedor grid [&>*]:min-w-0 gap-y-6 pt-24 lg:min-h-[100svh] lg:grid-cols-12 lg:pt-20">
        <div className="pb-4 lg:col-span-7 lg:self-center lg:pb-0">
          <h1 id="inicio-titulo" className="script nombre-hero outline-none" aria-label={perfil.nombre}>
            <span aria-hidden className="block">
              Felipe
            </span>{" "}
            <span aria-hidden className="block pl-[0.5em]">
              Doval
            </span>
          </h1>
          <Filete className="mt-1 -ml-2 w-[86%]" />
          <p className="rol mt-5 max-w-[28ch]">{perfil.hero.kicker}</p>
          <p className="lead mt-3 max-w-[46ch]">{perfil.hero.lead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href="#perfil"
              onClick={(e) => {
                e.preventDefault();
                const destino = document.getElementById("perfil");
                if (destino) scrollTo(destino);
              }}
              data-vidrio
              data-gotas="1.02 0.78 34 1"
              className="vidrio vidrio-pildora boton-vidrio"
            >
              {t.hero.empezar}
              <ArrowDown className="size-[18px]" aria-hidden strokeWidth={2.4} />
            </a>
            <CopiarMail parada="inicio" />
          </div>
        </div>

        <div className="relative mt-4 lg:col-span-5 lg:mt-0 lg:self-end">
          <Globo
            parada="inicio"
            className="absolute top-[8%] left-0 z-10 max-w-[54%] sm:max-w-[22rem] lg:top-[-30%] lg:right-[-2%] lg:left-auto lg:max-w-[21rem]"
            gotas="0.78 0.62 76 0"
          >
            <ConEnlace frase={g.frase} palabra="Superlum" href="#trabajo" />
          </Globo>
          <Feli
            pose={g.pose}
            parada="inicio"
            intro
            className="ml-auto w-[50%] max-w-[300px] sm:max-w-[360px] lg:h-[min(68svh,620px)] lg:w-auto lg:max-w-none lg:translate-x-[6%]"
            sizes="(max-width: 1024px) 60vw, 640px"
          />
        </div>
      </div>
    </section>
  );
}
