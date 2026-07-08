"use client";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGL } from "@/hooks/useWebGL";
import { useAppReady } from "@/components/motion/AppReady";
import { useSmoothScroll } from "@/components/motion/SmoothScroll";
import type { CamState, NodeProj } from "@/components/three/GraphCanvas";
import { nodos, seccionIds } from "@/lib/navigation";
import { perfil } from "@/content/perfil";
import { cn } from "@/lib/utils";

// El 3D se carga aparte (ssr:false): no entra en el bundle inicial.
const GraphCanvas = dynamic(() => import("@/components/three/GraphCanvas"), {
  ssr: false,
});

/** Flag de preview `?gl` (fuerza el canvas aunque no haga falta). */
function useForceGl(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("gl"),
    () => false,
  );
}

/** Poster estático del grafo (solo si NO hay WebGL). */
function PosterFallback({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-1/2 left-1/2 aspect-square h-[92%] max-h-[820px] -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/assets/hero-poster.png"
          alt=""
          fill
          priority
          sizes="90vw"
          className="object-contain"
          onLoad={onLoaded}
        />
      </div>
    </div>
  );
}

/** Etiquetas clickeables proyectadas sobre los nodos 3D. Se muestran en la
 * portada (overview); al bucear a un tópico se desvanecen (nav = HUD). Son azúcar
 * de puntero (tabIndex -1); el teclado/lector usa el HUD. */
function NodeOverlay({
  projRef,
  overview,
  onGoto,
}: {
  projRef: RefObject<NodeProj[]>;
  overview: boolean;
  onGoto: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const proj = projRef.current;
      for (let i = 0; i < nodos.length; i++) {
        const b = refs.current[i];
        if (!b) continue;
        const p = proj[i];
        if (!p) {
          b.style.opacity = "0";
          b.style.pointerEvents = "none";
        } else {
          b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
          const show = overview && p.front;
          b.style.opacity = show ? "1" : "0";
          b.style.pointerEvents = show ? "auto" : "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [projRef, overview]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 hidden overflow-hidden sm:block"
      aria-hidden
    >
      {nodos.map((n, i) => (
        <button
          key={n.id}
          type="button"
          tabIndex={-1}
          ref={(el) => {
            refs.current[i] = el;
          }}
          onClick={() => onGoto(n.id)}
          style={{ opacity: 0, willChange: "transform, opacity" }}
          className="group absolute top-0 left-0 flex items-center gap-2.5 transition-opacity duration-500"
        >
          <span className="size-5 shrink-0 rounded-full border-2 border-agua bg-transparent shadow-[0_0_14px_0_var(--agua)] transition-transform group-hover:scale-110" />
          <span className="rounded-full border border-line bg-ink/80 px-3 py-1 font-mono text-xs tracking-wide whitespace-nowrap text-chalk backdrop-blur transition-colors group-hover:text-agua">
            {n.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/** HUD de navegación: los 5 tópicos, sin números ni "slides". Nav futurista +
 * fallback accesible (teclado / mobile / sin-WebGL). */
function HudRail({
  activeIdx,
  onGoto,
}: {
  activeIdx: number;
  onGoto: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40"
    >
      <div className="mx-auto flex max-w-[88rem] items-center justify-center gap-0.5 border-t border-line bg-ink/72 px-1 py-2.5 backdrop-blur-md sm:justify-start sm:gap-2 sm:px-8">
        {nodos.map((n, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onGoto(n.id)}
              aria-label={`${n.label} — ${n.hint}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative rounded-full px-2.5 py-1.5 font-mono text-[0.7rem] tracking-wide whitespace-nowrap transition-colors sm:px-4 sm:text-xs",
                active ? "text-agua" : "text-muted hover:text-chalk-dim",
              )}
            >
              {n.label}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-2.5 -bottom-0.5 h-px bg-agua shadow-[0_0_8px_0_var(--agua)] sm:inset-x-4"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Home = hub del grafo. El balón (centrado) + el logo FD flotando en su centro
 * 3D son la portada. Al scrollear (o clickear un nodo) la CÁMARA bucea hacia el
 * nodo: se mete en él y aparece el contenido. El HUD marca el tópico activo.
 */
export function GraphHome({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const webgl = useWebGL();
  const forceGl = useForceGl();
  const { marcarHeroCargado } = useAppReady();
  const { scrollTo } = useSmoothScroll();

  const camRef = useRef<CamState>({ active: 0, dive: 0 });
  const projRef = useRef<NodeProj[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1); // -1 = portada; 0..4 = nodos

  // Scroll → estado de cámara (active/dive) + índice activo (para HUD y glow).
  // Los offsets de sección se CACHEAN (en mount / resize / tras la carga): así el
  // handler de scroll NO fuerza layout por frame (nada de getBoundingClientRect
  // en cada scroll) → scroll fluido, sin thrash de layout.
  useEffect(() => {
    const ids = seccionIds; // [inicio, perfil, ..., contacto]
    let raf = 0;
    let last = -99;
    let boxes: { top: number; height: number }[] = [];

    const measure = () => {
      const sy = window.scrollY;
      boxes = ids.map((id) => {
        const el = document.getElementById(id);
        if (!el) return { top: 0, height: 1 };
        const r = el.getBoundingClientRect();
        return { top: r.top + sy, height: r.height };
      });
    };

    const update = () => {
      const center = window.scrollY + window.innerHeight * 0.5;
      let sec = 0;
      let dive = 0;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (center >= b.top && center < b.top + b.height) {
          sec = i;
          const local = (center - b.top) / Math.max(1, b.height);
          dive = i === 0 ? 0 : Math.min(1, Math.max(0, local / 0.42));
          break;
        }
      }
      camRef.current.active = sec;
      camRef.current.dive = dive;
      const ai = sec - 1;
      if (ai !== last) {
        last = ai;
        setActiveIdx(ai);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Re-medir tras la carga (fuentes/imágenes desplazan el layout).
    const t1 = setTimeout(measure, 600);
    const t2 = setTimeout(measure, 1800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const usarCanvas = forceGl || webgl;
  const goto = (id: string) => scrollTo(`#${id}`);

  return (
    <>
      {/* Capa fija: el grafo 3D (o poster si no hay WebGL). */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {usarCanvas ? (
          <GraphCanvas
            camRef={camRef}
            activeIndex={activeIdx}
            reduced={reduced}
            onReady={marcarHeroCargado}
            onProject={(p) => {
              projRef.current = p;
            }}
          />
        ) : (
          <PosterFallback onLoaded={marcarHeroCargado} />
        )}
      </div>

      {usarCanvas && (
        <NodeOverlay
          projRef={projRef}
          overview={activeIdx === -1}
          onGoto={goto}
        />
      )}

      {/* Contenido */}
      <div className="relative z-10">
        {/* Portada — solo el modelo + el logo + la firma mínima */}
        <section
          id="inicio"
          className="relative flex min-h-dvh items-end justify-center pb-28 sm:pb-32"
        >
          <h1 className="font-mono text-xs tracking-[0.32em] text-chalk-dim uppercase">
            {perfil.nombre}
            <span className="text-muted"> — Portfolio</span>
          </h1>
        </section>

        {children}
      </div>

      <HudRail activeIdx={activeIdx} onGoto={goto} />
    </>
  );
}
