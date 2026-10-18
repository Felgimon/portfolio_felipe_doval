---
proyecto: "[[Portfolio]]"
tipo: decisión
fecha: 2026-10-18
---
# La página no espera a la GPU

Al entrar, la página tardaba unos 6 segundos en dejar scrollear. No era la red:
era la GPU compilando el shader de las burbujas mientras el navegador esperaba,
congelado.

- **Ahora la GPU compila en paralelo** y la escena arranca recién cuando la
  página ya cargó y está libre. Se puede leer y scrollear desde el primer
  pintado.
- **Las burbujas están desde el principio**, en CSS, en el mismo lugar que las
  de verdad. Cuando la escena está lista, se funden con ellas. Por eso no hizo
  falta una pantalla de carga.
- **En cualquier equipo**: si el equipo no llega, la escena baja la calidad
  pero no se apaga. Si no hay WebGL, quedan las de CSS, que también se juntan
  en el botón.
- **El sonido a la primera**: si estaba prendido, el ícono late hasta que el
  navegador deja sonar, y tocarlo hace sonar la canción.

Ver [[las-burbujas-se-juntan]] y [[el-sitio-tiene-su-cancion]].
