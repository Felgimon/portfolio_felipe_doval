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
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { HeroName } from "./HeroName";
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

/** Poster estático del grafo (solo si NO hay WebGL). Se ubica donde la cámara
 * pone el modelo: arriba en pantalla angosta, a la derecha en ancha. */
function PosterFallback({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-[30%] left-1/2 aspect-square h-[46%] max-h-[820px] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-auto md:right-[3%] md:h-[86%] md:translate-x-0">
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

/** Hit-areas CIRCULARES invisibles sobre los propios soles 3D: se clickea (o
 * TOCA, en mobile) el sol directamente (la identificación la dan las etiquetas
 * 3D en escena). El hover dispara la mini-implosión del sol (via onHover). La
 * proyección (x, y y RADIO aparente en px) sale de la cámara real cada frame.
 * En puntero grueso (touch) el target mínimo sube a 44px (guía de Apple/WCAG).
 * `muted` apaga las hit-areas sin desmontar: en pantallas angostas dentro de un
 * tópico el texto se lee SOBRE el modelo atenuado, y un botón invisible abajo
 * del texto robaría los taps del contenido. Azúcar de puntero (tabIndex -1);
 * el teclado/lector usa el HUD. */
function NodeOverlay({
  projRef,
  onGoto,
  onHover,
  muted,
}: {
  projRef: RefObject<NodeProj[]>;
  onGoto: (id: string) => void;
  onHover: (i: number) => void;
  muted: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const minD = coarse ? 44 : 28; // target táctil mínimo
    const tick = () => {
      const proj = projRef.current;
      for (let i = 0; i < nodos.length; i++) {
        const b = refs.current[i];
        if (!b) continue;
        const p = proj[i];
        if (muted || !p || !p.front) {
          // Apagado, o cara de atrás: sin hit-area (clickear un sol que no
          // ves confunde).
          b.style.pointerEvents = "none";
          b.style.transform = "translate(-9999px, -9999px)";
        } else {
          const d = Math.max(minD, p.r * 2.6); // diámetro con margen de puntería
          b.style.width = `${d}px`;
          b.style.height = `${d}px`;
          b.style.transform = `translate(${p.x - d / 2}px, ${p.y - d / 2}px)`;
          b.style.pointerEvents = "auto";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [projRef, muted]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden
    >
      {nodos.map((n, i) => (
        <button
          key={n.id}
          type="button"
          tabIndex={-1}
          aria-label={n.label}
          ref={(el) => {
            refs.current[i] = el;
          }}
          onClick={() => {
            onGoto(n.id);
            // En touch no hay mouseleave: sin esto el sol quedaría "hovereado"
            // para siempre después del tap.
            if (window.matchMedia("(pointer: coarse)").matches) onHover(-1);
          }}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(-1)}
          style={{ willChange: "transform" }}
          className="absolute top-0 left-0 cursor-pointer touch-manipulation rounded-full"
        />
      ))}
    </div>
  );
}

/** HUD de navegación: los 5 tópicos, sin números ni "slides". El subrayado es
 * UNO solo y está vivo: se DESLIZA horizontalmente hasta la sección activa
 * (medido contra el botón real, con transición de transform + width). Fallback
 * accesible (teclado / mobile / sin-WebGL). */
function HudRail({
  activeIdx,
  onGoto,
}: {
  activeIdx: number;
  onGoto: (id: string) => void;
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bar, setBar] = useState({ x: 0, w: 0, on: false });

  const medir = useCallback(() => {
    const b = btnRefs.current[activeIdx];
    if (!b) {
      setBar((s) => (s.on ? { ...s, on: false } : s));
      return;
    }
    // El subrayado cubre el TEXTO del botón (descuenta el padding real).
    const cs = getComputedStyle(b);
    const pl = parseFloat(cs.paddingLeft);
    const pr = parseFloat(cs.paddingRight);
    setBar({ x: b.offsetLeft + pl, w: b.offsetWidth - pl - pr, on: true });
  }, [activeIdx]);

  useEffect(() => {
    medir();
    // Re-medir si cambia el layout (resize / carga de la fuente mono).
    const t = window.setTimeout(medir, 700);
    window.addEventListener("resize", medir);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

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
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => onGoto(n.id)}
              aria-label={`${n.label}: ${n.hint}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative rounded-full px-2.5 py-1.5 font-mono text-[0.7rem] tracking-wide whitespace-nowrap transition-colors sm:px-4 sm:text-xs",
                active ? "text-acento" : "text-muted hover:text-chalk",
              )}
            >
              {n.label}
            </button>
          );
        })}
        {/* El subrayado vivo: viaja hasta la sección activa. */}
        <span
          aria-hidden
          className="absolute bottom-1.5 left-0 h-0.5 rounded-full bg-acento transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{
            transform: `translateX(${bar.x}px)`,
            width: bar.w,
            opacity: bar.on ? 1 : 0,
          }}
        />
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

  const camRef = useRef<CamState>({ t: 0, active: 0 });
  const projRef = useRef<NodeProj[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1); // -1 = portada; 0..4 = nodos
  const [hoverIdx, setHoverIdx] = useState(-1); // sol bajo el puntero
  // El canvas renderiza solo mientras hay actividad (scroll / cámara moviéndose);
  // en reposo se pausa (frameloop "never"). `activityRef`/`wakeRef` los cablea
  // el efecto.
  const [rendering, setRendering] = useState(true);
  const activityRef = useRef<(() => void) | null>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const onActivity = useCallback(() => activityRef.current?.(), []);
  // Hover sobre un sol: dispara la mini-implosión y despierta el render (para
  // que también se vea en modo lite, donde el canvas duerme en reposo).
  const onHover = useCallback((i: number) => {
    setHoverIdx(i);
    wakeRef.current?.();
  }, []);

  // Scroll → estado de cámara (t continuo + sección activa para HUD/sol).
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

    // Progreso CONTINUO `t` por la ruta de waypoints: dentro de la sección i,
    // el primer 42% transiciona del waypoint anterior (i-1) al propio (i); el
    // resto sostiene t = i. La función es continua al cruzar bordes de sección
    // → la cámara nunca recibe un objetivo que salta (adiós al latigazo).
    const update = () => {
      const center = window.scrollY + window.innerHeight * 0.5;
      let sec = 0;
      let t = 0;
      let matched = false;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (center >= b.top && center < b.top + b.height) {
          sec = i;
          if (i > 0) {
            // La rampa de transición dura 42% de la sección pero NUNCA más de
            // media pantalla: el click directo aterriza en el tope de la
            // sección (centro = top + vh/2) y así SIEMPRE cae en la zona de
            // "nodo centrado" (t = i), también en secciones altas — el planeo
            // de cámara termina exactamente en el nodo, sin residuo.
            const ramp = Math.min(
              0.42 * b.height,
              window.innerHeight * 0.5 - 24,
            );
            t = i - 1 + Math.min(1, Math.max(0, (center - b.top) / Math.max(1, ramp)));
          }
          matched = true;
          break;
        }
      }
      // Debajo de la última sección (footer): la cámara se queda en el último
      // nodo (antes volvía de golpe al overview).
      if (!matched && boxes.length > 1 && center >= boxes[boxes.length - 1].top) {
        sec = boxes.length - 1;
        t = boxes.length - 1;
      }
      camRef.current.t = t;
      camRef.current.active = sec;
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
    wakeRef.current = wake; // el hover despierta el render (modo lite)

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
      wakeRef.current = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Pantalla angosta = layout mobile: al entrar a un tópico el texto se lee
  // SOBRE el modelo atenuado → ahí las hit-areas de los soles se apagan (si no,
  // robarían los taps del contenido). En la portada quedan activas: tocar un
  // sol navega, igual que en desktop.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const usarCanvas = forceGl || webgl;
  // Click en nodo/HUD: el contenido salta YA (sin speed-scroll por las
  // secciones intermedias, que marea); la transición la hace la CÁMARA, que
  // orbita en línea directa hasta el nodo elegido.
  const goto = (id: string) => scrollTo(`#${id}`, { immediate: true });

  return (
    <>
      {/* Cielo procedural (CSS, costo cero): el balón flota en él. Gradiente
          horizonte→cielo + nubes suaves que derivan muy lento. */}
      <div className="sky pointer-events-none fixed inset-0 -z-10" aria-hidden />

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
            hovered={hoverIdx}
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
        <NodeOverlay
          projRef={projRef}
          onGoto={goto}
          onHover={onHover}
          muted={narrow && activeIdx >= 0}
        />
      )}

      {/* Contenido */}
      <div className="relative z-10">
        {/* Portada: el nombre a la izquierda, el sol girando a la derecha (en
            mobile el sol queda arriba y este bloque abajo: lo resuelve el
            encuadre de la cámara, no un transform). */}
        <section
          id="inicio"
          className="relative flex min-h-dvh items-end pb-28 md:items-center md:pb-0"
        >
          <Container size="wide">
            <div className="max-w-xl">
              <p className="eyebrow">{perfil.hero.kicker}</p>
              <div className="mt-5">
                <HeroName />
              </div>
              <p className="lead mt-6 max-w-md">{perfil.hero.lead}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => goto("trabajo")}
                  className="glass glass-spec glass-hover glass-pill group inline-flex items-center gap-2 px-6 py-3.5 font-mono text-xs tracking-wide text-chalk"
                >
                  Ver el trabajo
                  <ArrowDown className="size-4 text-acento transition-transform group-hover:translate-y-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => goto("contacto")}
                  className="glass glass-spec glass-hover glass-pill group inline-flex items-center gap-2 px-6 py-3.5 font-mono text-xs tracking-wide text-chalk"
                >
                  Hablemos
                  <ArrowUpRight className="size-4 text-acento transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          </Container>
        </section>

        {children}
      </div>

      <HudRail activeIdx={activeIdx} onGoto={goto} />
    </>
  );
}
