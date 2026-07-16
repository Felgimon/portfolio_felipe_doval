import type { Metadata } from "next";
import { fontClassNames } from "@/lib/fonts";
import { perfil } from "@/content/perfil";
import { siteUrl } from "@/lib/site";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { AppReadyProvider } from "@/components/motion/AppReady";
import { Preloader } from "@/components/motion/Preloader";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { LiquidGlass } from "@/components/ui/LiquidGlass";
import { KonamiEasterEgg } from "@/components/motion/KonamiEasterEgg";
import { DevOverlay } from "@/components/motion/DevOverlay";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
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
        "Three.js",
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
    "fútbol",
    "Next.js",
    "React",
    "Three.js",
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
    <html lang="es-AR" className={`${fontClassNames} h-full`}>
      <body className="min-h-full antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#inicio"
          className="sr-only rounded-full bg-acento px-4 py-2 font-mono text-xs text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
        >
          Saltar al contenido
        </a>
        <CustomCursor />
        <KonamiEasterEgg />
        <DevOverlay />
        {/* La refracción del vidrio: le da su lente a cada `data-lente`. */}
        <LiquidGlass />
        <AppReadyProvider>
          <Preloader />
          <SmoothScroll>
            <SiteNav />
            {children}
            <SiteFooter />
          </SmoothScroll>
        </AppReadyProvider>
      </body>
    </html>
  );
}
