"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { CopiarMail } from "@/components/ui/CopiarMail";
import { abrirMail } from "@/lib/mail";
import { listo } from "@/lib/sonido";
import { TituloSeccion } from "./comun";

/**
 * CONTACTO. Sin formulario falso: copiar el mail (se arma recién al tocar),
 * GitHub y LinkedIn. Y, porque a Felipe le gusta charlar (v8), "¿De qué
 * charlamos?": un tema abre el mail con el asunto y el saludo listos.
 */
export function Contacto() {
  const { perfil, t } = useIdioma();

  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="parada !pb-10 max-md:pt-[150px]"
      data-gota="0.9 0.5 0.09"
      data-gota-m="0.9 0.5 0.09"
    >
      <div className="contenedor relative">
        <Cianotipo nombre="gente" className="top-[-116px] w-[78%] md:hidden" />
        {/* las dos tazas, grandes, a la derecha del texto */}
        <Cianotipo nombre="contacto-grande" className="top-[140px] right-[2%] w-[46%] max-w-[680px] max-md:hidden" />
        <div className="md:max-w-[58%]">
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
          <div role="group" aria-labelledby="temas-titulo" className="mt-9">
            <p id="temas-titulo" className="etiqueta">
              {t.contacto.temasTitulo}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {t.contacto.temas.map((tema) => (
                <button
                  key={tema.etiqueta}
                  type="button"
                  data-vidrio
                  onClick={() => {
                    listo();
                    abrirMail(tema.asunto, `${t.contacto.saludo}\n\n`);
                  }}
                  className="boton vidrio vidrio-pildora boton-vidrio tema min-h-[44px] px-[18px] text-[15px]"
                >
                  {tema.etiqueta}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[14px] text-crema-2">{t.contacto.temasAyuda}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
