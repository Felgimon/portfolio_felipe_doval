"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Registro central de GSAP. Importar siempre gsap/ScrollTrigger/useGSAP desde
 * acá para que los plugins queden registrados una sola vez.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Todo el movimiento va adentro de esta consulta: con "reducir movimiento"
 * el sitio queda quieto, en el estado final que deja el CSS. */
export const CON_MOVIMIENTO = "(prefers-reduced-motion: no-preference)";

/** Los títulos `[data-peso]` de un bloque engordan de hairline a negra
 * mientras suben por la pantalla. */
export function engordar(bloque: Element) {
  bloque.querySelectorAll("[data-peso]").forEach((el) => {
    gsap.fromTo(
      el,
      { fontWeight: 100 },
      {
        fontWeight: 900,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 96%", end: "top 38%", scrub: true },
      },
    );
  });
}

export { gsap, ScrollTrigger, useGSAP };
