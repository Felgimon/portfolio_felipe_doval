import type { Metadata } from "next";
import { ArrowUpRight, Copy } from "lucide-react";
import {
  Container,
  Heading,
  Eyebrow,
  Button,
  Tag,
  DeviceFrame,
  Placeholder,
  BrandIcon,
} from "@/components/ui";

/**
 * Página TEMPORAL de design system (se borra en Fase 9). Muestra todos los
 * tokens y componentes base para revisión visual y chequeo de contraste.
 */
export const metadata: Metadata = {
  title: "Design tokens (dev)",
  robots: { index: false, follow: false },
};

const colores: { nombre: string; varName: string; hex: string; uso: string }[] = [
  { nombre: "ink", varName: "--ink", hex: "#0B1220", uso: "fondo base" },
  { nombre: "ink-2", varName: "--ink-2", hex: "#0E1524", uso: "banda alterna" },
  { nombre: "panel", varName: "--panel", hex: "#121B2E", uso: "cards / superficies" },
  { nombre: "panel-2", varName: "--panel-2", hex: "#17223A", uso: "hover de panel" },
  { nombre: "celeste", varName: "--celeste", hex: "#74ACDF", uso: "señal / links (AA 7.8)" },
  { nombre: "celeste-bright", varName: "--celeste-bright", hex: "#A9D0FF", uso: "glow / hover" },
  { nombre: "chalk", varName: "--chalk", hex: "#ECE7DC", uso: "texto principal (AA 15.2)" },
  { nombre: "chalk-dim", varName: "--chalk-dim", hex: "#B9B3A6", uso: "texto secundario (AA 9.0)" },
  { nombre: "muted", varName: "--muted", hex: "#8A93A6", uso: "metadatos (AA 6.1)" },
  { nombre: "line", varName: "--line", hex: "#26324A", uso: "bordes / struts" },
  { nombre: "paper", varName: "--paper", hex: "#ECE7DC", uso: "superficie About" },
];

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-14">
      <p className="eyebrow mb-8">{titulo}</p>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="min-h-dvh bg-ink py-16">
      <Container size="wide">
        <header className="mb-6">
          <Eyebrow>Dev · design system</Eyebrow>
          <Heading as="h1" size="h1" className="mt-4">
            Tokens & componentes
          </Heading>
          <p className="lead mt-4 max-w-2xl">
            Referencia viva del sistema &quot;Noche de estadio&quot;. Página
            temporal — se borra en la fase de performance.
          </p>
        </header>

        {/* PALETA */}
        <Bloque titulo="Paleta · contraste AA verificado">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {colores.map((c) => (
              <div
                key={c.nombre}
                className="overflow-hidden rounded-lg border border-line bg-panel"
              >
                <div className="h-20 w-full" style={{ backgroundColor: c.hex }} />
                <div className="space-y-0.5 p-3">
                  <p className="data text-sm text-chalk">{c.nombre}</p>
                  <p className="data text-xs text-muted">{c.hex}</p>
                  <p className="text-xs text-chalk-dim">{c.uso}</p>
                </div>
              </div>
            ))}
          </div>
        </Bloque>

        {/* TIPOGRAFÍA */}
        <Bloque titulo="Escala tipográfica · Archivo / Hanken / Spline Mono">
          <div className="space-y-6">
            <p className="type-hero text-chalk">Felipe Doval_</p>
            <p className="type-h1 text-chalk">Titular H1 expandido</p>
            <p className="type-h2 text-chalk">Titular H2 de sección</p>
            <p className="type-h3 text-chalk">Titular H3</p>
            <p className="lead max-w-2xl">
              Lead / intro: párrafo de entrada más grande, en Hanken Grotesk, para
              bajar el tono después de un titular display.
            </p>
            <p className="max-w-2xl text-chalk-dim">
              Body base en Hanken Grotesk. El pangrama de siempre: el veloz murciélago
              hindú comía feliz cardillo y kiwi. La tipografía es parte del diseño, no
              un vehículo neutro.
            </p>
            <p className="eyebrow">Eyebrow · label en mono</p>
            <p className="data text-chalk">
              DATA 0123456789 · xG 2.41 · pases 87% · +60 features
            </p>
          </div>
        </Bloque>

        {/* BOTONES */}
        <Bloque titulo="Botones">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">
              Ver proyecto
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Button>
            <Button variant="secondary" href="https://github.com/Felgimon">
              <BrandIcon name="github" className="size-4" />
              GitHub
            </Button>
            <Button variant="ghost">
              <Copy className="size-4" strokeWidth={2} />
              Copiar email
            </Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
        </Bloque>

        {/* TAGS */}
        <Bloque titulo="Tags / stack">
          <div className="flex flex-wrap gap-2">
            <Tag variant="solid">Next.js</Tag>
            <Tag variant="soft">TypeScript</Tag>
            <Tag variant="outline">FastAPI</Tag>
            <Tag variant="solid">XGBoost</Tag>
            <Tag variant="soft" size="sm">
              Three.js
            </Tag>
          </div>
        </Bloque>

        {/* DEVICE FRAMES + PLACEHOLDER */}
        <Bloque titulo="Device frames & placeholder honesto">
          <div className="grid gap-8 lg:grid-cols-3">
            <DeviceFrame variant="browser" label="superlum.app">
              <Placeholder label="captura de dashboard" className="border-0" />
            </DeviceFrame>
            <DeviceFrame variant="terminal" label="buscaminas — main.cpp">
              <Placeholder label="captura de la terminal" className="border-0" />
            </DeviceFrame>
            <DeviceFrame variant="phone" label="courtside">
              <Placeholder label="captura mobile" className="border-0" />
            </DeviceFrame>
          </div>
        </Bloque>

        {/* UTILIDADES */}
        <Bloque titulo="Utilidades: hairline, node-grid, papel">
          <div className="space-y-8">
            <hr className="hairline" />
            <div className="node-grid h-28 rounded-lg border border-line" />
            <div className="surface-paper rounded-lg p-6">
              <p className="type-h3">Superficie papel</p>
              <p className="mt-2 max-w-lg opacity-80">
                El único momento cálido del sitio (sección About): invierte el
                esquema a chalk con tinta ink.
              </p>
            </div>
          </div>
        </Bloque>
      </Container>
    </main>
  );
}
