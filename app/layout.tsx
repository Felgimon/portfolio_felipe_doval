import type { Metadata } from "next";
import { piazzolla } from "@/lib/fonts";
import { perfil } from "@/content/perfil";
import { siteUrl } from "@/lib/site";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { IdiomaProvider } from "@/components/idioma/IdiomaProvider";
import { Nav } from "@/components/layout/Nav";
import { Pie } from "@/components/layout/Pie";
import { SaltarAlContenido } from "@/components/layout/SaltarAlContenido";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const titulo = `${perfil.nombre} | ${perfil.rol}`;

/** Datos estructurados (JSON-LD): le dicen a Google QUIÉN es Felipe Doval y
 * que este sitio es SU sitio oficial. Junto con el dominio exacto
 * (felipedoval.com), el H1 con el nombre y los backlinks desde GitHub y
 * LinkedIn, es la señal principal para rankear la búsqueda del nombre. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#persona`,
      name: perfil.nombre,
      url: siteUrl,
      jobTitle: perfil.rol,
      description: perfil.metaDescripcion,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Buenos Aires",
        addressCountry: "AR",
      },
      sameAs: [perfil.links.github, perfil.links.linkedin],
      knowsAbout: [
        "Next.js",
        "React",
        "TypeScript",
        "Python",
        "Machine Learning",
        "FastAPI",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#sitio`,
      name: `${perfil.nombre} · Portfolio`,
      url: siteUrl,
      inLanguage: "es-AR",
      about: { "@id": `${siteUrl}/#persona` },
      publisher: { "@id": `${siteUrl}/#persona` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titulo,
    template: `%s | ${perfil.nombre}`,
  },
  description: perfil.metaDescripcion,
  alternates: {
    canonical: "./", // self-referencing en cada ruta (evita contenido duplicado)
  },
  applicationName: `${perfil.nombre} · Portfolio`,
  authors: [{ name: perfil.nombre }],
  creator: perfil.nombre,
  keywords: [
    "Felipe Doval",
    "portfolio",
    "desarrollador",
    "machine learning",
    "full stack",
    "Next.js",
    "React",
    "Buenos Aires",
    "ORT",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: `${perfil.nombre} · Portfolio`,
    title: titulo,
    description: perfil.metaDescripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: perfil.metaDescripcion,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={piazzolla.variable}>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          // `jsonLd` es 100% contenido propio (nombre, rol, URLs), sin input de
          // usuario, así que hoy no hay riesgo. El escape de `<` va igual como
          // defensa en profundidad: convierte cualquier `</script>` que pudiera
          // aparecer en el futuro en `<</script>`, que no cierra la etiqueta.
          // Sigue siendo JSON válido (< es un escape legal para `<`).
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <IdiomaProvider>
          <SaltarAlContenido />
          <SmoothScroll>
            <Nav />
            {children}
            <Pie />
          </SmoothScroll>
        </IdiomaProvider>
        {/* Vercel Web Analytics. Va ÚLTIMO y fuera de los providers a propósito:
            no envuelve a nadie, así que si su script no carga (bloqueador,
            adblock, red caída) no se lleva puesto nada del sitio.
            En producción se sirve desde /_vercel/insights, mismo origen: pasa la
            CSP con `script-src 'self'` sin abrirle la puerta a terceros. */}
        <Analytics />
      </body>
    </html>
  );
}
