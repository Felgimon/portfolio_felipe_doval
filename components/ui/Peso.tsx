/**
 * Un título que engorda con el scroll, de hairline a negra. El molde invisible
 * (ya en negra) reserva el lugar; el vivo cambia de peso encima, así nada se
 * mueve alrededor mientras engorda. La animación la pone cada sección sobre
 * `[data-peso]`; sin ella queda en negra.
 */
export function Peso({ children }: { children: string }) {
  return (
    <span className="peso">
      <span className="peso-molde" aria-hidden>
        {children}
      </span>
      <span className="peso-vivo" data-peso>
        {children}
      </span>
    </span>
  );
}

/** Flecha propia (Piazzolla no trae): diagonal, para lo que sale del sitio. */
export function Flecha() {
  return (
    <svg className="flecha" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M3 13 13 3M5 3h8v8" />
    </svg>
  );
}
