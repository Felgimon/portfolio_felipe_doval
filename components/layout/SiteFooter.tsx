"use client";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Container } from "@/components/ui/Container";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { EmailLink } from "@/components/ui/EmailLink";
import { Logo } from "@/components/ui/Logo";

const anio = new Date().getFullYear();

/** Footer mínimo: marca, contacto y créditos. */
export function SiteFooter() {
  const { t, perfil } = useIdioma();
  return (
    <footer className="relative z-10 border-t border-line bg-ink-2">
      <Container size="wide" className="py-16">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo className="text-2xl text-chalk" />
            <p className="mt-4 text-sm leading-relaxed text-chalk-dim">
              {perfil.nombre}. {t.footer.bio}
            </p>
            <p className="mt-3 font-mono text-xs text-muted">
              {perfil.ubicacion}
            </p>
          </div>

          <nav aria-label={t.footer.ariaEnlaces} className="flex flex-col gap-4">
            <p className="eyebrow">{t.nodos.contacto.label}</p>
            <EmailLink
              mode="link"
              className="text-sm text-chalk-dim transition-colors hover:text-acento"
            />
            <a
              href={perfil.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-chalk-dim transition-colors hover:text-acento"
            >
              <BrandIcon name="github" className="size-4" />
              GitHub
            </a>
            <a
              href={perfil.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-chalk-dim transition-colors hover:text-acento"
            >
              <BrandIcon name="linkedin" className="size-4" />
              LinkedIn
            </a>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line-soft pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-muted">
            © {anio} {perfil.nombre} · {t.footer.hechoCon} Next.js + Three.js · {t.footer.solCredito}:{" "}
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
          <Link
            href="#inicio"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-chalk-dim transition-colors hover:text-acento"
          >
            {t.footer.volverArriba}
            <ArrowUp className="size-3.5" />
          </Link>
        </div>
      </Container>
    </footer>
  );
}
