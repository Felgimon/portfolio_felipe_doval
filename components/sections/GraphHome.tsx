"use client";
import {
  type ReactNode,
  type RefObject,
  useCallback,
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

/** Etiquetas clickeables proyectadas sobre los nodos 3D. Se muestran SIEMPRE (no
 * solo en la portada) para que se pueda saltar a cualquier sección desde el
 * modelo en todo momento. La proyección sale de la cámara real, así que los
 * labels quedan pegados a los soles aunque la cámara orbite/panee. Los nodos de
 * la cara de atrás quedan atenuados pero igual clickeables. Azúcar de puntero
 * (tabIndex -1); el teclado/lector usa el HUD. */
function NodeOverlay({
  projRef,
  activeIdx,
  onGoto,
}: {
  projRef: RefObject<NodeProj[]>;
  activeIdx: number;
  onGoto: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(activeIdx);
  useEffect(() => {
    activeRef.current = activeIdx;
  }, [activeIdx]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const proj = projRef.current;
      for (let i = 0; i < nodos.length; i++) {
        const b = refs.current[i];
        if (!b) continue;
        const p = proj[i];
        // El nodo activo NO lleva label (el sol grande ya es su marca; ya estás ahí).
        if (!p || i === activeRef.current) {
          b.style.opacity = "0";
          b.style.pointerEvents = "none";
        } else {
          b.style.transform = `translate(${p.x}px, ${p.y}px)`;
          // Cara de frente = pleno; cara de atrás = atenuado pero clickeable.
          b.style.opacity = p.front ? "1" : "0.4";
          b.style.pointerEvents = "auto";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [projRef]);

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
          className="group absolute top-0 left-0"
        >
          {/* El label flota DEBAJO del sol (no lo tapa); el sol 3D es el marcador. */}
          <span className="glass glass-pill absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 font-mono text-xs tracking-wide whitespace-nowrap text-chalk transition-colors group-hover:text-acento">
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
      <div className="glass glass-spec mx-3 mb-3 flex items-center justify-center gap-0.5 rounded-full px-1.5 py-2 sm:mx-auto sm:mb-4 sm:max-w-fit sm:gap-2 sm:px-3">
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
                active ? "text-acento" : "text-muted hover:text-chalk",
              )}
            >
              {n.label}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-acento sm:inset-x-4"
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
  // El canvas renderiza solo mientras hay actividad (scroll / cámara moviéndose);
  // en reposo se pausa (frameloop "never"). `activityRef` lo cablea el efecto.
  const [rendering, setRendering] = useState(true);
  const activityRef = useRef<(() => void) | null>(null);
  const onActivity = useCallback(() => activityRef.current?.(), []);

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

    // Pausa el render 180ms DESPUÉS de la última actividad (scroll o cámara aún
    // moviéndose). Sin timer ciego: se pausa recién cuando todo se asentó. Con la
    // cámara haciendo snap apenas el movimiento es imperceptible, esta ventana es
    // casi todo lo que dura la "recalibración" tras la animación.
    let pauseTimer = 0;
    const bump = () => {
      clearTimeout(pauseTimer);
      pauseTimer = window.setTimeout(() => setRendering(false), 180);
    };
    const wake = () => {
      setRendering(true);
      bump();
    };
    activityRef.current = bump; // la cámara (onActivity) mantiene vivo el render

    const onScroll = () => {
      wake();
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
      clearTimeout(pauseTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      activityRef.current = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const usarCanvas = forceGl || webgl;
  const goto = (id: string) => scrollTo(`#${id}`);

  return (
    <>
      {/* Cielo procedural (CSS, costo cero): el balón flota en él. Gradiente
          horizonte→cielo + nubes suaves que derivan muy lento. */}
      <div className="sky sky-drift pointer-events-none fixed inset-0 -z-10" aria-hidden />

      {/* Capa fija: el grafo 3D (o poster si no hay WebGL). El encuadre por
          sección lo hace la CÁMARA (orbita + panea dentro del canvas); acá no
          hay transforms. En mobile se atenúa al entrar a un tópico. */}
      <div
        className={cn(
          "graph-layer pointer-events-none fixed inset-0 z-0 transition-opacity duration-700",
          activeIdx >= 0 && "is-topic",
        )}
        aria-hidden
      >
        {usarCanvas ? (
          <GraphCanvas
            camRef={camRef}
            activeIndex={activeIdx}
            reduced={reduced}
            paused={!rendering}
            onReady={marcarHeroCargado}
            onProject={(p) => {
              projRef.current = p;
            }}
            onActivity={onActivity}
          />
        ) : (
          <PosterFallback onLoaded={marcarHeroCargado} />
        )}
      </div>

      {usarCanvas && (
        <NodeOverlay projRef={projRef} activeIdx={activeIdx} onGoto={goto} />
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
