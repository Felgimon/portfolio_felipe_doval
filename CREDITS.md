# CREDITS: assets y licencias

Todo lo que usa el sitio es propio de Felipe o de licencia libre (SIL OFL /
ISC / CC0). Desde la v6 **no hay ningún asset CC-BY** (la textura solar se fue
con el sol), así que no hay créditos obligatorios en el footer; igual se
nombra el origen de la tipografía, por honestidad.

## Tipografías (self-hosted, `app/fonts/`)

| Fuente | Uso | Archivo | Licencia |
|---|---|---|---|
| **Doval Script** | El nombre y los títulos de parada; favicons | `DovalScript.woff2` (web) · `brand/tipografia/DovalScript-Regular.otf/.ttf` (Mac/Figma) | **SIL OFL 1.1**. Derivada de **Norican** (Vernon Adams, © 2011 The Norican Project Authors), sin Reserved Font Name. Modificaciones © 2026 Felipe Doval: más peso, enderezada 4°, finales de palabra activados y finales acentuadas para el español. Licencia original en `brand/tipografia/LICENSE-Norican.txt`. |
| **Bricolage Grotesque** (variable) | Cuerpo y títulos de proyecto | `Bricolage-wght.woff2` | SIL OFL 1.1 (vía Fontsource) |
| **Spline Sans Mono** (variable) | Etiquetas | `SplineSansMono-wght.woff2` | SIL OFL 1.1 (vía Fontsource) |

Nota: la letra del screenshot de referencia es **Artisan Script de HRDR**
(comercial). **No** se usó ni se calcó: Doval Script es una derivación propia
de una fuente libre. Ver `brand/tipografia/LEEME.md`.

## La escena (sin assets de terceros)

El líquido, el vidrio y las burbujas son **código propio**: un fragment shader
WebGL (`lib/escena/shader.ts`). Técnicas de dominio público: la unión suave
con mezcla de color (`smin` cuadrático, publicada por Inigo Quilez) y la SDF de
rectángulo redondeado. El planteo del vidrio pintado dentro del shader salió
de la investigación de la v6 (prototipos propios). Cero texturas, cero modelos.

El póster sin WebGL (`public/assets/escena/poster*.webp`) es un render del
propio shader (`scripts/gen-poster.mjs`).

## Fotos

- Recortes de Felipe (`contenido/guia/*.png` → `public/assets/guia/*.webp`):
  fotos propias. El borde blanco de sticker y la limpieza del halo los genera
  `scripts/gen-guia.mjs`. Son interinas hasta la sesión de fotos de la v6.
- Capturas de proyectos (`public/assets/proyectos/`): de los proyectos de
  Felipe.

## Íconos

- **Lucide** (`lucide-react`): ISC License.
- **Simple Icons** (vía Iconify): CC0. Sólo GitHub y LinkedIn, extraídos a
  `lib/brand-icons.ts` con `scripts/gen-brand-icons.mjs`.
- **Favicons:** propios (`scripts/gen-favicons.mjs`): una gota lima con la F
  de Doval Script.

## Historial de assets retirados

v5: textura solar de Solar System Scope (CC BY 4.0), estudio blanco y sol en
three.js, motor de vidrio SVG (porteado de github.com/srdavo/liquid-glass, que
adapta el artículo de ekino-France). v4: Vía Láctea de ESO (CC BY 4.0). v3:
cielo de Poly Haven (CC0). Todo eso vive en el historial de git.

---

*Si agregás un asset de terceros, sumá acá nombre, autor, URL y licencia. Si es
CC-BY, además agregá el crédito visible en el footer.*
