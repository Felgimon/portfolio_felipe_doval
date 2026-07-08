# CREDITS — assets y licencias

Todos los assets del portfolio son propios de Felipe o de licencia libre
(CC0 / SIL OFL / ISC). **Al día de hoy no hay ningún asset con licencia CC-BY**,
así que no hace falta una línea de atribución obligatoria en el footer. Si en el
futuro se agrega un asset CC-BY (ej. un HDRI de Poly Haven o un modelo de
Sketchfab), se documenta acá y se agrega el crédito visible.

## Tipografías (v2)

| Fuente | Uso | Origen | Licencia |
|---|---|---|---|
| **Bricolage Grotesque** (variable, opsz+wght) | Display + body (títulos, logo, texto) | Google Fonts (`next/font`) | SIL OFL 1.1 |
| **Spline Sans Mono** | Datos / labels de nodo / eyebrows | Google Fonts (`next/font`) | SIL OFL 1.1 |
| **Archivo Black** | Solo la imagen OG (`app/opengraph-image.tsx`) | Omnibus-Type vía Google Fonts | SIL OFL 1.1 (ver `app/fonts/OFL.txt`) |

## Modelos 3D

| Archivo | Qué es | Origen | Licencia |
|---|---|---|---|
| `pelota-estructura.glb` | Balón-grafo (icosaedro truncado como red) | Generado proceduralmente (trimesh) por Felipe | CC0 (propio) |
| `pelota-facetada.glb` | Balón facetado sólido | Generado proceduralmente por Felipe | CC0 (propio) |
| `esfera-lowpoly.glb` | Icoesfera facetada | Generado proceduralmente por Felipe | CC0 (propio) |

## Logo y marca (v2)

- Logo **FD·** (monograma + nodo, wordmark): el guión bajo de terminal
  evolucionó a un nodo verde agua con glow (`components/ui/Logo.tsx`), atando la
  marca al balón-grafo. Compuesto con Bricolage Grotesque. Propio.
- Color de marca **verde agua `#8FE3C6`** (seafoam sólido). Propio.
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
