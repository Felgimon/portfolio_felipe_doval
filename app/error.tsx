"use client";
import { useEffect } from "react";
import Link from "next/link";

/**
 * Red de seguridad de la página: si un componente cliente tira, el visitante ve
 * esto en vez del error crudo de Next y tiene por dónde salir.
 *
 * A propósito no usa el diccionario de idioma ni componentes del sitio: si el
 * error viene de ahí, importarlo lo volvería a tirar. Solo clases de globals.css.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Queda en la consola del visitante y en cualquier reporter que se enchufe
    // más adelante. `digest` es el id que Next le pone al error en producción.
    console.error("[perfil] error de render:", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="contenido" data-tema="amarillo" className="aviso">
      <p className="dato">Error{error.digest && ` ${error.digest}`}</p>
      <h1 className="gigante mt-4">Algo se rompió</h1>
      <p className="aviso-salidas">
        <button type="button" onClick={reset} className="enlace cursor-pointer">
          Reintentar
        </button>
        <Link href="/" className="enlace">
          Inicio
        </Link>
      </p>
    </main>
  );
}
