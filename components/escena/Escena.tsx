"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { Motor, type Cuadro } from "@/lib/escena/motor";
import { MAX_GOTAS, MAX_VIDRIOS } from "@/lib/escena/shader";
import { leerGotas, type DefGota } from "@/lib/escena/gotas";
import { isSoftwareRenderer } from "@/lib/gpu";
import {
  alCambiarRendimiento,
  nivelRendimiento,
  vigilarRendimiento,
} from "@/lib/rendimiento";

/**
 * LA ESCENA: el líquido de fondo, Feli adentro y el vidrio que lo dobla.
 *
 * Un solo <canvas> fijo detrás de todo el contenido, en todas las páginas. El
 * DOM declara qué hay que pintar con atributos, y la escena lo lee en cada
 * cuadro con getBoundingClientRect (son pocos elementos, y el scroll no ensucia
 * el layout, así que la lectura sale casi gratis y queda EXACTA aunque haya
 * transforms o fuentes que cargan tarde):
 *
 *   data-vidrio            un panel de vidrio (el shader pinta su refracción)
 *   data-gotas="fx fy r t [capa]; ..."   gotas ancladas a la caja del elemento
 *   data-gotas-m="..."     las mismas, para pantallas angostas (< 760px)
 *   data-feli              una foto del guía (data-pose-src = la foto)
 *   data-nav-activo        el link activo de la nav (una cápsula de líquido)
 *
 * Estado en <html data-escena>: "poster" (sin WebGL o equipo que no llega:
 * el CSS muestra el póster, las fotos como <img> y el vidrio sólido),
 * "cargando" y "lista" (el canvas ya dibujó).
 *
 * Orden de cuadro: corre en el ticker de GSAP DESPUÉS de Lenis (que se agrega
 * con prioridad en SmoothScroll), así los rects que lee ya tienen el scroll de
 * este cuadro y el vidrio del shader no se despega del borde del DOM.
 */

