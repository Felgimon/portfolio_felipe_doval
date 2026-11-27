"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { detectarIdioma, type Idioma } from "@/lib/idioma";
import { textosUI, type TextosUI } from "@/content/ui";
import { perfil as perfilES } from "@/content/perfil";
import { perfilEN } from "@/content/perfil.en";
import { proyectos as proyectosES } from "@/content/proyectos";
import { proyectosEN } from "@/content/proyectos.en";
import { fotos } from "@/content/fotos";
import type { Foto, Perfil, Proyecto } from "@/content/types";

/**
 * El idioma del sitio, resuelto una vez por visita. SSR y primer paint son
 * SIEMPRE español (el HTML estático, el SEO y la identidad); tras hidratar se
 * detecta la configuración del navegador (= la config de idioma de Google, la
 * prioridad que pidió Felipe) con la región como fallback, y si el visitante
 * no es hispanohablante el contenido cambia a inglés. Sin selector: automático.
 *
 * Nota de hidratación: la detección corre en useEffect (nunca en el render
 * inicial) → el árbol hidrata idéntico al HTML servido y recién después
 * re-renderiza en inglés. Cero mismatch.
 */

type Paquete = {
  idioma: Idioma;
  t: TextosUI;
  perfil: Perfil;
  proyectos: Proyecto[];
  fotos: Foto[];
  getProyecto: (slug: string) => Proyecto | undefined;
};

function armar(idioma: Idioma): Paquete {
  const proyectos = idioma === "es" ? proyectosES : proyectosEN;
  return {
    idioma,
    t: textosUI[idioma],
    perfil: idioma === "es" ? perfilES : perfilEN,
    proyectos,
    fotos: fotos(idioma),
    getProyecto: (slug) => proyectos.find((p) => p.slug === slug),
  };
}

const IdiomaContext = createContext<Paquete>(armar("es"));

export function useIdioma(): Paquete {
  return useContext(IdiomaContext);
}

/** La detección, cacheada: `useSyncExternalStore` exige un snapshot estable. */
let idiomaDetectado: Idioma | null = null;
function snapshotCliente(): Idioma {
  if (idiomaDetectado === null) idiomaDetectado = detectarIdioma();
  return idiomaDetectado;
}
const sinSuscripcion = () => () => {};

export function IdiomaProvider({ children }: { children: ReactNode }) {
  // Patrón canónico para un valor solo-cliente: el snapshot de servidor es
  // "es" (el HTML estático), el de cliente es la detección. React hidrata con
  // el del servidor y re-renderiza con el del cliente — cero mismatch y sin
  // setState en effects.
  const idioma = useSyncExternalStore(sinSuscripcion, snapshotCliente, () => "es" as Idioma);
  useEffect(() => {
    // El lang del documento acompaña (lectores de pantalla, traductores).
    document.documentElement.lang = idioma;
  }, [idioma]);
  const paquete = useMemo(() => armar(idioma), [idioma]);
  return (
    <IdiomaContext.Provider value={paquete}>{children}</IdiomaContext.Provider>
  );
}
