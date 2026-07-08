"use client";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { ProjectMedia } from "./ProjectMedia";
import type { Proyecto } from "@/content/types";

type FeaturedProjectProps = {
  proyecto: Proyecto;
  invertido?: boolean;
};

/**
 * Bloque de proyecto destacado. En desktop, la media queda pineada
 * (ScrollTrigger) mientras el detalle scrollea; en mobile / reduced-motion se
 * apila normal. matchMedia + cleanup evita triggers zombie al cambiar de ruta.
 */
export function FeaturedProject({ proyecto, invertido = false }: FeaturedProjectProps) {
  const section = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const st = ScrollTrigger.create({
          trigger: section.current,
          start: "top 16%",
          end: "bottom 84%",
          pin: media.current,
          pinSpacing: false,
        });
        return () => st.kill();
      });
      return () => mm.revert();
    },
    { scope: section, dependencies: [reduced] },
  );

  const repo = proyecto.enlaces.find((e) => e.tipo === "repo");

  return (
    <div
      ref={section}
      className="relative border-t border-line py-16 lg:py-24"
    >
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Media (pineada en desktop) */}
          <div className={cn(invertido && "lg:order-2")}>
            <div ref={media}>
              <ProjectMedia proyecto={proyecto} />
            </div>
          </div>

          {/* Detalle */}
          <div className="flex flex-col gap-6">
            <div>
              <Eyebrow>Obra destacada</Eyebrow>
              <Heading size="h2" className="mt-4">
                {proyecto.nombre}
              </Heading>
              {proyecto.tagline && (
                <p className="mt-3 font-mono text-sm text-agua">
                  “{proyecto.tagline}”
                </p>
              )}
            </div>

            <p className="lead">{proyecto.unaLinea}</p>
            <p className="max-w-xl text-chalk-dim">{proyecto.resumen}</p>

            <ul className="flex flex-wrap gap-2">
              {proyecto.stack.map((s) => (
                <li key={s}>
                  <Tag variant="soft" size="sm">
                    {s}
                  </Tag>
                </li>
              ))}
            </ul>

            <dl className="grid gap-4 border-t border-line-soft pt-6 sm:grid-cols-[auto_1fr] sm:gap-x-8">
              <dt className="font-mono text-xs tracking-wide text-muted">Rol</dt>
              <dd className="text-sm text-chalk-dim">{proyecto.rol}</dd>
            </dl>

            {proyecto.destacados && (
              <ul className="flex flex-col gap-2">
                {proyecto.destacados.slice(0, 3).map((d) => (
                  <li
                    key={d}
                    className="flex gap-3 text-sm text-chalk-dim"
                  >
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-agua" />
                    {d}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2 flex flex-wrap gap-3">
              <Button href={`/proyectos/${proyecto.slug}`} variant="primary">
                Ver el caso
                <ArrowUpRight className="size-4" />
              </Button>
              {repo && (
                <Button href={repo.url} variant="secondary" external>
                  {repo.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
