import type { Metadata } from "next";
import { fontClassNames } from "@/lib/fonts";
import { perfil } from "@/content/perfil";
import { siteUrl } from "@/lib/site";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { AppReadyProvider } from "@/components/motion/AppReady";
import { Preloader } from "@/components/motion/Preloader";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { KonamiEasterEgg } from "@/components/motion/KonamiEasterEgg";
import { DevOverlay } from "@/components/motion/DevOverlay";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const titulo = `${perfil.nombre} · ${perfil.rol}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titulo,
    template: `%s · ${perfil.nombre}`,
  },
  description: perfil.metaDescripcion,
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
        <a
          href="#inicio"
          className="sr-only rounded-full bg-acento px-4 py-2 font-mono text-xs text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
        >
          Saltar al contenido
        </a>
        <CustomCursor />
        <KonamiEasterEgg />
        <DevOverlay />
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
