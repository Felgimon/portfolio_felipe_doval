"use client";
import {
  Component,
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
import type { Banda, CamState, NodeProj } from "@/components/three/GraphCanvas";
import { nodos, seccionIds } from "@/lib/navigation";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { cn } from "@/lib/utils";

// El 3D se carga aparte (ssr:false): no entra en el bundle inicial.
const GraphCanvas = dynamic(() => import("@/components/three/GraphCanvas"), {
  ssr: false,
});

/** ¿La etiqueta de este sol va ARRIBA o abajo? Siempre hacia AFUERA del cúmulo:
 * los soles del tope (Perfil, Enfoque) la llevan arriba y el resto abajo. No es
 * un capricho: colgándolas todas para abajo, las de arriba caen sobre el disco
 * del sol central. En una pantalla grande casi ni se nota, pero en un celular
 * la etiqueta mide lo mismo en px y la escena entra en 280px, así que se le
 * monta encima. Como los soles están quietos, esto es una constante por nodo. */
const ETIQUETA_ARRIBA = nodos.map((n) => n.dir[1] > 0.3);

/** Red de seguridad del canvas 3D: si CUALQUIER cosa del árbol WebGL revienta
 * (contexto negado, textura que no carga, shader que no compila en un driver
 * exótico), no puede tirar abajo la página — se avisa al padre y el hero cambia
 * al poster estático. En un equipo sano nunca se entera de que existe. */
class CanvasGuard extends Component<
  { onError: () => void; children: ReactNode },
  { roto: boolean }
> {
  state = { roto: false };
  static getDerivedStateFromError() {
    return { roto: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.roto ? null : this.props.children;
  }
}

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
 * pone el modelo: arriba en pantalla angosta, a la derecha en ancha. La imagen
 * es un recorte cuadrado CENTRADO en el cúmulo (lo genera scratchpad/poster.mjs
 * midiendo la escena real, etiquetas incluidas), así que acá alcanza con poner
 * su centro donde la cámara pone el del cúmulo: 49%/24% en angosto, 6% del
 * borde derecho y 47% de alto en ancho — medidos con hero-metrics, no a ojo. */
function PosterFallback({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-[24%] left-[49%] aspect-square h-[34%] max-h-[820px] -translate-x-1/2 -translate-y-1/2 md:top-[47%] md:left-auto md:right-[6%] md:h-[75%] md:translate-x-0">
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

/**
 * Los CALLOUTS de los soles: cada sol tiene UNA sola cosa que es a la vez su
 * etiqueta y su zona clickeable. Es un botón centrado en el sol (círculo
 * invisible sobre el sol, con el mínimo táctil de 44px de Apple/WCAG) que lleva
 * colgando una pastilla de vidrio con el nombre de la sección y un conector
 * fino. Tocar el sol o su etiqueta es lo mismo: el evento burbujea al botón.
 *
 * Por qué la etiqueta es HTML y no geometría 3D (v5.5): el texto 3D se escala
 * con la escena, así que su tamaño lo decidía la distancia de la cámara —
 * legible en 1920 (12.5px) e ILEGIBLE en un celular (~5px), donde la escena
 * entera entra en 289px. La etiqueta es UI, no geometría: vive en píxeles de
 * pantalla y se lee igual en cualquier dispositivo. Además así usa el vidrio
 * REAL de la identidad (el mismo `.glass` del HUD y los CTA) en vez de una
 * imitación con planos opacos, y el texto sale nítido a cualquier DPI.
 *
 * Lo que sigue siendo 3D es lo que importa: la POSICIÓN sale de proyectar el
 * sol con la cámara real cada frame, así que la etiqueta va pegada a su sol,
 * con su paralaje, y desaparece cuando el sol queda tapado por el sol central
 * (mismo test que decide si se puede clickear: si no lo ves, no está).
 *
 * `muted` las apaga sin desmontar: en pantallas angostas dentro de un tópico el
 * texto se lee SOBRE el modelo atenuado, y un botón encima robaría los taps del
 * contenido. Azúcar de puntero (tabIndex -1); el teclado/lector usa el HUD.
 */
function NodeOverlay({
  projRef,
  onGoto,
  onHover,
  muted,
  activeIdx,
}: {
  projRef: RefObject<NodeProj[]>;
  onGoto: (id: string) => void;
  onHover: (i: number) => void;
  muted: boolean;
  activeIdx: number;
}) {
  const { t } = useIdioma();
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
          // Apagado, o tapado por el sol central: sin etiqueta y sin hit-area
          // (ofrecerte clickear un sol que no ves confunde).
          b.style.pointerEvents = "none";
          b.style.opacity = "0";
          b.style.transform = "translate(-9999px, -9999px)";
        } else {
          const d = Math.max(minD, p.r * 2.6); // diámetro con margen de puntería
          b.style.width = `${d}px`;
          b.style.height = `${d}px`;
          b.style.transform = `translate(${p.x - d / 2}px, ${p.y - d / 2}px)`;
          b.style.pointerEvents = "auto";
          b.style.opacity = "1";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [projRef, muted]);

  return (
    <div
      className="solabels pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden
    >
      {nodos.map((n, i) => (
        <button
          key={n.id}
          type="button"
          tabIndex={-1}
          aria-label={t.nodos[n.id].label}
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
          style={{ willChange: "transform", opacity: 0 }}
          className={cn(
            "solnodo absolute top-0 left-0 cursor-pointer touch-manipulation rounded-full",
            ETIQUETA_ARRIBA[i] && "is-up",
          )}
        >
          {/* Conector sol → etiqueta y pastilla. Sobresalen de la caja del
              botón: siguen siendo clickeables (el evento burbujea) y el
              overflow del contenedor los recorta contra la pantalla. */}
          <span className="solnodo__hilo" />
          {/* `data-lente`: estas pastillas flotan SOBRE el sol, que es el único
              lugar del sitio donde hay algo para doblar. Acá la refracción se
              ve de verdad. */}
          <span
            data-lente
            className={cn(
              "solnodo__chip glass glass-pill",
              i === activeIdx && "is-on",
            )}
          >
            {t.nodos[n.id].label}
          </span>
        </button>
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
  barraRef,
}: {
  activeIdx: number;
  onGoto: (id: string) => void;
  /** La barra real: la portada la mide para no meter el cúmulo abajo de ella. */
  barraRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useIdioma();
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
    // Re-medir si cambia el layout (resize / carga de la fuente mono / cambio
    // de idioma: las etiquetas cambian de ancho).
    const timer = window.setTimeout(medir, 700);
    window.addEventListener("resize", medir);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", medir);
    };
  }, [medir, t]);

  return (
    <nav
      aria-label={t.aria.secciones}
      className="fixed inset-x-0 bottom-0 z-40"
    >
      {/* Abajo de 400px los 5 nombres NO entran a este tamaño: en un Android de
          360 se cortaban "Perfil" y "Contacto", y en un iPhone Pro entraban
          justo al límite (367 de 367 px). Ahí el HUD se compacta. No es un
          detalle: en pantallas chatas el HUD es la ÚNICA navegación, así que
          cortado deja a esa pantalla sin forma de moverse. */}
      <div
        ref={barraRef}
        data-lente
        className="glass mx-3 mb-3 flex items-center justify-center gap-0.5 rounded-full px-1.5 py-2 max-[400px]:mx-2 max-[400px]:gap-0 max-[400px]:px-1 sm:mx-auto sm:mb-4 sm:max-w-fit sm:gap-2 sm:px-3"
      >
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
              aria-label={`${t.nodos[n.id].label}: ${t.nodos[n.id].hint}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative rounded-full px-2.5 py-1.5 font-mono text-[0.7rem] tracking-wide whitespace-nowrap transition-colors max-[400px]:px-2 max-[400px]:text-[0.62rem] max-[400px]:tracking-normal sm:px-4 sm:text-xs",
                active ? "text-acento" : "text-muted hover:text-chalk",
              )}
            >
              {t.nodos[n.id].label}
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
  const { marcarHeroCargado, ready } = useAppReady();
  const { t, perfil } = useIdioma();
  const { scrollTo } = useSmoothScroll();

  const camRef = useRef<CamState>({ t: 0, active: 0 });
  const projRef = useRef<NodeProj[]>([]);
  // El hueco que el layout le deja al cúmulo en la portada. Lo mide el DOM (acá)
  // y lo consume la cámara (GraphCanvas): la escena 3D nunca replica reglas de
  // CSS, pregunta dónde termina el texto de verdad.
  const bandaRef = useRef<Banda>({ x0: 0, x1: 0, y0: 0, y1: 0 });
  const columnaRef = useRef<HTMLDivElement>(null);
  const barraRef = useRef<HTMLDivElement>(null);
  const capaRef = useRef<HTMLDivElement>(null);
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

  // Pantallas demasiado CHATAS para el cúmulo — SOLO en layout angosto (texto
  // apilado sobre el modelo). La cuenta, medida: en angosto el hero necesita
  // ~350px de texto, y el cúmulo ~270px de banda para que sus soles se puedan
  // tocar; abajo de ~620px de alto útil no entran los dos. Un iPhone Pro queda
  // en 659 (alcanza); un iPhone SE (553) no: ahí el modelo se apaga y la
  // navegación queda en el HUD y el scroll. Es preferible a un cúmulo de 120px
  // con las etiquetas encimadas.
  //
  // La condición de ANCHO no es opcional: en pantallas anchas el texto va AL
  // COSTADO y el alto no compite con él. Las netbooks escolares (1024x600, o
  // 1366x768 con Windows al 125% → ~614px CSS) caían abajo de 620 y esta regla
  // les apagaba el sol POR COMPLETO — el bug que reportó Felipe. Con banda
  // lateral el cúmulo entra siempre: la cámara lo encuadra en lo que haya.
  //
  // El alto se lee del CANVAS (la misma caja que ve la cámara), no de
  // window.innerHeight: en iOS no son lo mismo. No hay media query que sirva
  // acá: las de CSS miden el viewport de layout, que en iOS ignora la barra.
  const [chato, setChato] = useState(false);
  useEffect(() => {
    const medir = () => {
      const capa = capaRef.current?.getBoundingClientRect();
      if (capa) setChato(capa.height < 620 && capa.width < 768);
    };
    medir();
    window.addEventListener("resize", medir);
    const t = window.setTimeout(medir, 700);
    return () => {
      window.removeEventListener("resize", medir);
      clearTimeout(t);
    };
  }, []);

  // La BANDA libre de la portada, medida contra el layout real. En ancho el
  // texto ocupa la columna izquierda → el hueco es lo que sobra a su derecha,
  // hasta arriba del HUD. En angosto el texto va abajo → el hueco es todo el
  // ancho, arriba de él. El ResizeObserver cubre el reflow por la carga de la
  // fuente; el listener de resize cubre el caso en que el bloque no cambia de
  // tamaño pero sí de lugar (el contenedor centrado corre con la ventana).
  //
  // Todo se mide contra la CAJA DEL CANVAS, no contra `window.innerHeight`. No
  // es lo mismo: en iOS el alto de la ventana, el del viewport visual y el de
  // un elemento fijo pueden diferir (la barra de Safari), y la cámara razona en
  // las coordenadas de SU canvas. Midiendo contra la misma caja que ve la
  // cámara, esa familia entera de bugs no puede pasar.
  // Congelamiento durante la ENTRADA del nombre: la animación engorda las
  // letras de wght 200 a 800 y una letra flaca es más ANGOSTA — la columna se
  // angosta y recrece durante ~1.4s. Si la banda siguiera ese vaivén, la
  // cámara lo seguiría y el sol haría un "acomodo" al final (el tirón que
  // reportó Felipe, visto en el modelo). La medición de ANTES de la entrada ya
  // tiene el ancho final: el reposo ES wght 800.
  const bandaCongeladaHasta = useRef(0);
  const medirBanda = useCallback(() => {
    if (performance.now() < bandaCongeladaHasta.current) return;
    const capa = capaRef.current?.getBoundingClientRect();
    if (!capa) return;
    const col = columnaRef.current?.getBoundingClientRect();
    const barra = barraRef.current?.getBoundingClientRect();
    const hud = barra ? barra.top - capa.top : capa.height;
    bandaRef.current =
      narrow || !col
        ? { x0: 0, x1: capa.width, y0: 0, y1: col ? col.top - capa.top : hud }
        : { x0: col.right - capa.left, x1: capa.width, y0: 0, y1: hud };
  }, [narrow]);

  // La entrada arranca cuando el preloader se va (`ready`): banda congelada
  // hasta que la última letra termina de engordar (~1.4s + margen), y una
  // medición final por si algo del layout cambió mientras tanto.
  useEffect(() => {
    if (!ready) return;
    bandaCongeladaHasta.current = performance.now() + 2400;
    const t = window.setTimeout(() => {
      bandaCongeladaHasta.current = 0;
      medirBanda();
    }, 2450);
    return () => clearTimeout(t);
  }, [ready, medirBanda]);

  useEffect(() => {
    medirBanda();
    const ro = new ResizeObserver(medirBanda);
    if (columnaRef.current) ro.observe(columnaRef.current);
    if (barraRef.current) ro.observe(barraRef.current);
    window.addEventListener("resize", medirBanda);
    // Tras cargar la tipografía (las métricas del fallback difieren): la señal
    // real, no un timeout a ciegas.
    let vivo = true;
    document.fonts?.ready?.then(() => {
      if (vivo) medirBanda();
    });
    return () => {
      vivo = false;
      ro.disconnect();
      window.removeEventListener("resize", medirBanda);
    };
  }, [medirBanda]);

  // Si el 3D falla en runtime (contexto WebGL negado o perdido, driver que no
  // compila un shader), se baja al POSTER y se suelta el preloader: la página
  // nunca queda rehén del canvas. En un equipo sano este estado no se toca.
  const [glRoto, setGlRoto] = useState(false);
  const fallarGl = useCallback(() => {
    setGlRoto(true);
    marcarHeroCargado();
  }, [marcarHeroCargado]);

  // El modelo se muestra si hay con qué (WebGL), si no falló, y si ENTRA (ver
  // `chato`). El preloader espera al hero: si no va a haber modelo, hay que
  // soltarlo o la página se queda cargando para siempre.
  const usarCanvas = (forceGl || webgl) && !chato && !glRoto;
  const sinModelo = chato;
  useEffect(() => {
    if (sinModelo) marcarHeroCargado();
  }, [sinModelo, marcarHeroCargado]);
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
          hay transforms. En mobile se atenúa al entrar a un tópico.
          Su CAJA es además el sistema de coordenadas contra el que se mide la
          banda: es la misma que ve la cámara. */}
      <div
        ref={capaRef}
        className={cn(
          "graph-layer pointer-events-none fixed inset-0 z-0 transition-opacity duration-700",
          activeIdx >= 0 && "is-topic",
        )}
        aria-hidden
      >
        {usarCanvas ? (
          <CanvasGuard onError={fallarGl}>
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
              bandaRef={bandaRef}
              onContextLost={fallarGl}
            />
          </CanvasGuard>
        ) : sinModelo ? null : (
          <PosterFallback onLoaded={marcarHeroCargado} />
        )}
      </div>

      {usarCanvas && (
        <NodeOverlay
          projRef={projRef}
          onGoto={goto}
          onHover={onHover}
          muted={narrow && activeIdx >= 0}
          activeIdx={activeIdx}
        />
      )}

      {/* Contenido */}
      <div className="relative z-10">
        {/* Portada: el nombre a la izquierda, el sol girando a la derecha (en
            mobile el sol queda arriba y este bloque abajo: lo resuelve el
            encuadre de la cámara, no un transform). */}
        {/* En un celular REAL el alto útil son ~659px (la barra de Safari se
            come 185 de los 844 de la pantalla), y el HUD flota abajo. Así que
            en angosto el bloque va compacto y pegado al HUD: cada píxel que no
            gasta acá es un píxel que la cámara le da al modelo, que es lo único
            que no puede achicarse sin dejar de leerse. En md+ vuelven los aires
            grandes, donde sobra lugar. */}
        <section
          id="inicio"
          className="relative flex min-h-dvh items-end pb-16 md:items-center md:pb-0"
        >
          <Container size="wide">
            {/* `w-fit`: la columna mide exactamente lo que mide su hijo más
                ancho (el nombre). No es cosmético — es lo que le permite a la
                cámara saber dónde termina el texto de verdad para enmarcar el
                cúmulo en lo que sobra. El tope lo pone max-w-2xl. */}
            <div ref={columnaRef} className="w-fit max-w-2xl">
              <p className="eyebrow">{perfil.hero.kicker}</p>
              <div className="mt-3 md:mt-5">
                <HeroName />
              </div>
              <p className="lead mt-4 max-w-md md:mt-6">{perfil.hero.lead}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-9">
                <button
                  type="button"
                  data-lente

                  onClick={() => goto("trabajo")}
                  className="glass glass-hover glass-pill group inline-flex items-center gap-2 px-6 py-3.5 font-mono text-xs tracking-wide text-chalk"
                >
                  {t.hero.ctaTrabajo}
                  <ArrowDown className="size-4 text-acento transition-transform group-hover:translate-y-0.5" />
                </button>
                {/* CTA principal en vidrio PROMINENTE (tintado de acento):
                    jerarquía sin perder el material. */}
                <button
                  type="button"
                  data-lente
                  onClick={() => goto("contacto")}
                  className="glass glass-prominent glass-hover glass-pill group inline-flex items-center gap-2 px-6 py-3.5 font-mono text-xs tracking-wide"
                >
                  {t.hero.ctaContacto}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          </Container>
        </section>

        {children}
      </div>

      <HudRail activeIdx={activeIdx} onGoto={goto} barraRef={barraRef} />
    </>
  );
}
