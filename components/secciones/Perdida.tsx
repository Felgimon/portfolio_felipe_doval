"use client";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Cianotipo } from "@/components/escena/Cianotipo";

/** La página que no existe (404): un título directo, una salida y, de fondo, un mapa con su brújula. */
export function Perdida() {
  const { t } = useIdioma();
  return (
    <main
      id="contenido"
      className="capa flex min-h-dvh items-end pt-28"
      data-gota="0.78 0.5 0.11"
      data-gota-m="0.8 0.5 0.1"
    >
      <Cianotipo nombre="mapa" className="max-md:w-[200%]" />
      <div className="contenedor grid items-end gap-8 md:grid-cols-12">
        <div className="pb-16 md:col-span-8">
          <p className="etiqueta">404</p>
          <h1 data-placa className="placa titulo-seccion mt-4 outline-none">
            <span>{t.perdida.titulo}</span>
          </h1>
          <Link href="/" className="boton boton-solido mt-10">
            <span aria-hidden className="flecha flecha-izq">←</span> {t.perdida.volver}
          </Link>
        </div>
      </div>
    </main>
  );
}
