"use client";
import Image from "next/image";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Placeholder } from "@/components/ui/Placeholder";

/**
 * El CASO de un proyecto destacado. El nombre es la placa de la página (la gota
 * se apoya en su última letra); abajo, la captura principal y los bloques del
 * caso como filas: título a la izquierda, texto a la derecha.
 */

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-linea py-8 md:grid-cols-[16rem_1fr] md:gap-10">
      <h2 className="h3 text-[22px] leading-tight">{titulo}</h2>
      <div className="max-w-[64ch]">{children}</div>
    </section>
  );
}

export function ProyectoDetalle({ slug }: { slug: string }) {
  const { t, proyectos, getProyecto } = useIdioma();
  const p = getProyecto(slug);
  if (!p) return null;
  const d = t.detalle;
  const enCurso = p.slug === "superlum";
  const siguiente = proyectos.find((x) => x.categoria === "destacado" && x.slug !== p.slug);
  const [principal, ...resto] = p.capturas;

  return (
    <main id="contenido" className="capa pt-32 pb-16 md:pt-40" data-gota="0.97 0.5 0.1" data-gota-m="0.95 0.5 0.1">
      <div className="contenedor">
        <p className="etiqueta">
          {enCurso && <span className="punto" aria-hidden />}
          {enCurso ? t.trabajo.enProgreso : t.trabajo.anterior}
        </p>
        <h1 data-placa className="placa titulo-caso mt-4 outline-none">
          <span>{p.nombre}</span>
        </h1>
        <p className="lead mt-8 max-w-[50ch]">{p.unaLinea}</p>

        <dl className="mt-10 grid gap-6 md:grid-cols-3">
          <div>
            <dt className="etiqueta">{d.miRol}</dt>
            <dd className="mt-1.5 text-[15.5px] leading-snug">{p.rol}</dd>
          </div>
          {p.equipo && (
            <div>
              <dt className="etiqueta">{d.equipo}</dt>
              <dd className="mt-1.5 text-[15.5px] leading-snug">
                {p.equipo.map((m) => (
                  <span key={m.nombre} className="block">
                    {m.nombre}, <span className="text-crema-2">{m.rol}</span>
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div>
            <dt className="etiqueta">{d.stack}</dt>
            <dd className="mt-1.5 text-[15.5px] leading-snug">{p.stack.join(", ")}</dd>
          </div>
        </dl>
        {p.enlaces.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {p.enlaces.map((e) => (
              <a
                key={e.url}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                data-vidrio
                className="boton vidrio vidrio-pildora boton-vidrio"
              >
                {e.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
        )}

        <figure className="marco mt-14 aspect-[16/10]">
          {principal && !principal.falta ? (
            <Image
              src={principal.src}
              alt={principal.alt}
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 1296px"
              className="object-cover object-top"
            />
          ) : (
            <Placeholder label={principal?.alt ?? p.nombre} className="border-0" />
          )}
        </figure>

        <div className="mt-10 border-t border-linea">
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
              <div className="flex flex-col gap-4">
                {p.destacados.map((x) => (
                  <p key={x} className="cuerpo">
                    {x}
                  </p>
                ))}
              </div>
            </Bloque>
          )}
          {p.aprendizajes && (
            <Bloque titulo={d.aprendizajes}>
              <div className="flex flex-col gap-4">
                {p.aprendizajes.map((a) => (
                  <p key={a} className="cuerpo">
                    {a}
                  </p>
                ))}
              </div>
            </Bloque>
          )}
        </div>

        {resto.length > 0 && (
          <section className="mt-14">
            <h2 className="h3 text-[22px]">{d.capturas}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {resto.map((c) => (
                <figure key={c.src} className="marco aspect-[16/10]">
                  {c.src && !c.falta ? (
                    <Image src={c.src} alt={c.alt} fill sizes="(max-width: 768px) 92vw, 640px" className="object-cover object-top" />
                  ) : (
                    <Placeholder label={c.alt} className="border-0" />
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {siguiente && (
          <nav className="mt-20 flex justify-end" aria-label={d.siguiente}>
            <Link href={`/proyectos/${siguiente.slug}`} className="group text-right">
              <span className="etiqueta block">{d.siguiente}</span>
              <span className="mt-2 block text-[36px] leading-none font-[850] uppercase [font-stretch:125%] transition-colors group-hover:text-white md:text-[48px]">
                {siguiente.nombre} <span aria-hidden>→</span>
              </span>
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
