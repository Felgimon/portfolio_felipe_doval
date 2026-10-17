"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MAX_PLACAS, Motor, type Cuadro, type PlacaGPU } from "@/lib/escena/motor";
import { MAX_BURBUJAS, MAX_VIDRIOS } from "@/lib/escena/shader";
import { isSoftwareRenderer } from "@/lib/gpu";
import { alCambiarRendimiento, nivelRendimiento, vigilarRendimiento } from "@/lib/rendimiento";

/**
 * LA ESCENA: el estudio cobalto, los títulos impresos en el fondo, Feli y las
 * burbujas de vidrio que los refractan.
 *
 * Un solo <canvas> fijo detrás de todo el contenido. El DOM declara qué hay
 * que pintar y la escena lo lee en cada cuadro con getBoundingClientRect (son
 * pocos elementos y el scroll no ensucia el layout):
 *
 *   data-placa          un título "impreso": se dibuja una vez en una textura
 *                       con su misma fuente; el texto del DOM queda transparente
 *                       (data-placa-lista) pero sigue ahí para leer y copiar
 *   data-feli           una foto de Feli (data-pose-src = la foto)
 *   data-cianotipo      el fondo de una sección: objetos de todos los días en
 *                       cianotipo (data-src = el mapa de luz). Se pinta como
 *                       luz baja sobre el estudio, debajo de Feli y los títulos
 *   data-vidrio         un panel de vidrio ahumado. Si se puede tocar (a,
 *                       button), reacciona al mouse: lente, reflejo y canto.
 *                       ="claro": vidrio casi sin ahumar, como una gota.
 *                       ="hover": aparece sólo con el mouse encima (las
 *                       filas de proyectos). Al tocarlo, una onda lo recorre.
 *   data-burbujas="fx fy r [p]; …"
 *                       las burbujas de vidrio que viven en esa caja (un
 *                       título, un cianotipo): dónde, en fracciones de la caja
 *                       (pueden salirse: 1.2 es un poco a la derecha), su radio
 *                       en fracción de la pantalla y, opcional, cuánto miran
 *                       al mouse (0.04 si no se dice). Se mueven con la caja
 *                       (se quedan en su sección) y flotan apenas
 *   data-burbujas-m     lo mismo para pantallas angostas (< 768px). Una caja
 *                       oculta (display: none) no tiene burbujas
 *   data-gota-aqui      algo que se toca con el mouse o el foco encima: las
 *                       burbujas que se ven vuelan hasta ahí, de la más cerca
 *                       a la más lejos, se funden y se vuelven una sola
 *                       píldora de su tamaño (html[data-gota-modo="boton"]
 *                       mientras dura). Al salir, cada una vuelve a su lugar
 *
 * Estado en <html data-escena>: "poster" (sin WebGL 2 o equipo que no llega:
 * el CSS muestra el estudio en gradiente, los títulos como texto, Feli como
 * <img> y el vidrio sólido), "cargando" y "lista".
 *
 * Corre en el ticker de GSAP DESPUÉS de Lenis, así los rects que lee ya tienen
 * el scroll de este cuadro y nada se despega del DOM.
 */

type Placa = { el: HTMLElement; tex: WebGLTexture; firma: string };
/** h: hover animado · a: presencia animada (data-vidrio="hover" aparece sólo con el mouse encima) */
type Vidrio = { el: HTMLElement; radio: number; h: number; a: number; tipo: string; vivo: boolean };
type Resorte = { v: number; vel: number };
/** una burbuja: su lugar (en la caja que la declara) y sus resortes, relativos a ese lugar */
type Burbuja = {
  el: HTMLElement;
  /** [fx, fy, r, paralaje] en escritorio y en el celular (null: ahí no hay) */
  d: number[] | null;
  dm: number[] | null;
  fase: number;
  ox: Resorte;
  oy: Resorte;
  r: Resorte;
  hw: Resorte;
  hh: Resorte;
  m: Resorte;
  lista: boolean;
  viva: boolean;
  /** su casa en este cuadro (x, y, radio) y dónde está de verdad */
  cx: number;
  cy: number;
  cr: number;
  x: number;
  y: number;
};

