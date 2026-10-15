---
proyecto: "[[Portfolio]]"
tipo: decisión técnica
fecha: 2026-10-09
---
> **v6 (historia).** En la v7 el vidrio se sigue pintando en el shader, ahora ahumado sobre cobalto: ver [[la-gota-lee-los-titulos]].

# El vidrio se pinta en el shader

En la v5 el liquid glass era un filtro SVG (`feDisplacementMap`) dentro de
`backdrop-filter`. Funcionaba, pero:

- **Sólo en Chromium.** Safari, Firefox y **todo iOS** (Chrome en iPhone es
  WebKit) se quedaban con un blur, que es justo lo que Feli dijo que "no es
  liquid glass, en absoluto".
- **Carísimo sobre un fondo animado:** medido en la v5.14, el filtro era el
  **78 % del costo de cada cuadro**. Con un líquido que se mueve todo el tiempo,
  cada panel se recalculaba en cada cuadro.

## Cómo es ahora

El mismo fragment shader que pinta el líquido pinta el vidrio: el DOM marca los
paneles con `data-vidrio`, la escena lee sus rectángulos y, adentro de cada uno,
**muestrea la escena en un punto desplazado** (el centro magnifica un poco, el
bisel empuja hacia afuera). Una sola pasada, **en todos los navegadores**.

Se conservó lo que a Feli le gustó:
- la **aberración cromática** en el borde (el canto cian),
- el **vidrio que se hunde** al apretar,
- el **barrido especular** al pasar el mouse.

La escarcha es un 28 % de blanco, calculada para que la tinta (`#0F3D2E`) pase
AA aun sobre la zona más oscura del líquido.

## La trampa que esto resuelve

La refracción sólo se ve si atrás hay algo con bordes: sobre papel blanco liso
el mejor vidrio del mundo no muestra nada. Por eso **cada vidrio declara gotas
detrás** ([[las-gotas-se-declaran-en-el-dom]]): el globo de Feli, el botón
principal, la nav (con su cápsula).

Sin WebGL, el vidrio se vuelve **sólido** (papel con borde tinta), no un blur
falso.
