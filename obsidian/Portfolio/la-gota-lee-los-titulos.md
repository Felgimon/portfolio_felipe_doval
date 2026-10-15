---
proyecto: "[[Portfolio]]"
tipo: decisión
fecha: 2026-10-11
---
# La gota lee los títulos

El concepto de la v7: un **estudio fotográfico cobalto** (de `#1736BD` a azul
noche `#071447`) con los títulos **impresos en el fondo**, y una **gota de
vidrio claro** que va de título en título y se apoya en una letra. A través del
vidrio la letra se ve aumentada y doblada, con un borde de color por la
dispersión.

## Por qué así
- Es vidrio de verdad, no un efecto de "glassmorphism": la gota es
  raymarching de una forma 3D, con refracción, reflejo de un estudio con
  softbox y brillo duro.
- Le da un recorrido a la página: la gota acompaña el scroll y en el inicio
  sigue al mouse de lejos.
- Cualquier título funciona igual: no depende de una ilustración.
- Probé antes una burbuja, una cinta de vidrio, una gota oscura abajo y la
  gota sobre el nombre. La cinta parecía un gusano y la gota oscura era
  aburrida; la gota-lente sobre la letra es la que tiene una idea.

## Cómo está hecho
- Cada título tiene `data-placa`: la escena lo dibuja una vez en una textura
  con la misma fuente y el texto del DOM queda transparente (se sigue pudiendo
  leer, copiar y lo leen los lectores de pantalla).
- Cada sección dice dónde se apoya la gota con `data-gota="fx fy r"`, en
  fracciones de SU título.
- Los paneles de la UI son **vidrio ahumado**: refractan lo de atrás, se
  oscurecen hacia noche y tienen un canto de luz.
- Un solo acento de color: **ámbar**, sólo para el estado "Ahora".
- Sin WebGL 2: el estudio en gradiente CSS y los títulos como texto común.

Detalle técnico en `DECISIONS.md` (v7.0) del repo.
