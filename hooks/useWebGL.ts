"use client";
import { useSyncExternalStore } from "react";

let cached: boolean | null = null;

function detect(): boolean {
  if (typeof window === "undefined") return false;
  if (cached !== null) return cached;
  try {
    const c = document.createElement("canvas");
    cached = Boolean(
      window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl")),
    );
  } catch {
    cached = false;
  }
  return cached;
}

/**
 * ¿Hay WebGL en este navegador? Gate del canvas 3D — reemplaza a detect-gpu, que
 * mandaba a GPUs integradas / Chrome al poster estático (bug cross-browser).
 * Client-only, sin mismatch de hidratación (server → false).
 */
export function useWebGL(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => detect(),
    () => false,
  );
}
