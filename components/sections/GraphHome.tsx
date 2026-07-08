"use client";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGpuTier } from "@/hooks/useGpuTier";
import { useAppReady } from "@/components/motion/AppReady";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import { useActiveSection } from "@/hooks/useActiveSection";
import { nodos, nodoIds, seccionIds, indiceNodo } from "@/lib/navigation";
import { perfil } from "@/content/perfil";
import { cn } from "@/lib/utils";

// El 3D se carga aparte (ssr:false): no entra en el bundle inicial.
const GraphCanvas = dynamic(() => import("@/components/three/GraphCanvas"), {
  ssr: false,
});

/** Poster estático del grafo (reduced-motion / GPU débil). */
function PosterFallback({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-1/2 right-0 aspect-square h-[110%] -translate-y-1/2 translate-x-[10%] sm:right-[4%] sm:translate-x-0">
        <Image
          src="/assets/hero-poster.png"
          alt=""
          fill
          priority
          sizes="(max-width: 820px) 95vw, 60vw"
          className="object-contain"
          onLoad={onLoaded}
        />
      </div>
    </div>
  );
}

/** HUD de navegación: barra-consola inferior con los 5 nodos, índice y progreso.
 * Es la nav "futurista" y a la vez el fallback accesible (teclado / mobile /
 * sin-WebGL): scrollear o clickear un nodo llevan al mismo lugar. */
function HudRail({
  activeIndex,
  onGoto,
}: {
  activeIndex: number;
  onGoto: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Nodos del portfolio"
      className="fixed inset-x-0 bottom-0 z-40"
    >
      <div className="mx-auto flex max-w-[88rem] items-center gap-3 border-t border-line bg-ink/72 px-4 py-2.5 backdrop-blur-md sm:gap-5 sm:px-8">
        <span className="eyebrow hidden shrink-0 sm:block">Nodos</span>
        <ol className="flex flex-1 items-center justify-between gap-1 sm:justify-start sm:gap-2">
          {nodos.map((n, i) => {
            const active = i === activeIndex;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onGoto(n.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "group flex items-center gap-2 rounded-full px-2.5 py-1.5 font-mono text-xs tracking-wide transition-colors sm:px-3",
                    active
                      ? "text-agua"
                      : "text-muted hover:text-chalk-dim",
                  )}
                >
                  <span aria-hidden className="tabular-nums opacity-70">
                    {indiceNodo(i)}
                  </span>
                  <span className="hidden sm:inline">{n.label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full transition-all",
                      active
                        ? "scale-125 bg-agua shadow-[0_0_10px_-1px_var(--agua)]"
                        : "bg-line group-hover:bg-chalk-dim",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <span
          aria-hidden
          className="data hidden shrink-0 text-muted sm:block"
        >
          {activeIndex >= 0 ? indiceNodo(activeIndex) : "00"} / 05
        </span>
      </div>
    </nav>
  );
}

/**
 * Home = hub del grafo. El balón + nodos viven en una capa FIJA detrás del
 * contenido; el nodo activo (derivado del scroll) se ilumina y el HUD lo marca.
 * La portada (#inicio) muestra el modelo + una línea que enseña que los nodos se
 * pueden tocar. Los tópicos (children) scrollean por delante.
 */
export function GraphHome({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const { tier, loading } = useGpuTier();
  const { marcarHeroCargado } = useAppReady();
  const { scrollTo } = useSmoothScroll();

  const ids = useMemo(() => seccionIds, []);
  const active = useActiveSection(ids);
  const activeIndex = nodoIds.indexOf(active as (typeof nodoIds)[number]);

  const stageRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const usarCanvas = !reduced && !loading && tier >= 2;
  const mostrarPoster = reduced || (!loading && tier < 2);

  const goto = (id: string) => scrollTo(`#${id}`);

  return (
    <>
      {/* Capa fija: el grafo 3D (o poster). Detrás del contenido, sin capturar
          el puntero (los nodos clickeables llegan como overlay en la Fase D). */}
      <div
        ref={stageRef}
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
      >
        {usarCanvas ? (
          <GraphCanvas
            tier={tier}
            activeIndex={activeIndex}
            paused={!visible}
            onReady={marcarHeroCargado}
          />
        ) : mostrarPoster ? (
          <PosterFallback onLoaded={marcarHeroCargado} />
        ) : null}
      </div>

      {/* Contenido */}
      <div className="relative z-10">
        {/* Portada — solo modelo + logo (+ una línea que enseña la interacción) */}
        <section
          id="inicio"
          className="relative flex min-h-dvh flex-col justify-end pb-28 sm:pb-32"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
            style={{
              background:
                "linear-gradient(0deg, var(--ink) 8%, rgba(15,30,27,0.4) 45%, transparent)",
            }}
          />
          <Container size="wide" className="relative">
            <h1 className="font-mono text-xs tracking-[0.28em] text-chalk-dim uppercase">
              {perfil.nombre}
              <span className="text-muted"> — {perfil.rol}</span>
            </h1>
            <p className="type-h2 mt-5 max-w-xl text-balance text-chalk">
              Cada nodo del balón es una parte de lo que hago.
            </p>
            <p className="mt-5 flex items-center gap-2 font-mono text-xs text-muted">
              <span className="inline-block size-1.5 rounded-full bg-agua shadow-[0_0_10px_-1px_var(--agua)]" />
              Tocá un nodo —o scrolleá— para entrar.
            </p>
          </Container>
        </section>

        {children}
      </div>

      <HudRail activeIndex={activeIndex} onGoto={goto} />
    </>
  );
}
