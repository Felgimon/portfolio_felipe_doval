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

/** Mutación imperativa fuera del componente (regla react-hooks/immutability). */
function aplicarLente(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.width < 24 || r.height < 12) return;
  // El filtro codifica el tamaño: si no cambió, el que tiene puesto sigue
  // siendo exacto. Evita rearmar el data URI en cada pasada del observer.
  const clave = `${Math.round(r.width)}x${Math.round(r.height)}`;
  if (el.dataset.liquid === clave) return;
  const radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  // data-lente="suave" = vidrio en flujo (cards en grillas): lente contenida
  // para no traer a la card vecina adentro. Ver paramsPara.
  const suave = el.dataset.lente === "suave";
  const p = paramsPara(r.width, r.height, radio, suave);
  const b = Math.min(p.width, p.height) < 30 ? 1 : 2;
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
    // Las páginas de proyecto montan sus cards DESPUÉS (navegación client-side
    // con el layout persistente): sin esto, todo lo que aparece tras la carga
    // inicial quedaría sin lente. childList solamente — escribir style/dataset
    // no dispara childList, así que no se retroalimenta.
    const mo = new MutationObserver(programar);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", programar);
      mo.disconnect();
    };
  }, []);
  return null;
}
