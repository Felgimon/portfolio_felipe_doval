# Portfolio — Felipe Doval

Sitio personal de **Felipe "Feli" Doval** — estudiante y builder de Buenos Aires
(fútbol × ML). Single-page con scroll narrativo, hero 3D interactivo y páginas de
detalle por proyecto.

**Dirección de diseño:** "Noche de estadio" — lienzo dark azulado, celeste
bandera como señal, tipografía Archivo (argentina, la del logo) en cut expandido.
El elemento firma es el **balón-grafo** 3D (una pelota de fútbol que también se
lee como red de pases / red neuronal). Detalle completo en
[`DECISIONS.md`](./DECISIONS.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ·
Three.js + React Three Fiber v9 + drei · GSAP (ScrollTrigger + SplitText) ·
Lenis · Motion · lucide-react.

Las versiones exactas y el porqué de cada una están en
[`DECISIONS.md`](./DECISIONS.md).

## Requisitos

- Node.js ≥ 20 (desarrollado con Node 26).
- npm.

## Setup

```bash
npm install
npx playwright install chromium   # solo la primera vez (para el smoke test)
npm run dev                       # http://localhost:3000
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack). |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción. |
| `npm run typecheck` | `tsc --noEmit` — chequeo de tipos. |
| `npm run lint` | ESLint. |
| `npm run gate` | typecheck + lint + build (el gate mínimo de cada fase). |
| `npm run smoke` | Smoke test con Playwright (requiere `build` previo). Abre el sitio, saca screenshots y falla si hay errores de consola. |
| `npm run analyze` | Build con el analizador de bundle (`@next/bundle-analyzer`). |

### Verificación completa (lo que se corre al cerrar cada fase)

```bash
npm run gate && npm run smoke
```

El smoke test acepta variables de entorno:
`SMOKE_ROUTES="/,/proyectos/superlum"` y `SMOKE_VIEWPORT="390,844"` (mobile).

Probar en el celular (misma red): `npm run dev -- -H 0.0.0.0` y entrar desde tu
IP local.

## Estructura

```
app/              Rutas (App Router): layout, page (single-page), globals.css,
                  proyectos/[slug], fonts/ (TTF de Archivo)
components/       ui/ · sections/ · three/ · motion/
content/          ⭐ ÚNICA fuente de verdad, tipada:
                    perfil.ts     → bio, links, stack, timeline
                    proyectos.ts  → los 7 proyectos
                    types.ts      → tipos
hooks/            useLenis, useGpuTier, useActiveSection, ...
lib/              fonts.ts (next/font), gsap.ts, utils.ts
public/assets/    logo, foto, modelos-3d, capturas
scripts/          smoke.ts (Playwright)
contenido/        material original que pasó Felipe (fuente, no se sirve)
```

## Cómo editar el contenido

Todo el texto y los datos del sitio salen de **`content/`** (TypeScript tipado):

- **Tu bio, links, stack y recorrido:** `content/perfil.ts`.
- **Proyectos** (títulos, descripciones, stack, links, capturas):
  `content/proyectos.ts`. Para agregar una captura real, ponela en
  `public/assets/proyectos/<slug>/` y cargá su ruta en `capturas`, sacando
  `falta: true`.

Lo que falta completar está listado en [`TODO-FELI.md`](./TODO-FELI.md).

## Deploy (Vercel)

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com) → *New Project* → importá el repo.
   Vercel detecta Next.js solo (build `next build`, sin config extra).
3. Configurá tu dominio y actualizá la URL en `app/layout.tsx`
   (`metadataBase`) y en el `sitemap`/`robots` (Fase 10).
4. Deploy.

## Documentos

- [`DECISIONS.md`](./DECISIONS.md) — decisiones de diseño, versiones y bugs.
- [`TODO-FELI.md`](./TODO-FELI.md) — lo que falta que complete Felipe.
- [`CREDITS.md`](./CREDITS.md) — assets y licencias.
