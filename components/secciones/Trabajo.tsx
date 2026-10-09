"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { Placeholder } from "@/components/ui/Placeholder";
import { guion } from "@/content/guia";
import type { Proyecto } from "@/content/types";
import { cn } from "@/lib/utils";
import { TituloParada } from "./comun";

/**
 * TRABAJO. Ordenado por lo que pesa: Superlum (lo que está construyendo hoy)
 * en grande, FutbolVision al lado y más chico, y abajo lo que lo trajo hasta
 * acá. Tamaños por importancia real, no un bento.
 *
 * Las tarjetas son PAPEL (sólido, borde tinta, sombra dura jade), no vidrio:
 * un vidrio sobre papel opaco no tendría nada que doblar.
 */

function Captura({ p, sizes, prioridad }: { p: Proyecto; sizes: string; prioridad?: boolean }) {
  const c = p.capturas[0];
  return (
    <div className="relative aspect-[16/10] overflow-hidden border-b-[1.5px] border-tinta bg-papel">
      {c && !c.falta && c.src ? (
        <Image src={c.src} alt={c.alt} fill sizes={sizes} priority={prioridad} className="object-cover object-top" />
      ) : (
        <Placeholder label={c?.alt ?? p.nombre} className="border-0" />
      )}
    </div>
  );
}

function Destacado({ p, grande }: { p: Proyecto; grande?: boolean }) {
  const { t } = useIdioma();
  const repo = p.enlaces.find((e) => e.tipo === "repo");
  const enCurso = p.slug === "superlum";
  return (
    <article className={cn("papel overflow-hidden", grande ? "lg:col-span-7" : "lg:col-span-5 lg:mt-24")}>
      <Captura p={p} sizes={grande ? "(max-width: 1024px) 92vw, 720px" : "(max-width: 1024px) 92vw, 520px"} />
      <div className={cn("flex flex-col gap-3", grande ? "p-6 lg:p-8" : "p-6")}>
        <div>
          <span className={enCurso ? "etiqueta-estado" : "etiqueta text-tinta-2"}>
            {enCurso ? t.trabajo.enProgreso : t.trabajo.anterior}
          </span>
        </div>
        <h3 className={cn("leading-none font-bold tracking-[-0.02em]", grande ? "text-[40px] lg:text-[46px]" : "text-[32px]")}>
          {p.nombre}
        </h3>
        <p className="text-[17px] leading-[1.45]">{p.unaLinea}</p>
        <dl className="mt-1 flex flex-col gap-1.5">
          <div className="grid grid-cols-[3.6rem_1fr] gap-x-3">
            <dt className="etiqueta pt-0.5 text-tinta-2">{t.trabajo.rol}</dt>
            <dd className="text-[15px] leading-snug">{p.rol}</dd>
          </div>
          <div className="grid grid-cols-[3.6rem_1fr] gap-x-3">
            <dt className="etiqueta pt-0.5 text-tinta-2">{t.trabajo.stack}</dt>
            <dd className="etiqueta leading-snug">{p.stack.join(", ")}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={`/proyectos/${p.slug}`} className="boton" aria-label={`${p.nombre}: ${t.trabajo.ariaVerCaso}`}>
            {t.trabajo.verCaso}
          </Link>
          {repo ? (
            <a href={repo.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
              {repo.label}
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          ) : (
            <span className="etiqueta text-tinta-2">{t.trabajo.repoPrivado}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function Secundario({ p }: { p: Proyecto }) {
  const { t } = useIdioma();
  const link = p.enlaces.find((e) => e.tipo === "repo" || e.tipo === "demo");
  const cuerpo = (
    <>
      <Captura p={p} sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-[20px] leading-tight font-bold">{p.nombre}</h4>
          {link && <ArrowUpRight className="size-5 shrink-0" aria-hidden />}
        </div>
        <p className="cuerpo text-[15px]">{p.unaLinea}</p>
        {p.stack.length > 0 && <p className="etiqueta mt-auto pt-2 text-tinta-2">{p.stack.slice(0, 3).join(", ")}</p>}
      </div>
    </>
  );
  if (link) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${p.nombre}: ${t.trabajo.ariaAbrirRepo} ${link.label}`}
        className="papel flex h-full flex-col overflow-hidden"
      >
        {cuerpo}
      </a>
    );
  }
  return <div className="papel flex h-full flex-col overflow-hidden">{cuerpo}</div>;
}

export function Trabajo() {
  const { proyectos, t, idioma } = useIdioma();
  const g = guion[idioma].paradas.trabajo;
  const destacados = proyectos.filter((p) => p.categoria === "destacado");
  const secundarios = proyectos.filter((p) => p.categoria === "secundario");

  return (
    <section
      id="trabajo"
      aria-labelledby="trabajo-titulo"
      className="parada"
      data-gotas="1.02 0.05 120 1; -0.02 0.34 100 0; 0.62 0.46 110 0; 0.46 0.99 90 1"
      data-gotas-m="1.12 0.03 100 1; -0.12 0.3 80 0"
    >
      <div className="contenedor">
        <div className="grid items-end gap-x-10 gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <TituloParada id="trabajo-titulo">{t.paradas.trabajo}</TituloParada>
          </div>
          <div className="flex items-end justify-end gap-4 lg:col-span-6">
            <Globo parada="trabajo" className="mb-[22%] min-w-0 flex-1 lg:flex-none" gotas="0.1 0.55 66 1">
              {g.frase}
            </Globo>
            <Feli pose={g.pose} parada="trabajo" className="h-[clamp(180px,38vh,340px)] w-auto shrink-0" />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {destacados.map((p, i) => (
            <Destacado key={p.slug} p={p} grande={i === 0} />
          ))}
        </div>

        <h3 className="mt-20 text-[22px] font-bold">{t.trabajo.otros}</h3>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {secundarios.map((p) => (
            <li key={p.slug}>
              <Secundario p={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
