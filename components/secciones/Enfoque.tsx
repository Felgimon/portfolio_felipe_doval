"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";
import { TituloSeccion } from "./comun";

/**
 * ENFOQUE. Cómo trabaja, en cuatro principios sobre vidrio ahumado. Sin
 * numeración: el orden no es real (regla de Felipe: nada de 01/02 decorativo).
 * Al lado del título y la bajada, sus herramientas de planear: una regla, una
 * escuadra, un compás, un lápiz y una libreta (entender antes de tocar código).
 */
export function Enfoque() {
  const { perfil, t } = useIdioma();

  return (
    <section
      id="enfoque"
      aria-labelledby="enfoque-titulo"
      className="parada max-md:pt-[150px]"
      data-gota="0.84 0.5 0.085"
      data-gota-m="0.88 0.5 0.085"
    >
      <div className="contenedor relative">
        <Cianotipo nombre="enfoque" className="top-[-124px] w-[44%] md:hidden" />
        {/* el juego de dibujo, grande, arriba a la derecha: al lado del título y la bajada, y apenas por detrás de las tarjetas de vidrio */}
        <Cianotipo nombre="enfoque-grande" className="top-[-80px] right-[var(--margen)] w-[31%] max-w-[470px] max-md:hidden" />
        <TituloSeccion id="enfoque-titulo">{t.paradas.enfoque}</TituloSeccion>
        <p className="lead mt-8 max-w-[56ch]">{perfil.enfoque.resumen}</p>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 md:gap-7">
          {perfil.enfoque.principios.map((p) => (
            <li key={p.titulo} data-vidrio className="vidrio p-[30px]">
              <h3 className="h3 text-[22px] leading-tight">{p.titulo}</h3>
              <p className="cuerpo mt-3">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
