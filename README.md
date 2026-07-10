# Portfolio — Felipe Doval

Sitio personal de **Felipe "Feli" Doval** — desarrollador y builder de Buenos
Aires. **La navegación ES el balón-grafo**: cada nodo del modelo 3D es un tópico
(Perfil · Enfoque · Trabajo · Recorrido · Contacto). Se entra clickeando un nodo
o simplemente scrolleando (orden por defecto), y el balón rota para encarar el
nodo activo. Un HUD de consola marca el progreso y es el fallback accesible
(teclado / mobile / sin-WebGL), más páginas de detalle por proyecto.

**Dirección de diseño (v3 — "cielo"):** fondo **celeste** (cielo procedural CSS),
el balón **blanco** flota en él (UI espacial), texto **tinta** y acento **oro**
(guiño al sol). **Cero glow**: los nodos son **mini-soles** (shader GLSL) y los
contenedores flotantes son **Liquid Glass**. Los paneles no son "slides": el texto
flota sobre el cielo y el modelo se corre al costado, agrandándose. Tipografía
Bricolage Grotesque con estiramientos de firma. El elemento firma es el
**balón-grafo** 3D (pelota de fútbol × red de nodos). Detalle e historial (v2
"verde agua", v1) en [`DECISIONS.md`](./DECISIONS.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ·
Three.js + React Three Fiber v9 + drei (Bloom) · GSAP (ScrollTrigger) · Lenis ·
Bricolage Grotesque + Spline Sans Mono (`next/font`) · lucide-react.

> **Preview del 3D:** en una máquina sin GPU capaz se ve el poster estático. Para
> forzar el canvas 3D en cualquier equipo, agregá `?gl=1` a la URL
> (`/?gl=1`).

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
hooks/            useWebGL, useReducedMotion, useActiveSection, ...
lib/              fonts.ts (next/font), gpu.ts (sonda GPU), gsap.ts, utils.ts
public/assets/    logo, foto, modelos-3d, capturas
scripts/          smoke.ts (Playwright) · perf.ts (medidor de FPS)
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
3. **Cambiá el dominio** en un solo lugar: [`lib/site.ts`](./lib/site.ts)
   (`siteUrl`). De ahí lo toman metadata, OG, `sitemap.xml` y `robots.txt`.
4. Deploy.
5. **Validá el Lighthouse mobile** sobre el preview de Vercel (condiciones reales
   con GPU). Las métricas ya verificadas: CLS 0, JS inicial 225 KB, Accesibilidad
   / Best Practices / SEO 100, y Performance desktop 94. Ver `DECISIONS.md` (Fase
   9) para el detalle del entorno.

### SEO / metadata

- Metadata completa (title template, OG/Twitter) en `app/layout.tsx`.
- Imagen OG generada dinámicamente desde los tokens en
  [`app/opengraph-image.tsx`](./app/opengraph-image.tsx) (Archivo + celeste,
  sin ilustración).
- `sitemap.xml` y `robots.txt` en `app/sitemap.ts` / `app/robots.ts`.
- Favicons (derivados del logo de Felipe): `app/favicon.ico`, `app/icon.png`,
  `app/apple-icon.png`.

## Documentos

- [`DECISIONS.md`](./DECISIONS.md) — decisiones de diseño, versiones y bugs.
- [`TODO-FELI.md`](./TODO-FELI.md) — lo que falta que complete Felipe.
- [`CREDITS.md`](./CREDITS.md) — assets y licencias.
