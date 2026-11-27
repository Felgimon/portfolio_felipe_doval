"use client";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/** La página que no existe: 404, qué pasó y una salida. */
export function Perdida() {
  const { t } = useIdioma();
  return (
    <main id="contenido" data-tema="amarillo" className="aviso">
      <p className="dato">404</p>
      <h1 className="gigante mt-4">{t.perdida.titulo}</h1>
      <p className="aviso-salidas">
        <Link href="/" className="enlace">
          {t.perdida.volver}
        </Link>
      </p>
    </main>
  );
}
