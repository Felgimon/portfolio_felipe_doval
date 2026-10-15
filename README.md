# Portfolio: Felipe Doval

Sitio personal de **Felipe "Feli" Doval**, desarrollador full stack y datos de
Buenos Aires: **https://felipedoval.com**.

## v7 «Vidrio y cobalto»

Un estudio fotográfico cobalto que cae a azul noche. Los títulos van
**impresos en el fondo** en Doval Grotesk extendida y negra, y una **gota de
vidrio claro** (raymarching de verdad, con refracción y dispersión) viaja de
título en título y se apoya en una letra, que se ve aumentada y doblada a
través del vidrio. La UI es **vidrio ahumado** que refracta lo que tiene
detrás. Feli acompaña la visita en **fotos**, sin hablar. Una sola fuente en
todo el sitio: **Doval Grotesk** (`brand/tipografia/doval-grotesk/`).

Todo el porqué (versiones, decisiones, bugs) está en [`DECISIONS.md`](./DECISIONS.md)
y en las notas de [`obsidian/Portfolio/`](./obsidian/Portfolio/Portfolio.md).

## Stack

Next.js 16 (App Router, 100% estático) · React 19 · TypeScript strict ·
Tailwind CSS v4 · **WebGL 2 crudo** (un fragment shader, sin three.js) · GSAP +
Lenis · next/font local (una sola fuente: Doval Grotesk, variable en peso y
ancho) · lucide-react · Vercel Analytics.

## Cómo funciona la escena

Un solo `<canvas>` fijo detrás de todo (`components/escena/Escena.tsx`) pinta,
en una pasada, el estudio, los títulos, las fotos de Feli, la gota y el vidrio
ahumado. El DOM declara qué pintar con atributos y la escena los lee en cada
cuadro:

| Atributo | Qué hace |
|---|---|
| `data-placa` | un título "impreso": se dibuja en una textura con su misma fuente y la gota lo refracta; el texto del DOM queda transparente (sigue ahí para leer y copiar) |
| `data-gota="fx fy r"` | en una sección: dónde se apoya la gota cuando esa sección está activa, en fracciones de su título (`data-gota-m` para < 768px) |
| `data-vidrio` | el elemento es vidrio ahumado: el shader pinta su refracción |
| `data-feli` + `data-pose-src` | una foto de Feli (con el pie fundido) |

`<html data-escena>` vale `cargando`, `lista` o `poster` (sin WebGL 2 o equipo
que no llega: el estudio en gradiente CSS, los títulos como texto, las fotos
como `<img>` y el vidrio sólido). La calidad baja sola si el equipo no llega
(`lib/rendimiento.ts`).

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
| `npm run anim` | La gota ondula sola (y no, con reducir movimiento) |
| `npm run perf` | Frame time por sección (comparativo) |

Sin GPU (contenedores, CI): `GL_SOFT=1`; con un Chromium propio:
`PW_CHROMIUM=/ruta/al/chrome`. Ver `scripts/lib/servidor.mjs`.

Generadores (correr cuando cambia lo visual): `scripts/gen-guia.mjs` (fotos de
Feli), `gen-og.mjs` (imagen al compartir), `gen-favicons.mjs`. La fuente se
arma con `brand/tipografia/doval-grotesk/construir.py`.

## Estructura

```
app/                rutas: layout, home, proyectos/[slug], 404, error, fonts/
components/
  escena/           el canvas: estudio + títulos + Feli + gota + vidrio
  guia/             Feli (las fotos que acompañan)
  secciones/        las siete secciones, el caso de proyecto y el 404
  layout/           nav, footer, saltar al contenido
lib/escena/         motor WebGL 2 y shader
content/            ⭐ la fuente de verdad: perfil, proyectos, ui, guia (qué foto va en cada sección)
contenido/guia/     los recortes originales de Feli (fuente de las poses)
brand/tipografia/   Doval Grotesk (TTF para la Mac y Figma, cómo se construye) y la Doval Script de la v6
obsidian/Portfolio/ las notas del proyecto (se enlazan al vault con scripts/obsidian-enlazar.sh)
scripts/            tests (Playwright) y generadores
```

## Editar el contenido

- Bio, links, stack, recorrido: `content/perfil.ts` (+ `perfil.en.ts`).
- Proyectos: `content/proyectos.ts` (+ `proyectos.en.ts`).
- Qué foto de Feli va en cada sección: `content/guia.ts`.
- Textos de la interfaz: `content/ui.ts`.

Pendientes de Felipe: [`TODO-FELI.md`](./TODO-FELI.md). Créditos y licencias:
[`CREDITS.md`](./CREDITS.md).

## Deploy

Vercel (proyecto `felipe.doval.portfolio`, cuenta `felgimon`). El push a `main`
deploya; si el webhook falla, `npx vercel --prod`. El dominio se cambia en un
solo lugar: `lib/site.ts`.
