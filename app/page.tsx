import { Inicio } from "@/components/secciones/Inicio";
import { SobreMi } from "@/components/secciones/SobreMi";
import { Enfoque } from "@/components/secciones/Enfoque";
import { Trabajo } from "@/components/secciones/Trabajo";
import { Proyectos } from "@/components/secciones/Proyectos";
import { Recorrido } from "@/components/secciones/Recorrido";
import { Contacto } from "@/components/secciones/Contacto";

/** La home: siete secciones en orden, hacia abajo. El scroll las mueve. */
export default function Home() {
  return (
    <main id="contenido">
      <Inicio />
      <SobreMi />
      <Enfoque />
      <Trabajo />
      <Proyectos />
      <Recorrido />
      <Contacto />
    </main>
  );
}
