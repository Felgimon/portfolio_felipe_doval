# CREDITS: assets y licencias

Todo lo que usa el sitio es propio de Felipe, de licencia libre (SIL OFL /
ISC / CC0) o generado para el sitio (los cianotipos del fondo, ver abajo). No hay ningún asset CC-BY, así que no hay créditos obligatorios en
el footer; el origen de la tipografía queda documentado acá.

## Tipografía (self-hosted, `app/fonts/`)

Una sola fuente en todo el sitio (v7):

| Fuente | Uso | Archivo | Licencia |
|---|---|---|---|
| **Doval Grotesk** (variable: peso 100 a 900, ancho 62% a 125%) | Todo: nombre, títulos, texto, etiquetas, favicons | `DovalGrotesk.woff2` (web) · `brand/tipografia/doval-grotesk/DovalGrotesk.ttf` (Mac/Figma) | **SIL OFL 1.1**. Versión modificada de **Archivo** (Omnibus-Type, © 2020 The Archivo Project Authors), sin Reserved Font Name. Modificaciones © 2026 Felipe Doval: renombrada, recortada a latín, flechas propias (↗ → ← ↓ ↑ ↘) variables en peso y ancho, y 54 estilos con nombre. Licencia original en `brand/tipografia/doval-grotesk/LICENSE-Archivo-OFL.txt`. |

La dirección tipográfica sale de **Tahoe** (una de las fuentes que eligió
Felipe, comercial): no se usó ni se calcó, se buscó una fuente libre del mismo
género (grotesca extendida y pesada). Análisis completo en `DECISIONS.md`
(v7.0) y en `brand/tipografia/LEEME.md`.

La **Doval Script** de la v6 (derivada de Norican, SIL OFL) ya no se usa en el
sitio; queda en `brand/tipografia/doval-script/` con su licencia.

## La escena (sin assets de terceros)

La gota, el vidrio ahumado y el estudio son **código propio**: un fragment
shader WebGL 2 (`lib/escena/shader.ts`). Técnicas de dominio público:
raymarching de SDF, unión suave (`smin` cuadrático, publicada por Inigo
Quilez), normales por diferencias centrales, Fresnel de Schlick y la SDF de
rectángulo redondeado. Cero texturas de terceros, cero modelos.

## Fotos

- Recortes de Felipe (`contenido/guia/*.png` → `public/assets/guia/*.webp`):
  fotos propias. La limpieza del halo la hace `scripts/gen-guia.mjs` (desde
  la v7, sin borde de sticker). Son interinas hasta la sesión de fotos.
- Capturas de proyectos (`public/assets/proyectos/`): de los proyectos de
  Felipe.

## Los cianotipos del fondo (v8)

`brand/cianotipos/*.jpg` (originales) → `public/assets/cianotipos/*.webp` (mapas
de luz, `scripts/gen-cianotipos.mjs`; las composiciones grandes de escritorio,
`*-grande.webp`, con `scripts/componer-cianotipos.py`). Seis fotogramas en cianotipo de objetos
de todos los días (auriculares, una lupa, teclas, zapatillas, dos tazas, un
mapa), **generados con IA** para este sitio (GPT Image 2.5, vía Higgsfield, con
la cuenta de Felipe). Son ilustrativos: no son fotos de objetos de Felipe. Si
algún día hay fotos o cianotipos propios de sus cosas, se reemplazan con el
mismo script.

En la v9.1 se sumaron, con el mismo estilo y la misma referencia, un piano de
cola, libros, una pelota de fútbol, un mate, un cubo de Rubik, una laptop, un
metrónomo y la música separada en objetos sueltos (`brand/cianotipos/nuevos/`).
Desde entonces las secciones no usan los fotogramas enteros: cada objeto se
recorta y se vuelve a acomodar, disperso y girado (`*-grande.webp` en
escritorio, `*-m.webp` en el celular). Sólo el mapa del 404 va entero.

El papel del fondo (`brand/papel.jpg` → `public/assets/papel.webp`, v8.1)
también está generado para el sitio, con el mismo estilo.

Las referencias del mood board (en el Figma, no en el sitio) son de dominio
público o CC0 vía Openverse: los cianotipos de Anna Atkins (1843–1854) y fotos
CC0 de rawpixel, StockSnap y Flickr.

## Sonido (v8, la canción en v9)

Sin archivos: la canción y los sonidos de la interfaz los sintetiza el
navegador con Web Audio (`lib/sonido.ts`), sobre una partitura original
(`lib/musica.ts`). La sala (reverb) es una respuesta al impulso generada en el
momento.

## Íconos

- **Lucide** (`lucide-react`): ISC License.
- **Simple Icons** (vía Iconify): CC0. Sólo GitHub y LinkedIn, extraídos a
  `lib/brand-icons.ts` con `scripts/gen-brand-icons.mjs`.
- **Favicons:** propios (`scripts/gen-favicons.mjs`): la F de Doval Grotesk
  extendida y negra sobre la luz de estudio cobalto.

## Historial de assets retirados

v6: Doval Script en el sitio, Bricolage Grotesque y Spline Sans Mono (SIL OFL),
el póster del líquido. v5: textura solar de Solar System Scope (CC BY 4.0), estudio blanco y sol en
three.js, motor de vidrio SVG (porteado de github.com/srdavo/liquid-glass, que
adapta el artículo de ekino-France). v4: Vía Láctea de ESO (CC BY 4.0). v3:
cielo de Poly Haven (CC0). Todo eso vive en el historial de git.

---

*Si agregás un asset de terceros, sumá acá nombre, autor, URL y licencia. Si es
CC-BY, además agregá el crédito visible en el footer.*
