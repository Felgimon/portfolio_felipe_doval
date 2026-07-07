"use client";
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** desplazamiento inicial en px */
  y?: number;
  delay?: number;
  /** trigger start de ScrollTrigger */
  start?: string;
};

/**
 * Revela su contenido al entrar en viewport (ScrollTrigger). Si adentro hay
 * elementos con `data-reveal-item`, los anima con stagger; si no, anima el
 * bloque entero. Reversible al scrollear para arriba. Respeta reduced-motion
 * (todo visible, sin animación).
 */
export function Reveal({
  children,
  className,
  y = 28,
  delay = 0,
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const items = el.querySelectorAll<HTMLElement>("[data-reveal-item]");
      const targets = items.length ? items : [el];

      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.8,
        ease: "power3.out",
        delay,
        stagger: items.length ? 0.09 : 0,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
