"use client";
import { useEffect } from "react";

/**
 * El reflejo de los botones de esmalte (.boton-solido): un solo listener para
 * todo el sitio que le dice al botón que está bajo el puntero dónde cae la luz
 * (--mx / --my). El CSS pinta la mancha blanca ahí. Sólo con mouse.
 */
export function Reflejos() {
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>(".boton-solido") : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, []);
  return null;
}
