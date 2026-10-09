"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { guion } from "@/content/guia";
import { TituloParada } from "./comun";

/**
 * ENFOQUE. Cómo trabaja, en cuatro principios. Sin numeración: el orden no es
 * real (regla de Felipe: nada de 01/02 decorativo). Los títulos solos ya
 * cuentan la historia ("si estás apurado, leé sólo los títulos").
 */
export function Enfoque() {
  const { perfil, t, idioma } = useIdioma();
  const g = guion[idioma].paradas.enfoque;

  return (
    <section
      id="enfoque"
      aria-labelledby="enfoque-titulo"
      className="parada"
      data-gotas="1.0 0.12 120 1; 0.62 0.99 90 0; -0.02 0.56 56 0"
      data-gotas-m="1.12 0.06 100 1; -0.1 0.64 70 0"
    >
      <div className="contenedor">
        <div className="grid items-end gap-x-12 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <TituloParada id="enfoque-titulo">{t.paradas.enfoque}</TituloParada>
            <p className="lead mt-6 max-w-[54ch] text-[18px] text-tinta">{perfil.enfoque.resumen}</p>
          </div>
          <div className="relative flex items-end gap-4 lg:col-span-5">
            <Globo parada="enfoque" className="mb-[22%] min-w-0 flex-1 lg:flex-none" gotas="0.12 0.5 70 0">
              {g.frase}
            </Globo>
            <Feli pose={g.pose} parada="enfoque" className="h-[clamp(180px,36vh,330px)] w-auto shrink-0" />
          </div>
        </div>
        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {perfil.enfoque.principios.map((p) => (
            <li key={p.titulo} className="papel p-6 lg:p-8">
              <h3 className="text-[22px] leading-tight font-bold tracking-[-0.01em]">{p.titulo}</h3>
              <p className="cuerpo mt-3">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
