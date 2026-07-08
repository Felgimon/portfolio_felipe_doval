import Image from "next/image";
import { perfil } from "@/content/perfil";
import type { CategoriaStack } from "@/content/types";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/motion/Reveal";

// Orden de las líneas del "plantel".
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

/**
 * Sobre mí — el único momento "papel" (cálido) del sitio. Bio larga, foto
 * tratada (duotone + grano) y el stack como un plantel/line-up.
 */
export function About() {
  const grupos = agruparStack();

  return (
    <section
      id="sobre"
      className="surface-paper relative scroll-mt-24 py-20 sm:py-28 lg:py-32"
    >
      <Container size="wide">
        <Reveal>
          <Eyebrow>Perfil</Eyebrow>
          <Heading size="h2" className="mt-4 text-paper-ink">
            Entre el full-stack y el machine learning
          </Heading>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Foto tratada */}
          <Reveal>
            <figure className="grain relative overflow-hidden rounded-2xl border border-paper-ink/10 bg-ink">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/assets/foto/foto_frente.png"
                  alt={`${perfil.nombre}, ${perfil.rol}`}
                  fill
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover object-[center_18%] opacity-90 grayscale contrast-[1.14] brightness-[0.82]"
                />
                {/* Duotone agua → ink */}
                <div
                  className="absolute inset-0 mix-blend-color"
                  style={{ backgroundColor: "#74acdf" }}
                />
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(11,18,32,0.5), rgba(11,18,32,0.25) 42%, rgba(11,18,32,0.92))",
                  }}
                />
              </div>
              <figcaption className="absolute bottom-0 left-0 flex items-center gap-2 p-4 font-mono text-xs text-chalk">
                <span className="text-agua">●</span>
                {perfil.apodo} · {perfil.ubicacion}
              </figcaption>
            </figure>
          </Reveal>

          {/* Bio + stack */}
          <div className="flex flex-col gap-10">
            <Reveal>
              <div className="flex flex-col gap-5 text-lg leading-relaxed text-paper-ink/80">
                {perfil.bioLarga.map((parrafo, i) => (
                  <p key={i} data-reveal-item>
                    {parrafo}
                  </p>
                ))}
              </div>
            </Reveal>

            <hr className="hairline" />

            <Reveal>
              <p className="eyebrow mb-6">Mi plantel · stack</p>
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {grupos.map((g) => (
                  <div key={g.categoria} data-reveal-item>
                    <dt className="mb-2 font-mono text-xs tracking-wide text-paper-ink/50">
                      {g.categoria}
                    </dt>
                    <dd className="flex flex-wrap gap-x-4 gap-y-1">
                      {g.items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 text-paper-ink"
                        >
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-[#235886]"
                          />
                          {item}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
