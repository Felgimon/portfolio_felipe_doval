import type { Metadata } from "next";
import { Perdida } from "@/components/secciones/Perdida";

export const metadata: Metadata = {
  // absoluto: la plantilla del layout ya agrega "| Felipe Doval"
  title: { absolute: "Página no encontrada | Felipe Doval" },
  robots: { index: false, follow: true },
};

/** 404: un título directo y una salida, en una sola pantalla (con el footer). */
export default function NoEncontrado() {
  return <Perdida />;
}
