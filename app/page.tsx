import { GraphHome } from "@/components/sections/GraphHome";
import { Perfil } from "@/components/sections/Perfil";
import { Enfoque } from "@/components/sections/Enfoque";
import { Trabajo } from "@/components/sections/Trabajo";
import { Recorrido } from "@/components/sections/Recorrido";
import { Contacto } from "@/components/sections/Contacto";

/**
 * Home = hub del grafo. El balón + los 5 nodos son la navegación (viven en la
 * capa fija de GraphHome); cada tópico se recorre clickeando un nodo/el HUD o
 * simplemente scrolleando en orden. Contenido real, en el DOM (SEO + a11y).
 */
export default function Home() {
  return (
    <GraphHome>
      <Perfil />
      <Enfoque />
      <Trabajo />
      <Recorrido />
      <Contacto />
    </GraphHome>
  );
}
