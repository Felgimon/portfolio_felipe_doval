---
proyecto: "[[Portfolio]]"
tipo: proceso
fecha: 2026-10-11
---
# El Figma son capas, no una captura

El diseño final está en Figma, archivo **Mood Board Portfolio**, página
**Diseño v7**: el sistema visual (color, tipografía, componentes) y las 7
secciones en desktop (1440) y en mobile (393).

## Cómo se armó
1. Prototipo en HTML con la escena WebGL real.
2. Para cada sección: una captura del fondo **sin títulos ni gota**, los
   títulos como **contornos** de Doval Grotesk, la **gota como imagen con
   transparencia** encima, y la UI como **texto editable**.
3. El texto editable usa **Archivo** (Figma ya la tiene y tiene los mismos
   contornos). Los títulos van en contornos porque Figma no tiene el ancho
   extendido de Archivo.

El primer intento fue importar la captura entera con texto encima: se veía
igual, pero no era un diseño (no se podía editar nada). Se rehízo en capas.

## Después del Figma
Se implementó en el repo y se comparó sección por sección con capturas del
sitio real (desktop y celular). Ver [[como-se-verifica]].
