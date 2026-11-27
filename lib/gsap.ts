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

/**
 * Las entradas de un bloque, atadas al scroll (no al tiempo: si el navegador
 * frena, nada queda a medio aparecer):
 *  - `[data-sube]`: el texto sube desde atrás de su máscara.
 *  - `[data-abre]`: la imagen se destapa de abajo hacia arriba y, adentro, se
 *    desplaza un poco más lento que su marco.
 */
export function entradas(bloque: Element) {
  bloque.querySelectorAll<HTMLElement>("[data-sube]").forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 108 },
      { yPercent: 0, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top 98%", end: "top 76%", scrub: 0.5 } },
    );
  });
  bloque.querySelectorAll<HTMLElement>("[data-abre]").forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: "inset(100% 0 0 0)" },
      { clipPath: "inset(0% 0 0 0)", ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top 96%", end: "top 58%", scrub: 0.5 } },
    );
    gsap.fromTo(
      el.querySelector("img"),
      { yPercent: -10.5 },
      { yPercent: 0, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
    );
  });
}

export { gsap, ScrollTrigger, useGSAP };
