import { perfil } from "@/content/perfil";
import { Section } from "@/components/ui";
import { Hero } from "@/components/sections/Hero";

/**
 * Home — single page con scroll narrativo. En esta fase (2) las secciones son
 * andamiaje con títulos reales y anclas funcionando; el hero 3D y el contenido
 * real llegan en las fases 3–7.
 */
export default function Home() {
  return (
    <>
      {/* ===================== HERO / INICIO ===================== */}
      <Hero />

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
