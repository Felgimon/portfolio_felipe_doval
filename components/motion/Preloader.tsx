"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { gsap, useGSAP } from "@/lib/gsap";
import { useAppReady } from "./AppReady";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const MIN_MS = 700; // tiempo mínimo visible (evita parpadeo si está cacheado)
const MAX_MS = 2400; // techo: nunca supera los ~2.4s percibidos

/**
 * Preloader con progreso REAL de assets (useProgress de drei) y salida
 * orquestada con GSAP. Respeta reduced-motion (salida instantánea) y tiene un
 * techo de tiempo para no colgarse si el 3D no llega a cargar (poster).
 */
export function Preloader() {
  const { progress, active } = useProgress();
  const { marcarListo } = useAppReady();
  const reduced = useReducedMotion();

  const root = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLDivElement>(null);
  const inicio = useRef<number>(0);

  const [saliendo, setSaliendo] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [shown, setShown] = useState(0);

  // Marca de tiempo de arranque (fuera del render: Date.now es impuro).
  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  // Contador visual: lerp hacia el progreso real (o un piso por tiempo).
  useEffect(() => {
    const id = window.setInterval(() => {
      setShown((prev) => {
        const elapsed = Date.now() - inicio.current;
        const piso = Math.min(88, (elapsed / MAX_MS) * 100);
        const listo = saliendo || (progress >= 100 && !active);
        const target = listo ? 100 : Math.max(progress, piso);
        const next = prev + (target - prev) * 0.2;
        return next > 99.5 ? 100 : next;
      });
    }, 70);
    return () => clearInterval(id);
  }, [progress, active, saliendo]);

  // Disparar salida cuando cargó (respetando el mínimo) — vía timeout para no
  // hacer setState sincrónico en el cuerpo del effect.
  useEffect(() => {
    if (saliendo) return;
    if (!(progress >= 100 && !active)) return;
    const wait = Math.max(0, MIN_MS - (Date.now() - inicio.current));
    const t = window.setTimeout(() => setSaliendo(true), wait);
    return () => clearTimeout(t);
  }, [progress, active, saliendo]);

  // Safety: salir sí o sí antes del techo.
  useEffect(() => {
    const t = window.setTimeout(() => setSaliendo(true), MAX_MS);
    return () => clearTimeout(t);
  }, []);

  // Salida.
  useGSAP(
    () => {
      if (!saliendo || !root.current) return;
      const tl = gsap.timeline({
        onComplete: () => setOculto(true),
      });
      if (reduced) {
        // marcarListo al empezar → el hero se revela apenas se va el preloader
        tl.to(root.current, {
          autoAlpha: 0,
          duration: 0.25,
          onStart: () => marcarListo(),
        });
      } else {
        tl.to(barra.current, { scaleX: 1, duration: 0.25, ease: "power2.out" }).to(
          root.current,
          {
            yPercent: -100,
            duration: 0.85,
            ease: "power4.inOut",
            onStart: () => marcarListo(),
          },
          "+=0.08",
        );
      }
    },
    { dependencies: [saliendo, reduced] },
  );

  if (oculto) return null;

  const pct = Math.round(shown);
  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
      role="status"
      aria-live="polite"
      aria-label="Cargando el sitio"
    >
      <div className="node-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex flex-col items-center gap-8 px-6">
        <p className="type-display text-5xl text-chalk sm:text-7xl">
          FELIPE DOVAL<span className="text-celeste">_</span>
        </p>
        <div className="flex w-56 flex-col gap-2">
          <div className="h-px w-full overflow-hidden bg-line">
            <div
              className="h-full origin-left bg-celeste transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div ref={barra} className="h-px w-full origin-left scale-x-0 bg-celeste-bright" />
          </div>
          <div className="flex justify-between font-mono text-xs text-muted">
            <span>cargando</span>
            <span className="data text-celeste">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
