"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CON_MOVIMIENTO, engordar, gsap, useGSAP } from "@/lib/gsap";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Flecha, Peso } from "@/components/ui/Peso";

/**
 * El caso de un proyecto destacado: el nombre a lo ancho, los datos en filas
 * (título a la izquierda, texto a la derecha), las capturas enteras y el
 * siguiente caso.
 */
export function ProyectoDetalle({ slug }: { slug: string }) {
  const { t, proyectos, getProyecto } = useIdioma();
  const raiz = useRef<HTMLElement>(null);
  const p = getProyecto(slug);

  useGSAP(
    () => {
      gsap.matchMedia().add(CON_MOVIMIENTO, () => {
        gsap.from(".caso-cabeza .gigante", { yPercent: 30, duration: 0.9, ease: "power3.out" });
        engordar(raiz.current!);
        gsap.utils.toArray<HTMLElement>(".caso-capturas img").forEach((img) => {
          gsap.fromTo(
            img,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", ease: "none", scrollTrigger: { trigger: img, start: "top 95%", end: "top 35%", scrub: true } },
          );
        });
      });
    },
    { scope: raiz },
  );

  if (!p) return null;
  const siguiente = proyectos.find((x) => x.categoria === "destacado" && x.slug !== p.slug);
  const filas: [string, React.ReactNode][] = [
    [t.proyectos.rol, p.rol],
    [t.proyectos.equipo, p.equipo?.map((m) => `${m.nombre}, ${m.rol}`).join(". ")],
    [t.proyectos.stack, p.stack.join(", ")],
    [t.caso.problema, p.problema],
    [t.caso.solucion, p.solucion],
    [t.caso.queHace, p.queHace],
    [t.caso.detalles, p.destacados?.map((d) => <p key={d}>{d}</p>)],
  ];

  return (
    <main ref={raiz} id="contenido">
      <header data-tema="amarillo" className="caso-cabeza">
        <h1 className="gigante">{p.nombre}</h1>
        <p className="caso-linea">{p.unaLinea}</p>
        {p.enlaces.map((e) => (
          <a key={e.url} href={e.url} target="_blank" rel="noreferrer" className="enlace mt-8">
            GitHub <Flecha />
          </a>
        ))}
      </header>

      <div data-tema="tinta" className="caso-capturas">
        {p.capturas.map((c, i) => (
          <Image key={c.src} src={c.src} alt={c.alt} width={1600} height={1000} sizes="100vw" priority={i === 0} />
        ))}
      </div>

      <div data-tema="amarillo" className="caso-cuerpo pt-[8svh]">
        {filas.map(
          ([titulo, texto]) =>
            texto && (
              <section key={titulo} className="caso-fila">
                <h2>{titulo}</h2>
                <div className="grid gap-3">{texto}</div>
              </section>
            ),
        )}
      </div>

      {siguiente && (
        <Link href={`/proyectos/${siguiente.slug}`} data-tema="tinta" className="caso-siguiente">
          <span className="dato">{t.caso.siguiente}</span>
          <span className="gigante mt-3 block">
            <Peso>{siguiente.nombre}</Peso>
          </span>
        </Link>
      )}
    </main>
  );
}
