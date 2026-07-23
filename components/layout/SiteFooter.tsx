"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Container } from "@/components/ui/Container";

const anio = new Date().getFullYear();

/**
 * Footer mínimo: SOLO el copyright, por pedido de Felipe. El contacto, los
 * enlaces y la marca ya viven en la sección Contacto y en el HUD, así que acá
 * eran repetición.
 *
 * OJO al quitar cosas de acá: la textura del sol (public/textures/sol.jpg) es
 * CC BY 4.0 de Solar System Scope, y esa licencia EXIGE crédito visible. El
 * crédito se retiró a pedido expreso; queda documentado en CREDITS.md, que es
 * público en el repo. Si el sitio va a difundirse, conviene reponer un enlace a
 * los créditos (ver DECISIONS v5.17.7).
 */
export function SiteFooter() {
  const { perfil } = useIdioma();
  return (
    <footer className="relative z-10 border-t border-line bg-ink-2">
      <Container size="wide" className="py-10">
        <p className="font-mono text-xs text-muted">
          © {anio} {perfil.nombre}
        </p>
      </Container>
    </footer>
  );
}
