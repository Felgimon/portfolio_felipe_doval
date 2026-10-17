"use client";
import { useEffect } from "react";
import { tocar, type Toque } from "@/lib/sonido";

/**
 * EL HOVER DE TODO LO QUE SE TOCA (v8.2): la gota de vidrio vuela hasta el
 * botón (o el link, o la fila) con el mouse o el foco del teclado encima y se
 * vuelve una burbuja con su forma. Este componente sólo marca a dónde ir con
 * data-gota-aqui; el vuelo y el dibujo los hace la escena (Escena.tsx).
 *
 * Con el sonido prendido, además suena (v9), siempre en la tonalidad de la
 * canción: los botones, una burbuja (más grave cuanto más grande); las filas
 * de una lista, una cajita que baja con ellas; el nombre, el acorde.
 *
 * Los links de la nav lo manejan ellos mismos (Nav.tsx: además cambian de
 * color y tocan su nota). Sin escena o con movimiento reducido, cada botón
 * tiene su hover de CSS.
 */
export const BURBUJA = ".boton, .sonido-icono, .sonido-texto, .marca, a.fila, a.vidrio-hover";

/** Qué voz le toca a cada cosa (lib/sonido.ts). */
function voz(el: HTMLElement): Toque {
  if (el.matches(".marca")) return { tipo: "marca" };
  if (el.matches(".sonido-icono")) return { tipo: "sonido" };
  if (el.matches("a.fila")) {
    const filas = [...(el.closest("ul, ol")?.querySelectorAll("a.fila") ?? [])];
    return { tipo: "fila", i: Math.max(0, filas.indexOf(el)) };
  }
  return { tipo: "boton", ancho: el.getBoundingClientRect().width };
}

export function Burbuja() {
  useEffect(() => {
    let actual: HTMLElement | null = null;
    const poner = (el: HTMLElement | null) => {
      if (el === actual) return;
      if (actual && !actual.classList.contains("nav-link")) delete actual.dataset.gotaAqui;
      actual = el;
      if (!el) return;
      el.dataset.gotaAqui = "";
      if (!el.classList.contains("nav-link")) tocar(voz(el));
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
