"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { CopiarMail } from "@/components/ui/CopiarMail";
import { TituloSeccion } from "./comun";

/**
 * CONTACTO. Sin formulario falso: copiar el mail (se arma recién al tocar),
 * GitHub y LinkedIn.
 */
export function Contacto() {
  const { perfil, t } = useIdioma();

  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="parada !pb-10"
      data-gota="0.9 0.5 0.09"
      data-gota-m="0.9 0.5 0.09"
    >
      <div className="contenedor grid items-end gap-7 md:grid-cols-12">
        <div className="md:col-span-7">
          <TituloSeccion id="contacto-titulo">{t.paradas.contacto}</TituloSeccion>
          <p className="lead mt-10 max-w-[34ch]">{t.contacto.lead}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CopiarMail variante="solido" />
            <a
              href={perfil.links.github}
              target="_blank"
              rel="noopener noreferrer"
              data-vidrio
              className="boton vidrio vidrio-pildora boton-vidrio"
            >
              GitHub <span aria-hidden className="flecha flecha-diag">↗</span>
            </a>
            <a
              href={perfil.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-vidrio
              className="boton vidrio vidrio-pildora boton-vidrio"
            >
              LinkedIn <span aria-hidden className="flecha flecha-diag">↗</span>
            </a>
          </div>
        </div>
        <Feli pose="contacto" className="ml-auto w-[48%] md:col-span-4 md:col-start-9 md:w-[58%]" />
      </div>
    </section>
  );
}
