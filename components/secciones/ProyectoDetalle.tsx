"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CON_MOVIMIENTO, entradas, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha } from "@/components/ui/Titulo";

/**
 * El caso de un proyecto: nombre, qué es y enlaces; las capturas enteras; los
 * datos en filas (título a la izquierda, texto a la derecha) y el siguiente.
 */
export function ProyectoDetalle({ slug }: { slug: string }) {
  const { t, proyectos, getProyecto } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const p = getProyecto(slug);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => entradas(raiz.current!));
    },
    { scope: raiz },
  );

  if (!p) return null;
  const casos = proyectos.filter((x) => x.caso);
  const siguiente = casos[(casos.indexOf(p) + 1) % casos.length];
  const filas: [string, React.ReactNode][] = [
    [t.proyectos.rol, p.rol],
    [t.proyectos.stack, p.stack.join(", ")],
    [t.caso.problema, p.problema],
    [t.caso.solucion, p.solucion],
    [t.caso.queHace, p.queHace],
    [t.caso.detalles, p.detalles?.map((d) => <p key={d}>{d}</p>)],
  ];

  return (
    <main ref={raiz} id="contenido">
      <div data-tema="blanco">
        <header className="cont caso-cabeza">
          {p.estado && <p className="etiqueta mb-3">{p.estado}</p>}
          <h1 className="t-titulo">{p.nombre}</h1>
          <p className="t-lead">{p.unaLinea}</p>
          <p className="acciones">
            {p.sitio && (
              <a href={p.sitio} target="_blank" rel="noreferrer" className="boton">
                {t.proyectos.verSitio} <Flecha />
              </a>
            )}
            {p.repo && (
              <a href={p.repo} target="_blank" rel="noreferrer" className="boton">
                GitHub <Flecha />
              </a>
            )}
          </p>
        </header>

        <div className="cont caso-capturas">
          {p.capturas.map((c, i) => (
            <div key={c.src} className="corte">
              <Image src={c.src} alt={c.alt} width={c.w} height={c.h} sizes="(max-width: 1400px) 92vw, 1280px" priority={i === 0} />
            </div>
          ))}
        </div>

        <div className="cont pb-[10svh]">
          {filas.map(
            ([titulo, texto]) =>
              texto && (
                <section key={titulo} className="caso-fila">
                  <h2 className="t-sub">{titulo}</h2>
                  <div>{texto}</div>
                </section>
              ),
          )}
        </div>
      </div>

      <Link href={`/proyectos/${siguiente.slug}`} data-tema="noche" className="caso-siguiente">
        <span className="cont block">
          <span className="etiqueta">{t.caso.siguiente}</span>
          <span className="t-titulo block">{siguiente.nombre}</span>
        </span>
      </Link>
    </main>
  );
}
