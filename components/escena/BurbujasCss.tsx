"use client";
import { useEffect } from "react";

/**
 * LAS BURBUJAS SIN WEBGL (v9.2). Las mismas burbujas que pinta la escena
 * (data-burbujas="fx fy r; …"), en CSS: un vidrio con canto, brillo y sombra.
 *
 * Sólo para los equipos sin WebGL 2 (o si la escena se cae): ahí son las
 * burbujas, nacen con el mismo ¡pup! y con el mouse sobre algo que se toca
 * también se juntan en el botón y toman su forma (JuntarBurbujasCss). Con
 * escena (o mientras carga) no se muestran: las burbujas nacen cuando están
 * las de verdad (v9.3).
 *
 * Van DENTRO de la caja que las declara (un título, un cianotipo), en las
 * mismas fracciones, así que se mueven con ella como las de la escena.
 */
const leer = (s?: string) =>
  (s ?? "")
    .split(";")
    .map((t) => t.trim().split(/\s+/).map(Number))
    .filter((v) => v.length >= 3 && v.every((n) => !Number.isNaN(n)));

export function BurbujasCss({ d, m }: { d?: string; m?: string }) {
  const escritorio = leer(d);
  const celular = m === undefined ? escritorio : leer(m);
  const n = Math.max(escritorio.length, celular.length);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = escritorio[i];
        const b = celular[i];
        return (
          <span
            key={i}
            aria-hidden
            className="burbuja-css"
            data-sin-d={a ? undefined : ""}
            data-sin-m={b ? undefined : ""}
            style={
              {
                "--x": a?.[0] ?? 0,
                "--y": a?.[1] ?? 0,
                "--r": a?.[2] ?? 0,
                "--xm": b?.[0] ?? 0,
                "--ym": b?.[1] ?? 0,
                "--rm": b?.[2] ?? 0,
                "--i": i,
              } as React.CSSProperties
            }
          />
        );
      })}
    </>
  );
}

/**
 * El hover sin escena: las burbujas de CSS que se ven vuelan al botón con el
 * mouse encima (data-gota-aqui), de la más cerca a la más lejos, y toman su
 * forma de píldora. Con la escena lista no hace nada (lo hace el shader).
 */
export function JuntarBurbujasCss() {
  useEffect(() => {
    const html = document.documentElement;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    let juntas: HTMLElement[] = [];
    let objetivo: HTMLElement | null = null;

    const soltar = () => {
      for (const b of juntas) {
        b.style.removeProperty("translate");
        b.style.removeProperty("width");
        b.style.removeProperty("height");
        b.style.removeProperty("aspect-ratio");
        b.style.removeProperty("transition-delay");
        delete b.dataset.junta;
      }
      juntas = [];
      objetivo = null;
    };

    const juntar = (boton: HTMLElement) => {
      soltar();
      objetivo = boton;
      const rb = boton.getBoundingClientRect();
      const bx = rb.left + rb.width / 2;
      const by = rb.top + rb.height / 2;
      const visibles = [...document.querySelectorAll<HTMLElement>(".burbuja-css")]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth)
        .map((x) => ({ ...x, lejos: Math.hypot(x.r.left + x.r.width / 2 - bx, x.r.top + x.r.height / 2 - by) }))
        .sort((a, b) => a.lejos - b.lejos);
      const ancho = rb.width + (rb.height < 30 ? 30 : 8);
      const alto = Math.max(rb.height + 8, 36);
      visibles.forEach(({ el, r }, i) => {
        const dx = bx - (r.left + r.width / 2);
        const dy = by - (r.top + r.height / 2);
        el.style.transitionDelay = `${i * 55}ms`;
        el.style.translate = `calc(-50% + ${dx}px) calc(-50% + ${dy}px)`;
        el.style.aspectRatio = "auto";
        el.style.width = `${ancho}px`;
        el.style.height = `${alto}px`;
        el.dataset.junta = "";
        juntas.push(el);
      });
    };

    const revisar = () => {
      if (html.dataset.escena === "lista" || quieto.matches) {
        if (juntas.length) soltar();
        return;
      }
      const boton = document.querySelector<HTMLElement>("[data-gota-aqui]");
      if (boton === objetivo) return;
      if (boton) juntar(boton);
      else soltar();
    };

    const mo = new MutationObserver(revisar);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-gota-aqui"] });
    mo.observe(html, { attributes: true, attributeFilter: ["data-escena"] });
    // si el scroll mueve las cosas, se sueltan (y se vuelven a juntar al próximo hover)
    const scroll = () => {
      if (juntas.length) soltar();
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", scroll);
      soltar();
    };
  }, []);
  return null;
}
