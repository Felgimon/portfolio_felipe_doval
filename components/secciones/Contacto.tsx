"use client";
import { useEffect, useRef, useState } from "react";
import { CON_MOVIMIENTO, engordar, gsap, useGSAP } from "@/lib/gsap";
import { armarMail } from "@/lib/mail";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha, Peso } from "@/components/ui/Peso";

/**
 * Contacto: tres filas enormes. La del mail lo copia: la dirección no está en
 * el HTML ni en el contenido, se arma recién en el clic (lib/mail.ts) y se
 * muestra en la misma fila. Si el portapapeles falla, queda a la vista para
 * copiarla a mano.
 */
export function Contacto() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  const reloj = useRef(0);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => engordar(raiz.current!));
    },
    { scope: raiz },
  );

  const copiar = async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(armarMail());
    } catch {
      ok = false;
    }
    setEstado(ok ? "ok" : "error");
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setEstado(""), ok ? 3000 : 9000);
  };

  const nota = estado === "ok" ? t.contacto.copiado : estado === "error" ? t.contacto.copialoAMano : t.contacto.copiar;

  return (
    <section ref={raiz} id="contacto" data-tema="tinta" className="contacto">
      <h2 className="gigante titulo text-amarillo">
        <Peso>{t.secciones.contacto}</Peso>
      </h2>
      <div className="filas">
        <button type="button" className={estado ? "fila fila-mail" : "fila"} data-estado={estado || undefined} onClick={copiar}>
          <span>{estado ? armarMail() : t.contacto.mail}</span>
          <span className="fila-nota" role="status">
            {nota}
          </span>
        </button>
        <a className="fila" href={perfil.links.github} target="_blank" rel="noreferrer">
          GitHub <Flecha />
        </a>
        <a className="fila" href={perfil.links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn <Flecha />
        </a>
      </div>
    </section>
  );
}
