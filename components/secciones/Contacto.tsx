"use client";
import { useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { CON_MOVIMIENTO, entradas, gsap, useGSAP } from "@/lib/gsap";
import { abrirMail, armarMail } from "@/lib/mail";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha, Titulo } from "@/components/ui/Titulo";

const sinSuscripcion = () => () => {};

/**
 * Contacto: tres vías del mismo tamaño. El mail no viaja en el HTML: se arma
 * en el navegador (lib/mail.ts), se muestra recién ahí y al tocarlo abre el
 * correo.
 */
export function Contacto() {
  const { t, perfil } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  // en el servidor no hay dirección; en el navegador, sí
  const mail = useSyncExternalStore(sinSuscripcion, armarMail, () => "");

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => entradas(raiz.current!));
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} id="contacto" data-tema="noche" className="seccion">
      <div className="cont contacto-grilla">
        <div>
          <Titulo texto={t.titulos.contacto} />
          <div className="vias">
            <button type="button" className="via" onClick={() => abrirMail("", "")}>
              <span className="t-sub">{mail || t.contacto.mail}</span>
              <span className="etiqueta">{t.contacto.abrir}</span>
            </button>
            <a className="via" href={perfil.links.github} target="_blank" rel="noreferrer">
              <span className="t-sub">GitHub</span>
              <Flecha />
            </a>
            <a className="via" href={perfil.links.linkedin} target="_blank" rel="noreferrer">
              <span className="t-sub">LinkedIn</span>
              <Flecha />
            </a>
          </div>
        </div>
        <div className="contacto-foto corte">
          <div data-abre>
            <Image src="/assets/fotos/cruzado.webp" alt="" width={562} height={1404} sizes="(max-width: 899px) 280px, 26vw" className="mx-auto w-[46%]" />
          </div>
        </div>
      </div>
    </section>
  );
}
