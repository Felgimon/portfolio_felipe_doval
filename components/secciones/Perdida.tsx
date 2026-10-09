"use client";
import Link from "next/link";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import { Feli } from "@/components/guia/Feli";
import { Globo } from "@/components/guia/Globo";
import { guion } from "@/content/guia";

/** La parada que no existe (404). */
export function Perdida() {
  const { t, idioma } = useIdioma();
  return (
    <main
      id="contenido"
      className="capa flex min-h-dvh items-end pt-28"
      data-gotas="0.5 1.0 220 0; 0.18 0.92 120 1; 0.84 0.9 140 1"
    >
      <div className="contenedor grid items-end gap-8 lg:grid-cols-12">
        <div className="pb-16 lg:col-span-7">
          <h1 className="script titulo-parada outline-none">{t.perdida.titulo}</h1>
          <Link href="/" data-vidrio data-gotas="0.9 0.5 56 1" className="vidrio vidrio-pildora boton-vidrio mt-8">
            {t.perdida.volver}
          </Link>
        </div>
        <div className="flex items-end justify-end gap-4 lg:col-span-5">
          <Globo parada="inicio" className="mb-[30%]" gotas="0.2 0.6 70 0">
            {guion[idioma].perdida}
          </Globo>
          <Feli pose="encoge" parada="inicio" intro className="w-[40%] max-w-[220px] shrink-0" />
        </div>
      </div>
    </main>
  );
}
