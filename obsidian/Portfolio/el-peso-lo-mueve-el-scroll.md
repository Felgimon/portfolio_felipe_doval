---
proyecto: "[[Portfolio]]"
tipo: decisión
fecha: 2026-11-26
---
# El peso lo mueve el scroll

La v10 tiró la escena WebGL entera. Lo que quedó como firma es más barato y
más mío: **el peso de la letra**.

## La letra
Piazzolla, de Huerta Tipográfica: de Buenos Aires, con nombre de músico. Curvas
que se quiebran en ángulos, paso corto de grueso a fino, remates en cuña. Se
usa en las dos puntas: hairline cursiva y negra cursiva.

## El motivo
- Los títulos entran flacos y engordan de 100 a 900 mientras suben.
- En el inicio el peso pasa de «Felipe» a «Doval» mientras se separan.
- En Contacto las filas engordan al pasar el mouse.
- La cursiva se inclina más cuanto más rápido se scrollea.

## El color
Amarillo taxi, tinta, papel y un rojo que aparece una vez. Planos. Se evitó el
crema con serif fina y terracota, que hoy delata IA.

## Lo que aprendí
Un título que cambia de peso cambia de ancho y empuja todo. La solución fue un
molde invisible en negra que reserva el lugar. Y `overflow: hidden` en un
ancestro rompe `position: sticky`: va `overflow: clip`.

Relacionado: [[las-reglas-de-gusto-que-ya-estaban]].
