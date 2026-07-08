"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { HeroTitle } from "./HeroTitle";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGpuTier } from "@/hooks/useGpuTier";
import { useAppReady } from "@/components/motion/AppReady";
import { perfil } from "@/content/perfil";

// El 3D se carga aparte (ssr:false): no entra en el bundle inicial.
const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), {
  ssr: false,
});

/** Poster estático real (render del balón-grafo) para reduced-motion / GPU
 * débil. Posicionado como el canvas: centrado-derecha, saliéndose un poco. */
function PosterFallback({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-1/2 right-0 aspect-square h-[115%] -translate-y-1/2 translate-x-[14%] sm:translate-x-[6%]">
        <Image
          src="/assets/hero-poster.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 95vw, 60vw"
          className="object-contain"
          onLoad={onLoaded}
        />
      </div>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const { tier, loading } = useGpuTier();
  const { marcarHeroCargado } = useAppReady();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  // Pausa el render del canvas cuando el hero sale del viewport (ahorra GPU).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 3D solo en GPU capaz y sin reduced-motion; si no, poster estático.
  const usarCanvas = !reduced && !loading && tier >= 2;
  const mostrarPoster = reduced || (!loading && tier < 2);

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative min-h-dvh overflow-hidden"
    >
      {/* Capa de fondo: canvas 3D, poster estático, o ink mientras detecta GPU */}
      <div className="absolute inset-0" aria-hidden>
        {usarCanvas ? (
          <HeroCanvas
            tier={tier}
            ballScale={1.5}
            ballPosition={[1.15, 0, 0]}
            paused={!visible}
            onReady={marcarHeroCargado}
          />
        ) : mostrarPoster ? (
          <PosterFallback onLoaded={marcarHeroCargado} />
        ) : null}
      </div>

      {/* Malla de nodos + degradado para contraste del texto */}
      <div className="node-grid absolute inset-0 opacity-25" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, var(--ink) 0%, var(--ink) 28%, rgba(11,18,32,0.55) 60%, transparent 88%), linear-gradient(0deg, var(--ink), transparent 28%)",
        }}
      />

      {/* Texto */}
      <Container
        size="wide"
        className="relative z-10 flex min-h-dvh flex-col justify-center pt-28 pb-20"
      >
        <p className="eyebrow">{perfil.ubicacion}</p>
        <div className="mt-5">
          <HeroTitle />
        </div>
        <p className="lead mt-6 max-w-xl text-pretty">
          Construyo productos reales entre el full-stack y el machine learning,
          con el fútbol como excusa para meterle datos a todo.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
          <span className="text-agua">●</span>
          <span>fútbol × ML</span>
          <span className="text-line">/</span>
          <span>builder</span>
          <span className="text-line">/</span>
          <span>ORT TIC · Buenos Aires</span>
        </div>

        <a
          href="#sobre"
          className="mt-16 inline-flex w-fit items-center gap-2 font-mono text-xs tracking-wide text-chalk-dim transition-colors hover:text-agua"
        >
          <ArrowDown className="size-4 animate-bounce" />
          Bajá para ver más
        </a>
      </Container>
    </section>
  );
}
