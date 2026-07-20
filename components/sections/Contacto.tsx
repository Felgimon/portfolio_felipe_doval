"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { EmailLink } from "@/components/ui/EmailLink";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
import { TopicPanel } from "./TopicPanel";

/**
 * Nodo Contacto — email con micro-interacción de "copiado" + GitHub/LinkedIn en
 * contenedores Liquid Glass. Sin formulario (Felipe no configuró backend): no
 * ponemos un form falso. Textos desde el diccionario (es/en automático).
 */
export function Contacto() {
  const { t, perfil } = useIdioma();
  const titulo = t.contacto.titulo;

  return (
    <TopicPanel
      id="contacto"
      kicker={t.nodos.contacto.label}
      align={ladoTexto(indiceTopico("contacto"))}
      contentClassName="max-w-3xl"
    >
      <Reveal>
        <h2 className="type-h1 text-chalk">
          {titulo.pre}
          <span className="accent-grad">{titulo.accent}</span>
          {titulo.post}
        </h2>
        <p className="lead mt-6 max-w-2xl">{t.contacto.lead}</p>
      </Reveal>

      <Reveal className="mt-12">
        {/* Email — la micro-interacción de copiado */}
        <div data-reveal-item data-lente="suave" className="glass p-6">
          <p className="mb-3 font-mono text-xs tracking-wide text-acento">
            {t.contacto.email}
          </p>
          {/* De corrido, sin quiebre: el tamaño se adapta al ancho (clamp). */}
          <EmailLink
            mode="copy"
            className="data font-semibold whitespace-nowrap text-[clamp(0.95rem,3.2vw,1.9rem)] text-chalk transition-colors hover:text-acento"
          />
        </div>

        {/* Redes */}
        <div data-reveal-item className="mt-4 flex flex-wrap gap-3">
          <a
            href={perfil.links.github}
            target="_blank"
            rel="noopener noreferrer"
            data-lente="suave"
            className="glass glass-hover group inline-flex items-center gap-3 px-5 py-4"
          >
            <BrandIcon name="github" className="size-6 text-chalk" />
            <span className="text-left">
              <span className="block font-mono text-xs text-muted">GitHub</span>
              <span className="text-chalk transition-colors group-hover:text-acento">
                @Felgimon
              </span>
            </span>
          </a>
          <a
            href={perfil.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            data-lente="suave"
            className="glass glass-hover group inline-flex items-center gap-3 px-5 py-4"
          >
            <BrandIcon name="linkedin" className="size-6 text-chalk" />
            <span className="text-left">
              <span className="block font-mono text-xs text-muted">
                LinkedIn
              </span>
              <span className="text-chalk transition-colors group-hover:text-acento">
                Felipe Doval
              </span>
            </span>
          </a>
        </div>

        <p data-reveal-item className="mt-8 font-mono text-xs text-muted">
          {perfil.ubicacion}
        </p>
      </Reveal>
    </TopicPanel>
  );
}
