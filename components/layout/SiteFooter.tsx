"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Container } from "@/components/ui/Container";

const anio = new Date().getFullYear();

/**
 * Footer mínimo: el copyright y el crédito de la textura solar. El contacto, los
 * enlaces y la marca ya viven en la sección Contacto y en el HUD, así que se
 * sacaron por repetición (v5.17.7).
 *
 * El crédito NO es decoración y no se saca: la textura del sol
 * (public/textures/sol.jpg) es CC BY 4.0 de Solar System Scope, y esa licencia
 * EXIGE atribución visible con enlace a la fuente. Es el único asset CC-BY que
 * sigue en uso (la panorámica de la Vía Láctea de ESO se retiró en v4.2). Si
 * algún día se reemplaza la textura por una CC0/propia, recién ahí puede irse.
 */
export function SiteFooter() {
  const { t, perfil } = useIdioma();
  return (
    <footer className="relative z-10 border-t border-line bg-ink-2">
      {/* `pb-28`: el HUD flota FIJO abajo y al final de la página se le monta
          encima al footer — medido, tapaba el "(CC BY 4.0)" en 768, 1024 y 1440.
          Un crédito tapado no cumple la licencia, así que el texto se sube por
          encima de la zona del HUD. */}
      <Container size="wide" className="pt-10 pb-28">
        <p className="font-mono text-xs text-muted">
          © {anio} {perfil.nombre} · {t.footer.solCredito}:{" "}
          <a
            href="https://www.solarsystemscope.com/textures/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline hover:text-chalk-dim"
          >
            Solar System Scope
          </a>{" "}
          (CC BY 4.0)
        </p>
      </Container>
    </footer>
  );
}
