"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import type { CategoriaStack } from "@/content/types";
import { Dato, TituloSeccion } from "./comun";

/**
 * PERFIL. Feli a la izquierda, la bio a la derecha. El stack va como frases
 * corridas por categoría (sin logos ni chips: texto que se lee).
 */
export function Perfil() {
  const { perfil, t } = useIdioma();
  const categorias = [...new Set(perfil.stack.map((s) => s.categoria))] as CategoriaStack[];
  const [primero, ...resto] = perfil.bioLarga;

  return (
    <section
      id="perfil"
      aria-labelledby="perfil-titulo"
      className="parada"
      data-gota="0.93 0.5 0.085"
      data-gota-m="0.9 0.5 0.085"
    >
      <div className="contenedor">
        <TituloSeccion id="perfil-titulo">{t.paradas.perfil}</TituloSeccion>
        <div className="mt-16 grid items-start gap-7 md:grid-cols-12">
          <Feli pose="perfil" className="w-[78%] md:col-span-5 md:w-full" />
          <div className="md:col-span-6 md:col-start-7">
            <p className="text-[18px] leading-[1.6]">{primero}</p>
            {resto.map((p) => (
              <p key={p.slice(0, 24)} className="cuerpo mt-5">
                {p}
              </p>
            ))}
            <dl className="mt-9 flex flex-col gap-2 border-t border-linea pt-6">
              {categorias.map((c) => (
                <Dato key={c} etiqueta={t.categoriasStack[c] ?? c} ancho="150px">
                  {perfil.stack
                    .filter((s) => s.categoria === c)
                    .map((s) => s.nombre)
                    .join(", ")}
                </Dato>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
