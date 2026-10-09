"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { guion } from "@/content/guia";
import type { CategoriaStack } from "@/content/types";
import { TituloParada } from "./comun";

/**
 * PERFIL. Feli sentado a la izquierda, la bio a la derecha. El stack va como
 * frases corridas por categoría (sin logos ni chips: texto que se lee).
 */
export function Perfil() {
  const { perfil, t, idioma } = useIdioma();
  const g = guion[idioma].paradas.perfil;

  const categorias = [...new Set(perfil.stack.map((s) => s.categoria))] as CategoriaStack[];

  return (
    <section
      id="perfil"
      aria-labelledby="perfil-titulo"
      className="parada"
      data-gotas="-0.02 0.2 90 1; 0.42 0.08 60 0; 1.0 0.1 70 0"
      data-gotas-m="1.12 0.05 80 1; -0.12 0.7 70 0"
    >
      <div className="contenedor grid [&>*]:min-w-0 gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="relative order-2 lg:order-1 lg:col-span-5">
          <Globo parada="perfil" className="relative z-10 mb-4 lg:mb-6" gotas="0.86 0.7 70 1">
            {g.frase}
          </Globo>
          <Feli pose={g.pose} parada="perfil" className="w-[78%] max-w-[420px] lg:w-[92%]" />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7 lg:pt-10">
          <TituloParada id="perfil-titulo">{t.paradas.perfil}</TituloParada>
          <div className="mt-6 flex max-w-[62ch] flex-col gap-4">
            {perfil.bioLarga.map((p) => (
              <p key={p.slice(0, 24)} className="cuerpo text-[17px]">
                {p}
              </p>
            ))}
          </div>
          <div className="papel mt-10 max-w-[62ch] p-6">
            <h3 className="text-[19px] font-bold">{t.perfil.stack}</h3>
            <dl className="mt-3 flex flex-col gap-2">
              {categorias.map((c) => (
                <div key={c} className="grid gap-x-4 sm:grid-cols-[9.5rem_1fr]">
                  <dt className="etiqueta text-tinta-2">{t.categoriasStack[c] ?? c}</dt>
                  <dd className="text-[15.5px]">
                    {perfil.stack
                      .filter((s) => s.categoria === c)
                      .map((s) => s.nombre)
                      .join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
