"use client";

/**
 * El último recurso: se usa SOLO si el que falla es el layout raíz, y en ese
 * caso Next descarta el layout entero — por eso este archivo tiene que traer su
 * propio <html> y <body>.
 *
 * Justamente porque el layout no corrió, acá no hay tipografías cargadas, ni
 * variables de tema, ni globals.css garantizado: los estilos van INLINE. Es la
 * pantalla que nadie debería ver nunca, y tiene que funcionar aunque no quede
 * nada en pie.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#ffffff",
          color: "#0f3d2e",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Felipe Doval
        </h1>
        <p style={{ margin: 0, color: "#2e5a49", maxWidth: "28rem" }}>
          El sitio no pudo cargar. Probá recargar la página.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.25rem",
            borderRadius: "9999px",
            border: "1.5px solid #0f3d2e",
            background: "#78d561",
            color: "#0f3d2e",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
        {error.digest && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#2e5a49" }}>
            referencia: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
