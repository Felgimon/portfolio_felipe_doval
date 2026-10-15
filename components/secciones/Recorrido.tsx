"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { TituloSeccion } from "./comun";

/**
 * RECORRIDO. Corto y real (nada inventado: si falta el período, se dice).
 * Feli, de cuerpo entero, acompaña desde la derecha.
 */
export function Recorrido() {
  const { perfil, t } = useIdioma();
  const hitos = [...perfil.timeline].sort((a, b) => a.orden - b.orden);

  return (
    <section
      id="recorrido"
      aria-labelledby="recorrido-titulo"
      className="parada"
      data-gota="0.97 0.5 0.085"
      data-gota-m="0.94 0.5 0.085"
    >
      <div className="contenedor">
        <TituloSeccion id="recorrido-titulo">{t.paradas.recorrido}</TituloSeccion>
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
          <Feli pose="recorrido" className="ml-auto w-[38%] md:col-span-3 md:col-start-10 md:w-[50%]" />
        </div>
      </div>
    </section>
  );
}
