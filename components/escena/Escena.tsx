"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MAX_PLACAS, Motor, type Cuadro, type PlacaGPU } from "@/lib/escena/motor";
import { MAX_VIDRIOS } from "@/lib/escena/shader";
import { isSoftwareRenderer } from "@/lib/gpu";
import { alCambiarRendimiento, nivelRendimiento, vigilarRendimiento } from "@/lib/rendimiento";

/**
 * LA ESCENA: el estudio cobalto, los títulos impresos en el fondo, Feli y la
 * gota de vidrio que los refracta.
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
 *   data-gota="fx fy r" en una sección: dónde se apoya la gota cuando esa
 *                       sección está activa, en fracciones de SU título
 *                       (data-placa) y r en fracción de la pantalla
 *   data-gota-m         lo mismo para pantallas angostas (< 768px)
 *   data-gota-aqui      un link de la nav con el mouse o el foco encima: la
 *                       gota vuela hasta ahí y se vuelve una píldora de su
 *                       tamaño (html[data-gota-modo="boton"] mientras dura)
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
type Seccion = { el: HTMLElement; d: number[]; dm: number[]; placa: HTMLElement | null };

const leer = (s: string | undefined) => (s ?? "").trim().split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));

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
    let secciones: Seccion[] = [];
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
      secciones = [...document.querySelectorAll<HTMLElement>("[data-gota]")].map((el) => ({
        el,
        d: leer(el.dataset.gota),
        dm: leer(el.dataset.gotaM ?? el.dataset.gota),
        placa: el.querySelector<HTMLElement>("[data-placa]"),
      }));
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
      attributeFilter: ["data-gota", "data-gota-m", "data-vidrio", "data-feli", "data-pose-src", "data-placa", "data-cianotipo", "class"],
    });

    // --- puntero: en el inicio, la gota lo sigue de lejos ---
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
    // la gota: posición, radio, y su forma de botón (medio ancho, medio alto, cuánto)
    // cada valor es un resorte (con un poco de rebote, como un líquido)
    const resorte = (v: number) => ({ v, vel: 0 });
    const gp = {
      x: resorte(0), y: resorte(0), r: resorte(0), hw: resorte(0), hh: resorte(0), m: resorte(0),
      lista: false,
    };
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
        cianotipos.push({ rect: [r.left, r.top, r.width, r.height], src });
      }

      // 3. La gota: va a la sección activa y se apoya en una letra de su título.
      // Con el mouse (o el foco) sobre un link de la nav, vuela hasta ahí y se
      // vuelve una píldora de vidrio del tamaño del link.
      let activa: Seccion | undefined = secciones[0];
      for (const s of secciones) if (s.el.getBoundingClientRect().top < vh * 0.5) activa = s;
      const boton = quieto ? null : document.querySelector<HTMLElement>("[data-gota-aqui]");
      const rb = boton?.getBoundingClientRect();
      if (activa?.placa || (rb && rb.width > 0)) {
        let tx: number, ty: number, tr: number, thw: number, thh: number, tm: number;
        if (rb && rb.width > 0) {
          tx = rb.left + rb.width / 2;
          ty = rb.top + rb.height / 2;
          thw = rb.width / 2;
          thh = rb.height / 2;
          tr = thh;
          tm = 1;
        } else {
          const [fx = 0.5, fy = 0.5, fr = 0.09] = angosto ? activa!.dm : activa!.d;
          const pa = activa!.placa!.getBoundingClientRect();
          tx = pa.left + pa.width * fx;
          ty = pa.top + pa.height * fy;
          tr = fr * Math.min(vw, vh, 960) * (angosto ? 1.25 : 1);
          thw = thh = tr;
          tm = 0;
          if (activa === secciones[0] && px >= 0 && fino.matches && !quieto) {
            tx += (px - tx) * 0.18;
            ty += (py - ty) * 0.12;
          }
        }
        const objetivos = [tx, ty, tr, thw, thh, tm];
        const res = [gp.x, gp.y, gp.r, gp.hw, gp.hh, gp.m];
        if (!gp.lista || quieto) {
          res.forEach((s, i) => {
            s.v = objetivos[i];
            s.vel = 0;
          });
          gp.lista = true;
        } else {
          // hacia un botón: rápido y con un rebote corto; de vuelta a un título: lento
          const [k, c] = tm > 0.5 || gp.m.v > 0.05 ? [340, 26] : [70, 17];
          res.forEach((s, i) => empujar(s, objetivos[i], k, c, dt / 1000));
          gp.m.v = Math.min(1, Math.max(0, gp.m.v));
          if (Math.abs(gp.x.vel) + Math.abs(gp.y.vel) + Math.abs(gp.m.vel) > 0.5) actividad = ahora;
        }
        if (gp.m.v > 0.5) html.dataset.gotaModo = "boton";
        else delete html.dataset.gotaModo;
      }

      // 4. Vidrio: hover (mouse o foco de teclado) y presencia, con resorte
      let nv = 0;
      const kh = 1 - Math.exp(-dt / 110);
      let moviendo = false;
      for (const v of vidrios) {
        const encima = v.vivo && ((fino.matches && v.el.matches(":hover")) || v.el.matches(":focus-visible"));
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
        gota: [gp.x.v, gp.y.v, gp.lista ? Math.max(gp.r.v, 1) : 0],
        forma: [gp.hw.v, gp.hh.v, gp.m.v],
        placas: placasGPU,
        feli,
        cianotipos,
        vidrios: vr,
        vidriosX: vx,
        nVidrios: nv,
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
