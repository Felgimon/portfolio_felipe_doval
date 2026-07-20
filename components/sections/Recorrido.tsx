"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
import { TopicPanel } from "./TopicPanel";

/** Nodo Recorrido — la trayectoria en orden, en contenedores Liquid Glass
 * flotantes, sin números ni viñetas. Textos desde el diccionario (es/en). */
export function Recorrido() {
  const { t, perfil } = useIdioma();
  const items = [...perfil.timeline].sort((a, b) => a.orden - b.orden);
  const titulo = t.recorrido.titulo;

  return (
    <TopicPanel
      id="recorrido"
      kicker={t.nodos.recorrido.label}
      align={ladoTexto(indiceTopico("recorrido"))}
      contentClassName="max-w-3xl"
    >
      <Reveal>
        <h2 className="type-h1 text-chalk">
          {titulo.pre}
          <span className="accent-grad">{titulo.accent}</span>
          {titulo.post}
        </h2>
      </Reveal>

      <Reveal className="mt-10">
        <div className="flex flex-col gap-3">
          {items.map((tl) => (
            <div
              key={tl.orden}
              data-reveal-item
              data-lente="suave"
              className="glass glass-hover p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="type-h3 text-chalk">{tl.titulo}</h3>
                <span className="font-mono text-xs tracking-wide text-muted">
                  {t.recorrido.tipos[tl.tipo] ?? tl.tipo}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-acento">
                {tl.lugar}
                {tl.periodo ? ` · ${tl.periodo}` : ""}
              </p>
              <p className="mt-3 leading-relaxed text-chalk-dim">
                {tl.descripcion}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </TopicPanel>
  );
}
