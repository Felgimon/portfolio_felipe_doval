import type { Metadata } from "next";
import { Perdida } from "@/components/secciones/Perdida";

export const metadata: Metadata = {
  // absoluto: la plantilla del layout ya agrega "| Felipe Doval"
  title: { absolute: "No está | Felipe Doval" },
  robots: { index: false, follow: true },
};

/** 404: un título directo, Feli y una salida. */
export default function NoEncontrado() {
  return <Perdida />;
}
