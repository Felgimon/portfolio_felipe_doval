import { Section } from "@/components/ui";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Timeline } from "@/components/sections/Timeline";

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
      <About />

      {/* ===================== OBRAS ===================== */}
      <Work />

      {/* ===================== RECORRIDO ===================== */}
      <Timeline />

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
