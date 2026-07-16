"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/Tag";
import { Placeholder } from "@/components/ui/Placeholder";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Proyecto } from "@/content/types";

/**
 * Card de proyecto en Liquid Glass con hover espacial: elevación (sombra, SIN
 * glow) e inclinación sutil hacia el puntero (JS, solo pointer fino / sin
 * reduced-motion). `href` interno (case study) tiene prioridad; si no, enlaza al
 * repo; si no hay ninguno, es informativa.
 */
export function ProjectCard({
  proyecto,
  href,
}: {
  proyecto: Proyecto;
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const cap = proyecto.capturas[0];
  const tieneCaptura = Boolean(cap && !cap.falta && cap.src);
  const repo = proyecto.enlaces.find((e) => e.tipo === "repo" || e.tipo === "demo");
  const linkable = Boolean(href || repo);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || reduced || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const contenido = (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "glass group relative flex h-full flex-col overflow-hidden transition-[transform,box-shadow] duration-300 will-change-transform",
        linkable && "hover:shadow-[var(--shadow-float)]",
      )}
    >
      {/* Media */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line-soft bg-white/10">
        {tieneCaptura ? (
          <Image
            src={cap.src}
            alt={cap.alt}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Placeholder label={cap?.alt ?? "captura"} className="h-full border-0" />
        )}
        {proyecto.incompleto && (
          <span className="glass glass-pill absolute top-3 right-3 px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-chalk-dim">
            en progreso
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="type-h3 text-chalk">{proyecto.nombre}</h3>
          {linkable && (
            <ArrowUpRight className="size-5 shrink-0 text-muted transition-colors group-hover:text-acento" />
          )}
        </div>
        <p className="text-sm leading-relaxed text-chalk-dim">{proyecto.unaLinea}</p>
        {proyecto.stack.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {proyecto.stack.slice(0, 3).map((s) => (
              <Tag key={s} variant="outline" size="sm">
                {s}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${proyecto.nombre}: ver el caso`}
        className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {contenido}
      </Link>
    );
  }
  if (repo) {
    return (
      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${proyecto.nombre}: abrir ${repo.label}`}
        className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {contenido}
      </a>
    );
  }
  return contenido;
}
