import {
  proyectosDestacados,
  proyectosSecundarios,
} from "@/content/proyectos";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/motion/Reveal";
import { FeaturedProject } from "./FeaturedProject";
import { ProjectCard } from "./ProjectCard";

/** Sección Obras: 2 destacados con pinning + grid de proyectos secundarios. */
export function Work() {
  return (
    <section id="obras" className="scroll-mt-24 py-20 sm:py-28 lg:py-32">
      <Container size="wide">
        <Reveal>
          <Eyebrow>Obras</Eyebrow>
          <Heading size="h2" className="mt-4 max-w-3xl">
            Dos productos reales, y una vitrina
          </Heading>
          <p className="lead mt-5 max-w-2xl">
            Superlum y FutbolVision son los grandes, cada uno con su case study.
            Abajo, el resto de lo que construí.
          </p>
        </Reveal>
      </Container>

      {/* Destacados con pinning */}
      <div className="mt-10 lg:mt-16">
        {proyectosDestacados.map((p, i) => (
          <FeaturedProject key={p.slug} proyecto={p} invertido={i % 2 === 1} />
        ))}
      </div>

      {/* Grid secundaria */}
      <Container size="wide" className="mt-24 border-t border-line pt-20">
        <Reveal>
          <Eyebrow>Más proyectos</Eyebrow>
          <Heading size="h3" className="mt-3">
            Otras cosas que construí
          </Heading>
        </Reveal>
        <Reveal className="mt-10">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {proyectosSecundarios.map((p) => (
              <li key={p.slug} data-reveal-item className="h-full">
                <ProjectCard proyecto={p} />
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
