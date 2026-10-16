"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { Pieza } from "./Pieza";
import { TituloSeccion } from "./comun";

/**
 * TRABAJO. Lo que Felipe está construyendo hoy para una empresa real
 * (Superlum). Va separado de los proyectos a propósito: es trabajo, no un
 * ejercicio. Al lado del título, el oficio en fila: una libreta, los anteojos,
 * un cable enrollado y unas teclas.
 */
export function Trabajo() {
  const { proyectos, t } = useIdioma();
  const superlum = proyectos.find((p) => p.slug === "superlum");

  return (
    <section
      id="trabajo"
      aria-labelledby="trabajo-titulo"
      className="parada max-md:pt-[150px]"
      data-gota="0.6 0.5 0.085"
      data-gota-m="0.62 0.5 0.085"
    >
      <div className="contenedor relative">
        <Cianotipo nombre="herramientas" className="top-[-116px] w-[78%] md:hidden" />
        {/* el oficio, en una fila larga: el centro en el aire entre Superlum y
            Proyectos, y los objetos que rozan la captura de arriba */}
        <Cianotipo nombre="trabajo-grande" className="top-[calc(100%-120px)] right-[6%] w-[88%] max-md:hidden" />
        <TituloSeccion id="trabajo-titulo">{t.paradas.trabajo}</TituloSeccion>
        {superlum && <Pieza p={superlum} etiqueta={t.trabajo.enProgreso} enCurso prioridad />}
      </div>
    </section>
  );
}
