"use client";
import Link from "next/link";
import { BurbujasCss } from "@/components/escena/BurbujasCss";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";

/**
 * La página que no existe (404): "Error 404", el título directo, una salida y,
 * de fondo, un mapa con su brújula. Es UNA pantalla sin scroll: el alto es el de
 * la ventana menos el del footer (--pie, el mismo que usa SiteFooter).
 */
export function Perdida() {
  const { t } = useIdioma();
  return (
    <main
      id="contenido"
      className="capa relative flex h-[calc(100svh-var(--pie))] min-h-[520px] items-end overflow-hidden pt-28"
      data-burbujas="0.7 0.25 0.045; 0.35 0.3 0.026"
      data-burbujas-m="0.75 0.3 0.04"
    >
      <BurbujasCss d="0.7 0.25 0.045; 0.35 0.3 0.026" m="0.75 0.3 0.04" />
      <Cianotipo nombre="mapa" className="max-md:w-[200%]" />
      <div className="contenedor">
        <div className="pb-10 md:pb-14">
          <p className="etiqueta">{t.perdida.etiqueta}</p>
          <h1
            data-placa
            data-burbujas="0.78 0.5 0.11"
            data-burbujas-m="0.8 0.5 0.1"
            aria-label={t.perdida.titulo.join(" ")}
            className="placa titulo-perdida mt-4 outline-none"
          >
            {t.perdida.titulo.map((l) => (
              <span key={l} aria-hidden>
                {l}
              </span>
            ))}
            <BurbujasCss d="0.78 0.5 0.11" m="0.8 0.5 0.1" />
          </h1>
          <Link href="/" className="boton boton-solido mt-10">
            <span aria-hidden className="flecha flecha-izq">←</span> {t.perdida.volver}
          </Link>
        </div>
      </div>
    </main>
  );
}
