"use client";
import { useEffect, useRef } from "react";

const SECUENCIA = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

/**
 * Easter egg: código Konami → lluvia de pelotas (⚽🏀) con física simple, guiño
 * al mundo deportivo de Felipe. Costo cero salvo al activarse. Con reduced-motion
 * muestra un cartelito estático en vez de la animación.
 */
export function KonamiEasterEgg() {
  const contRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let buffer: string[] = [];
    let activo = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fiestaEstatica = () => {
      const cont = contRef.current;
      if (!cont) return;
      const cartel = document.createElement("div");
      cartel.textContent = "⚽ ¡Modo hincha! 🏀";
      cartel.className =
        "papel absolute left-1/2 top-24 -translate-x-1/2 px-6 py-3 font-mono text-sm text-tinta";
      cont.appendChild(cartel);
      window.setTimeout(() => cartel.remove(), 2200);
    };

    const fiesta = () => {
      const cont = contRef.current;
      if (!cont || activo) return;
      activo = true;

      const emojis = ["⚽", "🏀"];
      const N = 28;
      const W = window.innerWidth;
      const H = window.innerHeight;
      type Ball = { el: HTMLDivElement; x: number; y: number; vx: number; vy: number; r: number };
      const balls: Ball[] = [];

      for (let i = 0; i < N; i++) {
        const el = document.createElement("div");
        el.textContent = emojis[i % 2];
        const size = 26 + Math.random() * 26;
        el.style.cssText = `position:absolute;top:0;left:0;font-size:${size}px;will-change:transform;`;
        cont.appendChild(el);
        balls.push({
          el,
          x: Math.random() * W,
          y: -80 - Math.random() * 300,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 3,
          r: size / 2,
        });
      }

      const inicio = performance.now();
      let previo = inicio;
      let raf = 0;
      const tick = (t: number) => {
        // en cuadros de 60Hz: igual de rápido en una pantalla de 120Hz
        const dt = Math.min(3, (t - previo) / (1000 / 60));
        previo = t;
        for (const b of balls) {
          b.vy += 0.45 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.y + b.r > H) {
            b.y = H - b.r;
            b.vy *= -0.62;
            b.vx *= 0.85;
          }
          if (b.x < b.r || b.x > W - b.r) b.vx *= -0.8;
          b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        }
        if (t - inicio < 5000) {
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
          balls.forEach((b) => b.el.remove());
          activo = false;
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
      buffer.push(key);
      if (buffer.length > SECUENCIA.length) buffer = buffer.slice(-SECUENCIA.length);
      if (
        buffer.length === SECUENCIA.length &&
        SECUENCIA.every((k, i) => buffer[i] === k)
      ) {
        buffer = [];
        if (reduced) fiestaEstatica();
        else fiesta();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={contRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    />
  );
}
