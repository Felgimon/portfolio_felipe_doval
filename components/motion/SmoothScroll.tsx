"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type ScrollTarget = string | number | HTMLElement;
type SmoothScrollApi = {
  scrollTo: (
    target: ScrollTarget,
    opts?: { offset?: number; immediate?: boolean },
  ) => void;
};

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

/** Hook para desplazamientos programáticos (nav, botón "volver arriba"). */
export function useSmoothScroll(): SmoothScrollApi {
  const ctx = useContext(SmoothScrollContext);
  return (
    ctx ?? {
      // Fallback (reduced-motion o fuera del provider): scroll nativo.
      scrollTo: (target, opts) => {
        if (typeof window === "undefined") return;
        if (typeof target === "number") {
          window.scrollTo({ top: target, behavior: "auto" });
        } else {
          const el =
            typeof target === "string"
              ? document.querySelector(target)
              : target;
          el?.scrollIntoView({ behavior: "auto", block: "start" });
          if (opts?.offset) window.scrollBy(0, opts.offset);
        }
      },
    }
  );
}

/**
 * Provee scroll suave con Lenis, correctamente cableado a ScrollTrigger:
 * - `lenis.on("scroll", ScrollTrigger.update)`
 * - Lenis driveado desde `gsap.ticker` (con lagSmoothing 0)
 * Respeta `prefers-reduced-motion`: si está activo, no instancia Lenis y usa
 * scroll nativo (el sitio queda 100% usable).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: false, // lo driveamos desde gsap.ticker
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    // Con PRIORIDAD: Lenis mueve el scroll antes que cualquier otro oyente del
    // ticker. La escena (Escena.tsx) dibuja después y lee los rects ya
    // scrolleados: si no, el vidrio del shader iba un cuadro atrasado respecto
    // del borde del DOM mientras scrolleabas.
    gsap.ticker.add(raf, false, true);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const api: SmoothScrollApi = {
    scrollTo: (target, opts) => {
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, {
          offset: opts?.offset ?? 0,
          immediate: opts?.immediate ?? false,
        });
      } else if (typeof window !== "undefined") {
        if (typeof target === "number") {
          window.scrollTo({ top: target });
        } else {
          const el =
            typeof target === "string"
              ? document.querySelector(target)
              : target;
          el?.scrollIntoView({ block: "start" });
        }
      }
    },
  };

  return (
    <SmoothScrollContext.Provider value={api}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
