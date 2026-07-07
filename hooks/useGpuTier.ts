"use client";
import { useEffect, useState } from "react";
import { getGPUTier } from "detect-gpu";

export type GpuInfo = {
  /** 0 = muy débil / sin WebGL, 3 = potente */
  tier: number;
  isMobile: boolean;
  /** true mientras se detecta (asumir capaz para no bloquear) */
  loading: boolean;
};

/**
 * Detecta la capacidad de la GPU (detect-gpu). Sirve para degradar el hero 3D:
 * tier bajo o mobile → menos dpr o directamente poster estático.
 */
export function useGpuTier(): GpuInfo {
  const [info, setInfo] = useState<GpuInfo>({
    tier: 3,
    isMobile: false,
    loading: true,
  });

  useEffect(() => {
    let activo = true;
    // Override de debug: ?forcegl=1 fuerza el 3D (útil en headless/SwiftShader).
    const forzado =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("forcegl");
    const p = forzado
      ? Promise.resolve({ tier: 3, isMobile: false })
      : getGPUTier();
    p.then((r) => {
      if (!activo) return;
      setInfo({
        tier: r.tier ?? 2,
        isMobile: r.isMobile ?? false,
        loading: false,
      });
    }).catch(() => {
      if (activo) setInfo((prev) => ({ ...prev, loading: false }));
    });
    return () => {
      activo = false;
    };
  }, []);

  return info;
}
