import type { Metadata } from "next";
import { fontClassNames } from "@/lib/fonts";
import { perfil } from "@/content/perfil";
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
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
