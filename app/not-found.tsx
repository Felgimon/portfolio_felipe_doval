import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada · Felipe Doval",
  robots: { index: false, follow: true },
};

/**
 * 404 propio. Next trae uno por defecto, pero es una pantalla blanca con texto
 * del framework: al visitante que llega desde un link viejo o roto le queda la
 * sensación de que el sitio se cayó. Este mantiene la identidad y le da salida.
 *
 * Es un Server Component sin estado ni providers: se prerenderiza como estático
 * igual que el resto y no depende de que hidrate nada.
 */
export default function NoEncontrado() {
  return (
    <main className="sky flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="type-h2 mt-4 text-chalk">Acá no hay nada</h1>
      <p className="mt-4 max-w-md text-chalk-dim">
        La dirección no existe o el contenido se movió. El resto del sitio sigue
        en pie.
      </p>
      <Link
        href="/"
        className="glass glass-hover glass-pill mt-8 px-5 py-2.5 font-mono text-sm text-chalk"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
