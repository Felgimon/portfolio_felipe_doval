import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { proyectosDestacados, getProyecto } from "@/content/proyectos";
import { ProyectoDetalle } from "@/components/sections/ProyectoDetalle";

/**
 * Shell SERVIDOR del case study: valida el slug, genera las rutas estáticas y
 * la metadata (en español a propósito: el SEO del sitio es español — el HTML
 * estático siempre sale es y el idioma del CONTENIDO lo resuelve el cliente
 * vía IdiomaProvider dentro de ProyectoDetalle).
 */

// Solo los destacados tienen case study. Otros slugs → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return proyectosDestacados.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p) return {};
  return {
    title: p.nombre,
    description: p.unaLinea,
  };
}

export default async function Pagina({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p || p.categoria !== "destacado") notFound();
  return <ProyectoDetalle slug={slug} />;
}
