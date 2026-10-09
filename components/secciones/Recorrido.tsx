"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { guion } from "@/content/guia";
import { TituloParada } from "./comun";

/**
 * RECORRIDO. Un mapa de visita: la línea punteada con una estación por hito.
 * Es corto y es real (nada inventado: si falta el período, se dice).
 */
export function Recorrido() {
  const { perfil, t, idioma } = useIdioma();
  const g = guion[idioma].paradas.recorrido;
  const hitos = [...perfil.timeline].sort((a, b) => a.orden - b.orden);

  return (
    <section
      id="recorrido"
      aria-labelledby="recorrido-titulo"
      className="parada"
      data-gotas="0.06 0.22 110 1; 0.94 0.72 150 0; 0.55 0.02 50 0"
      data-gotas-m="-0.12 0.16 80 1; 1.1 0.84 100 0"
    >
      <div className="contenedor grid [&>*]:min-w-0 gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TituloParada id="recorrido-titulo">{t.paradas.recorrido}</TituloParada>
          <ol className="relative mt-10 ml-3 flex flex-col gap-10 border-l-[3px] border-dotted border-verde-texto pl-8">
            {hitos.map((h) => (
              <li key={h.orden} className="relative">
                <span
                  aria-hidden
                  className="absolute top-6 -left-[calc(2rem+10.5px)] size-[18px] rounded-full border-[2.5px] border-tinta bg-papel"
                />
                <div className="papel p-6">
                  <p className="etiqueta text-tinta-2">
                    {t.recorrido.tipos[h.tipo] ?? h.tipo} ·{" "}
                    {h.periodo ?? `${t.falta}: ${t.recorrido.falta}`}
                  </p>
                  <h3 className="mt-2 text-[24px] leading-tight font-bold">{h.titulo}</h3>
                  <p className="mt-0.5 text-[17px] font-semibold text-verde-texto">{h.lugar}</p>
                  <p className="cuerpo mt-3">{h.descripcion}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative flex flex-col items-start gap-4 lg:col-span-5 lg:items-end lg:pt-24">
          <Globo parada="recorrido" gotas="0.82 0.66 74 0">
            {g.frase}
          </Globo>
          <Feli pose={g.pose} parada="recorrido" className="h-[clamp(180px,38vh,340px)] w-auto self-end" />
        </div>
      </div>
    </section>
  );
}
