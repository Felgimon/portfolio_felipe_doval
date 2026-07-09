"use client";
import { useEffect, useRef, useState } from "react";
import { isSoftwareRenderer, rendererName } from "@/lib/gpu";

/**
 * Silencia SOLO el warning benigno de deprecación de `THREE.Clock` (lo emite
 * `@react-three/fiber` al instanciar su reloj interno; no es un error ni sale de
 * nuestro código). Todo el resto de `console.warn` pasa intacto. Se instala una
 * sola vez, apenas monta el cliente (antes que el canvas).
 */
function silenceThreeClockWarning() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __clockPatched?: boolean };
  if (w.__clockPatched) return;
  w.__clockPatched = true;
  const orig = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    orig(...args);
  };
}

/**
 * Overlay de desarrollo: instala el filtro del warning y, con `?stats` en la URL,
 * muestra un medidor de FPS de la PÁGINA (cadencia real de requestAnimationFrame).
 * Es la medición que importa para "¿se siente fluido?": 60 = smooth. En reposo,
 * con el canvas pausado, la página debería quedar clavada en 60.
 */
export function DevOverlay() {
  const [fps, setFps] = useState<number | null>(null);
  const [gpu, setGpu] = useState<{ name: string; soft: boolean } | null>(null);
  const enabled = useRef(false);

  useEffect(() => {
    silenceThreeClockWarning();
    enabled.current = new URLSearchParams(window.location.search).has("stats");
    if (!enabled.current) return;
    setGpu({ name: rendererName(), soft: isSoftwareRenderer() });

    let raf = 0;
    let frames = 0;
    let t0 = performance.now();
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - t0 >= 500) {
        setFps(Math.round((frames * 1000) / (now - t0)));
        frames = 0;
        t0 = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (fps === null) return null;
  const color = fps >= 55 ? "#8fe3c6" : fps >= 40 ? "#e7a06a" : "#e8846a";
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 9999,
        font: "600 12px ui-monospace, monospace",
        background: "rgba(15,30,27,0.85)",
        border: "1px solid #2a3f39",
        borderRadius: 6,
        padding: "4px 8px",
        pointerEvents: "none",
        textAlign: "right",
        maxWidth: 320,
      }}
    >
      <div style={{ color }}>{fps} FPS</div>
      {gpu && (
        <div
          style={{
            marginTop: 3,
            fontSize: 9,
            fontWeight: 400,
            color: gpu.soft ? "#e8846a" : "#83978d",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={gpu.name}
        >
          {gpu.soft ? "⚠ SOFTWARE · " : "GPU · "}
          {gpu.name}
        </div>
      )}
    </div>
  );
}
