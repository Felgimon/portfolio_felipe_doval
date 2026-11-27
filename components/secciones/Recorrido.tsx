"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { CON_MOVIMIENTO, entradas, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Titulo } from "@/components/ui/Titulo";

/**
 * Recorrido: dónde estudia y dónde trabaja. Cada fila se abre con un clic y
 * muestra el detalle y lo que hizo ahí, con enlace a cada caso.
 */
export function Recorrido() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => entradas(raiz.current!));
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="recorrido" data-tema="blanco" className="seccion">
      <div className="cont">
        <div className="cabeza">
          <Titulo texto={t.titulos.recorrido} />
        </div>
        {perfil.recorrido.map((r, i) => {
          const abre = abierta === r.lugar;
          return (
            <div key={r.lugar} className="rec">
              <button
                type="button"
                className="rec-boton"
                aria-expanded={abre}
                aria-controls={`rec-${i}`}
                onClick={() => setAbierta(abre ? null : r.lugar)}
              >
                <span className="t-sub">{r.lugar}</span>
                <span className="etiqueta">
                  {r.titulo}. {r.estado}
                </span>
                <span className="rec-mas" aria-hidden />
              </button>
              {/* al terminar de abrirse cambia el alto de la página: se recalculan las animaciones */}
              <div id={`rec-${i}`} className="rec-cuerpo" inert={!abre} onTransitionEnd={() => ScrollTrigger.refresh()}>
                <div>
                  <div className="rec-detalle">
                    <p>{r.detalle}</p>
                    <div>
                      <p className="etiqueta mb-4">{t.recorrido.hecho}</p>
                      <ul className="rec-lista">
                        {r.hecho.map((h) => {
                          const destino = h.caso ? `/proyectos/${h.caso}` : h.ancla ? `/#${h.ancla}` : null;
                          return (
                            <li key={h.texto}>
                              {destino ? (
                                <Link href={destino} className="enlace">
                                  {h.texto}
                                </Link>
                              ) : (
                                h.texto
                              )}
                              {h.nota && <span>{h.nota}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
