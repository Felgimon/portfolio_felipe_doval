import { Inicio } from "@/components/secciones/Inicio";
import { Proyectos } from "@/components/secciones/Proyectos";
import { Fotos } from "@/components/secciones/Fotos";
import { SobreMi } from "@/components/secciones/SobreMi";
import { Contacto } from "@/components/secciones/Contacto";

/** La home es un recorrido: cinco secciones en orden, y el scroll las mueve. */
export default function Home() {
  return (
    <main id="contenido">
      <Inicio />
      <Proyectos />
      <Fotos />
      <SobreMi />
      <Contacto />
    </main>
  );
}
