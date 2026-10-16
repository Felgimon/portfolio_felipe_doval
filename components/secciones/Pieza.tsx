"use client";
import Image from "next/image";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Placeholder } from "@/components/ui/Placeholder";
import type { Proyecto } from "@/content/types";
import { cn } from "@/lib/utils";
import { Dato } from "./comun";

/**
 * Un proyecto destacado: la captura en su marco y, al lado, qué es, el rol, el
 * stack y los links. `invertida` pone el texto a la izquierda (en el celular la
 * captura va siempre primero).
 */
export function Pieza({ p, etiqueta, enCurso, invertida, prioridad }: {
  p: Proyecto;
  etiqueta: string;
  enCurso?: boolean;
  invertida?: boolean;
  prioridad?: boolean;
}) {
  const { t } = useIdioma();
  const c = p.capturas[0];
  const repo = p.enlaces.find((e) => e.tipo === "repo");

  const captura = (
    <div className={cn("marco aspect-[16/10]", invertida && "md:order-2")}>
      {c && !c.falta && c.src ? (
        <Image
          src={c.src}
          alt={c.alt}
          fill
          sizes="(max-width: 768px) 92vw, 720px"
          priority={prioridad}
          className="object-cover object-top"
        />
      ) : (
        <Placeholder label={c?.alt ?? p.nombre} className="border-0" />
      )}
    </div>
  );

  return (
    <article
      className={cn(
        "mt-10 grid items-center gap-6 md:mt-16 md:gap-12",
        invertida ? "md:grid-cols-[5fr_7fr]" : "md:grid-cols-[7fr_5fr]",
      )}
    >
      {captura}
      <div className={cn(invertida && "md:order-1")}>
        <p className="etiqueta">
          {enCurso && <span className="punto" aria-hidden />}
          {etiqueta}
        </p>
        <h3 className="h3 mt-3 text-[32px] leading-none md:text-[40px]">{p.nombre}</h3>
        <p className="mt-3 text-[19px] leading-[1.45]">{p.unaLinea}</p>
        <dl className="mt-5 flex flex-col gap-2">
          <Dato etiqueta={t.trabajo.rol}>{p.rol}</Dato>
          <Dato etiqueta={t.trabajo.stack}>{p.stack.join(", ")}</Dato>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/proyectos/${p.slug}`}
            className="boton boton-solido"
            aria-label={`${p.nombre}: ${t.trabajo.ariaVerCaso}`}
          >
            {t.trabajo.verCaso} <span aria-hidden className="flecha flecha-der">→</span>
          </Link>
          {repo && (
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              data-vidrio
              className="boton vidrio vidrio-pildora boton-vidrio"
            >
              {repo.label} <span aria-hidden className="flecha flecha-diag">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
