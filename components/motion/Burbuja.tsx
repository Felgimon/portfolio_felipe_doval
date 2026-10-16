"use client";
import { useEffect } from "react";

/**
 * EL HOVER DE TODO LO QUE SE TOCA (v8.2): la gota de vidrio vuela hasta el
 * botón (o el link, o la fila) con el mouse o el foco del teclado encima y se
 * vuelve una burbuja con su forma. Este componente sólo marca a dónde ir con
 * data-gota-aqui; el vuelo y el dibujo los hace la escena (Escena.tsx).
 *
 * Los links de la nav lo manejan ellos mismos (Nav.tsx: además cambian de
 * color y suenan). Sin escena o con movimiento reducido, cada botón tiene su
 * hover de CSS.
 */
export const BURBUJA = ".boton, .sonido-icono, .sonido-texto, .marca, a.fila, a.vidrio-hover";

export function Burbuja() {
  useEffect(() => {
    let actual: HTMLElement | null = null;
    const poner = (el: HTMLElement | null) => {
      if (el === actual) return;
      if (actual && !actual.classList.contains("nav-link")) delete actual.dataset.gotaAqui;
      actual = el;
      if (el) el.dataset.gotaAqui = "";
    };
    const objetivo = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>(BURBUJA) : null;

    const sobre = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      poner(objetivo(e.target));
    };
    const foco = (e: FocusEvent) => {
      const el = objetivo(e.target);
      if (el?.matches(":focus-visible")) poner(el);
    };
    const sinFoco = () => {
      if (actual && !actual.matches(":hover")) poner(null);
    };
    const fuera = () => poner(null);

    document.addEventListener("pointerover", sobre, { passive: true });
    document.addEventListener("focusin", foco);
    document.addEventListener("focusout", sinFoco);
    document.documentElement.addEventListener("pointerleave", fuera);
    return () => {
      document.removeEventListener("pointerover", sobre);
      document.removeEventListener("focusin", foco);
      document.removeEventListener("focusout", sinFoco);
      document.documentElement.removeEventListener("pointerleave", fuera);
      poner(null);
    };
  }, []);
  return null;
}