type EstadoGota = { ox: number; oy: number; vx: number; vy: number };
type Vidrio = { el: HTMLElement; radio: number; barrido: number; presion: number };

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function interactivo(el: EventTarget | null): boolean {
  return (
    el instanceof Element &&
    !!el.closest("a,button,input,textarea,select,label,[data-vidrio],[data-feli],[role=button]")
  );
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
    let anclas: { el: HTMLElement; d: DefGota[]; dm: DefGota[] }[] = [];
    const medir = () => {
      const r = canvas.getBoundingClientRect();
      vw = r.width;
      vh = r.height;
      const dpr = window.devicePixelRatio || 1;
      escala = nivel === "alto" ? Math.min(dpr, 1.5) : 0.6;
      motor.tamaño(Math.max(1, Math.round(vw * escala)), Math.max(1, Math.round(vh * escala)));
      const previos = new Map(vidrios.map((v) => [v.el, v]));
      vidrios = [...document.querySelectorAll<HTMLElement>("[data-vidrio]")].map(
        (el) =>
          previos.get(el) ?? {
            el,
            radio: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
            barrido: 0,
            presion: 0,
          },
      );
      for (const v of vidrios) {
        v.radio = parseFloat(getComputedStyle(v.el).borderTopLeftRadius) || 0;
      }
      felis = [...document.querySelectorAll<HTMLElement>("[data-feli]")];
      anclas = [...document.querySelectorAll<HTMLElement>("[data-gotas]")].map((el) => ({
        el,
        d: leerGotas(el.dataset.gotas),
        dm: leerGotas(el.dataset.gotasM ?? el.dataset.gotas),
      }));
      sucio = false;
    };
    const ensuciar = () => {
      sucio = true;
      actividad = performance.now();
    };
    window.addEventListener("resize", ensuciar);
    document.fonts?.ready.then(ensuciar);
    const mo = new MutationObserver(ensuciar);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-gotas", "data-gotas-m", "data-vidrio", "data-feli", "class"],
    });

    // --- puntero: empuja el líquido, y en desktop se puede agarrar una gota ---
    let px = -9999, py = -9999;
    let actividad = performance.now();
    let agarrada: string | null = null;
    let sobreGota: string | null = null;
    let presionado: HTMLElement | null = null;
    const posGotas = new Map<string, { x: number; y: number; r: number }>();

    const mover = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      actividad = performance.now();
      if (agarrada || !fino.matches || nivel !== "alto") return;
      let encima: string | null = null;
      if (!interactivo(e.target)) {
        for (const [k, g] of posGotas) {
          if (Math.hypot(px - g.x, py - g.y) < g.r * 0.9) {
            encima = k;
            break;
          }
        }
      }
      if (encima !== sobreGota) {
        sobreGota = encima;
        if (encima) html.dataset.sobreGota = "";
        else delete html.dataset.sobreGota;
      }
    };
    const bajar = (e: PointerEvent) => {
      const v = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-vidrio]") : null;
      if (v) presionado = v;
      if (sobreGota && e.pointerType === "mouse" && !interactivo(e.target)) {
        agarrada = sobreGota;
        html.dataset.arrastrando = "";
        e.preventDefault();
      }
    };
    const soltar = () => {
      presionado = null;
      if (agarrada) {
        agarrada = null;
        delete html.dataset.arrastrando;
      }
    };
    const entrar = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-vidrio]") : null;
      const v = el && vidrios.find((x) => x.el === el);
      if (v && v.barrido <= 0 && !rm.matches) v.barrido = 0.001;
    };
    const salir = () => {
      px = py = -9999;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("pointerdown", bajar);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    document.addEventListener("pointerover", entrar);
    document.documentElement.addEventListener("pointerleave", salir);

    const perdido = (e: Event) => {
      e.preventDefault();
      apagar();
    };
    canvas.addEventListener("webglcontextlost", perdido);

    // --- el cuadro ---
    const estados = new Map<string, EstadoGota>();
    const hundEgg = new WeakMap<HTMLElement, number>();
    const gotas = new Float32Array(MAX_GOTAS * 4);
    const capas = new Float32Array(MAX_GOTAS);
    const vr = new Float32Array(MAX_VIDRIOS * 4);
    const vx = new Float32Array(MAX_VIDRIOS * 4);
    const fe = new Float32Array(8);
    const hu = new Float32Array(2);
    let navX: number | null = null, navW = 0;
    const t0 = performance.now();
    let ultimo = t0;
    let primero = true;
    let par = false;

    function cuadro() {
      if (apagada || document.hidden) return;
      const ahora = performance.now();
      const dt = Math.min(100, ahora - ultimo);
      ultimo = ahora;
      if (motor.perdido()) return apagar();
      if (sucio) medir();
      const quieto = rm.matches;
      // En reposo (4s sin scroll ni puntero) se dibuja a la mitad de cuadros.
      const ocioso = ahora - actividad > 4000;
      par = !par;
      if (!primero && ocioso && par) return;
      const t = quieto ? 0 : (ahora - t0) / 1000;
      const u = Math.max(Math.min(vw, vh * 1.4) / 1000, 0.6);
      const angosto = vw < 760;
      const sa = 1 - Math.exp(-dt / 260);
      let n = 0;
      posGotas.clear();

      const agregar = (x: number, y: number, r: number, tono: number, capa: number) => {
        if (n >= MAX_GOTAS) return;
        gotas[n * 4] = x;
        gotas[n * 4 + 1] = y;
        gotas[n * 4 + 2] = r;
        gotas[n * 4 + 3] = tono;
        capas[n] = capa;
        n++;
      };

      // 1. Feli (hasta 2: los más visibles) y sus piletas
      const visibles = felis
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.bottom > -100 && r.top < vh + 100 && r.width > 0)
        .sort((a, b) => b.r.height - a.r.height)
        .slice(0, 2);
      fe.fill(0);
      hu.fill(0);
      const texturas: [string | null, string | null] = [null, null];
      visibles.forEach(({ el, r }, i) => {
        const src = el.dataset.poseSrc ?? null;
        const lista = src ? motor.textura(src) : false;
        texturas[i] = src;
        // sube del líquido a medida que entra en pantalla
        let hundido = 1 - ease(clamp((vh * 0.95 - r.top) / (r.height * 0.5), 0, 1));
        if (el.dataset.intro !== undefined && !quieto) {
          hundido = Math.max(hundido, 1 - ease(clamp((ahora - t0 - 250) / 1100, 0, 1)));
        }
        const egg = hundEgg.get(el) ?? 0;
        const objetivo = el.dataset.hundir !== undefined ? 1 : 0;
        const e2 = egg + (objetivo - egg) * (1 - Math.exp(-dt / (objetivo ? 160 : 260)));
        hundEgg.set(el, e2);
        hundido = Math.max(hundido, e2);
        if (lista) {
          fe.set([r.left, r.top, r.width, r.height], i * 4);
          hu[i] = hundido * r.height * 0.82;
          if (el.dataset.pintado === undefined) el.dataset.pintado = "";
        }
        // la pileta: tapa el corte recto de la foto
        const pr = (angosto ? 46 : 64) * Math.max(u, 0.9);
        const xs = [0.06, 0.38, 0.72, 1.0];
        xs.forEach((fx, k) => {
          const ola = quieto ? 0 : Math.sin(t * 0.6 + k * 2 + i) * 7 * u;
          agregar(
            r.left + r.width * fx,
            r.bottom - (k % 2 ? 14 : 2) * u + ola,
            pr * (k % 2 ? 1.18 : 0.98) * (r.width < 260 ? 0.8 : 1),
            (k + i) % 2,
            1,
          );
        });
      });

      // 2. Gotas ancladas al contenido
      anclas.forEach(({ el, d, dm }, ai) => {
        const defs = angosto ? dm : d;
        if (!defs.length) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < -400 || r.top > vh + 400 || r.width === 0) return;
        defs.forEach((g, gi) => {
          const clave = `${ai}:${gi}`;
          const rad = g.r * u;
          let x = r.left + g.fx * r.width;
          let y = r.top + g.fy * r.height;
          if (y + rad < -40 || y - rad > vh + 40) return;
          const ph = ai * 1.7 + gi * 2.3;
          if (!quieto) {
            x += Math.sin(t * 0.21 + ph) * 12 * u;
            y += Math.cos(t * 0.17 + ph * 1.3) * 16 * u;
          }
          const radio = rad * (quieto ? 1 : 1 + 0.035 * Math.sin(t * 0.5 + ph));
          let est = estados.get(clave);
          if (!est) {
            est = { ox: 0, oy: 0, vx: 0, vy: 0 };
            estados.set(clave, est);
          }
          // objetivo del desplazamiento: arrastre o empuje del puntero
          let tx = 0, ty = 0;
          if (agarrada === clave) {
            tx = px - x;
            ty = py - y;
          } else {
            const dx = x + est.ox - px, dy = y + est.oy - py;
            const dd = Math.hypot(dx, dy), alcance = radio + 120;
            if (dd < alcance && dd > 1) {
              const f = (1 - dd / alcance) * 90;
              tx = (dx / dd) * f;
              ty = (dy / dd) * f;
            }
          }
          const k = agarrada === clave ? 1 - Math.exp(-dt / 70) : sa;
          est.ox += (tx - est.ox) * k;
          est.oy += (ty - est.oy) * k;
          const gx = x + est.ox, gy = y + est.oy;
          if (agarrada === clave) {
            // lo que queda en el lugar: con el cuello que arma el smin se ve
            // cómo se estira y, si la llevás lejos, cómo se parte
            agregar(x, y, radio * 0.55, g.tono, g.capa);
            agregar(gx, gy, radio * 0.82, g.tono, g.capa);
          } else {
            agregar(gx, gy, radio, g.tono, g.capa);
          }
          posGotas.set(clave, { x: gx, y: gy, r: radio });
        });
      });

      // 3. Vidrio
      let nv = 0;
      for (const v of vidrios) {
        if (nv >= MAX_VIDRIOS) break;
        const r = v.el.getBoundingClientRect();
        if (r.width < 2 || r.bottom < -40 || r.top > vh + 40) continue;
        if (v.el.dataset.vidrio === "apagado") continue;
        v.presion += ((presionado === v.el ? 1 : 0) - v.presion) * 0.25;
        if (v.barrido > 0) {
          v.barrido += dt / 650;
          if (v.barrido > 1) v.barrido = 0;
        }
        const s = 1 - 0.035 * v.presion;
        const w = r.width * s, h = r.height * s;
        vr.set([r.left + (r.width - w) / 2, r.top + (r.height - h) / 2, w, h], nv * 4);
        vx.set([Math.min(v.radio, Math.min(w, h) / 2), v.presion, v.barrido, 0], nv * 4);
        nv++;
      }

      // 4. La cápsula de líquido bajo el link activo de la nav
      let nav: [number, number, number, number] = [0, 0, 0, 0];
      const activo = document.querySelector<HTMLElement>("[data-nav-activo]");
      if (activo) {
        const r = activo.getBoundingClientRect();
        if (r.width > 0) {
          const cx = r.left + r.width / 2;
          if (navX === null) navX = cx;
          const na = quieto ? 1 : 1 - Math.exp(-dt / 140);
          navX += (cx - navX) * na;
          if (!navW) navW = r.width;
          navW += (r.width - navW) * na;
          nav = [navX, r.top + r.height / 2, Math.max(0, navW / 2 - 12), Math.min(17, r.height * 0.5)];
        }
      }

      const c: Cuadro = {
        vw,
        vh,
        escala,
        tiempo: t,
        u,
        calidad: nivel === "alto" ? 1 : 0,
        gotas,
        capas,
        nGotas: n,
        nav,
        vidrios: vr,
        vidriosX: vx,
        nVidrios: nv,
        feli: fe,
        hundido: hu,
        texturas,
      };
      motor.dibujar(c);
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
      window.removeEventListener("pointerdown", bajar);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      document.removeEventListener("pointerover", entrar);
      document.documentElement.removeEventListener("pointerleave", salir);
      canvas.removeEventListener("webglcontextlost", perdido);
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
