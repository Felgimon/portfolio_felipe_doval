/** Secciones de la home. Los ids son las anclas y alimentan la nav + el
 * IntersectionObserver de sección activa. Fuente única para no desincronizar. */
export const secciones = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre", label: "Sobre mí" },
  { id: "obras", label: "Obras" },
  { id: "recorrido", label: "Recorrido" },
  { id: "contacto", label: "Contacto" },
] as const;

export type SeccionId = (typeof secciones)[number]["id"];

export const seccionIds = secciones.map((s) => s.id);
