/**
 * El título de una sección: sans ancha y la última palabra en la serif. Sube
 * desde atrás de su máscara al entrar (lo anima `entradas`, lib/gsap.ts).
 */
export function Titulo({
  texto,
  como: Como = "h2",
}: {
  texto: [texto: string, acento: string];
  como?: "h1" | "h2";
}) {
  return (
    <Como className="t-titulo">
      <span className="mascara">
        <span data-sube>
          {texto[0]}
          {texto[0] && " "}
          <span className="serif">{texto[1]}</span>
        </span>
      </span>
    </Como>
  );
}

/** Flecha diagonal, para lo que sale del sitio. */
export function Flecha() {
  return (
    <svg className="flecha" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M3 13 13 3M5 3h8v8" />
    </svg>
  );
}
