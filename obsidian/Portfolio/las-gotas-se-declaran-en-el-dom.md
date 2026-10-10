---
proyecto: "[[Portfolio]]"
tipo: decisión técnica
fecha: 2026-10-09
---
# Las gotas se declaran en el DOM

Nada de coreografiar el líquido con posiciones a mano en el JS. Cada elemento
puede pedir gotas ancladas a **su** caja:

```html
<section data-gotas="0.93 0.3 205 0; 1.03 0.74 150 1" data-gotas-m="1.08 0.78 200 0">
```

`fx fy r tono [capa]`:
- `fx fy`: posición en fracción de la caja (pueden salirse de 0..1, para que la
  gota asome desde el borde),
- `r`: radio en unidades de escena (≈ px a 1000 px de lado corto),
- `tono`: 0 lima … 1 jade,
- `capa`: 0 detrás de Feli, 1 delante (la pileta).

`data-gotas-m` es la versión para pantallas angostas (< 760 px): en el celular
las gotas van a los **bordes**, nunca detrás de un párrafo.

Así el líquido **arma el escenario** pegado al contenido real: una gota detrás
de cada globo (para que el vidrio tenga qué doblar), detrás del botón
principal, a los costados de cada parada. Y como se lee la caja real en cada
cuadro, nunca se despega aunque cambie la fuente, el idioma o el tamaño.

Las gotas flotan solas (lento, como en microgravedad), el cursor las **empuja**
(no las atrae) y en desktop se pueden **agarrar y estirar** hasta partirlas.
Con "reducir movimiento" no flotan solas, pero siguen al scroll: la navegación
nunca se congela (lección de la v5.17.2).
