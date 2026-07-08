"use client";
import { useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/Tag";
import { Placeholder } from "@/components/ui/Placeholder";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Proyecto } from "@/content/types";

/**
 * Card de proyecto secundario con hover rico: elevación + glow agua (CSS) e
 * inclinación sutil hacia el puntero (JS, solo pointer fino / sin reduced-motion).
 * Si hay repo, toda la card enlaza; si no, es informativa (proyecto sin link).
 */
export function ProjectCard({ proyecto }: { proyecto: Proyecto }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const cap = proyecto.capturas[0];
  const tieneCaptura = Boolean(cap && !cap.falta && cap.src);
  const repo = proyecto.enlaces.find((e) => e.tipo === "repo" || e.tipo === "demo");

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
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel transition-[transform,border-color,box-shadow] duration-300 will-change-transform",
        repo && "hover:border-agua/50 hover:shadow-[0_0_40px_-12px_rgba(143,227,198,0.4)]",
      )}
    >
      {/* Media */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line-soft bg-ink-2">
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
          <span className="absolute top-3 right-3 rounded-full border border-line bg-ink/80 px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-muted backdrop-blur">
            en progreso
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="type-h3 text-chalk">{proyecto.nombre}</h3>
          {repo && (
            <ArrowUpRight className="size-5 shrink-0 text-muted transition-colors group-hover:text-agua" />
          )}
        </div>
        <p className="text-sm leading-relaxed text-chalk-dim">{proyecto.unaLinea}</p>
        {proyecto.stack.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {proyecto.stack.slice(0, 3).map((s) => (
              <li key={s}>
                <Tag variant="outline" size="sm">
                  {s}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (repo) {
    return (
      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${proyecto.nombre} — abrir ${repo.label}`}
        className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {contenido}
      </a>
    );
  }
  return contenido;
}
