"use client";
import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { useAppReady } from "@/components/motion/AppReady";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { perfil } from "@/content/perfil";
import { cn } from "@/lib/utils";

/**
 * EL NOMBRE de la portada. Tres capas, ninguna decorativa porque sí:
 *
 * 1. MATERIALIZACIÓN por eje variable. Bricolage Grotesque es una fuente
 *    VARIABLE (eje wght 200..800, ya self-hosted). Cada letra entra finita
 *    (200) y ENGORDA hasta 800 mientras la línea sube, en cascada: la letra no
 *    aparece, se FORMA. Es la tipografía haciendo lo suyo, no un efecto pegado
 *    encima; se hace con la fuente que ya cargamos, sin sumar librerías.
 * 2. LUZ DEL SOL. El sol vive a la DERECHA del nombre, así que las letras están
 *    degradadas como si él las iluminara: tinta fría a la izquierda, celeste y
 *    un beso de oro sobre el filo derecho, y la sombra cae al lado opuesto.
 *    El degradé no es un adorno: es de dónde viene la luz de la escena.
 * 3. PARALAJE. El bloque se inclina apenas siguiendo el puntero (solo custom
 *    properties → transform en el compositor, cero reflow).
 *
 * Accesibilidad y SEO, sin pagar el precio de ninguno de los dos:
 *  - El texto del <h1> son las LETRAS reales, con un espacio entre las dos
 *    palabras → en el DOM se lee exactamente "Felipe Doval" (Google lee el
 *    texto crudo: un <span class="sr-only"> con el nombre ADEMÁS de las letras
 *    haría que el h1 dijera "Felipe DovalFelipeDoval").
 *  - `aria-label` en el <h1> le da a los lectores el nombre de una pieza, así
 *    ninguno deletrea las letras sueltas.
 * Con reduced-motion queda quieto en su estado final.
 */

/** Las dos líneas del nombre, con el índice GLOBAL de cada letra: el stagger
 * cruza de una línea a la otra, como si el nombre se escribiera de un tirón. */
const LINEAS = (() => {
  let n = 0;
  return perfil.nombre.split(" ").map((palabra) => ({
    palabra,
    letras: [...palabra].map((ch) => ({ ch, i: n++ })),
  }));
})();

/** Inclina el bloque hacia el puntero (mutación imperativa fuera del
 * componente; escribe custom properties que solo alimentan un transform). */
function tiltHacia(el: HTMLElement, px: number, py: number) {
  const r = el.getBoundingClientRect();
  const dx = (px - (r.left + r.width / 2)) / Math.max(1, window.innerWidth);
  const dy = (py - (r.top + r.height / 2)) / Math.max(1, window.innerHeight);
  el.style.setProperty("--rx", `${(-dy * 4).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${(dx * 6).toFixed(2)}deg`);
}

export function HeroName() {
  const reduced = useReducedMotion();
  const { ready } = useAppReady();
  const root = useRef<HTMLHeadingElement>(null);

  // Paralaje: solo con puntero fino (mouse) y sin reduced-motion.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => tiltHacia(el, e.clientX, e.clientY));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <h1
      ref={root}
      aria-label={perfil.nombre}
      className={cn("nombre", ready && "is-in")}
    >
      {LINEAS.map(({ palabra, letras }, l) => (
        <Fragment key={palabra}>
          {/* Espacio REAL entre las palabras: no se ve (las líneas son bloques)
              pero deja el texto del h1 como "Felipe Doval" para los buscadores. */}
          {l > 0 ? " " : null}
          <span className="nombre__linea" style={{ "--l": l } as CSSProperties}>
            {letras.map(({ ch, i }) => (
              <span
                key={i}
                className="nombre__letra"
                style={{ "--i": i } as CSSProperties}
              >
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </h1>
  );
}
