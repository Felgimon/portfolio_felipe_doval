import { perfil } from "@/content/perfil";
import { Reveal } from "@/components/motion/Reveal";
import { TopicPanel } from "./TopicPanel";

/** Nodo Enfoque — cómo trabaja Felipe. Reemplaza al viejo "fútbol × ML" como
 * relato: los principios se numeran 01..0N, sin viñetas. */
export function Enfoque() {
  const { resumen, principios } = perfil.enfoque;

  return (
    <TopicPanel id="enfoque" indice="02" kicker="Enfoque" contentClassName="max-w-3xl">
      <Reveal>
        <h2 className="type-h1 text-chalk">
          Los proyectos son el{" "}
          <span className="text-agua">medio</span>, no el fin
        </h2>
        <p className="lead mt-6 max-w-2xl">{resumen}</p>
      </Reveal>

      <Reveal className="mt-12">
        <ol className="flex flex-col">
          {principios.map((p, i) => (
            <li
              key={p.titulo}
              data-reveal-item
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 border-t border-line py-6 sm:gap-x-8"
            >
              <span
                aria-hidden
                className="data pt-1 text-sm text-agua tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="type-h3 text-chalk">{p.titulo}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-chalk-dim">
                  {p.texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </TopicPanel>
  );
}
