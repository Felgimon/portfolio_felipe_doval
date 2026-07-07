import { ArrowDown } from "lucide-react";
import { perfil } from "@/content/perfil";
import { Container, Section } from "@/components/ui";

/**
 * Home — single page con scroll narrativo. En esta fase (2) las secciones son
 * andamiaje con títulos reales y anclas funcionando; el hero 3D y el contenido
 * real llegan en las fases 3–7.
 */
export default function Home() {
  return (
    <>
      {/* ===================== HERO / INICIO ===================== */}
      <section
        id="inicio"
        className="relative flex min-h-dvh flex-col justify-center overflow-hidden pt-28 pb-16"
      >
        <div aria-hidden className="node-grid absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 65% 40%, rgba(116,172,223,0.10), transparent 70%)",
          }}
        />
        <Container size="wide" className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow">{perfil.ubicacion}</p>
              <h1 className="type-hero mt-5 text-chalk">
                Felipe
                <br />
                Doval<span className="text-celeste">_</span>
              </h1>
              <p className="lead mt-6 max-w-xl text-pretty">
                Construyo productos reales entre el full-stack y el machine
                learning, con el fútbol como excusa para meterle datos a todo.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
                <span className="text-celeste">●</span>
                <span>fútbol × ML</span>
                <span className="text-line">/</span>
                <span>builder</span>
                <span className="text-line">/</span>
                <span>ORT TIC · Buenos Aires</span>
              </div>
            </div>

            {/* Slot del elemento firma (balón-grafo 3D) — se monta en Fase 3 */}
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-0 flex items-center justify-center rounded-full border border-dashed border-line">
                <p className="data max-w-[12rem] text-center text-xs text-muted">
                  balón-grafo 3D
                  <br />
                  <span className="text-line">— elemento firma (Fase 3)</span>
                </p>
              </div>
            </div>
          </div>
        </Container>

        <Container size="wide" className="relative mt-14">
          <a
            href="#sobre"
            className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-chalk-dim transition-colors hover:text-celeste"
          >
            <ArrowDown className="size-4 animate-bounce" />
            Bajá para ver más
          </a>
        </Container>
      </section>

      {/* ===================== SOBRE MÍ ===================== */}
      <Section id="sobre" eyebrow="Perfil" title="Sobre mí" size="wide">
        <p className="lead max-w-2xl">{perfil.bioCorta}</p>
        <div className="mt-10 grid gap-4 rounded-xl border border-dashed border-line p-8 text-muted sm:grid-cols-2">
          <p className="data text-xs">
            Bio larga + foto tratada + stack (Fase 4)
          </p>
        </div>
      </Section>

      {/* ===================== OBRAS ===================== */}
      <Section id="obras" eyebrow="Proyectos" title="Obras" size="wide">
        <p className="lead max-w-2xl">
          Dos grandes con case study —{" "}
          <span className="text-chalk">Superlum</span> y{" "}
          <span className="text-chalk">FutbolVision</span> — más una grid de
          proyectos.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-line p-8">
          <p className="data text-xs text-muted">
            Destacados con pinning + grid secundaria (Fase 5)
          </p>
        </div>
      </Section>

      {/* ===================== RECORRIDO ===================== */}
      <Section id="recorrido" eyebrow="Experiencia" title="Recorrido" size="wide">
        <p className="lead max-w-2xl">
          ORT TIC, competencias (NASA Space Apps, Sadosky) y la pasantía en
          Taquion.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-line p-8">
          <p className="data text-xs text-muted">Timeline numerado (Fase 4/5)</p>
        </div>
      </Section>

      {/* ===================== CONTACTO ===================== */}
      <Section id="contacto" eyebrow="Hablemos" title="Contacto" size="wide">
        <p className="lead max-w-2xl">
          ¿Tenés algo para construir, una idea o una pregunta? Escribime.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-line p-8">
          <p className="data text-xs text-muted">
            Email (copiar) + GitHub + LinkedIn con micro-interacciones (Fase 7)
          </p>
        </div>
      </Section>
    </>
  );
}
