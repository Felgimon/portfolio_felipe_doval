"use client";
import HeroCanvas from "@/components/three/HeroCanvas";

/**
 * Ruta TEMPORAL (dev) para generar el poster estático del hero: renderiza solo
 * el balón-grafo centrado sobre ink. Se screenshotea a public/assets/ y esta
 * ruta se borra en Fase 9. No indexable.
 */
export default function PosterPage() {
  return (
    <div className="fixed inset-0 z-[200] bg-ink">
      <HeroCanvas tier={3} ballScale={1.55} ballPosition={[0, 0, 0]} />
    </div>
  );
}
