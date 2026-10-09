import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { proyectosDestacados, getProyecto } from "@/content/proyectos";
import { ProyectoDetalle } from "@/components/secciones/ProyectoDetalle";

/**
 * Shell SERVIDOR del caso: valida el slug, genera las rutas estáticas y la
 * metadata (en español a propósito: el HTML estático siempre sale es y el
 * idioma del contenido lo resuelve el cliente).
 *
 * La metadata define su propio Open Graph: en la v5 heredaba el de la home y
 * un link a un caso se compartía con la tarjeta de la portada.
 */

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
  const url = `/proyectos/${p.slug}`;
  const titulo = `${p.nombre} | Felipe Doval`;
  return {
    title: p.nombre,
    description: p.unaLinea,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: titulo, description: p.unaLinea },
    twitter: { card: "summary_large_image", title: titulo, description: p.unaLinea },
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
