import { Briefcase, GraduationCap, Trophy } from "lucide-react";
import { perfil } from "@/content/perfil";
import type { TipoTimeline } from "@/content/types";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/motion/Reveal";

const ICONOS: Record<TipoTimeline, typeof Briefcase> = {
  trabajo: Briefcase,
  educacion: GraduationCap,
  competencia: Trophy,
};

/**
 * Recorrido — timeline con marcadores numerados. Acá los números SÍ son
 * legítimos: el orden codifica una secuencia real (ver content/perfil.ts).
 */
export function Timeline() {
  return (
    <section
      id="recorrido"
      className="scroll-mt-24 border-t border-line bg-ink-2 py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal>
          <Eyebrow>Recorrido</Eyebrow>
          <Heading size="h2" className="mt-4">
            Cómo llegué hasta acá
          </Heading>
        </Reveal>

        <Reveal className="mt-14">
          <ol className="relative ml-4 flex flex-col gap-12 border-l border-line pl-10 sm:ml-6">
            {perfil.timeline.map((item) => {
              const Icon = ICONOS[item.tipo];
              return (
                <li key={item.orden} data-reveal-item className="relative">
                  {/* Nodo numerado sobre la línea */}
                  <span className="absolute top-0 -left-[3.4rem] flex size-9 items-center justify-center rounded-full border border-line bg-panel font-mono text-xs text-agua">
                    {String(item.orden).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Icon className="size-4 text-agua" aria-hidden />
                      <h3 className="type-h3 text-chalk">{item.titulo}</h3>
                      {item.periodo && (
                        <span className="data text-xs text-muted">
                          {item.periodo}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs tracking-wide text-agua">
                      {item.lugar}
                    </p>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-chalk-dim">
                      {item.descripcion}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </Container>
    </section>
  );
}
