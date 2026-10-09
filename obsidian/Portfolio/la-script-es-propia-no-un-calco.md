---
proyecto: "[[Portfolio]]"
tipo: decisión
fecha: 2026-10-09
---
# La script es propia, no un calco

La font del screenshot ("Introducing Artisan Script") existe: es **Artisan
Script de HRDR**, comercial (licencia desktop ~USD 19 en Creative Market /
YouWorkForThem / Envato; el uso web pide su propia licencia).

**No se calcó del screenshot.** Dos razones:
1. Es el trabajo vendido de un diseñador; clonarla para no pagar USD 19 no está bien.
2. Técnicamente tampoco da: en un JPG hay ~10 letras unidas entre sí. No alcanza para un alfabeto.

## Lo que se hizo: Doval Script

Una script retro propia, derivada de **Norican** (Vernon Adams, SIL OFL 1.1,
sin *Reserved Font Name*), que fue la más parecida en espíritu entre 21 familias
script libres. Las finalistas fueron Yellowtail y Damion, pero resultaron más
inclinadas y livianas.

Cambios sobre Norican:
- **Más peso**: el contorno engrosado 32 u. en horizontal y 18 u. en vertical, para mantener el contraste. Las astas pasan de ~200 a ~265 u.
- **Más derecha**: enderezada 4° (de ~15° a ~11°), con el pivote a la altura de las uniones.
- **Finales de palabra** activados por defecto (`calt`), con 53 finales acentuadas nuevas para el español (está, diseñó).
- Sin hinting, nombres nuevos y copyright original + "Modificaciones © 2026 Felipe Doval".

Archivos en el repo: `brand/tipografia/` (OTF/TTF para la Mac y Figma, espécimen y
licencia) y `app/fonts/DovalScript.woff2` (para la web). Cómo reconstruirla:
`brand/tipografia/herramientas/LEEME.md`.

## Para usarla en Figma

Doble clic en `DovalScript-Regular.otf` → **Instalar** (Catálogo Tipográfico).
Reiniciá Figma desktop. Si usás Figma en el navegador, necesitás el *Figma font
installer* corriendo.

## Detalles heredados de Norican (no se tocaron)

- La "ü" chica puede leerse como "ii".
- Los acentos de Ñ e Í quedan corridos a la izquierda (siguen el swash de la mayúscula).
- Las rayas – y — se parecen.

Ninguno molesta en títulos, que es para lo que es.

> Si algún día querés la Artisan Script original: comprala (desktop + web) y es
> un cambio de una línea en `lib/fonts.ts`.
