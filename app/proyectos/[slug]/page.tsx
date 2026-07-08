import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { proyectosDestacados, getProyecto } from "@/content/proyectos";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Placeholder } from "@/components/ui/Placeholder";

// Solo los destacados tienen case study. Otros slugs → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return proyectosDestacados.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p) return {};
  return {
    title: p.nombre,
    description: p.unaLinea,
  };
}

function Bloque({
  titulo,
  children,
  acento,
}: {
  titulo: string;
  children: React.ReactNode;
  acento: string;
}) {
  return (
    <section className="border-t border-line py-12 lg:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.3fr_0.7fr] lg:gap-12">
        <h2 className="type-h3 flex items-start gap-3 text-chalk">
          <span
            aria-hidden
            className="mt-2.5 h-4 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: acento }}
          />
          {titulo}
        </h2>
        <div className="max-w-2xl">{children}</div>
      </div>
    </section>
  );
}

export default async function ProyectoDetalle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p || p.categoria !== "destacado") notFound();

  const otros = proyectosDestacados.filter((x) => x.slug !== p.slug);
  const siguiente = otros[0];

  return (
    <article className="pt-28 pb-24">
      <Container size="wide">
        <Link
          href="/#trabajo"
          className="link-underline inline-flex items-center gap-2 font-mono text-xs tracking-wide text-chalk-dim transition-colors hover:text-agua"
        >
          <ArrowLeft className="size-4" />
          Volver al trabajo
        </Link>

        {/* Encabezado */}
        <header className="mt-10 border-b border-line pb-12">
          <Eyebrow>Case study</Eyebrow>
          <Heading as="h1" size="h1" className="mt-4">
            {p.nombre}
          </Heading>
          {p.tagline && (
            <p className="mt-4 font-mono text-sm" style={{ color: p.acento }}>
              “{p.tagline}”
            </p>
          )}
          <p className="lead mt-6 max-w-3xl">{p.unaLinea}</p>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-mono text-xs tracking-wide text-muted">
                Mi rol
              </p>
              <p className="text-sm text-chalk-dim">{p.rol}</p>
            </div>
            {p.equipo && (
              <div>
                <p className="mb-2 font-mono text-xs tracking-wide text-muted">
                  Equipo
                </p>
                <ul className="space-y-1 text-sm text-chalk-dim">
                  {p.equipo.map((m) => (
                    <li key={m.nombre}>
                      {m.nombre} — <span className="text-muted">{m.rol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-2 font-mono text-xs tracking-wide text-muted">
                Stack
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <li key={s}>
                    <Tag variant="soft" size="sm">
                      {s}
                    </Tag>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {p.enlaces.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {p.enlaces.map((e) => (
                <Button key={e.url} href={e.url} variant="secondary" external>
                  {e.label}
                  <ArrowUpRight className="size-4" />
                </Button>
              ))}
            </div>
          )}
        </header>

        {/* Cuerpo */}
        {p.problema && (
          <Bloque titulo="El problema" acento={p.acento}>
            <p className="text-chalk-dim">{p.problema}</p>
          </Bloque>
        )}
        {p.solucion && (
          <Bloque titulo="La solución" acento={p.acento}>
            <p className="text-chalk-dim">{p.solucion}</p>
          </Bloque>
        )}
        {p.destacados && (
          <Bloque titulo="Decisiones y features" acento={p.acento}>
            <ol className="flex flex-col">
              {p.destacados.map((d, i) => (
                <li
                  key={d}
                  className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-line-soft py-4 first:border-t-0 first:pt-0"
                >
                  <span className="data pt-0.5 text-sm text-agua tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed text-chalk-dim">{d}</span>
                </li>
              ))}
            </ol>
          </Bloque>
        )}

        {/* Capturas */}
        <section className="border-t border-line py-12 lg:py-16">
          <h2 className="type-h3 mb-8 text-chalk">Capturas</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {p.capturas.map((c, i) => (
              <div
                key={i}
                className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-ink-2"
              >
                {c.src && !c.falta ? (
                  <Image
                    src={c.src}
                    alt={c.alt}
                    fill
                    sizes="(max-width: 640px) 90vw, 45vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <Placeholder label={c.alt} className="h-full border-0" />
                )}
              </div>
            ))}
          </div>
        </section>

        {p.aprendizajes && (
          <Bloque titulo="Aprendizajes" acento={p.acento}>
            <ul className="flex flex-col gap-3">
              {p.aprendizajes.map((a) => (
                <li key={a} className="text-chalk-dim">
                  {a}
                </li>
              ))}
            </ul>
          </Bloque>
        )}

        {/* Navegación entre casos */}
        {siguiente && (
          <nav className="mt-16 flex flex-col gap-4 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
            <Button href="/#trabajo" variant="ghost">
              <ArrowLeft className="size-4" />
              Todo el trabajo
            </Button>
            <Link
              href={`/proyectos/${siguiente.slug}`}
              className="group inline-flex items-center gap-3 text-right"
            >
              <span>
                <span className="block font-mono text-xs text-muted">
                  Siguiente caso
                </span>
                <span className="type-h3 text-chalk transition-colors group-hover:text-agua">
                  {siguiente.nombre}
                </span>
              </span>
              <ArrowUpRight className="size-6 text-agua" />
            </Link>
          </nav>
        )}
      </Container>
    </article>
  );
}
