import { perfil } from "@/content/perfil";

/**
 * Fase 0 — home de andamiaje. Prueba que los tokens de diseño y las tipografías
 * (Archivo display + Hanken body + Spline Sans Mono) renderizan bien.
 * El hero real, las secciones y el 3D llegan en las fases siguientes.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col justify-between overflow-hidden px-6 py-10 sm:px-10 lg:px-16">
      {/* malla de nodos sutil de fondo (placeholder — shader real en Fase 3) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--line) 1px, transparent 0)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 60% 40%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 60% 40%, black, transparent)",
        }}
      />

      <header className="relative flex items-center justify-between">
        <span className="type-display text-xl tracking-tight text-chalk">
          FD<span className="text-celeste">_</span>
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Fase 0 · andamiaje
        </span>
      </header>

      <div className="relative max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-celeste">
          {perfil.ubicacion}
        </p>
        <h1 className="type-display mt-5 text-[clamp(3rem,13vw,10rem)] uppercase text-chalk">
          Felipe
          <br />
          Doval<span className="text-celeste">_</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-chalk-dim">
          {perfil.rol}. Setup técnico listo: Next.js + Tailwind v4 + el stack 3D
          verificado. El sitio se construye por fases.
        </p>
      </div>

      <footer className="relative flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted">
        <span className="text-celeste">●</span>
        <span>fútbol × ML</span>
        <span className="text-line">/</span>
        <span>builder</span>
        <span className="text-line">/</span>
        <span>Buenos Aires 🇦🇷</span>
      </footer>
    </main>
  );
}
