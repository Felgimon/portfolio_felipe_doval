"use client";
import Image from "next/image";
import { useIdioma } from "@/components/idioma/IdiomaProvider";
import type { CategoriaStack, Perfil as PerfilTipo } from "@/content/types";
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

function agruparStack(perfil: PerfilTipo) {
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
 * stack en contenedores Liquid Glass (sin viñetas ni separadores de lista).
 * Textos desde el diccionario (es/en automático). */
export function Perfil() {
  const { t, perfil } = useIdioma();
  const grupos = agruparStack(perfil);
  const titulo = t.perfil.titulo;

  return (
    <TopicPanel
      id="perfil"
      kicker={t.nodos.perfil.label}
      align={ladoTexto(indiceTopico("perfil"))}
      contentClassName="max-w-4xl"
    >
      {/* FELI APOYADO EN EL TEXTO — dos recortes, uno por forma de pantalla.
          En ancho se para A LA IZQUIERDA con la espalda contra la columna de
          texto (el texto hace de pared); en angosto no hay costados libres, así
          que se apoya ENCIMA, con el bloque de texto de mesa. Los dos van con
          `loading=lazy` (el default de next/image) y ocultos por CSS: el que no
          corresponde nunca entra al viewport, así que el navegador NO lo baja —
          es art direction sin pagar dos descargas. */}

      {/* Angosto: apoyado ENCIMA del texto. El recorte se corta a la altura de
          los antebrazos (aspect + object-top) para que el borde de abajo sea el
          brazo y se lea "apoyado en una mesa" y no un busto flotando. */}
      <Reveal className="md:hidden">
        <div
          className="relative mx-auto aspect-[8/7] w-full max-w-[19rem] overflow-hidden"
          style={{
            /* El PNG ya viene cortado a la altura del torso, así que SIEMPRE
               hay un filo recto abajo — recortarlo más no lo arregla, sólo lo
               mueve. Se disuelve con una máscara: los antebrazos quedan nítidos
               y lo que sigue se desvanece, que es lo que hace leer "apoyado
               sobre" en vez de "foto cortada". */
            maskImage:
              "linear-gradient(to bottom, #000 84%, rgba(0,0,0,0.35) 94%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 84%, rgba(0,0,0,0.35) 94%, transparent 100%)",
          }}
        >
          <Image
            src="/assets/foto/feli-apoyado.png"
            alt={`${perfil.nombre}, ${perfil.rol}`}
            fill
            sizes="(max-width: 767px) 19rem, 1px"
            className="object-cover object-top"
          />
        </div>
        {/* Contacto: la sombra que lo deja apoyado sobre el texto y no flotando. */}
        <div
          aria-hidden
          className="mx-auto h-4 w-full max-w-[13rem] -translate-y-2"
          style={{
            background:
              "radial-gradient(50% 100% at 50% 0%, rgba(23,45,66,0.22), rgba(23,45,66,0) 74%)",
          }}
        />
      </Reveal>

      <div className="mt-6 grid gap-10 md:mt-0 md:grid-cols-[auto_1fr] md:items-end md:gap-0">
        {/* Ancho: parado, de espaldas contra el texto. El recorte mira al otro
            lado, así que se ESPEJA (-scale-x-100) y la espalda queda del lado
            de la columna. Alto en vh y ancho automático: se acomoda a cualquier
            pantalla sin deformarse, y al alinearse al final de su columna la
            espalda toca el texto sea cual sea el alto resultante. */}
        <Reveal className="hidden md:block">
          <div className="relative flex justify-end">
            <Image
              src="/assets/foto/feli-parado.png"
              alt={`${perfil.nombre}, ${perfil.rol}`}
              width={446}
              height={1600}
              sizes="(min-width: 768px) 20rem, 1px"
              className="h-[clamp(22rem,58vh,38rem)] w-auto -scale-x-100 object-contain object-bottom"
            />
            {/* Sombra de contacto en el piso: sin esto queda pegoteado sobre el
                estudio 3D en vez de parado en él. */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-2 bottom-0 h-4 w-28 translate-y-1/2"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(23,45,66,0.28), rgba(23,45,66,0) 70%)",
              }}
            />
          </div>
        </Reveal>

        {/* Título + bio: la "pared" contra la que se apoya. */}
        {/* pl-3 y no más: el texto tiene que ARRANCAR contra la espalda para que
            se lea apoyado. Con 2rem quedaba parado al lado, que es otra cosa. */}
        <div className="flex flex-col gap-8 md:pl-3">
          <Reveal>
            <h2 className="type-h1 text-chalk">
              {titulo.pre}
              <span className="stretch-y inline-block accent-grad">
                {titulo.accent}
              </span>
              {titulo.post}
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
        </div>
      </div>

      {/* El stack pasa DEBAJO y a ancho completo: la figura se queda con el
          costado del texto, y de paso las cards dejan de competir por los
          ~430px que les quedaban en la columna angosta. */}
      <div className="mt-10">
        <Reveal>
          <p className="eyebrow mb-4">{t.perfil.herramientas}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {grupos.map((g) => (
              <div
                key={g.categoria}
                data-reveal-item
                data-lente="suave"
                className="glass glass-hover p-4"
              >
                <p className="font-mono text-[0.7rem] tracking-wider text-acento uppercase">
                  {t.categoriasStack[g.categoria] ?? g.categoria}
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
    </TopicPanel>
  );
}
