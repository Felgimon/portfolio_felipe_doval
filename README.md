# Portfolio: Felipe Doval

Sitio personal de **Felipe "Feli" Doval**, desarrollador full stack y datos de
Buenos Aires: **https://felipedoval.com**.

## v6 «Visita guiada»

Feli te hace la visita: cada sección es una **parada** (Inicio, Perfil,
Enfoque, Trabajo, Recorrido, Contacto) y en cada una él sube desde el líquido,
señala lo que importa y dice una sola frase. De fondo, **burbujas de líquido
espeso** lima y jade que flotan, se funden y se pueden empujar y estirar con el
mouse; arriba, **vidrio líquido** que las refracta de verdad. El nombre y los
títulos van en **Doval Script**, una script de cartel propia.

Todo el porqué (versiones, decisiones, bugs) está en [`DECISIONS.md`](./DECISIONS.md)
y en las notas de [`obsidian/Portfolio/`](./obsidian/Portfolio/Portfolio.md).

## Stack

Next.js 16 (App Router, 100% estático) · React 19 · TypeScript strict ·
Tailwind CSS v4 · **WebGL 1 crudo** (un fragment shader, sin three.js) · GSAP +
Lenis · next/font local (Doval Script, Bricolage Grotesque, Spline Sans Mono) ·
lucide-react · Vercel Analytics.

## Cómo funciona la escena

Un solo `<canvas>` fijo detrás de todo (`components/escena/Escena.tsx`) pinta,
en una pasada, el líquido, las fotos de Feli y el vidrio. El DOM declara qué
pintar con atributos y la escena los lee en cada cuadro:

| Atributo | Qué hace |
|---|---|
| `data-gotas="fx fy r tono [capa]; ..."` | gotas ancladas a la caja del elemento (`data-gotas-m` para < 760px) |
| `data-vidrio` | el elemento es vidrio: el shader pinta su refracción |
| `data-feli` + `data-pose-src` | una foto del guía (con su pileta de líquido) |
| `data-nav-activo` | la cápsula de líquido bajo el link activo de la nav |

`<html data-escena>` vale `cargando`, `lista` o `poster` (sin WebGL o equipo
que no llega: póster estático, fotos como `<img>` y vidrio sólido). La calidad
baja sola si el equipo no llega (`lib/rendimiento.ts`).

Debug: `?fx=full` (fuerza GPU completa), `?perf=alto|bajo|minimo`, `?stats` (FPS).

## Requisitos y setup

Node.js ≥ 22.18 (los scripts `.ts` corren directo con node) y npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm run start` | Build de producción / servirlo |
| `npm run gate` | typecheck + lint + build |
| `npm run smoke` | Abre las páginas y falla si hay errores de consola (`SMOKE_ROUTES`, `SMOKE_VIEWPORT`) |
| `npm run audit` | Auditoría de riesgo: sin WebGL, teclado, mail, idioma del texto, reducir movimiento |
| `npm run idioma` | Español/inglés automático, sin errores de hidratación |
| `npm run touch` | El celular de verdad (393×659) |
| `npm run anim` | El líquido se mueve (y no, con reducir movimiento) |
| `npm run perf` | Frame time por parada (comparativo) |

Sin GPU (contenedores, CI): `GL_SOFT=1`; con un Chromium propio:
`PW_CHROMIUM=/ruta/al/chrome`. Ver `scripts/lib/servidor.mjs`.

Generadores (correr cuando cambia lo visual): `scripts/gen-guia.mjs` (fotos del
guía), `gen-poster.mjs` (póster sin WebGL), `gen-og.mjs` (imagen al compartir),
`gen-favicons.mjs`.

## Estructura

```
app/                rutas: layout, home, proyectos/[slug], 404, error, fonts/
components/
  escena/           el canvas: líquido + Feli + vidrio
  guia/             Feli (la foto) y su Globo (la frase), la "voz"
  secciones/        las seis paradas, el caso de proyecto y la parada perdida
  layout/           nav, footer, saltar al contenido
lib/escena/         motor WebGL, shader, parser de gotas
content/            ⭐ la fuente de verdad: perfil, proyectos, ui, guia (lo que dice Feli)
contenido/guia/     los recortes originales de Feli (fuente de las poses)
brand/tipografia/   Doval Script (OTF/TTF para la Mac y Figma) y cómo se construye
obsidian/Portfolio/ las notas del proyecto (se enlazan al vault con scripts/obsidian-enlazar.sh)
scripts/            tests (Playwright) y generadores
```

## Editar el contenido

- Bio, links, stack, recorrido: `content/perfil.ts` (+ `perfil.en.ts`).
- Proyectos: `content/proyectos.ts` (+ `proyectos.en.ts`).
- Lo que dice Feli en cada parada y qué pose usa: `content/guia.ts`.
- Textos de la interfaz: `content/ui.ts`.

Pendientes de Felipe: [`TODO-FELI.md`](./TODO-FELI.md). Créditos y licencias:
[`CREDITS.md`](./CREDITS.md).

## Deploy

Vercel (proyecto `felipe.doval.portfolio`, cuenta `felgimon`). El push a `main`
deploya; si el webhook falla, `npx vercel --prod`. El dominio se cambia en un
solo lugar: `lib/site.ts`.
