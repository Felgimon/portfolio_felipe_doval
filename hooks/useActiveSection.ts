"use client";
import { useEffect, useState } from "react";

/**
 * Devuelve el id de la sección actualmente "activa" (la que cruza la banda
 * central del viewport), para resaltar el item de nav correspondiente.
 * Pasar un array de ids ESTABLE (definido fuera del componente o memoizado).
 */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      // La sección se marca activa cuando su contenido cruza el centro vertical.
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids]);

  return active;
}
