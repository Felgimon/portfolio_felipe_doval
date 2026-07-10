"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { useAppReady } from "./AppReady";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Logo } from "@/components/ui/Logo";

const MIN_MS = 700; // tiempo mínimo visible (evita parpadeo si está cacheado)
const MAX_MS = 2400; // techo: nunca supera los ~2.4s percibidos

/**
 * Preloader con salida orquestada con GSAP. Completa cuando el hero avisa que su
 * fondo (canvas 3D o poster) terminó de cargar (`heroCargado`, señal que sube
 * desde el Hero), con un techo de tiempo. Así NO importa drei/three: el 3D queda
 * 100% en el chunk lazy y no entra al bundle inicial. Respeta reduced-motion.
 */
export function Preloader() {
  const { marcarListo, heroCargado } = useAppReady();
  const reduced = useReducedMotion();
  const pathname = usePathname();
  // El preloader es solo para la home (donde vive el hero 3D). En deep-links a
  // páginas de detalle no tiene sentido esperar.
  const soloHome = pathname === "/";

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

  // Contador visual: sube por tiempo hasta el piso, salta a 100 al estar listo.
  useEffect(() => {
    const id = window.setInterval(() => {
      setShown((prev) => {
        const elapsed = Date.now() - inicio.current;
        const piso = Math.min(90, (elapsed / MAX_MS) * 120);
        const target = saliendo || heroCargado ? 100 : piso;
        const next = prev + (target - prev) * 0.2;
        return next > 99.5 ? 100 : next;
      });
    }, 70);
    return () => clearInterval(id);
  }, [heroCargado, saliendo]);

  // Disparar salida cuando el hero cargó (respetando el mínimo) — vía timeout
  // para no hacer setState sincrónico en el cuerpo del effect.
  useEffect(() => {
    if (saliendo || !heroCargado) return;
    const wait = Math.max(0, MIN_MS - (Date.now() - inicio.current));
    const t = window.setTimeout(() => setSaliendo(true), wait);
    return () => clearTimeout(t);
  }, [heroCargado, saliendo]);

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

  if (oculto || !soloHome) return null;

  const pct = Math.round(shown);
  return (
    <div
      ref={root}
      className="sky fixed inset-0 z-[100] flex flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Cargando el sitio"
    >
      <div className="node-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex flex-col items-center gap-8 px-6">
        <Logo full className="text-5xl text-chalk uppercase sm:text-7xl" />
        <div className="flex w-56 flex-col gap-2">
          <div className="h-px w-full overflow-hidden bg-line">
            <div
              className="h-full origin-left bg-acento transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div ref={barra} className="h-px w-full origin-left scale-x-0 bg-acento-hi" />
          </div>
          <div className="flex justify-between font-mono text-xs text-muted">
            <span>cargando</span>
            <span className="data text-acento">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
