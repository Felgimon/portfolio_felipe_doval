"use client";
import { useEffect } from "react";
import { filtroLente, paramsPara } from "@/lib/lente";

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

/** ¿Chromium? Es el único motor que aplica filtros SVG en backdrop-filter.
 * Detección por UA como el componente de referencia: no hay feature-detect
 * confiable (Safari PARSEA `backdrop-filter: url()` como válido y después lo
 * ignora o lo rompe, así que CSS.supports miente). */
function soportaLente(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const esChromium = /chrome|chromium|crios|edg/.test(ua) && !/firefox|fxios/.test(ua);
  return esChromium && CSS.supports("backdrop-filter", "blur(1px)");
}

/** Mutación imperativa fuera del componente (regla react-hooks/immutability). */
function aplicarLente(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.width < 24 || r.height < 12) return;
  const radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const p = paramsPara(r.width, r.height, radio);
  const b = Math.min(p.width, p.height) < 30 ? 1 : 2;
  // Sin brightness: aclarar el backdrop es lo que vuelve "leche" al vidrio
  // (calibración v5.8); el saturate acompaña al frost de la clase (170%).
  const filtro = `blur(${b / 2}px) url('${filtroLente(p)}') blur(${b}px) saturate(1.7)`;
  el.style.backdropFilter = filtro;
  // TS/DOM no expone webkitBackdropFilter tipado; en Chromium alcanza el estándar.
  el.dataset.liquid = "on";
}

export function LiquidGlass() {
  useEffect(() => {
    if (!soportaLente()) return;
    let raf = 0;
    const pintar = () => {
      document.querySelectorAll<HTMLElement>("[data-lente]").forEach(aplicarLente);
    };
    const programar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pintar);
    };
    programar();
    // Tras cargar la tipografía las pastillas cambian de ancho.
    const t = window.setTimeout(programar, 800);
    window.addEventListener("resize", programar);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", programar);
    };
  }, []);
  return null;
}
