import { Inicio } from "@/components/secciones/Inicio";
import { Perfil } from "@/components/secciones/Perfil";
import { Enfoque } from "@/components/secciones/Enfoque";
import { Trabajo } from "@/components/secciones/Trabajo";
import { Proyectos } from "@/components/secciones/Proyectos";
import { Recorrido } from "@/components/secciones/Recorrido";
import { Contacto } from "@/components/secciones/Contacto";

/**
 * La home: siete secciones en orden, cada una con su título directo. La gota
 * de vidrio va de título en título; Feli acompaña en fotos.
 */
export default function Home() {
  return (
    <main id="contenido" className="capa">
      <Inicio />
      <Perfil />
      <Enfoque />
      <Trabajo />
      <Proyectos />
      <Recorrido />
      <Contacto />
    </main>
  );
}
