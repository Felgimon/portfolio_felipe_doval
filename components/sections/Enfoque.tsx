import { perfil } from "@/content/perfil";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
import { TopicPanel } from "./TopicPanel";

/** Nodo Enfoque — cómo trabaja Felipe. Los principios como contenedores Liquid
 * Glass flotantes, sin números ni viñetas. */
export function Enfoque() {
  const { resumen, principios } = perfil.enfoque;

  return (
    <TopicPanel
      id="enfoque"
      kicker="Enfoque"
      align={ladoTexto(indiceTopico("enfoque"))}
      contentClassName="max-w-3xl"
    >
      <Reveal>
        <h2 className="type-h1 text-chalk">
          Los proyectos son el <span className="accent-grad">medio</span>, no
          el fin
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
