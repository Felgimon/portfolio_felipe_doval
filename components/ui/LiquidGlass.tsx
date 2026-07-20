"use client";
import { useEffect } from "react";
import { filtroLente, paramsPara } from "@/lib/lente";
import {
  alCambiarRendimiento,
  nivelRendimiento,
  vigilarRendimiento,
} from "@/lib/rendimiento";

/**
 * Aplica el Liquid Glass real (lente + aberración cromática, ver lib/lente.ts)
 * a cada elemento marcado con `data-lente`.
 *
 * La cadena completa va INLINE en el elemento y solo en Chromium:
 *   blur(b/2) → url(filtro) → blur(b) → brightness → saturate
 * (el blur ANTES del desplazamiento ablanda lo que la lente dobla — es parte
 * del look "líquido" — y el de después funde el resultado).
 *
 * Safari y Firefox no aplican filtros SVG en backdrop-filter, y peor: si la
 * declaración entera incluye el url(), WebKit la descarta y el elemento pierde
 * hasta el blur (probado con el motor real: el fondo desaparecía y quedaba un
 * bulto blanco). Por eso acá NO se toca el estilo fuera de Chromium: esos
 * navegadores se quedan con el frost del CSS, que es exactamente el fallback
 * que usa el componente de referencia (github.com/srdavo/liquid-glass).
 *
 * Por qué hace falta JS: el filtro codifica el TAMAÑO del elemento (el mapa se
 * genera a medida), y estos elementos cambian con el viewport y con la carga
 * de la fuente. Se regenera al redimensionar; el costo es armar un string.
 */

/** ¿Chromium DE VERDAD? Es el único motor que aplica filtros SVG en
 * backdrop-filter. Detección por UA como el componente de referencia: no hay
 * feature-detect confiable (Safari PARSEA `backdrop-filter: url()` como válido
 * y después lo descarta, así que CSS.supports miente).
 *
 * La trampa que rompió el celular de Feli: en iOS TODOS los navegadores son
 * WebKit por regla de Apple — "Chrome" en iPhone es Safari con otra cara y su
 * UA dice `CriOS` (Edge dice `EdgiOS`). La primera versión trataba CriOS como
 * Chromium, le escribía la cadena con url()... y WebKit descartaba la
 * declaración ENTERA: ni lente ni blur, solo transparencia. iOS es frost,
 * siempre, sin importar el nombre del navegador. */
function soportaLente(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  // iPad moderno se disfraza de Mac; lo delata el multitouch.
  const esIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (ua.includes("mac") && navigator.maxTouchPoints > 1);
  if (esIOS) return false;
  const esChromium = /chrome|chromium|edg/.test(ua) && !/firefox/.test(ua);
  return esChromium && CSS.supports("backdrop-filter", "blur(1px)");
}

/** Las dos cadenas de cada elemento: reposo y PRESIONADO (la lupa se hunde). */
const cadenas = new WeakMap<HTMLElement, { normal: string; honda: string }>();

/** Mutación imperativa fuera del componente (regla react-hooks/immutability).
 * `medida` viene del ResizeObserver (borde-caja, sin flush de layout); si no
 * está, se cae a medir el elemento. */
