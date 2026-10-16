"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";
import type { CategoriaStack } from "@/content/types";
import { BotonSonido } from "@/components/ui/BotonSonido";
import { Dato, TituloSeccion } from "./comun";

/**
 * PERFIL. La bio a la izquierda; a la derecha, con qué construye (frases
 * corridas por categoría, sin logos ni chips) y Así soy: los cuatro rasgos que
 * contó Felipe, en sus palabras (v8). Al lado del título, sus objetos de
 * curioso: una lupa, un lápiz, una protoboard y una lamparita.
 */
export function Perfil() {
  const { perfil, t } = useIdioma();
  const categorias = [...new Set(perfil.stack.map((s) => s.categoria))] as CategoriaStack[];
  const [primero, ...resto] = perfil.bioLarga;

  return (
    <section
      id="perfil"
      aria-labelledby="perfil-titulo"
      className="parada max-md:pt-[150px]"
      data-gota="0.93 0.5 0.085"
      data-gota-m="0.9 0.5 0.085"
    >
      <div className="contenedor relative">
        <Cianotipo nombre="curiosidad" className="top-[-116px] w-[78%] md:hidden" />
        <TituloSeccion id="perfil-titulo">{t.paradas.perfil}</TituloSeccion>
        <div className="mt-14 grid items-start gap-x-16 gap-y-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-[18px] leading-[1.6]">{primero}</p>
            {resto.map((p) => (
              <p key={p.slice(0, 24)} className="cuerpo mt-5">
                {p}
              </p>
            ))}
            {/* los objetos de curioso, grandes, en el aire que queda debajo de la bio */}
            <Cianotipo nombre="perfil-grande" className="relative mt-10 -ml-[6%] w-[112%] max-md:hidden" />
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <h3 className="etiqueta">{t.perfil.stack}</h3>
            <dl className="mt-4 flex flex-col gap-2 border-t border-linea pt-5">
              {categorias.map((c) => (
                <Dato key={c} etiqueta={t.categoriasStack[c] ?? c} ancho="150px">
                  {perfil.stack
                    .filter((s) => s.categoria === c)
                    .map((s) => s.nombre)
                    .join(", ")}
                </Dato>
              ))}
            </dl>
            <h3 className="etiqueta mt-10">{t.perfil.asiSoy}</h3>
            <dl className="mt-4 flex flex-col border-t border-linea">
              {perfil.rasgos.map((r) => (
                <div key={r.titulo} className="grid gap-x-3.5 border-b border-linea py-3 sm:grid-cols-[150px_1fr]">
                  <dt className="text-[15px] font-semibold text-crema-2">{r.titulo}</dt>
                  <dd className="text-[17px] leading-[1.45] font-medium">
                    {r.texto}
                    {r.accion === "sonido" && <BotonSonido variante="texto" />}
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
