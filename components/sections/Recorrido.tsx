import { perfil } from "@/content/perfil";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
import { TopicPanel } from "./TopicPanel";

const TIPO_LABEL: Record<string, string> = {
  educacion: "Formación",
  competencia: "Competencia",
  trabajo: "Trabajo",
};

/** Nodo Recorrido — la trayectoria en orden, en contenedores Liquid Glass
 * flotantes, sin números ni viñetas. */
export function Recorrido() {
  const items = [...perfil.timeline].sort((a, b) => a.orden - b.orden);

  return (
    <TopicPanel
      id="recorrido"
      kicker="Recorrido"
      align={ladoTexto(indiceTopico("recorrido"))}
      contentClassName="max-w-3xl"
    >
      <Reveal>
        <h2 className="type-h1 text-chalk">
          Por dónde fui <span className="accent-grad">pasando</span>
        </h2>
      </Reveal>

      <Reveal className="mt-10">
        <div className="flex flex-col gap-3">
          {items.map((t) => (
            <div
              key={t.orden}
              data-reveal-item
              className="glass glass-hover p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="type-h3 text-chalk">{t.titulo}</h3>
                <span className="font-mono text-xs tracking-wide text-muted">
                  {TIPO_LABEL[t.tipo] ?? t.tipo}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-acento">
                {t.lugar}
                {t.periodo ? ` · ${t.periodo}` : ""}
              </p>
              <p className="mt-3 leading-relaxed text-chalk-dim">
                {t.descripcion}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </TopicPanel>
  );
}
