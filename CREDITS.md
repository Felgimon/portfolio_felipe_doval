# CREDITS — assets y licencias

Todos los assets del portfolio son propios de Felipe o de licencia libre
(CC0 / dominio público / SIL OFL / ISC), **con DOS excepciones CC-BY**: la
panorámica de la Vía Láctea de ESO y la textura solar de Solar System Scope
(ver tablas), ambas acreditadas visiblemente en el footer del sitio como exige
la licencia. Si se agrega otro asset CC-BY, se documenta acá y se suma su
crédito visible.

## Tipografías (v2.1 — self-hosted)

Todas locales (`next/font/local`, `app/fonts/*.woff2`) — cero dependencia de red
en build. Los variable woff2 salen de [Fontsource](https://fontsource.org) (mismos
archivos que Google Fonts, OFL).

| Fuente | Uso | Archivo | Licencia |
|---|---|---|---|
| **Bricolage Grotesque** (variable wght) | Display + body | `Bricolage-wght.woff2` | SIL OFL 1.1 |
| **Spline Sans Mono** (variable wght) | Datos / labels de nodo / eyebrows | `SplineSansMono-wght.woff2` | SIL OFL 1.1 |
| **Archivo Black** | Imagen OG + logo 3D (`public/fonts/logo.ttf`) | `ArchivoBlack-Regular.ttf` | SIL OFL 1.1 (ver `app/fonts/OFL.txt`) |

## Modelos 3D

| Archivo | Qué es | Origen | Licencia |
|---|---|---|---|
| `pelota-estructura.glb` | Balón-grafo (icosaedro truncado como red) | Generado proceduralmente (trimesh) por Felipe | CC0 (propio) |
| `pelota-facetada.glb` | Balón facetado sólido | Generado proceduralmente por Felipe | CC0 (propio) |
| `esfera-lowpoly.glb` | Icoesfera facetada | Generado proceduralmente por Felipe | CC0 (propio) |

## Fondo (v5 — ESTUDIO BLANCO, sin assets)

El fondo ya no es una imagen: es un ESTUDIO BLANCO 3D generado en vivo
(`components/three/Studio.tsx`) — una cúpula/ciclorama con un shader de
gradiente por altura (pared + piso) y la sombra del sol como una textura
radial dibujada en canvas. Cero archivos, cero terceros.

Historial de fondos retirados: v4.2 usó una nebulosa procedural propia
(GLSL, WebP); v4.0/v4.1 la panorámica real de la Vía Láctea (ESO/S. Brunier,
CC BY 4.0); v3 el cielo diurno de Poly Haven (CC0). También se retiró el
contenedor de metal (icosaedro truncado, propio) y los asteroides con textura
de roca lunar de NASA. Todo eso vive en el historial de git.

## Liquid Glass (v5.8 — técnica adaptada, sin assets)

El efecto de vidrio líquido de la UI (`lib/lente.ts` + `LiquidGlass.tsx`) está
porteado del web component de **Salvador Camacho**
(github.com/srdavo/liquid-glass), que a su vez adapta el enfoque del artículo
de **ekino-France** (medium.com/ekino-france/liquid-glass-in-css-and-svg).
Es código adaptado a TypeScript/React con calibración propia por tamaño de
elemento; no se incluye ningún archivo de terceros.

## Textura solar (v3.6 — CC-BY, con crédito en el footer)

| Archivo | Qué es | Origen | Licencia |
|---|---|---|---|
| `public/textures/sol.jpg` (2K) | Superficie solar fotográfica (equirectangular, granulación real) — base del sol central y los mini-soles | [Solar System Scope — Textures](https://www.solarsystemscope.com/textures/) (derivada de imágenes NASA/SDO) | **CC BY 4.0** → crédito visible en el footer del sitio |

## Logo y marca (v3)

- Logo **FD·** (monograma + nodo, wordmark): el guión bajo de terminal
  evolucionó a un nodo (círculo oro) (`components/ui/Logo.tsx`), atando la
  marca a los soles del grafo. Compuesto con Bricolage Grotesque. Propio.
- Acento de texto **azul celeste profundo `#0B5385`** (+ gradiente
  `.accent-grad`); **oro `#E0A63A`** reservado a los soles 3D y micro-marcas.
  Propio.
- **Favicons**: micro-grafo de nodos generado con solo primitivas circle/line
  (`scripts/gen-favicons.mjs`). Propio.
- **Poster de fallback** (`public/assets/hero-poster.png`): render propio del
  balón, recoloreado a verde agua con `sharp` (rotación de matiz).

## Íconos

- **Lucide** (`lucide-react`) — ISC License. Íconos de UI.
- **Simple Icons** (vía Iconify) — CC0. Solo los íconos de marca **GitHub** y
  **LinkedIn** (lucide ya no incluye íconos de marca). Extraídos offline y
  mínimos a `lib/brand-icons.ts` con `scripts/gen-brand-icons.mjs` (no se
  bundlea la colección completa).

## Fotos

- Fotos de Felipe (`foto_frente`, `foto_casual`): propias.

---

*Si agregás un asset de terceros, sumá acá: nombre, autor, URL y licencia. Si es
CC-BY, además agregá el crédito en el footer del sitio.*
