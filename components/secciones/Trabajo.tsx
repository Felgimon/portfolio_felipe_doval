"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { Pieza } from "./Pieza";
import { TituloSeccion } from "./comun";

/**
 * TRABAJO. Lo que Felipe está construyendo hoy para una empresa real
 * (Superlum). Va separado de los proyectos a propósito: es trabajo, no un
 * ejercicio.
 */
export function Trabajo() {
  const { proyectos, t } = useIdioma();
  const superlum = proyectos.find((p) => p.slug === "superlum");

  return (
    <section
      id="trabajo"
      aria-labelledby="trabajo-titulo"
      className="parada"
      data-gota="0.6 0.5 0.085"
      data-gota-m="0.62 0.5 0.085"
    >
      <Cianotipo nombre="herramientas" />
      <div className="contenedor">
        <TituloSeccion id="trabajo-titulo">{t.paradas.trabajo}</TituloSeccion>
        {superlum && <Pieza p={superlum} etiqueta={t.trabajo.enProgreso} enCurso prioridad />}
      </div>
    </section>
  );
}
