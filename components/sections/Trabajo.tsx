import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { proyectos, getProyecto } from "@/content/proyectos";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
import { ProjectCard } from "./ProjectCard";
import { TopicPanel } from "./TopicPanel";

/** Nodo Trabajo — los proyectos como evidencia. Superlum lidera con su case
 * study; el resto (incluida FutbolVision, ya como proyecto anterior) va en la
 * grilla. Todo en Liquid Glass sobre el cielo, sin viñetas. */
export function Trabajo() {
  const superlum = getProyecto("superlum");
  const resto = proyectos.filter((p) => p.slug !== "superlum");
  const cap = superlum?.capturas.find((c) => !c.falta && c.src);

  return (
    <TopicPanel
      id="trabajo"
      kicker="Trabajo"
      align={ladoTexto(indiceTopico("trabajo"))}
      contentClassName="max-w-6xl"
    >
      <Reveal>
        <h2 className="type-h1 max-w-3xl text-chalk">
          La <span className="accent-grad">prueba</span>: lo que construí
        </h2>
        <p className="lead mt-5 max-w-2xl">
          Cada uno resolvió un problema real. El grande, Superlum, tiene su
          historia completa; abajo, el resto de lo que fui armando.
        </p>
      </Reveal>

      {/* Superlum — caso principal */}
      {superlum && (
        <Reveal className="mt-12">
          <article data-lente="suave" className="glass grid gap-6 overflow-hidden p-6 lg:grid-cols-2 lg:p-8">
            <div className="flex flex-col justify-center gap-5">
              <p className="eyebrow">Caso principal</p>
              <h3 className="type-h2 text-chalk">{superlum.nombre}</h3>
              <p className="max-w-md leading-relaxed text-chalk-dim">
                {superlum.unaLinea}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {superlum.stack.slice(0, 5).map((s) => (
                  <Tag key={s} variant="outline" size="sm">
                    {s}
                  </Tag>
                ))}
              </div>
              <Link
                href="/proyectos/superlum"
                className="group mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-acento px-5 py-2.5 font-mono text-xs tracking-wide text-ink transition-colors hover:bg-acento-hi"
              >
                Ver el caso
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line-soft bg-white/10">
              {cap && (
                <Image
                  src={cap.src}
                  alt={cap.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover object-top"
                />
              )}
            </div>
          </article>
        </Reveal>
      )}

      {/* Resto de proyectos */}
      <Reveal className="mt-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resto.map((p) => (
            <div key={p.slug} data-reveal-item className="h-full">
              <ProjectCard
                proyecto={p}
                href={
                  p.categoria === "destacado"
                    ? `/proyectos/${p.slug}`
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </Reveal>
    </TopicPanel>
  );
}
