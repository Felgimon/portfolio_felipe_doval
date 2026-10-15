"use client";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";

/** La página que no existe (404): un título directo, Feli y una salida. */
export function Perdida() {
  const { t } = useIdioma();
  return (
    <main
      id="contenido"
      className="capa flex min-h-dvh items-end pt-28"
      data-gota="0.78 0.5 0.11"
      data-gota-m="0.8 0.5 0.1"
    >
      <div className="contenedor grid items-end gap-8 md:grid-cols-12">
        <div className="pb-16 md:col-span-8">
          <p className="etiqueta">404</p>
          <h1 data-placa className="placa titulo-seccion mt-4 outline-none">
            <span>{t.perdida.titulo}</span>
          </h1>
          <Link href="/" className="boton boton-solido mt-10">
            <span aria-hidden>←</span> {t.perdida.volver}
          </Link>
        </div>
        <Feli pose="perdida" prioridad className="ml-auto w-[34%] md:col-span-3 md:col-start-10 md:w-[60%]" />
      </div>
    </main>
  );
}
