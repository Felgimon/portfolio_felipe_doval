import type { Metadata } from "next";
import { fontClassNames } from "@/lib/fonts";
import { perfil } from "@/content/perfil";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { AppReadyProvider } from "@/components/motion/AppReady";
import { Preloader } from "@/components/motion/Preloader";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const url = "https://felipedoval.com"; // TODO(FELI): dominio final de deploy

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${perfil.nombre} — ${perfil.rol}`,
    template: `%s · ${perfil.nombre}`,
  },
  description: perfil.metaDescripcion,
  applicationName: `${perfil.nombre} · Portfolio`,
  authors: [{ name: perfil.nombre }],
  creator: perfil.nombre,
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
          className="sr-only rounded-full bg-celeste px-4 py-2 font-mono text-xs text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
        >
          Saltar al contenido
        </a>
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