const leer = (s: string | undefined) => (s ?? "").trim().split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));
/** "fx fy r; fx fy r" → [[fx, fy, r], …] */
const leerLista = (s: string | undefined) =>
  (s ?? "")
    .split(";")
    .map(leer)
    .filter((v) => v.length >= 3);
/** sólo en las pruebas (y para exportar al Figma): apagar capas de la escena */
const capasOcultan = (capa: string) =>
  (window as { __capasEscena?: Record<string, boolean> }).__capasEscena?.[capa] === false;
const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** El ancho del eje (font-stretch) en la palabra que entiende el canvas 2D. */
function anchoCanvas(stretch: string): CanvasFontStretch {
  const v = parseFloat(stretch);
  if (v >= 124) return "expanded";
  if (v >= 112) return "semi-expanded";
  if (v <= 76) return "condensed";
  return "normal";
}

/** Dibuja el título en un canvas 2D con la misma caja, fuente y línea base que el DOM. */
function dibujarPlaca(el: HTMLElement, escala: number): HTMLCanvasElement {
  const r = el.getBoundingClientRect();
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.ceil(r.width * escala));
  cv.height = Math.max(1, Math.ceil(r.height * escala));
  const x = cv.getContext("2d");
  if (!x) return cv;
  x.scale(escala, escala);
  x.fillStyle = "#fff";
  const cs = getComputedStyle(el);
  x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  x.fontStretch = anchoCanvas(cs.fontStretch);
  x.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  x.textBaseline = "alphabetic";
  const mayus = cs.textTransform === "uppercase";
  const lh = parseFloat(cs.lineHeight);
  const lineas = el.children.length ? [...el.children] : [el];
  for (const sp of lineas) {
    const sr = sp.getBoundingClientRect();
    const txt = mayus ? (sp.textContent ?? "").toUpperCase() : (sp.textContent ?? "");
    const m = x.measureText(txt);
    const alto = Number.isFinite(lh) ? lh : sr.height;
    const base = sr.top - r.top + (alto - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    x.fillText(txt, sr.left - r.left, base);
  }
  return cv;
}

