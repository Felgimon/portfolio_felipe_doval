import Image from "next/image";
import { perfil } from "@/content/perfil";
import type { CategoriaStack } from "@/content/types";
import { Reveal } from "@/components/motion/Reveal";
import { TopicPanel } from "./TopicPanel";

const ORDEN_STACK: CategoriaStack[] = [
  "Frontend",
  "Backend",
  "ML / Datos",
  "Lenguajes",
  "3D / Motion",
  "Automatización",
];

function agruparStack() {
  const grupos = new Map<CategoriaStack, string[]>();
  for (const item of perfil.stack) {
    const arr = grupos.get(item.categoria) ?? [];
    arr.push(item.nombre);
    grupos.set(item.categoria, arr);
  }
  return ORDEN_STACK.filter((c) => grupos.has(c)).map((c) => ({
    categoria: c,
    items: grupos.get(c) ?? [],
  }));
}

/** Nodo Perfil — quién es Felipe: foto tratada, bio y el stack como datos en
 * mono (sin viñetas). */
export function Perfil() {
  const grupos = agruparStack();

  return (
    <TopicPanel id="perfil" kicker="Perfil" contentClassName="max-w-4xl">
      <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-12">
        {/* Foto tratada */}
        <Reveal>
          <figure className="grain relative w-full max-w-[16rem] overflow-hidden rounded-2xl border border-line bg-ink-2">
            <div className="relative aspect-[4/5]">
              <Image
                src="/assets/foto/foto_frente.png"
                alt={`${perfil.nombre}, ${perfil.rol}`}
                fill
                sizes="(max-width: 768px) 60vw, 20vw"
                className="object-cover object-[center_18%] opacity-95 grayscale contrast-[1.12] brightness-[0.9]"
              />
              <div
                className="absolute inset-0 mix-blend-color"
                style={{ backgroundColor: "#8fe3c6" }}
              />
              <div
                className="absolute inset-0 mix-blend-multiply"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(15,30,27,0.35), rgba(15,30,27,0.1) 45%, rgba(15,30,27,0.85))",
                }}
              />
            </div>
            <figcaption className="absolute bottom-0 left-0 flex items-center gap-2 p-3 font-mono text-xs text-chalk">
              <span className="inline-block size-1.5 rounded-full bg-agua" />
              {perfil.apodo} · {perfil.ubicacion}
            </figcaption>
          </figure>
        </Reveal>

        {/* Bio + stack */}
        <div className="flex flex-col gap-8">
          <Reveal>
            <h2 className="type-h1 text-chalk">
              Construyo de{" "}
              <span className="stretch-y inline-block text-agua">punta</span> a
              punta
            </h2>
          </Reveal>

          <Reveal>
            <div className="flex flex-col gap-4 text-lg leading-relaxed text-chalk-dim">
              {perfil.bioLarga.map((parrafo, i) => (
                <p key={i} data-reveal-item>
                  {parrafo}
                </p>
              ))}
            </div>
          </Reveal>

          <hr className="hairline" />

          <Reveal>
            <p className="eyebrow mb-4">Herramientas</p>
            <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {grupos.map((g) => (
                <div
                  key={g.categoria}
                  data-reveal-item
                  className="flex flex-col gap-1"
                >
                  <dt className="font-mono text-xs tracking-wide text-muted">
                    {g.categoria}
                  </dt>
                  <dd className="font-mono text-sm text-chalk-dim">
                    {g.items.join("  ·  ")}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </TopicPanel>
  );
}
