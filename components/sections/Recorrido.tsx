import { perfil } from "@/content/perfil";
import { Reveal } from "@/components/motion/Reveal";
import { TopicPanel } from "./TopicPanel";

const TIPO_LABEL: Record<string, string> = {
  educacion: "Formación",
  competencia: "Competencia",
  trabajo: "Trabajo",
};

/** Nodo Recorrido — la trayectoria como secuencia numerada (sin viñetas). */
export function Recorrido() {
  const items = [...perfil.timeline].sort((a, b) => a.orden - b.orden);

  return (
    <TopicPanel id="recorrido" indice="04" kicker="Recorrido" contentClassName="max-w-3xl">
      <Reveal>
        <h2 className="type-h1 text-chalk">
          Por dónde fui <span className="text-agua">pasando</span>
        </h2>
      </Reveal>

      <Reveal className="mt-10">
        <ol className="flex flex-col">
          {items.map((t) => (
            <li
              key={t.orden}
              data-reveal-item
              className="grid grid-cols-[auto_1fr] gap-x-5 border-t border-line py-6 sm:gap-x-8"
            >
              <span className="data pt-1 text-sm text-agua tabular-nums">
                {String(t.orden).padStart(2, "0")}
              </span>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="type-h3 text-chalk">{t.titulo}</h3>
                  <span className="font-mono text-xs tracking-wide text-muted">
                    {TIPO_LABEL[t.tipo] ?? t.tipo}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-jade">
                  {t.lugar}
                  {t.periodo ? ` · ${t.periodo}` : ""}
                </p>
                <p className="mt-3 max-w-xl leading-relaxed text-chalk-dim">
                  {t.descripcion}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </TopicPanel>
  );
}