export function Escena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const html = document.documentElement;
    if (!canvas) return;
    const poster = () => {
      html.dataset.escena = "poster";
    };

    let motor: Motor;
    try {
      motor = new Motor(canvas);
    } catch {
      poster();
      return;
    }
    html.dataset.escena = "cargando";

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fino = window.matchMedia("(pointer: fine)");
    const pararVigilancia = vigilarRendimiento();
    const forzado = new URLSearchParams(window.location.search).get("fx");
    let nivel = nivelRendimiento();
    // Render por software (sin GPU): directo al escalón bajo, salvo ?fx=full.
    if (isSoftwareRenderer() && forzado !== "full" && nivel === "alto") nivel = "bajo";
    let apagada = false;
    const apagar = () => {
      apagada = true;
      gsap.ticker.remove(cuadro);
      for (const p of placas.values()) delete p.el.dataset.placaLista;
      poster();
    };
    const bajaNivel = alCambiarRendimiento((n) => {
      if (n === "minimo") apagar();
      else if (n === "bajo") nivel = "bajo";
      sucio = true;
    });

    // --- medición (sólo cuando cambia el documento) ---
    let sucio = true;
    let vw = 0, vh = 0, escala = 1;
    let vidrios: Vidrio[] = [];
    let felis: HTMLElement[] = [];
    let cianos: HTMLElement[] = [];
    let burbujas: Burbuja[] = [];
    const placas = new Map<HTMLElement, Placa>();

    const medir = () => {
      const r = canvas.getBoundingClientRect();
      vw = r.width;
      vh = r.height;
      const dpr = window.devicePixelRatio || 1;
      escala = nivel === "alto" ? Math.min(dpr, 1.5) : 0.6;
      motor.tamaño(Math.max(1, Math.round(vw * escala)), Math.max(1, Math.round(vh * escala)));
      const previos = new Map(vidrios.map((v) => [v.el, v]));
      vidrios = [...document.querySelectorAll<HTMLElement>("[data-vidrio]")].map((el) => {
        const tipo = el.dataset.vidrio ?? "";
        const antes = previos.get(el);
        return {
          el,
          radio: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
          h: antes?.h ?? 0,
          a: antes?.a ?? (tipo === "hover" ? 0 : 1),
          tipo,
          // sólo lo que se puede tocar reacciona al mouse (un panel informativo no)
          vivo: el.matches("a, button, [data-vidrio-vivo]"),
        };
      });
      felis = [...document.querySelectorAll<HTMLElement>("[data-feli]")];
      // con contraste alto, el fondo queda liso (los objetos le restan contraste al texto)
      cianos = window.matchMedia("(prefers-contrast: more)").matches
        ? []
        : [...document.querySelectorAll<HTMLElement>("[data-cianotipo]")];
      // las burbujas: las que ya estaban conservan sus resortes (no saltan)
      const previas = new Map<HTMLElement, Burbuja[]>();
      for (const b of burbujas) previas.set(b.el, [...(previas.get(b.el) ?? []), b]);
      burbujas = [];
      for (const el of document.querySelectorAll<HTMLElement>("[data-burbujas]")) {
        const d = leerLista(el.dataset.burbujas);
        const dm = el.dataset.burbujasM === undefined ? d : leerLista(el.dataset.burbujasM);
        const antes = previas.get(el) ?? [];
        for (let i = 0; i < Math.max(d.length, dm.length); i++) {
          const resorte = () => ({ v: 0, vel: 0 });
          const b: Burbuja = antes[i] ?? {
            el,
            d: null,
            dm: null,
            fase: burbujas.length * 2.39,
            ox: resorte(), oy: resorte(), r: resorte(), hw: resorte(), hh: resorte(), m: resorte(),
            lista: false,
            viva: false,
            cx: 0, cy: 0, cr: 0, x: 0, y: 0,
          };
          b.d = d[i] ?? null;
          b.dm = dm[i] ?? null;
          burbujas.push(b);
        }
      }
      // placas: se redibujan sólo si cambió la caja o la fuente
      const vivas = new Set<HTMLElement>();
      const texEscala = Math.min(window.devicePixelRatio || 1, 2);
      for (const el of document.querySelectorAll<HTMLElement>("[data-placa]")) {
        vivas.add(el);
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const firma = `${Math.round(b.width)}x${Math.round(b.height)}:${cs.fontSize}:${cs.fontStretch}:${el.textContent}:${texEscala}`;
        let p = placas.get(el);
        if (!p) {
          p = { el, tex: motor.nuevaTextura(), firma: "" };
          placas.set(el, p);
        }
        if (p.firma !== firma && b.width > 0) {
          motor.subir(p.tex, dibujarPlaca(el, texEscala));
          p.firma = firma;
          el.dataset.placaLista = "";
        }
      }
      for (const [el, p] of placas) {
        if (!vivas.has(el)) {
          motor.borrar(p.tex);
          placas.delete(el);
        }
      }
      sucio = false;
    };
    const ensuciar = () => {
      sucio = true;
      actividad = performance.now();
    };
    window.addEventListener("resize", ensuciar);
    motor.alCargar = ensuciar;
    motor.papel("/assets/papel.webp");
    // la fuente es display:block, pero igual: si las placas se dibujaron antes
    // de que cargara, se vuelven a dibujar
    document.fonts?.ready.then(() => {
      for (const p of placas.values()) p.firma = "";
      ensuciar();
    });
    const mo = new MutationObserver(ensuciar);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-burbujas", "data-burbujas-m", "data-vidrio", "data-feli", "data-pose-src", "data-placa", "data-cianotipo", "class"],
    });

    // --- puntero: las burbujas lo miran de lejos ---
    let px = -1, py = -1;
    let actividad = performance.now();
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      actividad = performance.now();
    };
    const salir = () => {
      px = py = -1;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    document.documentElement.addEventListener("pointerleave", salir);

    // --- la onda: al tocar un vidrio, y más fuerte cuando algo sale bien ---
    const onda = { x: 0, y: 0, t0: -1e9, fuerza: 0 };
    const lanzar = (x: number, y: number, fuerza: number) => {
      if (rm.matches) return;
      onda.x = x;
      onda.y = y;
      onda.t0 = performance.now();
      onda.fuerza = fuerza;
      actividad = performance.now();
    };
    const tocar = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-vidrio]") : null;
      if (el?.matches("a, button")) lanzar(e.clientX, e.clientY, 1);
    };
    const festejo = (e: Event) => {
      const d = (e as CustomEvent<{ x: number; y: number }>).detail;
      if (d) lanzar(d.x, d.y, 1.6);
    };
    window.addEventListener("pointerdown", tocar, { passive: true });
    window.addEventListener("vidrio:onda", festejo);

    const perdido = (e: Event) => {
      e.preventDefault();
      apagar();
    };
    canvas.addEventListener("webglcontextlost", perdido);

    // --- el cuadro ---
    const vr = new Float32Array(MAX_VIDRIOS * 4);
    const vx = new Float32Array(MAX_VIDRIOS * 4);
    const bu = new Float32Array(MAX_BURBUJAS * 4);
    const bf = new Float32Array(MAX_BURBUJAS * 4);
    /** el elemento sobre el que están las burbujas (su propio hover de vidrio se apaga) */
    let gotaEn: HTMLElement | null = null;
    /** las burbujas que van al botón, y cuándo sale cada una (de la más cerca a la más lejos) */
    let juntadas = new Map<Burbuja, number>();
    let arriba = 0;
    const empujar = (s: { v: number; vel: number }, obj: number, k: number, c: number, dt: number) => {
      // Euler semi-implícito en pasos chicos: estable aunque el cuadro tarde
      let resto = dt;
      while (resto > 0) {
        const h = Math.min(resto, 1 / 120);
        s.vel += ((obj - s.v) * k - s.vel * c) * h;
        s.v += s.vel * h;
        resto -= h;
      }
    };
    const t0 = performance.now();
    let ultimo = t0;
    let primero = true;
    let par = false;

    function cuadro() {
      if (apagada || document.hidden) return;
      // __relojEscena: un reloj manual para los tests (avanza la animación de a
      // pasos fijos, porque las capturas en una máquina sin GPU son lentas)
      const ahora = (window as { __relojEscena?: number }).__relojEscena ?? performance.now();
      const dt = Math.min(100, ahora - ultimo);
      ultimo = ahora;
      if (motor.perdido()) return apagar();
      if (sucio) medir();
      const quieto = rm.matches;
      // En reposo (4s sin scroll ni puntero) se dibuja a la mitad de cuadros;
      // con movimiento reducido, si no pasó nada en 1s, ni se redibuja.
      const ocioso = ahora - actividad > 4000;
      par = !par;
      if (!primero && ocioso && par) return;
      if (!primero && quieto && ahora - actividad > 1000) return;
      const t = quieto ? 0 : (ahora - t0) / 1000;
      const angosto = vw < 768;

      // 1. Placas: las 3 más visibles
      const placasGPU: PlacaGPU[] = [];
      for (const p of placas.values()) {
        if (placasGPU.length >= MAX_PLACAS) break;
        const r = p.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh || r.width < 1) continue;
        placasGPU.push({ rect: [r.left, r.top, r.width, r.height], tex: p.tex });
      }

      // 2. Feli: las 2 fotos más grandes en pantalla
      const visibles = felis
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.bottom > 0 && r.top < vh && r.width > 0)
        .sort((a, b) => b.r.height - a.r.height)
        .slice(0, 2);
      const feli: Cuadro["feli"] = [];
      for (const { el, r } of visibles) {
        const src = el.dataset.poseSrc;
        if (!src) continue;
        if (motor.foto(src) && el.dataset.pintado === undefined) el.dataset.pintado = "";
        feli.push({ rect: [r.left, r.top, r.width, r.height], src });
      }

      // 2b. Los cianotipos: los 2 que más se ven
      const cianotipos: Cuadro["cianotipos"] = [];
      const enPantalla = cianos
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .map((x) => ({ ...x, v: Math.min(x.r.bottom, vh) - Math.max(x.r.top, 0) }))
        .filter((x) => x.v > 0 && x.r.width > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, 2);
      for (const { el, r } of enPantalla) {
        const src = el.dataset.src;
        if (!src) continue;
        if (motor.foto(src) && el.dataset.pintado === undefined) el.dataset.pintado = "";
        cianotipos.push({ rect: [r.left, r.top, r.width, r.height], src, funde: el.dataset.funde !== undefined });
      }

      // 3. Las burbujas. Cada una vive en su caja (un título, un cianotipo) y
      // se mueve con ella: flota apenas, a su ritmo, y mira un poco al mouse.
      const unidad = Math.min(vw, vh, 960);
      const rects = new Map<HTMLElement, DOMRect>();
      for (const b of burbujas) {
        const dd = angosto ? b.dm : b.d;
        let r = rects.get(b.el);
        if (!r) {
          r = b.el.getBoundingClientRect();
          rects.set(b.el, r);
        }
        b.viva = dd !== null && r.width > 0;
        if (!dd || !b.viva) continue;
        const [fx, fy, fr, mira = 0.04] = dd;
        const cr = fr * unidad * (angosto ? 1.25 : 1);
        let cx = r.left + r.width * fx;
        let cy = r.top + r.height * fy;
        if (!quieto) {
          cx += Math.sin(t * 0.37 + b.fase) * cr * 0.05;
          cy += Math.cos(t * 0.29 + b.fase * 1.3) * cr * 0.07;
          if (px >= 0 && fino.matches) {
            cx += (px - cx) * mira;
            cy += (py - cy) * mira * 0.7;
          }
        }
        // juntándose, vuelan en la pantalla: que la casa se mueva (el scroll) no las arrastra
        if (juntadas.has(b) && b.lista) {
          b.ox.v -= cx - b.cx;
          b.oy.v -= cy - b.cy;
        }
        b.cx = cx;
        b.cy = cy;
        b.cr = cr;
      }

      // Con el mouse (o el foco) sobre algo que se toca (data-gota-aqui: la nav,
      // los botones, las filas), las burbujas que se ven salen disparadas hacia
      // ahí, de la más cerca a la más lejos; al llegar se funden y se vuelven
      // una sola burbuja con su forma, encima. Un poco más grande que el botón,
      // para que su canto se vea alrededor; el ícono de sonido, un círculo.
      let boton = quieto ? null : document.querySelector<HTMLElement>("[data-gota-aqui]");
      // si el scroll lo sacó de abajo del puntero, ya no es el objetivo
      if (boton && !boton.matches(":hover, :focus-visible")) boton = null;
      const rb = boton?.getBoundingClientRect();
      if (rb && rb.width <= 0) boton = null;
      let tx = 0, ty = 0, thw = 0, thh = 0;
      if (boton && rb) {
        const pad = boton.matches(".nav-link") ? 0 : boton.matches(".boton-solido") ? 5 : 3;
        tx = rb.left + rb.width / 2;
        ty = rb.top + rb.height / 2;
        thh = Math.max(rb.height / 2 + pad, 18);
        thw = rb.width / 2 + pad + (rb.height < 30 ? 12 : 0);
        if (boton.matches(".sonido-icono")) thw = thh = Math.max(thw, thh);
      }
      if (boton !== gotaEn) {
        const antes = juntadas;
        juntadas = new Map();
        if (boton) {
          const lejos = (b: Burbuja) => Math.hypot(b.cx + b.ox.v - tx, b.cy + b.oy.v - ty);
          const vivas = burbujas.filter((b) => b.viva && b.lista);
          let van = vivas.filter((b) => b.cy + b.cr > 0 && b.cy - b.cr < vh && b.cx + b.cr > 0 && b.cx - b.cr < vw);
          // si en la pantalla no hay ninguna, vienen las dos más cercanas
          if (!van.length) van = vivas.sort((a, b) => lejos(a) - lejos(b)).slice(0, 2);
          van.sort((a, b) => lejos(a) - lejos(b));
          // las que ya estaban juntas en otro botón se pasan enseguida
          let orden = 0;
          for (const b of van) juntadas.set(b, antes.has(b) && b.m.v > 0.2 ? ahora : ahora + 55 * orden++);
        }
        gotaEn = boton;
      }

      let quien: Burbuja | null = null;
      for (const b of burbujas) {
        if (!b.viva) continue;
        const sale = juntadas.get(b);
        const va = boton !== null && sale !== undefined && ahora >= sale;
        let tox = 0, toy = 0, tr = b.cr, tw = b.cr, th = b.cr, tm = 0;
        if (va) {
          tox = tx - b.cx;
          toy = ty - b.cy;
          tw = thw;
          th = thh;
          // vuela con su tamaño (que se vea el viaje), se achica al llegar y
          // recién ahí se vuelve botón
          const falta = Math.hypot(b.cx + b.ox.v - tx, b.cy + b.oy.v - ty);
          tr = thh + (Math.max(b.cr * 0.85, thh) - thh) * suave(thw + 30, thw + 320, falta);
          tm = 1 - suave(thw * 0.6 + 6, thw + 90, falta);
        }
        if (!b.lista || quieto) {
          b.ox.v = tox;
          b.oy.v = toy;
          b.r.v = tr;
          b.hw.v = tw;
          b.hh.v = th;
          b.m.v = tm;
          for (const s of [b.ox, b.oy, b.r, b.hw, b.hh, b.m]) s.vel = 0;
          b.lista = true;
        } else {
          const h = dt / 1000;
          // la ida, disparada y con un rebote corto; la vuelta, lenta, como un líquido
          const [k, c] = va ? [300, 23] : [60, 12];
          empujar(b.ox, tox, k, c, h);
          empujar(b.oy, toy, k, c, h);
          const [k2, c2] = va ? [340, 26] : [90, 16];
          empujar(b.r, tr, k2, c2, h);
          empujar(b.hw, tw, k2, c2, h);
          empujar(b.hh, th, k2, c2, h);
          // al soltar, deja de ser botón enseguida (no vuelve volando como una píldora)
          const [k3, c3] = va ? [260, 28] : [420, 41];
          empujar(b.m, tm, k3, c3, h);
          b.m.v = Math.min(1, Math.max(0, b.m.v));
          b.r.v = Math.max(1, b.r.v);
          if (Math.abs(b.ox.vel) + Math.abs(b.oy.vel) + Math.abs(b.m.vel) + Math.abs(b.r.vel) > 0.5) actividad = ahora;
        }
        b.x = b.cx + b.ox.v;
        b.y = b.cy + b.oy.v;
        if (!quien || b.m.v > quien.m.v) quien = b;
      }

      // a la GPU: las que se ven (primero las que van al botón, después las grandes)
      const dibujadas = burbujas
        .filter((b) => {
          if (!b.viva || !b.lista) return false;
          const e = Math.max(b.r.v * 1.8, b.hw.v * b.m.v * 1.3 + b.r.v * 1.2);
          return b.x + e > 0 && b.x - e < vw && b.y + e > 0 && b.y - e < vh;
        })
        .sort((a, b) => Number(juntadas.has(b)) - Number(juntadas.has(a)) || b.r.v - a.r.v)
        .slice(0, MAX_BURBUJAS);
      arriba = 0;
      dibujadas.forEach((b, i) => {
        bu.set([b.x, b.y, capasOcultan("gota") ? 0 : b.r.v, b.m.v], i * 4);
        bf.set([b.hw.v, b.hh.v, b.ox.vel, b.oy.vel], i * 4);
        arriba = Math.max(arriba, b.m.v);
      });
      if (arriba > 0.5) html.dataset.gotaModo = "boton";
      else delete html.dataset.gotaModo;
      // sólo en las pruebas (con el reloj manual): dónde están las burbujas
      const w = window as { __relojEscena?: number; __gota?: number[]; __burbujas?: number[][] };
      if (w.__relojEscena !== undefined) {
        const g = quien ?? dibujadas[0];
        w.__gota = g ? [g.x, g.y, g.hw.v, g.hh.v, g.m.v] : [];
        w.__burbujas = dibujadas.map((b) => [b.x, b.y, b.r.v, b.m.v]);
      }

      // 4. Vidrio: hover (mouse o foco de teclado) y presencia, con resorte
      let nv = 0;
      const kh = 1 - Math.exp(-dt / 110);
      let moviendo = false;
      for (const v of vidrios) {
        // con la gota encima, el vidrio propio no reacciona: la burbuja es el hover
        const bajoGota = gotaEn !== null && arriba > 0.05 && (v.el === gotaEn || v.el.contains(gotaEn));
        const encima =
          !bajoGota && v.vivo && ((fino.matches && v.el.matches(":hover")) || v.el.matches(":focus-visible"));
        const objetivo = encima ? 1 : 0;
        v.h += (objetivo - v.h) * (quieto ? 1 : kh);
        if (v.tipo === "hover") v.a += (objetivo - v.a) * (quieto ? 1 : kh);
        if (Math.abs(objetivo - v.h) > 0.01) moviendo = true;
        if (nv >= MAX_VIDRIOS || v.a < 0.01) continue;
        const r = v.el.getBoundingClientRect();
        if (r.width < 2 || r.bottom < -20 || r.top > vh + 20) continue;
        vr.set([r.left, r.top, r.width, r.height], nv * 4);
        vx.set([Math.min(v.radio, Math.min(r.width, r.height) / 2), v.h, v.a, v.tipo === "claro" ? 1 : 0], nv * 4);
        nv++;
      }
      if (moviendo) actividad = ahora;
      const edad = (ahora - onda.t0) / 1000;
      if (edad < 1.2) actividad = ahora;

      motor.dibujar({
        vw,
        vh,
        escala,
        tiempo: t,
        calidad: nivel === "alto" ? 1 : 0,
        burbujas: bu,
        burbujasF: bf,
        nBurbujas: dibujadas.length,
        arriba,
        placas: capasOcultan("placas") ? [] : placasGPU,
        feli: capasOcultan("feli") ? [] : feli,
        cianotipos,
        vidrios: vr,
        vidriosX: vx,
        nVidrios: capasOcultan("vidrio") ? 0 : nv,
        puntero: [px, py],
        onda: [onda.x, onda.y, edad, edad < 1.2 ? onda.fuerza : 0],
      });
      if (primero) {
        primero = false;
        html.dataset.escena = "lista";
      }
    }

    const scroll = () => {
      actividad = performance.now();
    };
    window.addEventListener("scroll", scroll, { passive: true });
    gsap.ticker.add(cuadro);

    return () => {
      gsap.ticker.remove(cuadro);
      bajaNivel();
      pararVigilancia();
      mo.disconnect();
      window.removeEventListener("resize", ensuciar);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerdown", tocar);
      window.removeEventListener("vidrio:onda", festejo);
      document.documentElement.removeEventListener("pointerleave", salir);
      canvas.removeEventListener("webglcontextlost", perdido);
      for (const p of placas.values()) delete p.el.dataset.placaLista;
      motor.liberar();
      delete html.dataset.escena;
    };
  }, []);

  return (
    <>
      <div className="escena-poster" aria-hidden />
      <canvas ref={canvasRef} className="escena" aria-hidden />
    </>
  );
}
