import Image from "next/image";
import { perfil } from "@/content/perfil";
import type { CategoriaStack } from "@/content/types";
import { Reveal } from "@/components/motion/Reveal";
import { ladoTexto, indiceTopico } from "@/lib/navigation";
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

/** Nodo Perfil — quién es Felipe: foto enmarcada en vidrio, bio flotante y el
 * stack en contenedores Liquid Glass (sin viñetas ni separadores de lista). */
export function Perfil() {
  const grupos = agruparStack();

  return (
    <TopicPanel
      id="perfil"
      kicker="Perfil"
      align={ladoTexto(indiceTopico("perfil"))}
      contentClassName="max-w-4xl"
    >
      <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-12">
        {/* Foto enmarcada en vidrio */}
        <Reveal>
          <figure className="glass grain relative w-full max-w-[16rem] overflow-hidden p-1.5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-lg)-0.35rem)]">
              <Image
                src="/assets/foto/foto_frente.png"
                alt={`${perfil.nombre}, ${perfil.rol}`}
                fill
                sizes="(max-width: 768px) 60vw, 20vw"
                className="object-cover object-[center_18%] contrast-[1.05] grayscale-[0.35]"
              />
              <div
                className="absolute inset-0 mix-blend-soft-light"
                style={{ backgroundColor: "#e0a63a" }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 44%, rgba(16,41,59,0.72))",
                }}
              />
              <figcaption className="absolute bottom-0 left-0 p-3 font-mono text-xs text-white">
                {perfil.apodo} · {perfil.ubicacion}
              </figcaption>
            </div>
          </figure>
        </Reveal>

        {/* Bio + stack */}
        <div className="flex flex-col gap-8">
          <Reveal>
            <h2 className="type-h1 text-chalk">
              Construyo de{" "}
              <span className="stretch-y inline-block accent-grad">punta</span>{" "}
              a punta
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

          <Reveal>
            <p className="eyebrow mb-4">Herramientas</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {grupos.map((g) => (
                <div
                  key={g.categoria}
                  data-reveal-item
                  className="glass glass-hover p-4"
                >
                  <p className="font-mono text-[0.7rem] tracking-wider text-acento uppercase">
                    {g.categoria}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {g.items.map((it) => (
                      <span key={it} className="font-mono text-sm text-chalk">
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </TopicPanel>
  );
}
