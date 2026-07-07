"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Registro central de GSAP. Importar SIEMPRE gsap/ScrollTrigger/useGSAP desde
 * acá para garantizar que los plugins queden registrados una sola vez.
 * SplitText se registra en el componente que lo usa (Fase 3).
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };
