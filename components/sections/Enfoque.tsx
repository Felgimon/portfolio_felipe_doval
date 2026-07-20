"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
import { TopicPanel } from "./TopicPanel";

/** Nodo Enfoque — cómo trabaja Felipe. Los principios como contenedores Liquid
 * Glass flotantes, sin números ni viñetas. Textos desde el diccionario de
 * idioma (es/en automático). */
export function Enfoque() {
  const { t, perfil } = useIdioma();
  const { resumen, principios } = perfil.enfoque;
  const titulo = t.enfoque.titulo;

  return (
    <TopicPanel
      id="enfoque"
      kicker={t.nodos.enfoque.label}
      align={ladoTexto(indiceTopico("enfoque"))}
      contentClassName="max-w-3xl"
    >
      <Reveal>
        <h2 className="type-h1 text-chalk">
          {titulo.pre}
          <span className="accent-grad">{titulo.accent}</span>
          {titulo.post}
        </h2>
        <p className="lead mt-6 max-w-2xl">{resumen}</p>
      </Reveal>

      <Reveal className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {principios.map((p) => (
            <div
              key={p.titulo}
              data-reveal-item
              data-lente="suave"
              className="glass glass-hover p-5"
            >
              <h3 className="type-h3 text-chalk">{p.titulo}</h3>
              <p className="mt-2 leading-relaxed text-chalk-dim">{p.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </TopicPanel>
  );
}
