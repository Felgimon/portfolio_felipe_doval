"use client";
import { useEffect } from "react";
import Link from "next/link";

/**
 * Red de seguridad de la PÁGINA. El canvas 3D ya tenía la suya (CanvasGuard cae
 * al poster), pero cualquier otro componente cliente que tirara —una sección, el
 * scroll suave, el proveedor de idioma— se llevaba puesta la pantalla entera con
 * el error crudo de Next. Con esto el visitante ve algo de la marca y tiene por
 * dónde salir.
 *
 * A propósito NO usa el diccionario de idioma ni componentes del sitio: si el
 * error viene justamente de ahí, importarlo lo volvería a tirar. Texto en
 * español, que es el idioma del HTML servido. Solo clases de globals.css.
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
    <main id="contenido" className="capa flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="etiqueta">Algo se rompió</p>
      <h1 className="mt-4 text-[clamp(32px,5vw,56px)] leading-tight font-extrabold tracking-[-0.02em]">
        Esto no tendría que haber pasado
      </h1>
      <p className="lead mt-4 max-w-md">
        Se cayó una parte de la página. Podés reintentar; si sigue igual, volvé
        al inicio.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="boton boton-solido"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="boton boton-solido"
        >
          Volver al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="etiqueta mt-8">
          referencia: {error.digest}
        </p>
      )}
    </main>
  );
}
