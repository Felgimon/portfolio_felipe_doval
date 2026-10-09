"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { CopiarMail } from "@/components/ui/CopiarMail";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { guion } from "@/content/guia";
import { TituloParada } from "./comun";

/**
 * CONTACTO. Fin de la visita. Sin formulario falso: copiar el mail (se arma
 * recién al tocar), GitHub y LinkedIn. Al copiar, Feli lo comenta.
 */
export function Contacto() {
  const { perfil, t, idioma } = useIdioma();
  const g = guion[idioma].paradas.contacto;

  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="parada pb-10"
      data-gotas="0.12 0.9 180 0; 0.44 1.0 140 1; 0.86 0.94 200 0; 1.02 0.3 90 1"
      data-gotas-m="-0.1 1.0 120 0; 1.1 0.98 140 1"
    >
      <div className="contenedor grid [&>*]:min-w-0 items-end gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TituloParada id="contacto-titulo">{t.paradas.contacto}</TituloParada>
          <p className="lead mt-6 max-w-[48ch] text-[18px] text-tinta">{t.contacto.lead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <CopiarMail parada="contacto" vidrio gotas="0.85 0.55 62 1" />
            <a href={perfil.links.github} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2">
              <BrandIcon name="github" className="size-[18px]" />
              @Felgimon
            </a>
            <a href={perfil.links.linkedin} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2">
              <BrandIcon name="linkedin" className="size-[18px]" />
              LinkedIn
            </a>
          </div>
        </div>
        <div className="relative flex flex-col items-end gap-3 sm:flex-row sm:justify-end sm:gap-4 lg:col-span-5">
          <Globo parada="contacto" className="self-start sm:mb-[30%] sm:self-auto lg:min-w-[15rem]" gotas="0.2 0.6 76 1">
            {g.frase}
          </Globo>
          <Feli pose={g.pose} parada="contacto" className="h-[clamp(170px,34vh,320px)] w-auto shrink-0" />
        </div>
      </div>
    </section>
  );
}
