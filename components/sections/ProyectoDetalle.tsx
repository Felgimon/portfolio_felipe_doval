"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Placeholder } from "@/components/ui/Placeholder";

/**
 * El CUERPO del case study, como componente cliente: toma el proyecto del
 * diccionario de idioma (es/en automático). El shell servidor
 * (app/proyectos/[slug]/page.tsx) conserva metadata y rutas estáticas — la
 * metadata queda en español a propósito (el SEO del sitio es español).
 */

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

export function ProyectoDetalle({ slug }: { slug: string }) {
  const { t, proyectos, getProyecto } = useIdioma();
  const p = getProyecto(slug);
  // El shell servidor ya garantizó que el slug existe y es destacado.
  if (!p) return null;

  const otros = proyectos.filter(
    (x) => x.categoria === "destacado" && x.slug !== p.slug,
  );
  const siguiente = otros[0];
  const d = t.detalle;

  return (
    <article className="relative pt-28 pb-24">
      {/* Cielo de fondo, coherente con la home */}
      <div
        className="sky sky-drift pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      />
      <Container size="wide">
        <Link
          href="/#trabajo"
          className="link-underline inline-flex items-center gap-2 font-mono text-xs tracking-wide text-chalk-dim transition-colors hover:text-acento"
        >
          <ArrowLeft className="size-4" />
          {d.volver}
        </Link>

        {/* Encabezado */}
        <header className="mt-10 border-b border-line pb-12">
          <Eyebrow>{d.caseStudy}</Eyebrow>
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
                {d.miRol}
              </p>
              <p className="text-sm text-chalk-dim">{p.rol}</p>
            </div>
            {p.equipo && (
              <div>
                <p className="mb-2 font-mono text-xs tracking-wide text-muted">
                  {d.equipo}
                </p>
                <ul className="space-y-1 text-sm text-chalk-dim">
                  {p.equipo.map((m) => (
                    <li key={m.nombre}>
                      {m.nombre} · <span className="text-muted">{m.rol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-2 font-mono text-xs tracking-wide text-muted">
                {d.stack}
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
          <Bloque titulo={d.problema} acento={p.acento}>
            <p className="text-chalk-dim">{p.problema}</p>
          </Bloque>
        )}
        {p.solucion && (
          <Bloque titulo={d.solucion} acento={p.acento}>
            <p className="text-chalk-dim">{p.solucion}</p>
          </Bloque>
        )}
        {p.destacados && (
          <Bloque titulo={d.decisiones} acento={p.acento}>
            <div className="flex flex-col">
              {p.destacados.map((x) => (
                <p
                  key={x}
                  className="border-t border-line-soft py-4 leading-relaxed text-chalk-dim first:border-t-0 first:pt-0"
                >
                  {x}
                </p>
              ))}
            </div>
          </Bloque>
        )}

        {/* Capturas */}
        <section className="border-t border-line py-12 lg:py-16">
          <h2 className="type-h3 mb-8 text-chalk">{d.capturas}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {p.capturas.map((c, i) => (
              <div
                key={i}
                className="glass relative aspect-[16/10] overflow-hidden"
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
          <Bloque titulo={d.aprendizajes} acento={p.acento}>
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
              {d.todoTrabajo}
            </Button>
            <Link
              href={`/proyectos/${siguiente.slug}`}
              className="group inline-flex items-center gap-3 text-right"
            >
              <span>
                <span className="block font-mono text-xs text-muted">
                  {d.siguiente}
                </span>
                <span className="type-h3 text-chalk transition-colors group-hover:text-acento">
                  {siguiente.nombre}
                </span>
              </span>
              <ArrowUpRight className="size-6 text-acento" />
            </Link>
          </nav>
        )}
      </Container>
    </article>
  );
}
