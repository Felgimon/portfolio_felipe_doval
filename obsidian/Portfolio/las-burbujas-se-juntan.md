---
proyecto: "[[Portfolio]]"
tipo: decisión
fecha: 2026-10-17
---
# Las burbujas se juntan

Antes había una sola gota que iba de título en título. Pedí varias burbujas
por sección, de distintos tamaños, que se queden en su sección; y que con el
mouse sobre un botón se junten todas en él y sean una sola con su forma.

- **Tres por sección**: la grande sobre una letra del título y dos más chicas
  en el aire o sobre un objeto del fondo (la lamparita, el compás, la pelota,
  una taza), que así se agranda. Se declaran en el DOM, como antes las gotas
  ([[las-gotas-se-declaran-en-el-dom]]): `data-burbujas="fx fy r; …"`.
- **Se quedan en su sección**: se mueven con su caja (el scroll no las
  arrastra), flotan apenas y miran un poco al mouse.
- **El hover**: las que se ven salen **disparadas** hacia el botón, de la más
  cerca a la más lejos, estiradas en la dirección en la que van. Al llegar se
  achican, **se funden como líquido** y se vuelven la píldora del botón. Al
  salir, cada una vuelve a su lugar.
- **Lo que costó**: la primera versión tardaba el doble por cuadro aunque no
  hubiera burbujas en pantalla. Era que el dibujo de las burbujas se llamaba en
  tres lugares del shader y cada uno se pagaba en toda la pantalla. Con una
  sola llamada por píxel, ahora es más rápido que la gota sola de antes.

Ver también [[los-hovers-son-vidrio]] y [[el-sitio-tiene-su-cancion]].
