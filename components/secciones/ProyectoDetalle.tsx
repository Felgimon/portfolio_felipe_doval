"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { Placeholder } from "@/components/ui/Placeholder";
import { guion } from "@/content/guia";

/**
 * El CASO de un proyecto destacado. El nombre va en Bricolage grande: la
 * script queda para el nombre de Feli y los títulos de parada. Feli se apoya
 * junto a la captura principal y cuenta en qué estado está el proyecto.
 */

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="papel grid gap-4 p-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:p-8">
      <h2 className="text-[22px] leading-tight font-bold">{titulo}</h2>
      <div className="max-w-[64ch]">{children}</div>
    </section>
  );
}

export function ProyectoDetalle({ slug }: { slug: string }) {
  const { t, idioma, proyectos, getProyecto } = useIdioma();
  const p = getProyecto(slug);
  if (!p) return null;
  const d = t.detalle;
  const enCurso = p.slug === "superlum";
  const frase = guion[idioma].detalle[p.slug];
  const siguiente = proyectos.find((x) => x.categoria === "destacado" && x.slug !== p.slug);
  const [principal, ...resto] = p.capturas;

  return (
    <main id="contenido" className="capa pt-28 pb-16">
      <div
        className="contenedor"
        data-gotas="0.98 0.08 150 1; 0.02 0.42 110 0; 0.9 0.62 120 0"
        data-gotas-m="1.0 0.04 90 1; 0.0 0.4 70 0"
      >
        <header className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className={enCurso ? "etiqueta-estado" : "etiqueta text-tinta-2"}>
              {enCurso ? t.trabajo.enProgreso : t.trabajo.anterior}
            </span>
            <h1 className="mt-4 text-[clamp(48px,7vw,88px)] leading-[0.95] font-extrabold tracking-[-0.03em] outline-none">
              {p.nombre}
            </h1>
            <p className="mt-5 max-w-[50ch] text-[clamp(18px,1.6vw,22px)] leading-snug font-medium">{p.unaLinea}</p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="etiqueta text-tinta-2">{d.miRol}</dt>
                <dd className="mt-1 text-[15.5px] leading-snug">{p.rol}</dd>
              </div>
              {p.equipo && (
                <div>
                  <dt className="etiqueta text-tinta-2">{d.equipo}</dt>
                  <dd className="mt-1 text-[15.5px] leading-snug">
                    {p.equipo.map((m) => (
                      <span key={m.nombre} className="block">
                        {m.nombre}, <span className="text-tinta-2">{m.rol}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="etiqueta text-tinta-2">{d.stack}</dt>
                <dd className="etiqueta mt-1 leading-snug">{p.stack.join(", ")}</dd>
              </div>
            </dl>
            {p.enlaces.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-4">
                {p.enlaces.map((e) => (
                  <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" className="boton">
                    {e.label}
                    <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="mt-14 grid items-end gap-6 lg:grid-cols-12">
          <figure className="papel overflow-hidden lg:col-span-9">
            <div className="relative aspect-[16/10]">
              {principal && !principal.falta ? (
                <Image
                  src={principal.src}
                  alt={principal.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 900px"
                  className="object-cover object-top"
                />
              ) : (
                <Placeholder label={principal?.alt ?? p.nombre} className="border-0" />
              )}
            </div>
          </figure>
          <div className="relative flex items-end gap-3 lg:col-span-3 lg:flex-col lg:items-start">
            {frase && (
              <Globo parada="trabajo" gotas="0.5 0.9 70 1">
                {frase}
              </Globo>
            )}
            <Feli pose="mira" parada="trabajo" className="w-[46%] max-w-[260px] lg:w-full" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6">
          {p.problema && (
            <Bloque titulo={d.problema}>
              <p className="cuerpo">{p.problema}</p>
            </Bloque>
          )}
          {p.solucion && (
            <Bloque titulo={d.solucion}>
              <p className="cuerpo">{p.solucion}</p>
            </Bloque>
          )}
          {p.destacados && (
            <Bloque titulo={d.decisiones}>
              <div className="flex flex-col divide-y divide-linea">
                {p.destacados.map((x) => (
                  <p key={x} className="cuerpo py-3 first:pt-0 last:pb-0">
                    {x}
                  </p>
                ))}
              </div>
            </Bloque>
          )}
          {resto.length > 0 && (
            <section>
              <h2 className="text-[22px] font-bold">{d.capturas}</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {resto.map((c) => (
                  <figure key={c.src} className="papel overflow-hidden">
                    <div className="relative aspect-[16/10]">
                      {c.src && !c.falta ? (
                        <Image src={c.src} alt={c.alt} fill sizes="(max-width: 640px) 92vw, 45vw" className="object-cover object-top" />
                      ) : (
                        <Placeholder label={c.alt} className="border-0" />
                      )}
                    </div>
                  </figure>
                ))}
              </div>
            </section>
          )}
          {p.aprendizajes && (
            <Bloque titulo={d.aprendizajes}>
              <div className="flex flex-col gap-3">
                {p.aprendizajes.map((a) => (
                  <p key={a} className="cuerpo">
                    {a}
                  </p>
                ))}
              </div>
            </Bloque>
          )}
        </div>

        {siguiente && (
          <nav className="mt-16 flex justify-end" aria-label={d.siguiente}>
            <Link href={`/proyectos/${siguiente.slug}`} className="group inline-flex items-center gap-4 text-right">
              <span>
                <span className="etiqueta block text-tinta-2">{d.siguiente}</span>
                <span className="text-[32px] font-bold tracking-[-0.02em] group-hover:text-verde-texto">
                  {siguiente.nombre}
                </span>
              </span>
              <ArrowRight className="size-7" aria-hidden />
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
