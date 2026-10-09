import { Inicio } from "@/components/secciones/Inicio";
import { Perfil } from "@/components/secciones/Perfil";
import { Enfoque } from "@/components/secciones/Enfoque";
import { Trabajo } from "@/components/secciones/Trabajo";
import { Recorrido } from "@/components/secciones/Recorrido";
import { Contacto } from "@/components/secciones/Contacto";

/**
 * La home = la visita guiada. Seis paradas, en orden; en cada una Feli sube
 * del líquido, señala lo que importa y dice una sola frase. Todo el contenido
 * se lee scrolleando normal: Feli agrega voz, no esconde nada.
 */
export default function Home() {
  return (
    <main id="contenido" className="capa">
      <Inicio />
      <Perfil />
      <Enfoque />
      <Trabajo />
      <Recorrido />
      <Contacto />
    </main>
  );
}
