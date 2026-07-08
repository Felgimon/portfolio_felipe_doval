import { perfil } from "@/content/perfil";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { EmailLink } from "@/components/ui/EmailLink";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Contacto — email con micro-interacción de "copiado" + GitHub/LinkedIn.
 * Sin formulario: Felipe no configuró Formspree/Resend, así que no ponemos un
 * form falso (cuando lo configure, se agrega acá).
 */
export function Contact() {
  return (
    <section
      id="contacto"
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32 lg:py-40"
    >
      <div aria-hidden className="node-grid absolute inset-0 opacity-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, rgba(116,172,223,0.10), transparent 70%)",
        }}
      />
      <Container size="wide" className="relative">
        <Reveal>
          <Eyebrow>Hablemos</Eyebrow>
          <Heading size="h1" className="mt-5 max-w-4xl">
            ¿Tenés algo para construir?
          </Heading>
          <p className="lead mt-6 max-w-2xl">
            Estoy abierto a proyectos, pasantías y buenas ideas. Si algo de lo que
            viste te resonó, escribime — respondo.
          </p>
        </Reveal>

        <Reveal className="mt-14">
          {/* Email — la micro-interacción de copiado */}
          <div data-reveal-item className="border-t border-line pt-8">
            <p className="mb-3 font-mono text-xs tracking-wide text-muted">
              Email
            </p>
            <EmailLink
              mode="copy"
              className="type-h2 text-chalk transition-colors hover:text-agua"
            />
          </div>

          {/* Redes */}
          <div
            data-reveal-item
            className="mt-10 flex flex-wrap gap-4 border-t border-line pt-8"
          >
            <a
              href={perfil.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl border border-line bg-panel px-5 py-4 transition-colors hover:border-agua/50"
            >
              <BrandIcon name="github" className="size-6 text-chalk" />
              <span className="text-left">
                <span className="block font-mono text-xs text-muted">GitHub</span>
                <span className="text-chalk transition-colors group-hover:text-agua">
                  @Felgimon
                </span>
              </span>
            </a>
            <a
              href={perfil.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl border border-line bg-panel px-5 py-4 transition-colors hover:border-agua/50"
            >
              <BrandIcon name="linkedin" className="size-6 text-chalk" />
              <span className="text-left">
                <span className="block font-mono text-xs text-muted">
                  LinkedIn
                </span>
                <span className="text-chalk transition-colors group-hover:text-agua">
                  Felipe Doval
                </span>
              </span>
            </a>
          </div>

          <p
            data-reveal-item
            className="mt-10 font-mono text-xs text-muted"
          >
            {perfil.ubicacion} · tip: si andás con teclado, ya sabés qué código
            probar.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