function aplicarLente(el: HTMLElement, medida?: { w: number; h: number }) {
  const r = medida ?? (() => {
    const b = el.getBoundingClientRect();
    return { w: b.width, h: b.height };
  })();
  if (r.w < 24 || r.h < 12) return;
  // Equipo que no llega (lib/rendimiento.ts): el vidrio se queda con el frost
  // del CSS y NO se le arma la cadena SVG. El sitio pierde el doblez pero se
  // mueve; el criterio es que la fluidez manda sobre el efecto.
  if (nivelRendimiento() === "bajo") {
    el.style.backdropFilter = "";
    delete el.dataset.liquid;
    return;
  }
  // El filtro codifica el tamaño: si no cambió, el que tiene puesto sigue
  // siendo exacto. Evita rearmar el data URI en cada pasada del observer.
  const clave = `${Math.round(r.w)}x${Math.round(r.h)}`;
  if (el.dataset.liquid === clave) return;
  const radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  // data-lente="suave" = vidrio en flujo (cards en grillas): lente contenida
  // para no traer a la card vecina adentro. Ver paramsPara.
  const suave = el.dataset.lente === "suave";
  const p = paramsPara(r.w, r.h, radio, suave);
  // Blur BAJO a propósito: es lo que decide cuánto detalle del fondo sobrevive
  // para que la lente tenga qué doblar. Con blur 1+2 las líneas del estudio
  // (~5px) se lavaban y el doblez no se leía; a la mitad, pasan.
  const b = Math.min(p.width, p.height) < 30 ? 0.5 : 1;
  // Sin brightness: aclarar el backdrop es lo que vuelve "leche" al vidrio
  // (calibración v5.8); el saturate acompaña al frost de la clase (170%).
  const arma = (q: typeof p) =>
    `blur(${b / 2}px) url('${filtroLente(q)}') blur(${b}px) saturate(1.7)`;
  const normal = arma(p);
  el.style.backdropFilter = normal;
  // TS/DOM no expone webkitBackdropFilter tipado; en Chromium alcanza el estándar.
  el.dataset.liquid = clave;

  if (suave) return;
  // VIDRIO INTERACTIVO (el .interactive() de SwiftUI, el "clicked" del
  // componente de referencia): al PRESIONAR, la lupa se hunde — más espesor
  // óptico y más aberración por un instante. Solo el vidrio flotante (el
  // suave no es un control). Las cadenas se precalculan acá (nada de armar
  // data URIs en el pointerdown) y los listeners se cablean UNA vez.
  cadenas.set(el, {
    normal,
    honda: arma({
      ...p,
      depth: Math.round(p.depth * 1.8),
      strength: Math.round(p.strength * 1.4),
      chromaticAberration: p.chromaticAberration + 2,
    }),
  });
  if (el.dataset.lenteInteractiva) return;
  el.dataset.lenteInteractiva = "1";
  const hundir = () => {
    const c = cadenas.get(el);
    if (c) el.style.backdropFilter = c.honda;
  };
  const soltar = () => {
    const c = cadenas.get(el);
    if (c) el.style.backdropFilter = c.normal;
  };
  el.addEventListener("pointerdown", hundir);
  el.addEventListener("pointerup", soltar);
  el.addEventListener("pointerleave", soltar);
  el.addEventListener("pointercancel", soltar);
}

export function LiquidGlass() {
  useEffect(() => {
    // Marca el motor en <html>: "lente" (Chromium, refracción real) o "frost"
    // (Safari/Firefox). El CSS usa la marca para darle al frost su canto
    // grueso — y para NO dárselo a Chromium, donde ensuciaría la lente.
    const conLente = soportaLente();
    document.documentElement.dataset.lenteMotor = conLente ? "lente" : "frost";
    if (!conLente) return;

    /* El filtro sólo depende del TAMAÑO del elemento, así que quien manda es un
     * ResizeObserver: dispara una vez al observar (aplicación inicial) y después
     * únicamente cuando el elemento cambia de medida de verdad — carga de la
     * tipografía, resize de ventana, reflow del layout. Todo eso queda cubierto
     * sin escuchar 'resize' ni re-medir nada a mano.
     *
     * Antes esto colgaba del MutationObserver: CADA mutación del DOM (y GSAP
     * muta estilos por frame) reprogramaba un pase que hacía querySelectorAll +
     * getBoundingClientRect sobre los ~33 vidrios, o sea un LAYOUT SINCRÓNICO
     * forzado por frame para descubrir que casi nunca había cambiado nada.
     * `borderBoxSize` además da la medida de layout sin flush y sin contaminarse
     * con los transforms de las animaciones. */
    const ro = new ResizeObserver((entradas) => {
      for (const e of entradas) {
        const caja = e.borderBoxSize?.[0];
        aplicarLente(
          e.target as HTMLElement,
          caja
            ? { w: caja.inlineSize, h: caja.blockSize }
            : { w: e.contentRect.width, h: e.contentRect.height },
        );
      }
    });

    const observados = new WeakSet<Element>();
    const observar = () => {
      for (const el of document.querySelectorAll("[data-lente]")) {
        if (observados.has(el)) continue;
        observados.add(el);
        ro.observe(el);
      }
    };
    observar();

    /* Las páginas de proyecto montan sus cards DESPUÉS (navegación client-side
     * con el layout persistente). El MutationObserver queda SÓLO para descubrir
     * vidrio nuevo — ya no mide nada: el alta la resuelve el ResizeObserver. Se
     * coalescen las ráfagas en un rAF y se ignoran las mutaciones que no suman
     * nodos (escribir style/dataset no dispara childList, así que no se
     * retroalimenta). */
    let raf = 0;
    const mo = new MutationObserver((muts) => {
      if (!muts.some((m) => m.addedNodes.length > 0)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(observar);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    /* Vigilancia de FPS: si el equipo no llega, se le saca la cadena SVG a TODO
     * el vidrio de una (el frost del CSS queda). Pasa una sola vez por sesión. */
    const cortarVigilancia = vigilarRendimiento();
    const bajaNivel = alCambiarRendimiento(() => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-lente]")) {
        el.style.backdropFilter = "";
        delete el.dataset.liquid;
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      cortarVigilancia();
      bajaNivel();
    };
  }, []);
  return null;
}
