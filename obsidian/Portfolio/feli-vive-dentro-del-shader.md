---
proyecto: "[[Portfolio]]"
tipo: decisión técnica
fecha: 2026-10-09
---
> **v6 (historia).** En la v7 Feli sigue pintado en el shader, pero sin globos ni pileta: ver [[la-gota-lee-los-titulos]].

# Feli vive dentro del shader

La foto de Feli no es un `<img>` encima del fondo: **se pinta dentro del mismo
shader** que el líquido. En el DOM queda un botón transparente con la caja
exacta de la foto (con `aspect-ratio`, así no hay saltos de layout).

Por qué:
1. **La pileta.** Las fotos tienen un corte recto abajo. Una pileta de líquido
   pintada **delante** de Feli lo tapa, y él queda apoyado en el líquido. Con un
   `<img>` encima del canvas eso es imposible.
2. **Sube del líquido.** Cuando llega su parada, Feli emerge (el corte va
   bajando con el scroll); en el inicio, sube al cargar.
3. **El vidrio lo puede doblar** si un globo le pasa por encima.

La sombra dura jade (abajo a la derecha, la dirección de la luz del sitio) la
pinta el shader, no está horneada en la foto. El **borde blanco de sticker sí**
está horneado (`scripts/gen-guia.mjs`), que además limpia el halo claro que
dejan los recortes automáticos.

Sin WebGL, el `<img>` de adentro del botón se ve, con la misma sombra jade por
CSS y la base disuelta con una máscara.

Huevo de pascua: tocalo. Contesta cuatro veces y a la quinta **se hunde en la
pileta** y deja un cartel "Ahora vuelvo".
