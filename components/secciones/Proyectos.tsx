"use client";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Pieza } from "./Pieza";
import { TituloSeccion } from "./comun";

/**
 * PROYECTOS. FutbolVision en grande (el caso con más para contar) y abajo el
 * resto como una lista que se lee de un vistazo: nombre, qué es, con qué está
 * hecho y el link al repo.
 */
export function Proyectos() {
  const { proyectos, t } = useIdioma();
  const destacados = proyectos.filter((p) => p.categoria === "destacado" && p.slug !== "superlum");
  const secundarios = proyectos.filter((p) => p.categoria === "secundario");

  return (
    <section
      id="proyectos"
      aria-labelledby="proyectos-titulo"
      className="parada"
    >
      <div className="contenedor">
        <TituloSeccion
          id="proyectos-titulo"
          burbujas="0.92 0.5 0.085; 0.36 2.3 0.04; 1.12 0.1 0.024"
          burbujasM="0.94 0.5 0.085; 0.2 1.6 0.03"
        >{t.paradas.proyectos}</TituloSeccion>
        {destacados.map((p) => (
          <Pieza key={p.slug} p={p} etiqueta={t.trabajo.anterior} invertida />
        ))}
        <ul className="mt-16 border-t border-linea md:mt-22">
          {secundarios.map((p) => {
            const link = p.enlaces.find((e) => e.tipo === "repo" || e.tipo === "demo");
            const fila = (
              <>
                <span className="fila-nombre h3 text-[20px] md:text-[22px]">{p.nombre}</span>
                <span className="hidden text-[16px] text-crema-2 md:block">{p.unaLinea}</span>
                <span className="hidden text-[14px] text-crema-2 md:block">{p.stack.slice(0, 2).join(", ")}</span>
                <span aria-hidden className="text-right text-[18px]">
                  {link && <span className="flecha flecha-diag">↗</span>}
                </span>
              </>
            );
            return (
              <li key={p.slug} className="border-b border-linea">
                {link ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.nombre}: ${t.trabajo.ariaAbrirRepo} ${link.label}`}
                    data-vidrio="hover"
                    className="fila vidrio-hover"
                  >
                    {fila}
                  </a>
                ) : (
                  <div className="fila">{fila}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
