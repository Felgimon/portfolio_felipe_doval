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
    >
      <div className="contenedor relative">
        <Cianotipo nombre="trabajo-m" className="top-[-130px] w-full md:hidden" burbujas="0.52 0.56 0.035" />
        {/* el oficio, en una fila larga: el centro en el aire entre Superlum y
            Proyectos, y los objetos que rozan la captura de arriba */}
        <Cianotipo
          nombre="trabajo-grande"
          className="top-[calc(100%-150px)] right-0 w-full max-md:hidden"
          burbujas="0.48 0.5 0.05; 0.9 0.58 0.03"
        />
        <TituloSeccion id="trabajo-titulo" burbujas="0.6 0.5 0.085" burbujasM="0.62 0.5 0.085">{t.paradas.trabajo}</TituloSeccion>
        {superlum && <Pieza p={superlum} etiqueta={t.trabajo.enProgreso} enCurso prioridad />}
      </div>
    </section>
  );
}
