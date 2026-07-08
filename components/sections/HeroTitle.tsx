"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SplitText } from "gsap/SplitText";
import { useAppReady } from "@/components/motion/AppReady";
import { useReducedMotion } from "@/hooks/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText);
}

/**
 * Nombre del hero con entrada tipográfica (SplitText, stagger por caracteres),
 * sincronizada con la salida del preloader (`ready`). Con reduced-motion se
 * muestra estático. Tras animar, revierte el split (DOM limpio para el resize).
 */
export function HeroTitle() {
  const ref = useRef<HTMLHeadingElement>(null);
  const { ready } = useAppReady();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // reduced-motion: título estático y visible (restaurar por si una render
      // previa lo escondió durante la hidratación).
      if (reduced) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }

      if (!ready) {
        gsap.set(el, { autoAlpha: 0 });
        return;
      }

      const split = new SplitText(el, { type: "chars" });
      gsap.set(el, { autoAlpha: 1 });
      gsap.from(split.chars, {
        yPercent: 130,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.035,
        onComplete: () => split.revert(),
      });

      return () => split.revert();
    },
    { dependencies: [ready, reduced], scope: ref },
  );

  return (
    <h1 ref={ref} className="type-hero text-chalk">
      Felipe
      <br />
      Doval<span className="text-agua">_</span>
    </h1>
  );
}
