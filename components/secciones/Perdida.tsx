"use client";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";

/** La página que no existe: 404, qué pasó y una salida. */
export function Perdida() {
  const { t } = useIdioma();
  return (
    <main id="contenido" data-tema="blanco" className="aviso">
      <p className="etiqueta">404</p>
      <h1 className="t-titulo">
        {t.perdida.titulo[0]} <span className="serif">{t.perdida.titulo[1]}</span>
      </h1>
      <Link href="/" className="boton">
        {t.perdida.volver}
      </Link>
    </main>
  );
}
