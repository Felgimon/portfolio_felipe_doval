"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { TituloSeccion } from "./comun";

/**
 * RECORRIDO. Corto y real (nada inventado: si falta el período, se dice). En
 * la columna libre de la derecha, lo de moverse: zapatillas, llaves, la tarjeta
 * y la de básquet.
 */
export function Recorrido() {
  const { perfil, t } = useIdioma();
  const hitos = [...perfil.timeline].sort((a, b) => a.orden - b.orden);

  return (
    <section
      id="recorrido"
      aria-labelledby="recorrido-titulo"
      className="parada max-md:pt-[150px]"
    >
      <div className="contenedor relative">
        <Cianotipo nombre="recorrido-m" className="top-[-130px] w-full md:hidden" burbujas="0.6 0.48 0.035" />
        {/* lo de moverse, grande: el centro en la columna libre de la derecha y el
            borde izquierdo que se mete un poco debajo de la línea de tiempo */}
        <Cianotipo
          nombre="recorrido-grande"
          className="top-[40px] right-[-3%] w-[48%] max-w-[720px] max-md:hidden"
          burbujas="0.75 0.22 0.05; 0.2 0.64 0.028"
        />
        <TituloSeccion id="recorrido-titulo" burbujas="0.97 0.5 0.085" burbujasM="0.94 0.5 0.085">{t.paradas.recorrido}</TituloSeccion>
        <div className="mt-16 grid items-start gap-7 md:grid-cols-12">
          <ol className="border-t border-linea md:col-span-8">
            {hitos.map((h) => (
              <li key={h.orden} className="grid gap-1.5 border-b border-linea py-[30px] md:grid-cols-[4fr_7fr] md:gap-7">
                <p className="etiqueta">
                  {t.recorrido.tipos[h.tipo] ?? h.tipo} · {h.periodo ?? `${t.falta}: ${t.recorrido.falta}`}
                </p>
                <div>
                  <h3 className="h3 text-[26px] leading-tight">
                    {h.titulo}, {h.lugar}
                  </h3>
                  <p className="cuerpo mt-2">{h.descripcion}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
