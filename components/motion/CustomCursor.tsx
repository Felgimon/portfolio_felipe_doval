"use client";
import { useEffect, useRef } from "react";

/**
 * Cursor custom: aro celeste que sigue al puntero con lerp + punto exacto.
 * Crece sobre elementos interactivos. Solo se activa con `pointer: fine` y sin
 * reduced-motion (en touch / reduced-motion queda el cursor nativo). El gating
 * y el ocultado del cursor nativo se hacen por CSS (ver globals.css).
 */
export function CustomCursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`;
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const grow = Boolean(
        t?.closest?.("a, button, [role='button'], [data-cursor='grow']"),
      );
      ring.current?.classList.toggle("cursor-grow", grow);
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      root.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-el cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-el cursor-dot" aria-hidden />
    </>
  );
}
