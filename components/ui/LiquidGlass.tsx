"use client";
import { useEffect } from "react";
import { escalaLente, grosorBisel, mapaLente } from "@/lib/lente";

/**
 * Le pone la LENTE (la refracción del borde) a cada elemento marcado con
 * `data-lente`. Monta un único <svg> con un <filter> por elemento y le pasa a
 * cada uno su `--lente`, que `.glass::before` consume.
 *
 * Por qué hace falta JS: el mapa de desplazamiento tiene que medir lo MISMO que
 * el elemento (feImage no se estira solo), y los elementos de este sitio cambian
 * de tamaño con el viewport y con el texto. Se regenera al redimensionar.
 *
 * Dónde se usa y dónde no: la lente va SOLO en lo que FLOTA (el HUD, los CTA,
 * las etiquetas de los soles). Es la regla de Apple, no una optimización: el
 * vidrio es una capa que se apoya SOBRE el contenido, no el contenido mismo.
 * Además es donde se ve: sobre el estudio blanco no hay nada que doblar, pero
 * las etiquetas flotan sobre el sol y ahí la refracción canta.
 *
 * Solo Chromium aplica filtros SVG en `backdrop-filter`. En Safari y Firefox
 * `--lente` queda sin efecto y el vidrio se queda con su frost: por eso la
 * refracción vive en su propia capa y nunca en la declaración del blur (con
 * las dos juntas, WebKit borra el fondo y deja un bulto blanco).
 */
export function LiquidGlass() {
  useEffect(() => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    document.body.appendChild(svg);

    let raf = 0;
    const medidos = new WeakMap<Element, string>();

    const pintar = () => {
      const nodos = document.querySelectorAll<HTMLElement>("[data-lente]");
      svg.replaceChildren();
      nodos.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        if (w < 8 || h < 8) return;
        // Si no cambió de tamaño, se reusa el filtro y no se recalcula el mapa.
        const clave = `${w}x${h}`;
        const radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        const grosor = grosorBisel(w, h);
        const uri = mapaLente(w, h, radio, grosor);
        if (!uri) return;
        medidos.set(el, clave);

        const id = `lente-${i}`;
        const f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        f.setAttribute("id", id);
        // La región del filtro se ESTIRA más allá del elemento a propósito: la
        // lente del borde tiene que traer píxeles de afuera. Sin ese margen no
        // hay de dónde sacarlos y el fondo se desgarra en vez de doblarse.
        f.setAttribute("x", "-50%");
        f.setAttribute("y", "-50%");
        f.setAttribute("width", "200%");
        f.setAttribute("height", "200%");
        f.setAttribute("color-interpolation-filters", "sRGB");
        f.setAttribute("primitiveUnits", "userSpaceOnUse");

        const img = document.createElementNS("http://www.w3.org/2000/svg", "feImage");
        img.setAttribute("href", uri);
        img.setAttribute("x", "0");
        img.setAttribute("y", "0");
        img.setAttribute("width", String(w));
        img.setAttribute("height", String(h));
        img.setAttribute("result", "mapa");

        const dm = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "feDisplacementMap",
        );
        dm.setAttribute("in", "SourceGraphic");
        dm.setAttribute("in2", "mapa");
        dm.setAttribute("scale", String(escalaLente(grosor)));
        dm.setAttribute("xChannelSelector", "R");
        dm.setAttribute("yChannelSelector", "G");

        f.append(img, dm);
        svg.appendChild(f);
        el.style.setProperty("--lente", `url(#${id})`);
      });
    };

    const programar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pintar);
    };

    programar();
    // Tras cargar las fuentes las pastillas cambian de ancho.
    const t = window.setTimeout(programar, 800);
    window.addEventListener("resize", programar);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", programar);
      svg.remove();
    };
  }, []);

  return null;
}
