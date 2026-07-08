import { perfil } from "@/content/perfil";
import { Reveal } from "@/components/motion/Reveal";
import { TopicPanel } from "./TopicPanel";

/** Nodo Enfoque — cómo trabaja Felipe. Reemplaza al viejo "fútbol × ML" como
 * relato: los principios como bloques separados por hairlines, sin números ni
 * viñetas. */
export function Enfoque() {
  const { resumen, principios } = perfil.enfoque;

  return (
    <TopicPanel id="enfoque" kicker="Enfoque" contentClassName="max-w-3xl">
      <Reveal>
        <h2 className="type-h1 text-chalk">
          Los proyectos son el{" "}
          <span className="text-agua">medio</span>, no el fin
        </h2>
        <p className="lead mt-6 max-w-2xl">{resumen}</p>
      </Reveal>

      <Reveal className="mt-12">
        <div className="flex flex-col">
          {principios.map((p) => (
            <div
              key={p.titulo}
              data-reveal-item
              className="border-t border-line py-6"
            >
              <h3 className="type-h3 text-chalk">{p.titulo}</h3>
              <p className="mt-2 max-w-2xl leading-relaxed text-chalk-dim">
                {p.texto}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </TopicPanel>
  );
}
