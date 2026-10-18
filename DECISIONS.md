# DECISIONS.md — bitácora de decisiones

Registro de las decisiones no triviales del proyecto (diseño, arquitectura,
dependencias y bugs). Se actualiza en cada fase.

> Las secciones **v9.x**, **v8** y **v7.x** son las vigentes (rediseño «Vidrio y cobalto», lo que lo hace más de Felipe y su canción).
> Debajo queda toda la historia: v6 (la visita guiada en líquido verde), v5.x
> (el sol en el estudio blanco), v4, v3, v2 y v1. Las notas también están en
> `obsidian/Portfolio/`.

---

## v9.2 — Carga sin congelarse, burbujas en cualquier equipo, el sonido a la primera y la preview

### El pedido
Al entrar, la página tardaba ~6 s en dejar scrollear y en mostrar las burbujas
(sin pantalla de carga si se podía evitar; si no, una mínima con burbujas que
explotan). En algunos dispositivos las burbujas no se veían. Con el sonido
recordado como prendido, la música no sonaba hasta apagarlo y prenderlo. Y la
preview al compartir el link mostraba el panel viejo de "Ahora: Superlum".

### Por qué tardaba
Se midió la carga: el primer pintado es rápido (~0,3 s), pero al hidratar, el
constructor del motor WebGL CONGELABA el hilo principal (en esta máquina
650 ms, antes del primer pintado). Ahí se crea el contexto y se pregunta si el
shader linkeó; esa pregunta espera a que la GPU termine de compilar. En una
placa real, sobre todo con ANGLE sobre D3D en Windows, compilar un raymarcher
así tarda SEGUNDOS: esos eran los ~6 s sin scroll.

### La carga (sin pantalla de carga: no hizo falta)
- **Compilación en paralelo**: con `KHR_parallel_shader_compile` el motor ya
  no pregunta si el shader compiló; `preparado()` lo consulta en cada cuadro sin
  esperar. Ni `compilar()` pregunta por el estado (también bloqueaba).
- **Arranque diferido**: la escena se monta después del evento load, un cuadro
  pintado y el primer rato libre (`requestIdleCallback`). La hidratación y el
  primer scroll no compiten con la GPU.
- **Burbujas desde el primer pintado**: `BurbujasCss` las dibuja en CSS, en el
  HTML del servidor, en el mismo lugar que las de la escena (mismas fracciones,
  mismo radio). Los objetos del fondo también se ven ya, en CSS. Cuando la
  escena está lista, las burbujas de CSS se funden con las de verdad. Mientras
  tanto la página se puede leer, scrollear y tocar.
- Resultado medido: primer pintado ~0,3 s con las burbujas, la página usable
  desde ahí, y la escena lista ~1,5 s en una GPU por software. Sin la
  extensión (la GPU por software de los tests no la tiene) queda una tarea de
  ~300 ms, pero ya después de la carga. Con la extensión (Chrome, Edge, Firefox
  y Safari recientes con GPU) la compilación no bloquea nada. Por eso no hizo
  falta la pantalla de carga.

### Burbujas en cualquier equipo
- La causa más probable de que no se vieran: el vigilante de rendimiento, si
  el equipo no llegaba, bajaba la calidad dos veces y en la segunda APAGABA la
  escena (y sin escena no había burbujas). Ahora el nivel mínimo baja la
  resolución (0,42) y dibuja a la mitad de cuadros, pero la escena sigue.
- Sin WebGL 2 (o si la escena se cae), quedan las burbujas de CSS: un vidrio
  con canto de luz, brillo, espesor y sombra, y con el mouse sobre un botón se
  juntan en él y toman su forma (`JuntarBurbujasCss`), como las de la escena.
- `html` también recorta lo que asoma de costado (`overflow-x: clip`): una
  burbuja de un título no puede ensanchar la página en el celular.

### El sonido a la primera
- El bug: con el sonido recordado, la canción esperaba el primer gesto. Si ese
  gesto era un clic en el ícono, el pointerdown la arrancaba y el click la
  apagaba antes de que sonara: había que tocar dos veces. Y en el celular
  apoyar el dedo no habilita el audio (soltarlo sí), así que nunca arrancaba.
- Ahora el sonido tiene tres estados: apagado, ESPERANDO (prendido, sin permiso
  todavía) y sonando. Esperando, el ícono queda quieto con una burbuja que late
  ("Tocá para escuchar"), y tocarlo HACE sonar la canción. Cualquier gesto que
  cuente la arranca: un clic, una tecla, soltar el dedo. Los oyentes se van
  recién cuando suena de verdad.

### La preview
`node scripts/gen-og.mjs` sacó una captura nueva de la portada: el papel, las
burbujas, el piano y la música de fondo, sin el panel de Superlum. El texto
alternativo también se actualizó.

---

## v9.1 — Orden adentro, desorden afuera (y el 404 en una pantalla)

### El pedido
El 404 pasaba de 100vh (no contaba el footer) y tenía scroll: que sea una
pantalla justa, con el footer. "Page not found" (en español, "Página no
encontrada") y arriba "Error 404". Y los objetos, más grandes, y con una idea:
cada objeto ordenado en sí (el cable enrollado y atado, los lápices derechos),
pero distribuidos de forma desordenada, porque Felipe es las dos cosas: estricto
y recto con algunas cosas, y con las ideas desordenadas y poco articuladas.
Objetos nuevos que lo representen: un piano de cola, libros y otros.

### El 404
- El footer tiene un alto fijo, `--pie` (84 px, lo que ya medía), y el 404 mide
  `100svh - var(--pie)`: con el footer, una pantalla justa, sin scroll, en
  escritorio, 720p y el celular. El audit lo prueba en dos tamaños e idiomas.
- "Error 404" arriba; el título en dos líneas ("Página no / encontrada", "Page /
  not found") con su propio tamaño (`.titulo-perdida`), porque en una línea no
  entraba.

### Los objetos
- **No hizo falta regenerar los que estaban**: cada objeto ya era prolijo en sí
  (el cable con su tira, los lápices alineados). Lo que cambia es la mesa:
  `dispersar()` en `scripts/componer-cianotipos.py` recorta cada objeto y lo
  vuelve a acomodar donde "cayó", girado a su manera (de −52° a 78°), a veces
  tocando al de al lado. Las posiciones están a mano, no al azar: desorden
  pensado, que se lea como mesa y no como error.
- **Objetos nuevos** con Higgsfield (el mismo modelo, la misma imagen de
  referencia, el mismo papel y color): un piano de cola con su banqueta, una
  pila de libros, un libro abierto, una pelota de fútbol, un mate, un cubo de
  Rubik resuelto (el orden más estricto), una laptop y un metrónomo. Y la
  música rehecha en objetos sueltos (en el original estaban pegados entre sí y
  al borde y no se podían recortar).
- **Dónde va cada cosa**: la portada, la música (el piano acostado en el aire
  entre "Doval" y la bajada, los auriculares y el vinilo alrededor de la foto,
  el metrónomo abajo); Perfil, lo de curioso más los libros y el cubo, a lo
  ancho debajo de la bio y de Así soy; Enfoque, el juego de dibujo; Trabajo, la
  libreta, los anteojos, la laptop, el cable y las teclas; Recorrido, las
  zapatillas, las llaves, la tarjeta y las dos pelotas; Contacto, las dos tazas
  (ya no en espejo) y el mate.
- **Más grandes**: entre 10% y 30% más de ancho en pantalla, y en el celular
  una composición propia por sección (`*-m.webp`, menos objetos y más grandes)
  en vez de las filas de antes.
- Las burbujas de cada sección se movieron para quedar sobre un objeto (la
  lamparita, el compás, la laptop, la pelota, la taza, los auriculares).
- Peso: las composiciones se guardan a lo sumo a 1800 px de ancho con el alfa
  comprimido; todo el fondo pesa 1,8 MB, lo mismo que antes con menos objetos.

---

## v9 — La canción del sitio y las burbujas que se juntan

### El pedido
El sonido tenía potencial: que no suenen sólo los links de la nav sino todos
los botones, sobre una canción en loop, serena, innovadora pero simple, que
transmita lo que es el sitio y esté siempre sonando (con el sonido prendido).
Todas las notas de la interfaz en la tonalidad de la canción, verificado. Y en
vez de una sola gota que te sigue, varias burbujas por sección, de distintos
tamaños, que se quedan en su sección; con el mouse sobre un botón, todas las de
la sección se juntan en él y son una sola con su forma.

### La canción (lib/musica.ts: la partitura; lib/sonido.ts: las voces)
- **Re mayor, 72 negras por minuto, cuatro acordes de dos compases** (un loop
  de 26,7 s): D6/9, Bm11, Gmaj9, Em9 (I, vi, IV, ii). Se eligieron acordes de
  sexta y novena, sin medios tonos adentro: son los más quietos que hay.
- **Un fa# arriba que no se mueve en los cuatro acordes**: la nota fija, como
  el azul del cianotipo. Las voces del colchón se mueven por grado conjunto.
- **Las voces**: el colchón (seno y triángulo apenas desafinados, entra en
  1,8 s y respira con un filtro que se abre muy lento), el bajo (re, si, sol,
  mi), una cajita de música con una figura de cuatro notas por acorde y, en la
  segunda vuelta, una melodía de vidrio. Todo por una sala (reverb de
  convolución con una respuesta generada, sin archivos) y un compresor suave.
- **Que no canse**: cada vuelta varía un poco (una nota de la cajita que falta,
  otra una octava arriba, la fuerza de cada una, a veces una corchea de levare),
  siempre con notas del acorde.
- Se pausa con la pestaña en segundo plano y retoma la misma corchea. Al
  apagarla se va en medio segundo; lo que quedaba sonando se va con su bus.

### La regla que hace que nada desafine
Lo que toca la interfaz sale siempre de la **pentatónica de re** (re mi fa# la
si). En estos cuatro acordes ninguna de esas notas queda a medio tono por
encima ni a un tritono de una nota del acorde: no hay choque posible, toque
cuando toque. Dentro de eso, cada acorde elige sus cinco notas (su arpegio), y
faltando menos de un segundo para el cambio se usa el que viene (la nota se
anticipa, como haría un músico).
- **La nav**: notas de vidrio simples. Cada link es una nota del acorde que
  suena: recorrerla es su arpegio, y el mismo recorrido suena distinto en cada
  acorde.
- **Los botones**: una burbuja (un glissando de 70 ms que sube y se apoya en
  la nota) con un brillo dos notas más arriba. Como las de verdad, **cuanto más
  grande el botón, más grave**.
- **Las filas de una lista**: una cajita una octava abajo; bajar el mouse por
  la lista es una escala que baja.
- **El nombre**: el acorde entero. **Copiar el mail o elegir un tema**: dos
  notas que suben.

### Cómo se verificó
- `npm run afinacion` recorre la canción dos vueltas con cuatro semillas, con
  las colas de cada voz, y en cada instante prueba todo lo que podría tocar la
  interfaz: 1.077.087 pares de notas sin un choque. Se probó que el chequeo
  muerde: con un do# en la cajita de Bm falla 1.345 veces. (Así se sacó el do#
  de la primera versión: chocaba con el re de los hovers.)
- `npm run sonido` renderiza un minuto en Chromium (OfflineAudioContext, las
  mismas voces) con hovers encima y mide el audio de verdad: pico −8 dBFS, la
  canción sola a −23,5 dBFS RMS (de fondo), y un cromagrama: **99,7% de la
  energía en notas de re mayor**. El primer render tenía demasiado grave (el
  bajo en mi1); se subió a mi2 y se bajó el bajo.

### Las burbujas (Escena.tsx, shader.ts)
- **Se declaran en el DOM**: `data-burbujas="fx fy r; …"` en una caja (un
  título, un cianotipo, la portada): dónde, en fracciones de la caja, y el
  radio en fracción de la pantalla. Tres por sección, de tres tamaños: la
  grande sobre una letra del título (la de siempre) y dos más chicas en el aire
  o sobre un objeto (la lamparita, el compás, la pelota, una taza), que así se
  agranda. En el celular, la del título y una sobre la fila de objetos.
- **Se quedan en su sección**: su posición es su caja más un resorte relativo
  a ella, así el scroll no las arrastra ni las deja atrás. Flotan apenas, cada
  una a su ritmo, y miran un poco al mouse (la grande de la portada, más).
- **El hover**: las que se ven salen disparadas hacia el botón, de la más
  cerca a la más lejos (55 ms entre una y otra). Vuelan con su tamaño y
  estiradas en la dirección en la que van; se achican al llegar, se funden
  (smin: se unen como líquido) y recién ahí se vuelven la píldora del botón. La
  más cerca llega en ~250 ms; todas son una a los ~560 ms. Al salir, cada una
  vuelve a su lugar, más lento, y deja de ser píldora enseguida.
- **Una sola SDF**: el shader evalúa sólo las burbujas cerca de cada píxel y
  las une con smin (con la k en cero cuando ya son botón, así la unión de
  píldoras iguales es exacta).

### El bug de rendimiento (y lo que dejó)
La primera versión tardaba el doble por cuadro **aunque no hubiera ninguna
burbuja en pantalla**. Un banco de pruebas del shader aislado (variantes
medidas una por una) mostró que no eran las burbujas: era que `gota()` se
llamaba en tres lugares, y cada llamada se compila entera; una GPU por
software (y cualquier GPU con ramas divergentes) la paga en toda la pantalla.
Ahora hay **una sola llamada por píxel** (y una sola de `fondo()` para la
dispersión del vidrio): el shader nuevo, con cinco burbujas, es más rápido que
el de la v8.3 con una (254 ms contra 309 por cuadro en SwiftShader).

---

## v8.3 — Los objetos, grandes, donde hay aire

### El pedido
Los objetos de las secciones eran muy chiquitos. Que sean grandes (pueden
quedar debajo de texto), en los espacios más vacíos, y que queden excelentes.

### Cómo
Las filas de la v8.1 eran una sola imagen por sección: para agrandarlas sin que
choquen con el texto hacía falta poder acomodar cada objeto. `scripts/
componer-cianotipos.py` recorta los objetos uno por uno del original (las
partes de un mismo objeto, como dos zapatillas o dos columnas de teclas,
quedan juntas) y los vuelve a acomodar, en knolling, con la forma del lugar
vacío de cada sección:
- **Perfil:** la lupa, el lápiz, la protoboard y la lamparita en fila, en el
  flujo, debajo de la bio (la columna izquierda quedaba vacía abajo).
- **Enfoque:** el juego de dibujo (la regla arriba; escuadra, compás, lápiz y
  libreta debajo) arriba a la derecha, al lado del título y la bajada, sin
  pisar el título, apenas por detrás de las tarjetas de vidrio.
- **Trabajo:** una fila larga en el aire entre Superlum y Proyectos.
- **Recorrido:** 2x2 en la columna libre (zapatillas y pelota; llaves y
  tarjeta).
- **Contacto:** las dos tazas en espejo, a la derecha del texto.
- **La regla final** (idea de Felipe): un poco más grandes, con el CENTRO de
  la composición en el hueco y los bordes que se meten un poco debajo del
  texto (la escuadra bajo el final de "ENFOQUE" y el borde de las tarjetas, las
  zapatillas bajo el final de la línea de tiempo, la libreta bajo la captura
  de Superlum, las tazas rozando el final de "CONTACTO"). Así se sienten
  apoyados en la misma mesa que el texto, no pegados al costado.
- En el celular siguen las filas chicas arriba de cada título.
- Los bordes sólo se funden en los que van a sangre (la portada y el 404): las
  composiciones ya traen su aire y fundirlas cortaba los objetos de abajo.

---

## v8.2 — La burbuja es el hover de todo, y los objetos se ven

### El pedido
El botón de sonido, sólo el ícono (sin botón); de hover, la burbuja que se
pone encima. Un debug de los hovers con burbuja en todos los botones: no
parecían una burbuja encima y en varios ni llegaba. Los objetos del fondo, menos
transparentes (con el papel nuevo no se veían) y bien ubicados. Y el diseño
nuevo entero en el Figma.

### El debug (lo que estaba mal)
- La gota sólo volaba a los links de la nav. El resto de los botones tenía el
  hover de la v7.1: el vidrio propio se aclaraba y hacía de lente, y el esmalte
  tenía su mancha de luz. Ninguno era "una burbuja encima": por eso no se leía
  así, y en los de esmalte no había vidrio en absoluto.
- Se armó un script que recorre TODO lo que se toca (home y un caso), le pasa
  el mouse, adelanta el reloj de la escena y mide dónde terminó la gota contra
  el centro del elemento, con una captura de cada uno: 30 elementos, todos con
  la gota encima (el único "fuera de lugar" era la marca, que se ensancha al
  pasar el mouse; la gota la sigue bien).

### Cómo es ahora
- **`Burbuja.tsx`**: un solo listener para el sitio que marca con
  `data-gota-aqui` lo que tiene el mouse o el foco de teclado: botones, chips,
  la marca, el ícono de sonido, el link "Prender el sonido", las filas de
  proyectos y "Siguiente caso". La nav lo sigue manejando ella (además cambia
  el color y suena).
- La escena hace la burbuja un poco más grande que el botón (3 px; 5 px en los
  de esmalte), para que el canto se vea alrededor; en el ícono de sonido es un
  círculo. Mientras la gota está encima, el vidrio propio del botón no
  reacciona: la burbuja es el único hover.
- **Los de esmalte** quedan "bajo vidrio": el canvas no puede pintar encima de
  un botón opaco del DOM, así que el canto de la burbuja se ve alrededor y el
  esmalte suma, con CSS, el brillo de cúpula arriba, el canto claro y una
  sombra azul abajo.
- Si el scroll saca al botón de abajo del puntero, la gota lo suelta.
- **Sonido:** sólo el ícono (sin caja); el hover es la gota en círculo. Sin
  escena o con movimiento reducido, un círculo de fondo.

### Los objetos
Con el papel, al 12% casi desaparecían: pasan al 24% (también en el póster sin
WebGL). En el celular asomaban detrás de la nav fija: cada sección con objetos
tiene más aire arriba y los objetos quedan entre la nav y el título, como la
cabecera de un capítulo. En Trabajo la fila se corrió a la derecha para no
pegarse al "JO".

### El Figma
Página **Diseño v8.2**: las 8 pantallas de escritorio (con la nav y el pie)
como capas editables. Se exportan del sitio real con un script: el layout
congelado (estilos calculados), el texto común en Archivo (los mismos
contornos que Doval Grotesk al 100%), los textos anchos (títulos, etiquetas,
la marca, las flechas) en contornos de la fuente real, el fondo (papel y
objetos) renderizado por la escena sin títulos ni gota, y la gota como capa
aparte encima, recortada con su silueta exacta. Más una lámina con los
estados: el ícono de sonido y la burbuja sobre cada tipo de botón.

### Verificación
`gate` 0 errores · `audit` **51/51** (suma: la gota llega a un botón de
esmalte, a uno de vidrio y al ícono de sonido; el sonido es sólo el ícono, con
nombre y estado) · `idioma`, `touch`, `anim`, `smoke` en verde.

---

## v8.1 — Una sola foto, el papel de fondo y los objetos donde hay aire

### El pedido
Algunos cianotipos estaban bien ubicados y otros no (Trabajo mal, Enfoque sin
nada): no alcanza con la opacidad, importa dónde caen los objetos. Probar el
sitio sin fotos de Felipe salvo en la portada, y usar como fondo el papel azul
granulado de los cianotipos. Sonido sólo con el ícono y más evidente cuando
está en silencio. Fuera el panel "Ahora" de la portada.

### Los objetos van donde hay aire
- **Regla:** cada sección pone su fila de objetos en un lugar vacío, al lado
  del título o en la columna libre, nunca debajo de un párrafo. Así se leen
  como un bodegón que acompaña al título y el texto queda limpio.
- Para eso se rehicieron como **filas compactas** en knolling (mismo estilo y
  papel, con las anteriores como referencia), con aire alrededor, que se
  ubican sin recortar: Perfil (lupa, lápiz, protoboard, lamparita) y Trabajo
  (libreta, anteojos, cable, teclas) a la derecha del título; Enfoque, nuevo
  (regla, escuadra, compás, lápiz, libreta: planear antes de tocar código), al
  lado del título y la bajada; Recorrido (zapatillas, llaves, tarjeta, la de
  básquet) en la columna libre a la derecha de la línea de tiempo; Contacto
  (dos tazas en espejo) debajo del final del título, a la derecha.
- La portada (auriculares, vinilo, casete) queda como estaba, porque le gustó.
  El 404 sigue con el mapa y la brújula. Proyectos no lleva: ya tiene capturas
  grandes y un objeto ahí competiría.
- En el celular, las filas asoman arriba de cada título, en el aire entre
  secciones.
- Bug encontrado al probar: la regla base `.cianotipo` estaba fuera de las
  capas de CSS y le ganaba a las clases de cada sección (todas las filas caían
  a ancho completo, debajo del texto). Pasó a `@layer components`.

### Una sola foto
Felipe sólo aparece en la portada. Perfil se rearmó a dos columnas (la bio;
con qué construye y Así soy), Recorrido y Contacto quedan con la columna de la
derecha para sus objetos, y el 404 con el mapa. La sesión de fotos pasa a
necesitar una sola pose.

### El papel
El estudio cobalto ahora es un pliego de papel cianotipo: una textura del
papel vacío (generada con el mismo estilo, `brand/papel.jpg` →
`scripts/gen-papel.mjs` → `public/assets/papel.webp`, sólo el grano en gris)
se repite en espejo, sin costuras, en dos escalas: el grano fino y, grande, la
exposición despareja del sol. El color lo sigue poniendo el shader. Sin
WebGL, el mismo grano va sobre el póster CSS (`soft-light`).

### Sonido y portada
- El botón es sólo el ícono (un círculo de vidrio). Prendido, el ecualizador
  se mueve; apagado, las barras quedan quietas, apagadas y tachadas. El nombre
  accesible es fijo ("Sonido") con `aria-pressed`, y el tooltip dice qué pasa
  al tocarlo. En el menú del celular va con el estado escrito.
- Sin el panel "Ahora": la portada es nombre, rol, bajada y dos botones.

### Verificación
`gate` 0 errores · `audit` 47/47 (cambian: una sola foto, en la portada; la
escena pinta los objetos de Perfil con movimiento reducido; el cianotipo de
Enfoque está) · `idioma` (ahora chequea Así soy en vez del panel Ahora),
`touch`, `anim`, `smoke` en verde. Capturas de cada sección en escritorio y
celular, y del botón de sonido en sus dos estados.

---

## v8 — Más yo: los cianotipos de lo cotidiano, el sonido y Así soy

### El pedido
Que el portfolio sea más Felipe. Contó cómo es: le gusta la música, respeta a
la gente y se preocupa por ella, es curioso por lo nuevo, es dinámico y le
gusta hablar con la gente y conocerla. Buscar referencias de la vida
cotidiana, sumar funciones o cambiar el diseño, y elegir un fondo que lo
personalice (pueden ser varias imágenes). Primero en el Figma, después a main.

### La idea: cada sección, una mesa
- **El fondo son cianotipos.** El cianotipo es un fotograma sin cámara:
  objetos apoyados sobre papel sensibilizado al sol; lo que tapan queda claro y
  el resto, azul de Prusia. Es el mismo azul del sitio: el fondo no cambia de
  paleta, cambia de historia. Seis, uno por sección: Inicio (música:
  auriculares, un vinilo, un casete), Perfil (lo nuevo: una lupa, un lápiz,
  una protoboard, una lamparita), Trabajo (el oficio: teclas, un cable,
  anteojos, una libreta), Recorrido (moverse: zapatillas, llaves, una tarjeta,
  la de básquet), Contacto (la gente: dos tazas, una frente a la otra) y el 404
  (perdido: un mapa y una brújula).
- **Ordenados.** La primera tanda tenía cables tirados y zapatillas desatadas;
  Felipe es ordenado (y así quiere que lo vean): se rehicieron en *knolling*
  (todo a 90°, con la misma separación, cables enrollados, cordones atados),
  con el mismo estilo y color (las primeras como referencia).
- **Bajo, sin robar foco.** Se pintan en el shader como luz sobre el estudio
  (12%), debajo de Feli y de los títulos, con los bordes fundidos. De lejos son
  textura; la gota, al pasar, los agranda (la curiosidad tiene premio). Con
  contraste alto no se pintan.
- **Sin WebGL**, el mismo archivo (un mapa de luz: celeste con la luz en el
  alfa) va de fondo CSS con la misma intensidad; sólo se descarga en ese modo.

### Funciones nuevas
- **Sonido** (música). Botón en la nav (y en el menú del celular), apagado de
  entrada y recordado. Prendido, cada link de la nav toca una nota de un
  acorde de do mayor con novena: recorrer la nav es un arpegio. Copiar el mail
  y elegir un tema suenan a "listo". Todo sintetizado con Web Audio, una nota
  de vidrio (fundamental más dos parciales inarmónicos): cero archivos.
- **Así soy** (en Perfil, debajo del stack): los cuatro rasgos, con sus
  palabras y nada más. En el de Música, "Prender el sonido".
- **¿De qué charlamos?** (Contacto): un proyecto, un laburo, música o algo
  nuevo; cada uno abre el mail con asunto y saludo listos. La dirección sigue
  armándose recién en el clic (ahora en `lib/mail.ts`) y el link no queda en
  el DOM.

### Descartado
- "Escuchando ahora" de Spotify en vivo: necesita un servidor con su token y,
  si no está escuchando nada, queda vacío.
- Fotos de stock de gente en el sitio: no es su gente. Los objetos pueden ser
  de cualquiera; las caras no.
- Muro de logos de bandas o íconos de hobbies: infantil (la crítica de la v6).

### Autocrítica en el camino
- En el Figma, la primera prueba con el cianotipo al 42% competía con el
  título: se bajó a 16% (Figma) y 12% (sitio), en 16:9 sin estirar.
- "Prender el sonido" quedaba cortado con sangría al final de la frase: va en
  su propia línea.

### Verificación
`gate` 0 errores · `audit` **47/47** (suma: un tema abre el mail con su
asunto, el link no queda en el DOM, el sonido se prende desde Así soy y se
apaga desde la nav, los cianotipos están en sus secciones y la escena pinta el
de la vista) · `idioma`, `touch`, `anim`, `smoke` en verde. Capturas de cada
sección en escritorio, celular y sin WebGL.

---

## v7.2 — El hover de la nav es la gota

### El pedido
La cápsula de vidrio claro de la v7.1 no gustó: "horrible", "no parece un
reflejo de burbuja". La idea de Felipe: que la burbuja grande que flota vaya
hasta el botón y se achique tomando su forma, rápido.

### Cómo es
- Con el mouse (o el foco del teclado) sobre un link de la nav, ese link se
  marca con `data-gota-aqui` y la **gota misma** vuela hasta él: se estira en
  el viaje, llega con un pequeño rebote y queda como una **píldora de vidrio**
  del tamaño del link. Entre links se desliza estirándose; al salir de la nav,
  vuelve a apoyarse en su título.
- Es la misma SDF: el huevo que ondula se mezcla con una caja redondeada
  (`uForma`: medio ancho, medio alto y cuánto es botón). La ondulación y la
  gotita satélite se apagan a medida que se vuelve botón. Nada se superpone ni
  se cambia de golpe: es un solo objeto.
- Los resortes (x, y, radio, ancho, alto, forma) son más duros mientras va o
  está en un botón (el viaje dura ~250 ms) y blandos en el resto, como antes.
- Mientras es gota grande viaja **debajo** del vidrio de la UI; pasada la mitad
  del cambio se pinta **encima** de la nav.
- La píldora tiene su propio acabado: vista frontal (sin la perspectiva de la
  gota grande, que a esa altura la torcía), el centro es una lente que aclara
  (contra el ahumado de la nav), el canto es una línea de luz fuerte arriba a
  la izquierda y suave abajo, un brillo arriba que se corre con el puntero y
  una sombra corta sobre la nav. El borde se suaviza con la silueta 2D exacta.
- La sección activa queda marcada con un punto debajo del link.
- Sin escena, con poca potencia o con reducir movimiento: el hover es un fondo
  más claro (CSS).

### Bugs encontrados al probar
- La primera píldora se veía como un aro de goma negra: con un vidrio tan
  chico casi todo el canto es reflexión total interna y el entorno es oscuro.
  En la píldora la luz "cruza" igual (se toma el fondo, aclarado).
- Para ver el vuelo cuadro por cuadro en SwiftShader (lento), la escena acepta
  un reloj manual: `window.__relojEscena` (en ms) reemplaza a
  `performance.now()` si está definido. Sólo se usa en las pruebas.

### Verificación
`gate` 0 errores · `audit` **41/41** (cambian los chequeos de la nav: el link
llama a la gota, la gota se vuelve píldora y al salir vuelve) · `idioma`,
`touch`, `anim`, `smoke` en verde. Secuencias del vuelo cuadro por cuadro
(0 a 600 ms) desde Perfil y desde Inicio, deslizándose entre links y de vuelta.

---

## v7.1 — Los hovers son vidrio, y "Copiar mi mail" se entiende

### El pedido
A Felipe no le gustaban los hovers (en la nav directamente no había) y pidió
que jueguen con el vidrio, "como la burbuja", con un efecto reflectivo,
profesional y sin que falte ningún botón. Y que "Copiar mi mail" parezca un
botón de copiar, con una buena animación al copiar.

### La idea
El vidrio de la UI ya lo pinta el shader: el hover puede ser **vidrio de
verdad**, no un brillo de CSS que lo imite. Dos materiales, cada uno reacciona
como lo que es:
- **Vidrio** (botones de vidrio, la nav, las filas, el siguiente caso): con el
  mouse encima el vidrio se aclara y toma volumen de cúpula, una **lente**
  agranda lo que está debajo del puntero, un **reflejo** lo sigue (corrido hacia
  la luz de arriba a la izquierda) y el **canto** se engrosa y se enciende del
  lado del puntero. Al tocarlo, una **onda** circular recorre el vidrio.
- **Esmalte** (los botones crema): relieve (luz arriba, sombra abajo) y una
  mancha de luz que sigue al puntero (`Reflejos.tsx` pone `--mx/--my`).
- **La nav:** una **cápsula de vidrio claro** (data-vidrio="claro", una gotita)
  marca la sección activa y se desliza con un resorte elástico de GSAP hasta el
  link con el mouse o el foco del teclado; al salir, vuelve. *(Reemplazada en
  la v7.2: ahora es la gota la que vuela al link.)*
- **Las filas de proyectos y "Siguiente caso":** data-vidrio="hover", una
  burbuja de vidrio que se forma debajo con el mouse, y el nombre se corre.
- **Las flechas** acompañan (→ avanza, ↗ sube en diagonal, ← retrocede, ↓
  baja), el press es un resorte (baja y rebota) y el nombre de la nav ensancha
  el tracking y sube de peso (la fuente es variable).
- Se descartó el botón "magnético" (que persigue al mouse): en un sitio con
  una gota que ya sigue al puntero, era un segundo protagonista.

Sólo reacciona lo que se puede tocar (un panel informativo no). Con mouse o
foco de teclado; en el celular no hay hover pegado (`pointer: fine` y
`@media (hover: hover)`). Con reducir movimiento no hay onda.

### Copiar mi mail
- Se lee como lo que es: la insignia con el ícono de **copiar** (dos hojas),
  que al pasar el mouse se separan.
- Al tocar (respuesta **optimista**: no espera al portapapeles): las hojas se
  juntan y se **dibuja un tilde**, el texto sube a "Mail copiado", una onda
  recorre el vidrio (en el de esmalte, un aro) y aparece una **ficha con la
  dirección** copiada, a la derecha en el inicio y arriba en Contacto y en el
  celular. La ficha es sólida a propósito: una primera versión de vidrio claro
  dejaba ver el párrafo de atrás y no se leía.
- Si el portapapeles falla: "No se pudo copiar" y la ficha queda 7 s con la
  dirección seleccionable para copiarla a mano.
- La dirección sigue sin estar en el HTML: se arma y se muestra recién en el
  clic.

### Bugs encontrados al probar
- La cápsula cambiaba de ancho pero no se movía: se medía contra su `<li>` (el
  offsetParent), no contra la píldora.
- El primer hover de vidrio era tan sutil que no se veía (detrás de un botón
  suele haber azul liso, y la lente sola no muestra nada): se sumaron el
  aclarado, la cúpula y un canto más grueso.

### Verificación
`gate` 0 errores · `audit` **40/40** (suma: la cápsula va al link con el mouse
y vuelve a la activa; la ficha muestra la dirección recién después de copiar) ·
`idioma`, `touch`, `anim`, `smoke` en verde. Capturas antes/después de cada
tipo de botón y la secuencia de copiado cuadro por cuadro (animaciones
congeladas con `getAnimations()`), en escritorio y celular.

---

## v7.0 — «Vidrio y cobalto»: Doval Grotesk, la gota de vidrio y Feli sin globos

### El pedido
La v6 no gustó: "demasiado infantil", "no parece glass verdoso como me lo
imaginaba, parece plasticola de moco", "no es profesional". Felipe pidió el
diseño completo **primero en Figma, con colores nuevos**, después en el repo,
con autocrítica y capturas de diseño y navegación. En la misma tanda:
- **Una sola fuente** en todo el sitio, elegida entre cinco referencias
  (Tahoe, Inner, Reatro Retro, Viltrum, Drupadi) o una mezcla, con análisis.
- **Feli no comenta.** "Guiar" era que haya fotos suyas que te acompañen
  mientras navegás, no frases.
- **Títulos directos:** "Trabajo", "Proyectos", nada de "Lo que construí".

### Por qué falló la v6 (autocrítica)
El verde lima y jade saturado, en metaballs 2D con sombra dura y una script de
cartel, leía como juguete: el "material" verde no era vidrio, era plástico.
Sumado a Feli hablando en globos, el tono quedaba de mascota. El problema no
era un ajuste de color: era el material y la voz.

### Cómo se decidió
1. Prototipo en `scratchpad` con varios héroes (burbuja, cinta, gota oscura,
   lente sobre el nombre) hasta llegar a la **gota-lente**: una gota de vidrio
   claro apoyada sobre una letra del nombre, que se ve aumentada y doblada a
   través del vidrio. Es lo único del sitio que un template no trae, y
   funciona igual con cualquier título.
2. Color: un **estudio fotográfico cobalto** que cae a azul noche (#1736BD a
   #071447), crema para el texto (#F2EEE6) y un solo acento ámbar (#FFB861)
   para el estado "Ahora". Se bajó la saturación del primer cobalto, que con
   la foto recortada encima leía a miniatura de YouTube.
3. **Figma primero** (página *Diseño v7* del archivo *Mood Board Portfolio*):
   sistema visual + 7 secciones en 1440 + 7 en 393. En capas editables: el
   fondo WebGL capturado sin títulos, los títulos como contornos vectoriales
   de la fuente real, la gota como PNG con alfa y la UI como texto (Archivo,
   mismos contornos que la fuente propia). Se probó primero importar la
   captura entera y se descartó: era una imagen con texto encima, no un
   diseño.
4. Recién con el Figma revisado, el repo.

### La tipografía: Doval Grotesk
Análisis completo en `brand/tipografia/LEEME.md`. En corto: si es la **única**
fuente tiene que aguantar texto corrido, y tiene que convivir con la gota (que
aumenta y dobla lo que tiene detrás). Inner, Reatro y Drupadi rompen con la
refracción o son ilegibles en párrafo (y Reatro es justo lo "infantil");
Viltrum es sólo afiche. Ganó **Tahoe** (grotesca extendida y negra, tono
adulto y editorial), resuelta con una familia libre del mismo género **con eje
de ancho**: **Archivo** (Omnibus-Type, SIL OFL). Extendida y negra es el
"Tahoe" de los títulos; en ancho normal es el texto; el extremo condensado es
el "Viltrum" de la misma familia. En el celular los títulos bajan el ancho, no
el tamaño. Doval Grotesk = Archivo renombrada, latín, **flechas propias
variables** (sin ellas ↗ caía en otra fuente) y 54 estilos con nombre.

### La escena (WebGL 2)
- **Estudio:** gradiente radial cobalto a noche con grano.
- **Placas:** cada título (`data-placa`) se dibuja una vez en una textura con
  su misma fuente, caja y línea base; el texto del DOM queda transparente
  (sigue para leer, copiar y para lectores de pantalla). Hasta 3 a la vez.
- **La gota:** raymarching de una SDF (huevo con ondulación lenta + gotita
  satélite unida con `smin`), refracción de entrada y salida con dispersión
  por canal (IOR 1,47 a 1,515), Fresnel, un estudio con softbox y dos tiras de
  luz para el reflejo, brillo duro y una sombra suave. El plano refractado está
  cerca (0,55 radios) para que la letra se lea aumentada y no lechosa.
- **Viaja:** cada sección declara `data-gota="fx fy r"` en fracciones de SU
  título; la gota va a la sección activa con un suavizado de 260 ms. En el
  inicio sigue al mouse de lejos. Con reducir movimiento salta y no ondula.
- **Vidrio ahumado:** los paneles `data-vidrio` refractan con bisel, se ahuman
  42% hacia noche y llevan un canto de luz arriba a la izquierda.
- **Feli** se pinta en el shader con el pie fundido (así la gota lo puede
  refractar); el `<img>` es el respaldo.
- Sin WebGL 2: el estudio en gradiente CSS, títulos como texto, Feli como
  `<img>`, vidrio sólido. El póster PNG de la v6 se borró.

### La estructura
Inicio, Perfil, Enfoque, **Trabajo** (Superlum, lo que está construyendo para
una empresa real), **Proyectos** (FutbolVision en grande y el resto en lista),
Recorrido y Contacto. La nav: el nombre (vuelve al inicio), una píldora de
vidrio con las secciones y "Hablemos" sólido; en el celular, "Menú" abre la
lista. Fuera de la home, "Volver" lleva a la sección de origen.

### Bugs encontrados por el camino
- En mobile, la grilla de Enfoque tenía el `grid-template-columns` en línea y
  el media query no la pisaba: dos columnas de 150 px. Ahora es una clase.
- Las capturas para Figma escalaban la gota con el alto de la sección (en vivo
  es la pantalla): se topó el radio a 960 px.
- La gota se apoyaba fuera del título porque el h2 ocupaba todo el ancho: las
  placas son `width: fit-content`.
- El conversor HTML→Figma ignora el origen del `viewBox`: los contornos se
  generan desde 0,0.

### Números
- `public/`: −2 pósters (el estudio sin WebGL es CSS). Una sola fuente de 90 KB
  en lugar de tres.
- Imagen al compartir: 131 KB, captura real del inicio nuevo.

### Verificación
`gate` 0 errores · `audit` **36/36** (suma: una sola fuente en todo el DOM,
Feli sin globos, el nombre pintado por la escena, sin WebGL el nombre como
texto) · `idioma` 12/12 · `touch` 9/9 (7 secciones, Menú ≥ 44 px) · `anim` 2/2
(la gota ondula; con reducir movimiento, no) · `smoke` sin errores. Capturas
de las 7 secciones, los dos casos y el 404 en 1440×900 y 393×852.

### Pendiente de Felipe
La **sesión de fotos** sigue siendo lo que más suma (el brief se actualizó para
el cobalto: nada de ropa azul). Medir en hardware real (la gota es raymarching:
SwiftShader no sirve para juzgar). Instalar `DovalGrotesk.ttf` para editar en
Figma con la fuente propia.

---

## v6.0 — «Visita guiada»: el líquido, el vidrio en el shader y Feli de guía

### El pedido
Felipe pidió **cambiar por completo** el portfolio a partir de su mood board de
Figma (*Mood Board Portfolio*): "3D Objects de fondo o burbujas", "fotos mías
guiando al usuario a través del portfolio", los colores **`#78D561` · blanco ·
`#28C18C`** y "que fuese como liquid glass, que los objetos de fondo sean como
burbujas o líquido espeso que se mueve flotando". Más una script retro de
cartel (la del screenshot "Artisan Script"). Innovador, dinámico, divertido, y
que **no parezca hecho con IA**.

### Cómo se decidió
1. **Análisis** del repo, de las 17 versiones de este archivo (las reglas de
   gusto de Felipe siguen valiendo: sin glow, sin rgba en texto, sin rayas,
   sin viñetas, nada inventado) y de referencias.
2. **Cuatro conceptos prototipados** de verdad (WebGL crudo, vidrio real, la
   script y los recortes): *Lima-limón* (gaseosa de barrio), *Pecera* (el
   líquido como juguete), *Visita guiada* y *Filete y vidrio* (fileteado
   porteño). **Ganó Visita guiada** por claridad (un recruiter entiende en 10 s
   quién es, qué hace y cómo escribirle) y porque el guía es lo único que un
   template no puede copiar. Injertos: la sombra dura y el filete bajo el
   nombre (Lima-limón) y el líquido que se empuja y se estira (Pecera). Se
   sacó el selector de idioma del prototipo: el idioma sigue siendo automático.

### La tipografía: Doval Script (no un calco)
Artisan Script es de **HRDR, comercial** (~USD 19 desktop). No se calcó del
screenshot (es el trabajo vendido de un diseñador, y en un JPG hay ~10 letras).
Se hizo una propia: **derivada de Norican** (Vernon Adams, SIL OFL 1.1, sin
RFN), elegida entre 21 familias libres; engrosada 32/18 u., enderezada 4°,
finales de palabra por `calt` y 53 finales acentuadas para el español. OTF/TTF
para la Mac y Figma en `brand/tipografia/`, WOFF2 para la web.

### La escena
Un solo `<canvas>` fijo, **WebGL 1 crudo** (fuera three.js, react-three,
drei, postprocessing y motion), una pasada de pantalla completa:
papel → líquido → **Feli** → pileta → **vidrio**.
- **Líquido "pintado", no plástico:** metaballs 2D con `smin` cuadrático de k
  bajo (se separan con cuello), normal de hemisferio continua, dos bandas
  lima/jade con terminador corto, especular blanco duro, filete tinta del lado
  en sombra y burbujas de gas. Una sola luz, arriba a la izquierda.
- **Las gotas se declaran en el DOM** (`data-gotas="fx fy r tono [capa]"`,
  ancladas a la caja del elemento; `data-gotas-m` para celular).
- **El vidrio se pinta en el shader:** dentro de cada `data-vidrio` se muestrea
  la escena desplazada (bisel + leve magnificación + aberración cromática en el
  canto). Reemplaza al filtro SVG de la v5, que sólo andaba en Chromium y era
  el 78 % del costo del cuadro. Se conservaron el canto cian, el vidrio que se
  hunde y el barrido especular.
- **Feli adentro del shader:** así la pileta tapa el corte de la foto y él
  sube del líquido al llegar a su parada. En el DOM, un botón con la caja exacta.
- Interacción: el cursor **empuja** las gotas; en desktop se pueden **agarrar,
  estirar y partir**. Huevo de pascua: tocar a Feli cinco veces ("Ahora vuelvo").
- Lectura de rects con getBoundingClientRect en cada cuadro, corriendo en el
  ticker de GSAP **después de Lenis** (que ahora se agrega con prioridad): si
  no, el vidrio del shader iba un cuadro atrás del borde del DOM al scrollear.
- **Uniforms empaquetados** (la capa va en `w` junto con el tono): WebGL 1 en
  iPhones viejos da 64 vectores; quedó en ~48.

### Robustez
- Sin WebGL o equipo que no llega (`lib/rendimiento.ts` → mínimo): `data-escena
  ="poster"` → póster renderizado del propio shader, Feli como `<img>` con la
  sombra por CSS y **vidrio sólido** (nunca un blur que finja ser vidrio).
- Software rendering → escalón bajo de entrada (escala 0,6, sin extras).
- **Reducir movimiento:** las gotas no flotan solas, pero todo lo que sigue al
  scroll sigue igual (lección v5.17.2). Si no pasa nada en 1,5 s, ni se
  redibuja. En reposo normal, mitad de cuadros.
- Contraste alto / colores forzados / transparencia reducida: vidrio sólido.

### Bugs de la v5 arreglados de paso (todos verificados antes)
Preloader trabado al volver de un caso (se eliminó el preloader) · el mail
estaba en el HTML estático (ahora se arma en el clic) · sin `<main>` · "Saltar
al contenido" apuntaba a un id que no existía en los casos · el foco no pasaba
al contenido al navegar con teclado · la nav eran botones (ahora anclas:
`/#trabajo` se comparte) · los casos se compartían con la tarjeta de la home ·
404 con el nombre dos veces · año del footer horneado · Konami más rápido a
120 Hz · scripts de test colgados fuera de Windows (`taskkill`).

### Números
- `public/`: 5,9 MB → **1,6 MB**. Seis dependencias menos.
- Imagen al compartir: 114 KB, captura real del inicio.

### Verificación
`gate` 0 errores · `smoke` 3/3 rutas sin errores de consola (escritorio y
393×659) · `audit` **33/33** (sin WebGL, teclado y foco, mail fuera del HTML,
palabra prohibida, rayas, huevo de pascua, reduced-motion) · `idioma` 12/12 ·
`touch` 9/9 · `anim` 2/2. Revisión visual de las seis paradas, los casos y el
404 en 1440×900 y 393×659. El frame time bajo SwiftShader no es representativo
(misma parada entre 17 y 99 ms según la carga): **falta medir en hardware
real** (TODO-FELI).

### Pendiente de Felipe
La **sesión de fotos** (guion completo en
`obsidian/Portfolio/la-sesion-de-fotos-es-un-guion-no-un-book.md`): hoy el guía
usa los 4 recortes viejos como interinos.

---

## v5.17.10 — Revertida la grilla multi-escala: metía bandas grises gruesas

Felipe reportó "una línea gris súper gruesa en algunas partes de la grilla". La
introduje yo en v5.17.7 y es un error de UNIDADES, no de calibración.

En `lineas(p, ancho)` el ancho es **fracción de la celda**, no una medida
absoluta. Al pasar una escala más gruesa —`lineas(p * 0.0625, 0.018)`, celdas 16x
más grandes— ese 0.018 equivale a **0.018 × 16 = 0.288** en unidades de p, contra
los 0.028 de la grilla fina: **10x más gruesa**. Eso son las bandas. Lo mismo, más
suave, con la escala 4x (0.022 × 4 = 0.088, ~3x).

Y no tiene arreglo por calibración: la grilla gruesa sólo "sobrevive más lejos"
PORQUE sus líneas son más anchas en mundo. Adelgazarlas para que no se noten de
cerca las hace desaparecer a lo lejos, que era todo el punto. Se probó gatearlas
por LOD para que aparecieran sólo lejos y eso anuló la ganancia (volvió al
baseline). O sea: el enfoque entero estaba mal para este caso.

**Revertido**: `git checkout` del Studio.tsx previo. Verificado que el archivo
quedó con **hash idéntico** (266ada86…) al de la versión buena — la prueba más
fuerte posible, porque el código que dibujaba la banda literalmente ya no existe.
Confirmado además por captura completa (hero y Enfoque limpios) y por zoom 3x en
el punto sospechoso: sólo líneas de 1-2px.

Con esto se revierte también lo que v5.17.7 había hecho para el vidrio (banda
muerta del horizonte, alcance extendido, pared más presente): iban en el mismo
bloque y su ganancia era marginal (el fondo seguía muy por debajo del umbral
útil). **La conclusión de v5.17.7 sigue en pie y es la respuesta a la pregunta
original**: el Liquid Glass no se ve sobre los tópicos porque el fondo ahí está
lejos y liso, y darle contraste exige líneas gruesas a distancia — exactamente el
bug que Felipe pidió arreglar en v5.13.2. Es un trade-off real, no un bug
pendiente.

Nota metodológica: se intentó un detector de píxeles que midiera "la línea más
gruesa" como guard automático. Da falsos positivos (marcaba 80-93px donde el zoom
muestra líneas de 1-2px) porque confunde el sombreado suave de la pared con una
línea. No se sumó a la auditoría: un guard que miente es peor que no tenerlo.

---

## v5.17.9 — La preview del link pasa a ser la home de verdad

Al compartir felipedoval.com aparecía una tarjeta azul oscuro dibujada a mano
(nombre + punto dorado), del tema "espacio" de la v4.x: no se parecía en nada al
sitio actual, que es un estudio blanco con un sol 3D.

La causa es estructural: la imagen la generaba `app/opengraph-image.tsx` con
`ImageResponse` (next/og), y eso corre sobre **Satori**, que pinta un subconjunto
de CSS y **no ejecuta WebGL**. Por diseño nunca podría mostrar el sol. La única
forma de que la preview sea el sitio de verdad es capturarlo con un navegador.

Ahora es una **captura real de la home**, generada por `scripts/gen-og.mjs` (mismo
patrón que gen-favicons): levanta el build, abre la home con `?fx=full` para forzar
la ruta GPU completa, espera a que el sol erupcione sus protuberancias, saca del
cuadro el preloader / cursor propio / overlay de debug, captura a 2x y baja a
1200x630 (el downscale hace de antialias). NO se usa reduced-motion en la captura:
ahí las protuberancias no crecen y el sol sale pelado.

**JPEG y no PNG**: el mismo cuadro en PNG pesaba 621 KB. La escena es fotográfica
(el disco del sol, degradados suaves) — el peor caso para PNG. En JPEG q0.92 son
**115 KB (−81%)** sin artefactos visibles en el nombre, que es lo único con bordes
duros. El peso importa: varios clientes de chat no muestran la preview si la
imagen es pesada.

Se generan las dos (`opengraph-image.jpg` y `twitter-image.jpg`) con sus
`.alt.txt`. Verificado en el HTML servido: og:image con width 1200, height 630,
type image/jpeg y alt; twitter:card en summary_large_image; las dos rutas
devolviendo 200 image/jpeg y el archivo midiendo 1200x630 de verdad.

La auditoría chequeaba `/opengraph-image` (la ruta vieja, sin extensión) y **falló
al correrla** — el guard hizo su trabajo. Se actualizó a `.jpg` y se sumó el check
de la de Twitter: 14/14.

---

## v5.17.7 — Capas, footer mínimo, y por qué el vidrio no refractaba

### 1. El Liquid Glass sobre los tópicos: es la DISTANCIA, no la pared
Felipe preguntó si el vidrio no funciona con la grilla de la pared o si es que
está muy lejos. Medido (sd del fondo 3D exactamente bajo cada card, con el
contenido oculto): **1.85–5.71**, o sea liso. La calibración de v5.12.3 fijó que
sd 5.5 = refracción invisible y ~12 = visible. El vidrio nunca estuvo roto: no
tenía nada que doblar.

Diagnóstico, en tres pasos medidos:
- Había una **banda muerta en el horizonte**: el piso arrancaba en dir.y < -0.03 y
  la pared en dir.y > 0.0, así que entre medio no había NINGUNA grilla — y ahí
  caen las cards. Se cerró (los dos desvanecidos ahora se solapan).
- El **corte por distancia** mataba las líneas antes de llegar (11..26). Se
  extendió a 26..60; era redundante, porque lineas() ya apaga por cobertura.
- Lo que de verdad limita es **lineas() misma**: forzando `fade = 1.0` los números
  NO cambiaron. A esa distancia la grilla se funde al promedio, que es la
  protección anti-moiré que se construyó en v5.13.2 cuando Felipe pidió grosor
  proporcional a la perspectiva. **Sí: es porque está lejos.**

Mejora aplicada: grilla **multi-escala** (celdas 4x y 16x, atenuadas 0.70/0.45)
que releva a la fina donde ya se promedió, más la pared subida de 0.26 a 0.40.
Resultado +25–50% de contraste (Contacto 1.85 → 2.74, Trabajo 3.58 → 5.35) con el
hero igual de limpio.

**Queda un trade-off sin resolver, y es estructural**: llevar el fondo lejano a
sd ~12 exige líneas gruesas y oscuras a distancia, que es EXACTAMENTE el bug que
Felipe reportó en v5.13.2 ("parecen tener un grosor enorme"). Se probó un gate por
LOD para meter las escalas gruesas sólo lejos: anuló la ganancia (volvió al
baseline), porque en esa zona la grilla fina todavía resuelve — es sparse y
pálida, no promediada. Con la perspectiva correcta como requisito, la refracción
sobre los tópicos es sutil por física, no por bug.

### 2. Capas: las etiquetas de los mini-soles iban por delante de todo
`.solabels` estaba en `z-30`, por encima del contenido y del footer (los dos en
`z-10`): las pastillas y los soles se dibujaban ENCIMA de las cards y del footer.
Pasan a `z-[1]` — sobre el canvas (z-0), debajo del contenido. Además de arreglar
el tapado, ahora forman parte del BACKDROP, así que el Liquid Glass de las cards
las refracta y desenfoca como a cualquier fondo (que es lo que pidió Felipe).

El efecto colateral había que resolverlo: el wrapper de contenido cubre TODA la
página, así que al quedar por encima se comía los clicks y **los mini-soles
dejaban de navegar** (verificado: el click lo recibía el Container y scrollY no
se movía). Se arregla con `pointer-events-none` en el wrapper y `auto` en las
columnas de contenido real (hero y TopicPanel): el vacío al costado del texto deja
pasar el click al sol. Verificado: el chip recibe el click y navega (scrollY
0 → 820).

### 3. Footer mínimo
Queda sólo "© 2026 Felipe Doval". El resto (marca, bio, ubicación, enlaces de
contacto, "volver arriba", "Hecho con Next.js + Three.js") era repetición de lo
que ya está en Contacto y en el HUD.

**Atención legal**: con eso se fue también el crédito de la textura solar, que es
**CC BY 4.0** de Solar System Scope y cuya licencia EXIGE atribución visible —
CREDITS.md decía textualmente "crédito visible en el footer del sitio como exige
la licencia". Se le avisó a Felipe y **pidió reponerlo** (v5.17.8).

### 3.b — El crédito vuelve, y el HUD lo tapaba
El footer queda en "© AÑO Felipe Doval · Sol: Solar System Scope (CC BY 4.0)",
con el nombre enlazado a la fuente (creador + licencia + URI = lo que pide CC BY
4.0 §3(a)(1)). Es el único asset CC-BY en uso: la panorámica de la Vía Láctea de
ESO se retiró en v4.2.

Al verificarlo apareció algo que no se ve leyendo el código: el **HUD flota FIJO
abajo** y al final de la página se le monta encima al footer — medido, tapaba el
"(CC BY 4.0)" en 768, 1024 y 1440 (sólo en 390 zafaba). Un crédito tapado no
cumple la licencia. Se le dio al footer `pb-28` para que el texto suba por encima
de la zona del HUD. Verificado: sin solape y crédito completo visible en 1440,
1024, 768 y 390.

Auditoría 13/13 verde tras los tres cambios (incluido el portapapeles, que era el
más expuesto al cambio de pointer-events).

---

## v5.17.6 — El favicon sin caja: solo "FD." y el problema del color

Pedido de Felipe: sacar el rectángulo de fondo del favicon y dejar solo el
monograma "FD" con el punto, en un color de la paleta que se note en modo claro y
oscuro.

Sacar la caja es lo fácil (el canvas queda transparente: se borran el degradado
de espacio profundo y las estrellas). Lo difícil es el COLOR, y ahí el pedido
tenía una trampa que hubo que medir: sin caja, el monograma se apoya directo
sobre la barra de pestañas, que es BLANCA o CASI NEGRA según el tema del sistema.
Contraste WCAG de los candidatos de la paleta contra #ffffff / #dee1e6 / #35363a
/ #202124:

| color | claro | oscuro | mínimo |
| --- | --- | --- | --- |
| `--acento` #0b5385 | 8.11 | 1.49 | **1.49** |
| `--acento-hi` #1d74b0 | 5.03 | 2.40 | **2.40** |
| celeste del grad #3fa0d8 | 2.90 | 4.16 | **2.22** |
| `--oro` #d99a1e | 2.44 | 6.59 | **1.86** |

**Ningún color existente de la paleta sirve**: los azules de marca mueren en
oscuro y el oro desaparece en claro. Por eso el punto ya NO va dorado — en una
pestaña clara sería invisible (1.86).

El elegido es **#2b86c6**, el punto MEDIO del degradado de identidad (accent-grad
va #083d66 → #1370ad → #3fa0d8), corrido apenas para maximizar el contraste: da
**3.01 de mínimo en los cuatro fondos**. No es gusto: se calculó que 3.05 es el
TECHO teórico que puede alcanzar CUALQUIER color contra #dee1e6 y #35363a a la
vez (el óptimo está en luminancia ~0.21), así que este tono está en el máximo
posible. Monograma y punto van del mismo color: garantiza que los dos se lean.

Además el monograma pasa a ocupar el 90% del lienzo (sin caja que lo contenga, si
es chico se pierde en la pestaña) y se centra ÓPTICAMENTE con la caja real de los
glifos, no con el alto de línea. Las proporciones se miden y reescalan en el
script: si cambia la fuente, no se rompe.

Verificado: 82.4% del PNG transparente y alfa 0 en la esquina (o sea, sin caja de
verdad), render legible a 16/32/64/128px sobre fondo de pestaña claro y oscuro, y
las tres rutas sirviendo 200. De regalo, al no haber degradado ni estrellas los
archivos se desplomaron: icon.png 254KB → 13KB, favicon.ico 1768B → 623B,
apple-icon 35KB → 3.3KB.

Pendiente menor: en la pantalla de inicio de iOS el apple-touch-icon transparente
se compone sobre NEGRO (iOS no respeta transparencia ahí). El azul se lee bien
igual (5.3 contra negro), pero si se quiere una teja opaca de marca, hay que
darle fondo propio solo a ese archivo.

---

## v5.17.5 — La bio dice la verdad, y el check final

### El dato falso
La bio larga decía que a Felipe lo "foguearon competencias como NASA Space Apps y
los Premios Sadosky". **Nunca participó de ninguna de las dos.** Se reemplazó por
algo cierto y del mismo largo (ES +2 caracteres, EN +8, para no descolocar el
layout de la figura apoyada en el párrafo): "me foguié llevando cada proyecto de
la idea hasta algo que alguien usa" — que además es el hilo de todo el portfolio.
Se actualizó el comentario del código que decía que las competencias "siguen
mencionadas en la bio larga": ahora aclara que se sacaron por completo porque no
son ciertas.

### Auditoría de seguridad (superficie real, no checklist de adorno)
El sitio es estático, sin backend, sin base de datos, sin auth y **sin ningún
input de usuario** (no hay formularios ni búsqueda), así que la superficie de XSS
es prácticamente nula. Lo que se verificó:

- **`dangerouslySetInnerHTML`**: sólo dos. El JSON-LD (contenido propio) y los
  íconos de marca (SVG generados en build desde simple-icons). Al JSON-LD se le
  agregó escape de `<` a `<` como defensa en profundidad: cualquier
  `</script>` futuro deja de poder cerrar la etiqueta. Verificado: sigue
  parseando como JSON válido.
- **Links externos**: 7 de 7 con `rel="noopener noreferrer"` (tab-nabbing).
- **Secrets**: ningún `.env` trackeado en git, cero variables `NEXT_PUBLIC_` (o
  sea que nada de `.env.local` se inlinea al cliente), la app no lee NINGUNA env
  var, y se comprobó que el valor del `VERCEL_OIDC_TOKEN` no aparece en el bundle
  cliente.
- **Query params** (`?fx`, `?perf`, `?bloom`, `?dpr`, `?comp`): se comparan contra
  enums o pasan por `Number()`; ninguno se refleja al DOM. Sin XSS reflejado.
- **Sin** `eval`, `new Function`, `innerHTML`, `document.write`, ni fetch/XHR/
  WebSocket a hosts externos.
- **Headers en vivo**: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy presentes; `x-powered-by` ausente. **0 violaciones de CSP.**
- **Dependencias**: Next 16.2.10 / React 19.2.4 al día. `npm audit` marca postcss
  (moderada) pero su "fix" propone bajar Next a la v9: es dependencia de BUILD y
  el CSS lo escribe el repo, no un usuario. Falso positivo práctico.

### Estado funcional
`npm run audit` **13/13 verde**: rutas de servicio (OG, robots, sitemap), los dos
404, poster sin WebGL con 0 errores, teclado (HUD enfocable + Enter navega),
portapapeles del email, "Volver al grafo", y la cámara siguiendo al scroll con
reduced-motion. TypeScript, ESLint y build limpios.

---

## v5.17.4 — Capturas de LOST y Nindo, y fuera el "en progreso"

Felipe pasó las capturas (lost-home.png, nindo-menu.png) y pidió sacar el pill
"en progreso" de todos los proyectos.

Las dos venían como screenshot de PÁGINA ENTERA, con mucho fondo vacío: el
contenido de LOST ocupaba el tercio superior (blanco abajo) y el de Nindo el
cuadrante superior-izquierdo. En la card 16:10 habrían quedado medio vacías. Se
recortaron con un script que detecta el bounding box de lo no-blanco, con dos
criterios distintos porque las imágenes son distintas:
- LOST: la marca (logo a la izquierda, botones de auth a la derecha) vive en TODO
  el ancho; recortar los lados la mata. Se conserva el ancho del contenido y se
  extiende la altura hacia el blanco de abajo hasta 16:10 → 1918x1199, con logo,
  auth y los dos botones grandes intactos.
- Nindo: el menú es un bloque compacto; se recorta ajustado a él y a 16:10
  exacto → 1426x891, sin blanco.
Verificado ojo por ojo antes de conectarlas.

El pill "en progreso" lo disparaba `incompleto:true`, que sólo tenían LOST, Nindo
y PC Builder (Superlum nunca lo tuvo). Se sacó de los tres: los secundarios son
proyectos TERMINADOS a los que les faltaban datos, no proyectos en curso; el
único realmente en progreso es Superlum, que ya lo dice en su texto ("en
desarrollo con ella"). El flag y su render quedan por si algún proyecto futuro lo
necesita.

Verificado contra el sitio: las 7 cards con imagen cargada, LOST y Nindo con las
suyas, y 0 pills "en progreso" en toda la sección.

---

## v5.17.3 — El repo de LOST, clickeable

Felipe quería que se pudiera entrar al repo de LOST. LOST tenía `enlaces: []`, y
en ProjectCard eso significa card NO clickeable (sin `href` de case study ni
enlace `repo`/`demo`, la card es sólo informativa). Se le agregó el enlace al
repo → la card entera pasa a abrir el repo en pestaña nueva. El inglés lo hereda
por spread (`...es.lost`).

Trampa anotada: el repo se llama con el PUNTO FINAL —
`github.com/3-TIC-ORT/proyecto-3-L.O.S.T.` — y sin ese punto GitHub tira 404.
Verificado (200 con el punto, 404 sin él) antes de ponerlo, y de nuevo contra el
sitio corriendo.

Sigue faltando la CAPTURA de LOST (y la de Nindo): las que pasó Felipe son
screenshots del chat, no archivos en disco. Quedan como placeholder + pill "en
progreso" hasta que estén los PNG en /public, igual que Nindo.

---

## v5.17.2 — Reduced-motion no puede congelar la navegación

Un amigo de Felipe entró desde su máquina y el modelo 3D "no se movía": el sol
central se achicaba pero la cámara no viajaba por la grilla. Pasaba en Brave Y en
Edge de la misma PC — la pista de que era una config del sistema, no del
navegador.

Diagnóstico, reproducido y medido (centroide del cúmulo naranja, portada vs
#perfil): con `prefers-reduced-motion: reduce` el cúmulo se movía **0.1%** contra
**6.5%** en modo normal. La cámara clavada en la portada. La causa, una línea del
CameraRig: `const t = reduced ? 0 : clamp(st.t, ...)` — en reduced el progreso de
cámara se forzaba a 0, así que el scroll no la movía. Y como la cámara ES la
navegación de este sitio, eso no era "menos movimiento": era el sitio roto. El sol
seguía achicándose porque su escala (easeSunCore) no dependía de `reduced`, lo que
despistaba: parecía que algo andaba.

`prefers-reduced-motion` pide sacar el movimiento GRATUITO —la inercia, el plasma
hirviendo, la órbita autónoma—, no la posición que dirige el usuario. El fix: la
cámara SIEMPRE sigue al scroll; en reduced se planta directo en el objetivo (sin
damping ni planeo), así el único movimiento es el que produce quien scrollea, que
es motion controlado y accesible. El plasma y las protuberancias siguen quietos en
reduced, como antes.

Verificado tras el fix: el cúmulo se mueve 5.1% en reduced (era 0.1%), y el
encuadre por sección es correcto en ambas direcciones de paneo (Perfil a la
derecha, Enfoque a la izquierda), con el sol de la sección agrandado y el HUD
activo.

Guard de regresión: `scripts/audit.mjs` suma un check en un contexto con
reduced-motion — mide el desplazamiento de los chips del overlay (que posiciona la
proyección de la cámara) entre portada y un tópico y exige que se muevan. No se
veía en ningún test visual porque todos corren sin la preferencia. Auditoría 13/13.

---

## v5.17 — Robustez: lo que sí hacía falta (y lo que no)

Pedido de Felipe: que el sitio aguante miles de personas y ande estable.

### El diagnóstico primero, para no agregar cosas al pedo
El build lo dice: **TODAS las rutas salen `○ Static` / `● SSG`**. No hay cómputo
por request, ni base de datos, ni API, ni sesiones. Lo que Vercel sirve es HTML
prerenderizado desde su CDN, así que "miles de visitantes" **no es un problema de
carga**: no hay servidor que saturar. Rate limiting, pool de conexiones,
autoescalado o una capa de cache serían features de adorno acá.

Los riesgos REALES de este sitio son otros tres, y sobre esos se trabajó.

### 1. Que un error de JS no se lleve puesta la página
El canvas 3D ya estaba cubierto (`CanvasGuard` es un error boundary de verdad y
cae al poster), pero **no había red para el resto**: cualquier otro componente
cliente que tirara dejaba la pantalla del framework.
- `app/error.tsx` — fallback de marca con "Reintentar" y salida al inicio. A
  propósito NO usa el diccionario de idioma ni componentes del sitio: si el error
  viene de ahí, importarlo lo volvería a tirar.
- `app/global-error.tsx` — para cuando el que falla es el layout raíz. Trae su
  propio `<html>` y estilos INLINE, porque en ese escenario no se puede contar
  con que haya cargado nada.
- `app/not-found.tsx` — 404 de marca en vez del genérico.

**Verificado en navegador**, no supuesto: se montó una ruta que tira después de
hidratar y devolvió 200 con el fallback ("Algo se rompió" + Reintentar). Dato que
salió de ahí: un `throw` en render lo caza el BUILD (falla el prerender), así que
el boundary sólo entra para errores de runtime — que son justo los que le pasan
al visitante.

### 2. El peso de lo que se despliega
`public/` pesaba **21 MB**, de los cuales 16.3 MB eran `foto_frente.png` y
`foto_casual.png`: **sin una sola referencia en el código** desde que la sección
Perfil pasó a los recortes. Salieron de `public/` y quedan archivadas en
`contenido/assets/foto/`, que no se despliega. **21 MB → 5.4 MB (−74%)**.

### 3. Headers: cache y seguridad
- **Cache de /public**: Next ya marca `/_next/static` como `immutable` (esos
  archivos llevan hash), pero los de `/public` no tienen hash y se revalidaban en
  CADA visita. Ahora `max-age` corto para el navegador (una foto nueva se ve el
  mismo día) + `s-maxage` largo para el CDN, que es quien absorbe el tráfico y
  que Vercel invalida en cada deploy, + `stale-while-revalidate` para que nadie
  espere. `immutable` a secas se descartó: cambiás una foto y el que la tenía
  cacheada se come la vieja por un año.
- **Seguridad**: CSP, `nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS, y `poweredByHeader: false`.
- **La CSP es ESTÁTICA, no por nonce**, y es una decisión, no una omisión: el
  nonce exige render dinámico por request, o sea que rompería justo la propiedad
  que hace que el sitio escale. `'unsafe-inline'` en script-src es inevitable sin
  nonce; se acepta sabiendo que acá no hay input de usuario, formularios, auth ni
  terceros. Lo que la política sí cierra es todo lo demás. `'unsafe-eval'` quedó
  AFUERA: se verificó que three/drei no lo necesitan en producción.

Verificado contra el sitio corriendo: **0 violaciones de CSP y 0 errores**, con el
vidrio conservando su filtro SVG (la data URI del `backdrop-filter` era lo que más
riesgo corría) y el canvas 3D pintando.

### Observabilidad: Vercel Web Analytics (v5.17.1)
Felipe lo aprobó, así que se instaló `@vercel/analytics` y `<Analytics />` va
ÚLTIMO en el layout y FUERA de los providers: no envuelve a nadie, así que si su
script no carga (adblock, red caída) no se lleva puesto nada del sitio.

El punto fino era la CSP recién puesta. Verificado leyendo el paquete, no
suponiendo: en PRODUCCIÓN se sirve desde `/_vercel/insights/script.js` y manda
los eventos a `/_vercel/insights/event`, los dos del MISMO ORIGEN → entran con
`'self'` sin abrirle la puerta a ningún tercero. En DESARROLLO, en cambio, carga
un script de debug desde va.vercel-scripts.com, que la política sí bloquearía;
ese dominio se permite SOLO cuando `NODE_ENV === "development"`, para no ensuciar
la consola mientras se trabaja. **La política que se despliega queda cerrada.**

Verificado contra el build de producción: la CSP servida no incluye el dominio de
dev, el script se inyecta desde el mismo origen y hay **0 violaciones**.

Ojo con el límite: el plan Hobby da **2.500 eventos por mes**. Si el sitio
realmente recibe miles de visitas, se agota — y ese es justo el escenario que
Felipe quería cubrir.

`npm audit` marca postcss (moderada, XSS por `</style>` sin escapar en el
stringify). Su "fix" propone bajar Next a la v9: es un falso positivo práctico —
es dependencia de BUILD y el CSS lo escribe el repo, no un usuario.

---

## v5.16 — Feli apoyado en el texto (y no una foto en un marco)

Idea de Felipe: en vez de la foto enmarcada en vidrio, un recorte suyo APOYADO
sobre el texto. Dos versiones, porque la forma de la pantalla manda: en ancho hay
lugar al costado (del lado opuesto al sol) y se para de espaldas contra la
columna; en angosto no hay costados, así que se apoya ENCIMA, con el bloque de
texto haciendo de mesa. Sin el "Feli · Buenos Aires" (ya se dice en el footer y
en Contacto).

### Auditoría de los recortes (antes de escribir una línea)
Los cuatro PNG se midieron: alfa real, filo, resolución y peso. El susto inicial
—30-46% de píxeles con alfa "parcial"— era falso: ese tramo es 250-254, o sea el
cuerpo, visualmente opaco. La banda de transición REAL es 1.4-2.7%, un antialias
normal, y `claros=0%` descarta el halo blanco que arruina un recorte sobre fondo
claro. A 6x sobre el pelo (lo más difícil) el filo se funde sin línea de matte.
Veredicto: sirven como están.

### Las dos piezas
- **Ancho** (`feli-parado.png`, 446x1600): cuerpo entero con zapatillas, que es
  lo que lo deja PARADO sobre la grilla del piso 3D — el recorte a media pierna
  se hundía en el suelo. Va espejado (`-scale-x-100`) porque en la foto la
  espalda queda del lado equivocado. Alto en vh con `clamp` y ancho automático:
  se acomoda a cualquier pantalla sin deformarse, y alineado al final de su
  columna la espalda toca el texto sea cual sea el alto que resulte. El texto
  arranca con `pl-3` y no más: con 2rem se leía "parado al lado", que es otra
  cosa.
- **Angosto** (`feli-apoyado.png`, 1600x1561): brazos cruzados, recortado a la
  altura de los antebrazos. Acá estuvo el único problema de verdad: el PNG ya
  viene cortado en el torso, así que SIEMPRE queda un filo recto abajo y se leía
  "foto cortada", no "apoyado". Recortar más no lo arregla, sólo lo mueve. Se
  disuelve con `mask-image`: los antebrazos quedan nítidos y lo que sigue se
  desvanece.

Las dos llevan sombra de contacto (un radial suave) — sin eso quedan pegoteadas
sobre el estudio 3D en vez de apoyadas en él.

### Art direction sin pagar dos descargas
Los dos recortes se montan y se ocultan por CSS (`md:hidden` / `hidden md:block`).
Como next/image es lazy por defecto, el que no corresponde NUNCA entra al
viewport y el navegador no lo baja: art direction real sin el costo de bajar las
dos imágenes.

### De paso
El stack pasó DEBAJO y a ancho completo: la figura se queda con el costado del
texto, y las cards dejan de competir por los ~430px que les quedaban.

Verificado a 1920, 1440, 820 y 768 (el límite de `md`): sin desborde horizontal
en ninguno, y la figura apoyada en todos.

### Ajuste: más grande, y por qué escalaba mal
Felipe pidió la figura más grande, marcando un recuadro y una línea donde tenía
que llegarle la cabeza. Al medir apareció la causa real de que se viera chica: el
alto estaba en `vh`, y en su pantalla (baja y ancha, 773px de alto útil) `58vh`
daba 448px — la mitad del cap de 608. **El alto pasa a salir del ANCHO de la
columna**, que en desktop es siempre 672px: ahora mide 280x698 idéntico a 1920 y
a 1720x780.

Y se ancla ARRIBA, no abajo. Anclada abajo la cabeza quedaba a merced del alto
del texto, y agrandar era contraproducente: más ancho de figura → menos ancho de
texto → texto más alto → la cabeza volvía a bajar. Anclada arriba queda a la
altura del título en cualquier pantalla (medido: +0px contra el tope del título
en 1920, 1720x780 y 768). Resultado 280x698 contra el recuadro pedido de 235x585:
lo supera en ambos ejes.

Recortes finales: `feli-lateral.png` (cortado en el muslo, con el filo disuelto
por la misma máscara que el de angosto) y `feli-mesa.png` (mano en la cara) para
el móvil. La figura lateral perdió la sombra de piso: ya no tiene pies, se
desvanece — una sombra de contacto ahí sería mentira.

### Ajuste final: apoyado en el PÁRRAFO, no en el título
Felipe: un poco más grande y más abajo, apoyado sobre el párrafo. En vez de
empujarla con un margen a mano (que no seguiría al título, que mide 115px en
escritorio y 38px en `md`), **el título sale de la columna y pasa a ancho
completo**: así la fila de abajo EMPIEZA donde empieza el párrafo y la figura se
alinea sola con él en cualquier pantalla. Medido: cabeza a 0px del tope del
párrafo en 1920, 1720x780 y 768. De regalo el título recupera los 672px enteros
y deja de partirse en tres líneas (115px de alto contra 173px).

Columna a 19rem: la figura queda en 304x758 (venía de 280x698). El precio es la
columna de párrafo en 356px (~42 caracteres por línea) — corta pero legible; es
el intercambio directo por el tamaño pedido.

## v5.15 — El sol no puede cambiar de color según la máquina

Felipe, comparando ?perf=bajo contra la portada normal: "¿por qué el sol y los
mini-soles son más rojizos e intensos, y el color que emana a la escena es más
fuerte?". Tenía razón y el bug era de v5.14: al degradar, yo apagaba el bloom.

### El diagnóstico
Los soles salen en **HDR** (uBright 1.3, toneMapped false) contando con que el
EffectComposer los resuelva en un buffer half-float. La cúpula, en cambio, está
clampeada a 0.999 a propósito, así que **los únicos que pasan de 1.0 son los
soles**. Sin bloom, three dibuja directo a 8 bits y ese exceso se **recorta POR
CANAL**: el rojo se clava en 1.0 y verde/azul se quedan abajo → naranja duro. No
es "lo mismo sin halo": es otra gradación. Medido sobre la región del sol:

| | R | G | B | saturación |
| --- | --- | --- | --- | --- |
| con bloom (referencia) | 254.4 | 211.4 | 162.4 | 0.362 |
| sin bloom, crudo | 253.3 | 172.3 | 108.0 | **0.572** |

63% más saturado. Y el "color que emana" era lo mismo al revés: la cúpula es
idéntica en ambos casos, pero el bloom le pinta encima un resplandor pálido que
la LAVA. Sin bloom no emana más — es que ya no está tapada.

### Los arreglos
- **El bloom deja de apagarse al degradar.** Se midió por separado con overrides
  nuevos (`?bloom=0|1`, `?dpr=n`): el DPR solo ya da 3.9x (1137→293ms), y el
  cuello real medido en v5.14 era el DOM, no el canvas. El bloom es fill-rate
  puro: caro en el SwiftShader de headless, barato en cualquier GPU real.
- **Tercer escalón `minimo`** (lib/rendimiento.ts): si después de `bajo` el
  equipo SIGUE sin dar, recién ahí se suelta el bloom. La degradación pasa a ser
  escalonada, con ventana de gracia tras cada cambio (el reflow y el recompile
  de shaders ensucian la primera medición y condenarían al escalón nuevo).
- **Compensación de gradación** (CHUNK_SIN_BLOOM en sun.ts): donde el bloom es
  IMPOSIBLE (GPU sin half-float, render por software) el shader emula lo que el
  bloom hace al sumar luz —los tres canales suben juntos y el núcleo rueda al
  blanco— derramando el excedente sobre 1.0 a todos los canales. El factor 0.91
  no es a ojo: con derrame pleno el núcleo se pasaba de blanco, y la saturación
  y el canal azul, por separado, dieron 0.905 y 0.912.

### Resultado
Con el plasma congelado (reduced-motion) para que la única variable sea el modo:

| | R | G | B | sat | sd (contraste) |
| --- | --- | --- | --- | --- | --- |
| alto | 254.4 | 211.4 | 162.4 | 0.3615 | 29.8 |
| bajo | 254.4 | 211.4 | 162.4 | 0.3615 | 29.8 |
| minimo | 253.3 | 212.6 | 168.5 | 0.3353 | 36.4 |

**alto vs bajo: diferencia media 0/255** — idénticos pixel a pixel, que era el
pedido. `minimo` queda parejo en color (venía de 0.572 de saturación) pero
conserva ~22% más de contraste local.

### Un resultado NEGATIVO que queda documentado
Se probó una CORONA aditiva (sprite radial; makeCoronaTexture ya existía en
sun.ts, sin usar) para reemplazar el derrame del bloom en `minimo`. **No sirve**:
sd 36.8 contra 36.4 de no poner nada. La razón es de fondo — el bloom baja el
contraste porque desenfoca la PROPIA imagen y las vetas brillantes sangran sobre
las oscuras; un degradado radial fijo sólo suma una rampa de baja frecuencia y no
toca la alta. Se revirtió y quedó la nota en el código para que nadie lo reintente:
igualar ese resto pide un blur real, o sea el post-proceso que en ese escalón no
se puede pagar.

Overrides de debug disponibles: `?perf=alto|bajo|minimo`, `?bloom=0|1`, `?dpr=n`,
`?comp=0|1` (apaga la compensación, para comparar).

---

## v5.14 — Los FPS: el vidrio costaba una pasada de más (×2, y ×4 en gama baja)

Felipe reportó bajones de FPS en Trabajo y Recorrido, con la pregunta correcta
detrás: "si a mí me pasa, ¿cómo le irá a una máquina de gama baja?".

### El método: ablación, no intuición
El WebGL de headless es SwiftShader y tapa cualquier otra medición, así que se
midió el costo del DOM con el CANVAS OCULTO (en una GPU real el WebGL es barato;
lo que queda es lo que de verdad pesa). Frame-times reales scrolleando con
eventos wheel, apagando de a una las capas sospechosas:

| escenario (#trabajo, canvas oculto) | frame time |
| --- | --- |
| actual (lente SVG en las 33) | 117 ms |
| lente sólo en las 16 visibles | 120 ms |
| blur simple, sin SVG | 39 ms |
| sin ningún backdrop-filter | 17 ms |

Dos hallazgos que cambiaron el plan:
1. **El gating por viewport NO sirve** (117 → 120ms): Chrome ya no rasteriza lo
   que está fuera de pantalla. Se descartó antes de escribirlo.
2. **El filtro SVG es el 78% del costo.** Inventario: 33 elementos con lente,
   1.51 M px² filtrados. Y como el canvas 3D repinta detrás, el backdrop se
   invalida y TODO eso se recalcula por frame.

Segunda tanda, para saber de dónde sale ese costo: la cadena es **lineal en
pasadas** de `feDisplacementMap` (~30ms cada una, porque cada pasada reprocesa
el área entera) y proporcional al ÁREA — 1 pasada 57ms, 2 pasadas 94ms, 3
pasadas 110ms. Las cards "suave" aportan ~90% del área.

### Los arreglos
- **Una pasada para el vidrio EN FLUJO** (lente.ts): `chromaticAberration: 0` en
  `paramsPara({suave})` y `filtroLente` emite un único `feDisplacementMap`.
  Conserva la REFRACCIÓN entera (el doblez de las líneas, que es el efecto que
  se ve) y sólo resigna el fringe de color, que en esas cards ya era de 2px.
  Medido contra la versión de 3 pasadas: diferencia media **0.44/255 (0.17%)**,
  y sólo el **2.24%** de los píxeles cambia de forma perceptible. El vidrio
  FLOTANTE (HUD, CTAs, chips) mantiene las 3 pasadas con CA completa: es chico,
  cuesta centavos y es donde el efecto luce.
- **ResizeObserver en vez de re-medir por mutación** (LiquidGlass.tsx): antes
  cada mutación del DOM (y GSAP muta estilos por frame) reprogramaba un pase de
  `querySelectorAll` + `getBoundingClientRect` sobre los 33 vidrios — un layout
  sincrónico forzado por frame para descubrir que casi nunca cambiaba nada. El
  filtro sólo depende del TAMAÑO, así que ahora manda un ResizeObserver
  (`borderBoxSize`, sin flush). El MutationObserver queda sólo para descubrir
  vidrio nuevo, e ignora las mutaciones que no agregan nodos.
- **Calidad adaptativa** (lib/rendimiento.ts, nuevo): mide la cadencia real en
  ventanas de 100 frames y, si la MEDIANA supera 26ms (~38fps) dos ventanas
  seguidas, degrada UNA vez y no vuelve (el parpadeo de subir y bajar calidad
  molesta más que unos FPS). Al degradar: el vidrio se queda con el frost del
  CSS (sin cadena SVG) y el canvas baja a DPR 1 sin bloom — que además es el
  mayor ahorro de MEMORIA (a DPR 2 en 1920x1080 el buffer es de 3840x2160, y el
  composer del bloom se lleva varios más). Descarta los dt monstruo (pestaña en
  segundo plano) y deja de vigilar a los 25s. `?perf=bajo` / `?perf=alto` fuerzan
  el nivel para probar sin una netbook a mano.

### Resultado
| | #trabajo medio | #trabajo p95 | #recorrido | heap JS |
| --- | --- | --- | --- | --- |
| antes | 109.6 ms | 135.9 ms | — | 17.4 MB |
| después (calidad plena) | **52.1 ms** | 94.2 ms | 25.9 ms | **13.6 MB** |
| gama baja (automático) | **25.7 ms** | **28.4 ms** | 16.6 ms | 12.1 MB |

×2.1 en calidad plena y ×4.3 con la degradación, con el p95 de 135.9 a 28.4ms
(que es el bajón que se siente). Sin regresión visual: verificado por captura y
por diferencia numérica.

---

## v5.13.2 — El grosor lo manda la perspectiva, no la pantalla

El diagnóstico lo hizo Felipe y desarmó las dos versiones anteriores: v5.13 y
v5.13.1 fijaban el grosor **en píxeles de pantalla**, y eso IGNORA la perspectiva.
Si las celdas se achican con la distancia pero la línea conserva su ancho en
píxeles, la línea queda cada vez más desproporcionada respecto del cuadrado que
delimita — por eso las de atrás "parecen tener un grosor enorme". El pedido
original ("que sea constante") se había tomado literal; lo constante tiene que
ser la RELACIÓN línea/celda, no el ancho en píxeles.

Fix (función `lineas`, Studio.tsx): el ancho pasa a definirse como **fracción de
la celda** (espacio del mundo, no de pantalla) — 0.028 el piso, 0.026 la pared.
Así la línea se achica en proporción con su cuadrado, como cinta de marcar
pegada al piso. El precio es la minificación (a lo lejos la línea baja de un
píxel y titila), resuelto como en la técnica "pristine grid" de Ben Golus:

1. Nunca se dibuja más fino que ~1px (`dibujo = max(objetivo, medio px)`) y se
   COMPENSA la intensidad por `objetivo / dibujo`. En vez de una línea que
   parpadea, una de 1px cada vez más tenue: se conserva la "tinta" total, que es
   lo que percibe el ojo.
2. Pasado un cuadrado por píxel se funde al PROMEDIO (la fracción cubierta), así
   el fondo converge a un tono plano en lugar de moiré.

Las dos familias se unen con `mix(x, 1, y)` (unión tipo "over"), más suave que
`max` en los cruces. Verificado en el render de producción a 2x: la relación
línea/celda se mantiene de cerca a lejos y el vidrio conserva detalle que doblar
(la refracción cromática sigue leyéndose en los CTAs).

---

## v5.13.1 — La grilla que de verdad no engorda (la minificación era la culpable)

v5.13 tituló "grilla constante", pero las líneas lejanas SEGUÍAN empastándose y
Felipe lo volvió a cazar. La norma exacta del gradiente (v5.13) daba grosor
constante sólo MIENTRAS la celda fuera más grande que la línea. El problema real
era la **minificación**: hacia el horizonte entran muchas celdas por píxel; con
`d = min(g.x, g.y)` y un grosor de ~1.7px, la línea ocupaba casi TODA la celda
→ `d < grosor` daba verdadero en el píxel entero → la grilla se empastaba en una
banda sólida que se lee como "más gruesa". El término de saturación (0.12→0.38)
no la apagaba antes de que eso pasara.

Fix (función `lineas`, Studio.tsx): se mide la distancia a la línea en PÍXELES
por eje (núcleo de grosor constante en pantalla) y se atenúa por la **cobertura
real** de la línea dentro de la celda — `cob = (2·grosor + aa)·w`, línea/celda ∈
[0,1]. Apenas la línea empieza a comerse la celda, la grilla se DESVANECE (×`1 -
cob`) en vez de engordar. Cada eje se evalúa por separado (no con `min`, que
arrastraba una familia densa sobre la otra) y se unen con `max`. Grosor un punto
más fino, como pidió: 1.7→1.2 piso, 1.5→1.0 pared. Verificado en el render de
producción (SwiftShader): líneas finas y parejas de cerca a lejos, fundiéndose
limpio hacia el horizonte, sin banda.

Enfoque: se revisó el reporte de la card "Entender antes de tocar código"
chocando con la de abajo. NO se reproduce — la grilla usa `align-items: stretch`
(default), así que las cards de una fila SIEMPRE igualan altura. Medido en dev y
en producción, 9 anchos (768–1920px): las dos de arriba siempre misma altura y 0
solape (probablemente el reporte venía de un build cacheado). Sin cambios.

Nota: el póster de fallback (sin-WebGL) no se regeneró — la diferencia es un
pelo de grosor en la grilla, sólo visible para quien no tiene WebGL.

---

## v5.13 — El sitio habla inglés solo, la grilla constante y la auditoría

### Idioma automático (es/en), sin selector
Pedido de Felipe: detectar la región o el idioma configurado en Google y que el
sitio cambie solo, priorizando la configuración de Google. Implementación:
- Detección (lib/idioma.ts): 1º `navigator.languages` — en Chrome ES
  literalmente la config de idioma de Google del usuario (la prioridad pedida);
  2º la región por huso horario, solo si el navegador no informa idiomas.
- Arquitectura hydration-safe (IdiomaProvider): el HTML estático es SIEMPRE
  español (SEO: la búsqueda que importa es "felipe doval");
  `useSyncExternalStore` con snapshot de servidor "es" y de cliente la
  detección → React hidrata idéntico al HTML servido y re-renderiza en inglés
  sin mismatch (verificado: 0 errores de consola en ambos idiomas). El sitio
  sigue 100% estático: nada de headers() ni middleware que lo vuelvan dinámico.
- Contenido completo traducido: perfil.en.ts y proyectos.en.ts (heredan del
  español todo lo no-textual vía spread: si cambia un dato duro allá, acá se
  hereda solo) y content/ui.ts con TODOS los strings de interfaz (títulos
  partidos en pre/accent/post para que el span del degradé sirva en cualquier
  idioma). Refactor a useIdioma(): secciones, HUD, chips de los soles, footer,
  nav, preloader, placeholder, email, cards y el case study (partido en shell
  servidor para metadata/rutas + cuerpo cliente).
- Metadata / JSON-LD / sitemap quedan en español a propósito (el SEO es es).
- Tests: TODA la batería fijada a locale es-AR (Playwright usa en-US por
  defecto — sin esto, la batería entera hubiera pasado a probar el sitio en
  inglés sin que nadie lo pidiera). Nuevo scripts/idioma.mjs (npm run idioma):
  es-AR y en-US de punta a punta (html lang, CTA, HUD, detalle, hidratación).
  HUD verificado sin desborde en EN (320/393/1440).

### La grilla de grosor constante (bug de shader)
Felipe: las líneas lejanas se ven más gruesas. Causa: la normalización por
fwidth (norma L1 = |ddx|+|ddy|) sobreestima el ancho hasta 2x en las diagonales
que se alejan (las DOS derivadas contribuyen). Fix: norma exacta del gradiente
por eje (length(dFdx, dFdy)) → distancia real en píxeles → mismo grosor cerca y
lejos, más un término de saturación que apaga la grilla donde la celda ya es
más chica que la línea (antes se fundía en mancha hacia el horizonte). Grosor
final un punto más fino que el cercano anterior (1.7 piso / 1.5 pared), como
pidió.

### Auditoría de riesgo (12/12 verde)
Funcionalidades elegidas por criterio de riesgo, no al azar: poster sin WebGL
(el fallback menos ejercitado — WebGL bloqueado por init script → poster
visible, sin canvas, 0 errores), teclado (HUD enfocable + Enter navega),
portapapeles del email (copia exacta verificada), 404 de slug inválido y de
ruta inventada, OG image / robots / sitemap 200, y "Volver al grafo" desde el
case study. Nuevo scripts/audit.mjs (npm run audit). No se encontró ningún bug
latente.

Batería completa verde + póster regenerado (la grilla cambió).

---

## v5.12.3 — La refracción que por fin se VE (y el detective de por qué no)

Felipe: "la textura no se nota, el vidrio no la deforma, el color ambiental no
se nota, y no veo la aberración cromática". Cadena de diagnóstico MEDIDA (cada
paso descartó una hipótesis):

1. ¿El backdrop-filter ve el canvas 3D? SÍ — vidrio de prueba inyectado sobre el
   disco del sol: refracta. El mecanismo nunca estuvo roto.
2. ¿Qué capa del vidrio "borra" las líneas? NINGUNA — apagando glints, reflejo,
   tinte y anillo de a uno, el contraste interior no cambió (rango ~15 en todos
   los casos). Ni siquiera era el blur: sin filtro alguno el interior daba 17.
3. La verdad (medida contra el fondo desnudo): DETRÁS del vidrio casi no había
   nada. La grilla era rala (muchos vidrios caían entre líneas → desplazar un
   degradado liso da 0.3 niveles de diferencia = invisible), de bajo contraste
   (sd 5.5), y el lobe ancho del halo la COMPRIMÍA más (teñía línea y piso por
   igual).

Fixes, cada uno contra una causa medida:
- Grilla DENSA (paso 2.9 en vez de 1.15): todo contenedor tiene varias líneas
  cruzándolo. Con contraste real (sd 5.5 → 12.1) y grosor 2.1.
- Halo del sol como UNIFORM que sigue a la cámara (uSunGlow = dir cámara→sol):
  antes era una dirección fija del mundo y quedaba descentrado en los tópicos.
  Lobe ceñido (pow 2.6) para no aplastar el contraste de la grilla.
- Bisel de la lente más ancho (depth ~30% del lado, techo 22px): con 12px el
  doblez quedaba escondido en el filo. CA 4 en grandes / 2 en chicos y suaves.
- Blur de la cadena a la mitad (0.5/1): con blur 1+2 las líneas de ~5px se
  lavaban antes de llegar a la lente.
- Glints de esquina ceñidos (blur 11-12, no 18-20): inundaban de blanco el
  interior de los elementos chicos.

Resultado (zoom 2x): la línea que cruza el CTA entra y sale doblada en S con
los canales de color separados (rojo/naranja por dentro, celeste por fuera) —
la firma del componente de referencia. El HUD dobla las líneas del piso.
Herramientas nuevas en scratchpad: prueba-doblez.mjs (diferencia con/sin lente),
atenuacion.mjs (fondo desnudo vs a través del vidrio), quien-tapa.mjs (bisección
de capas), culpa-blur.mjs (bisección de la cadena).

Batería verde + póster regenerado.

---

## v5.12.2 — El salto del texto: reflow de peso, no el paralaje

Felipe reportó que el TEXTO seguía acomodándose (el sol ya estaba quieto), con
un dato de oro: sólo saltaban 4 letras — la E de FELIPE y VAL de DOVAL. Intuía
el paralaje del mouse.

Diagnóstico MEDIDO (scratchpad/letras.mjs, cada letra cuadro a cuadro):
- El paralaje es INOCENTE: con jitter de mouse los saltos son idénticos que sin
  mouse (la F se mueve 0.3px), siempre en los mismos ms.
- La causa real: la entrada anima el PESO de cada letra (200→800 vía
  font-variation-settings) y una letra más pesada es más ANCHA. Con las letras
  inline, cada una empuja a las de su derecha → las del borde acumulan todo el
  corrimiento (la L de DOVAL: 35px). Y animar font-variation-settings re-maqueta
  el texto entero por frame (con la drop-shadow + background-clip:text, carísimo)
  → la entrada corría a ~5fps (13 frames en 2.6s): las letras no se deslizaban,
  TELETRANSPORTABAN en saltos de 20-40px. Las 4 que vio Felipe eran las de
  mayor salto (E de FELIPE 23px, A 34px, L 42px).

La cura (HeroName.congelarAnchos): cada letra pasa a `inline-block` con el ANCHO
de su glifo a peso 800 (el reposo), medido forzando el peso 800 en el momento
(a prueba de si la animación ya arrancó) y tras `document.fonts.ready` (el
fallback tiene otras métricas). El peso sigue animando, pero DENTRO de una caja
fija: el glifo engorda sin mover a nadie. Verificado: recorrido y salto de las
11 letras = 0.0px. El degradado que atraviesa la línea y la drop-shadow
sobreviven (comparado A/B/C con screenshots: idéntico). Re-mide en resize (el
font-size cambia por el vw); verificado que la caja re-congela al tamaño nuevo.

Bonus: esto arregla el sol en la RAÍZ. La columna ya no respira (ancho constante
desde el primer frame), así que la cámara que la mide tampoco se acomoda — el
band-freeze de v5.12.1 y el cap de delta quedan como red de seguridad, no como
el fix. Batería completa verde.

---

## v3.3.0 — Sol vivo a 60fps + contenedor fullereno (cromo + vidrio)

Feedback de Felipe sobre v3.2: (a) el sol se animaba a <1fps (quedaba congelado
y saltaba cada varios segundos); (b) el contenedor (el balón GLB de v1) era feo
— quería un contenedor más realista y futurista.

### El sol hierve a framerate completo
- Causa del <1fps: el render on-demand pausaba el canvas en reposo → el plasma
  solo avanzaba en los pocos frames del scroll. Ahora **en GPU real el canvas
  corre SIEMPRE** (`frameloop="always"`): el sol se anima continuo a 60fps+. El
  costo es trivial para cualquier GPU (escena chica + bloom mipmap).
- La **pausa on-demand queda solo para software rendering y reduced-motion**
  (`paused && (lite || reduced)`): ahí el sol ya es estático (shader lite / uTime
  congelado), así que pausar ahorra CPU sin congelar nada visible.

### Contenedor nuevo: fullereno de cromo + vidrio (fuera el GLB)
- Sobre "buscar un modelo certificado": los marketplaces con descarga de modelos
  (Sketchfab etc.) requieren OAuth — no descargable desde acá. En su lugar, el
  contenedor se construye con **matemática exacta**: un **icosaedro truncado**
  (la pelota de fútbol / fullereno C60 — la marca de Felipe): 60 vértices / 90
  aristas (12 pentágonos + 20 hexágonos), **orientado con un hexágono de frente**
  → el sol y el FD quedan en una ventana limpia, sin struts cruzando el centro.
  (`components/three/Lattice.tsx`; primero se probó un geodésico detail-1 pero
  sus triángulos tapaban el centro.)
- **Materiales**: struts finos de cromo claro con juntas esféricas (mergeado en
  1 draw call; el envmap del cielo les da el realismo) + **esfera de vidrio
  físico** (`transmission`, ior bajo 1.08 para no hacer efecto lupa) — el sol se
  ve a través del vidrio y el cielo se refleja en él. En lite: metal simple, sin
  vidrio (transmission re-renderiza la escena).
- **Radio canónico `BALL_R = 1`**: se eliminó el GLB de la home (y su
  `useGLTF`); la boundingSphere del GLB estaba inflada respecto del radio
  visual, así que las distancias de cámara se recalibraron (OVER 5.0 / CLOSE
  3.6) y los soles-nodo ahora orbitan DESPEGADOS del contenedor (r×1.32, halo
  alrededor del vidrio). El FD se movió fuera del shell de llamas (R×1.5) para
  que no lo lave el fuego.

### QA
Gate verde · smoke desktop+mobile 0 errores · perf: 60 reposo / ~29 moviendo
bajo SwiftShader (la pausa lite sigue activa). Los `.glb` quedan en
`public/models/` como material histórico (el poster sin-WebGL sigue usándolos
como referencia visual).

### v3.4.0 — Ráfagas solares + navegación directa (y el bug del vidrio)
- **Protuberancias en arco** (como la referencia de Betelgeuse): dos torus
  parciales anclados al limbo con shader de fuego (ruido animado que repta por
  el arco, pies fundidos con la superficie), derivando lentamente alrededor del
  sol. **Ráfagas periódicas**: 3 jets que erupcionan y se apagan (períodos y
  fases distintos → nunca en sincronía). Los mini-soles también erupcionan
  (burst periódico en brillo + corona). Blending NORMAL para el fuego (el
  aditivo desaparece contra el cielo claro).
- **EL BUG DEL VIDRIO (root cause encontrado por bisección con capturas):** la
  esfera de vidrio (transmission) escribía DEPTH → todas las capas transparentes
  DENTRO del vidrio (corona, llamas, protuberancias y el FD) se rechazaban por
  profundidad → invisibles. Por eso el FD desapareció en v3.3.2 y el sol no
  "encandilaba". Fix: `depthWrite={false}` en el vidrio (el fuego se compone
  encima; la oclusión real la da el disco opaco del sol). Probado con FD rojo +
  depthTest off para aislar la causa.
- **Navegación por click DIRECTA (sin mareo):** al clickear una sección, el
  contenido salta YA (`lenis.scrollTo(..., { immediate: true })`) — nada de
  speed-scroll por las secciones intermedias. La transición visual la hace la
  CÁMARA con **damping adaptativo**: cerca del objetivo (scroll) tracking
  ajustado; lejos (click) un planeo suave (~1s) EN LÍNEA DIRECTA al nodo (los
  waypoints solo aplican al scroll continuo).
- El FD ahora se anima por ESCALA de su grupo (la opacidad del material de
  troika-text no es confiable de mutar).

### v3.8 — Responsive mobile + DEPLOY a Vercel
- **Mobile:** la cámara escala por ASPECTO (`OVER = r·max(5, 4.15/aspect)`): en
  anchos chicos se aleja para que el contenedor + halo de soles + etiquetas
  entren completos (~80% del viewport). Tipografía: mínimos de los clamps
  reducidos. Verificado 360/390/768: overflow-x 0, texto legible, HUD entero.
- **Deploy:** proyecto Vercel **`felipe.doval.portfolio`** (cuenta felgimon).
  Vercel aceptó el nombre con puntos pero la URL los normaliza (los puntos
  romperían el TLS wildcard de *.vercel.app):
  **https://felipedovalportfolio.vercel.app** (canónica, sigue cada deploy) +
  alias `https://felipe-doval-portfolio.vercel.app` (re-apuntar tras cada
  deploy o agregarlo como dominio en el dashboard). `ssoProtection` apagado vía
  API (portfolio público). `siteUrl` actualizado.
- **Verificación EN PRODUCCIÓN** (Playwright contra la URL real): desktop,
  mobile y /proyectos/superlum → 0 errores de consola, canvas 3D activo,
  overflow-x 0. Deploy manual: `npx vercel --prod` (o conectar el repo GitHub
  para auto-deploy).

### v3.7.0 — Protuberancias VIVAS + soles clickeables con implosión
- **Fuera las partículas-sprite de eyección** (a Felipe no le parecían de un
  sol). El fuego ahora es 100% mallas 3D + shaders.
- **Protuberancias con CICLO DE VIDA** (`updateProminences` en `sun.ts`): 4
  arcos (torus parciales) que ERUPCIONAN desde el limbo (crecen anclados a sus
  pies), se sostienen mientras se siguen estirando, COLAPSAN y se desvanecen
  (uAlpha por-arco) — y al renacer lo hacen en OTRO punto del limbo con otro
  roll y otra escala (re-anclaje determinista por ciclo). Vidas distintas (9 a
  17s) → siempre hay ráfagas nuevas formándose y muriendo, como en los
  timelapses del SDO. Verificado contra las referencias de Felipe: erupción en
  bucle visible en el limbo ✓.
- **Los mini-soles se CLICKEAN directamente**: el overlay pasó de pastillas
  laterales a hit-areas CIRCULARES invisibles sobre cada sol (el NodeProjector
  ahora exporta también el radio aparente en px). Solo la cara frontal es
  clickeable.
- **Hover = mini-implosión**: brillo del plasma +0.5, escala +12%, corona
  expandida (easing rápido ~0.25s) + una **ONDA EXPANSIVA 3D** (anillo
  billboard que estalla desde el sol y se desvanece, una vez por hover). En
  lite el hover despierta el render (wakeRef).
- **Diferenciación**: cada sol lleva su **etiqueta 3D flotante** en escena
  (troika Text billboard, tinta con halo claro, debajo del sol) — se sabe a qué
  sección lleva cada uno sin pastillas de UI plana.

### v3.6.0 — Sol fotorealista (foto NASA/SDO hirviendo) + eyecciones visibles
- Felipe no veía las eyecciones de v3.5 (opacidad efectiva ~0.25 contra fondo
  brillante) y pidió hiperrealismo con técnicas 3D reales.
- **Textura solar FOTOGRÁFICA** (`public/textures/sol.jpg`, 2K equirect, 803KB):
  Solar System Scope (**CC BY 4.0**, derivada de imágenes NASA/SDO — la textura
  estándar de la comunidad three.js para soles). Crédito visible en el footer +
  CREDITS.md.
- **Shader híbrido foto + procedural** (la innovación): la foto se muestrea con
  **UVs distorsionadas por el domain-warp animado** + deriva lenta → la
  granulación fotográfica REAL hierve y fluye (rotación diferencial). El calor
  procedural modula el brillo (fáculas vivas); núcleo y limbo pasan de 1.0 para
  el bloom. La variante lite también usa la foto (estática).
- **Eyecciones ahora VISIBLES**: tamaño ×1.8 (0.28–0.58R), travel 0.7–1.6R,
  vidas más cortas (2.8–5.6s → más eventos), opacidad pico 0.85–0.95, y dos
  clases: **"hot"** (chispas incandescentes, blending aditivo, tinte crema) y
  **plasma** (bloques con cuerpo, blending normal, tinte naranja fuego) —
  legibles contra el cielo claro y contra el disco.

### v3.5.0 — Eyecciones de plasma + fin del "acomodón" post-click
- **Ráfagas que se DESPRENDEN** (`makeEjectaSpecs`/`updateEjecta` en `sun.ts`):
  pool de partículas (10 el sol central + 3 por mini-sol) con física de
  eyección real: nacen en el limbo, salen **desacelerando** (√p, como plasma
  contra la gravedad), con **curl turbulento** en la trayectoria; se hinchan y
  se **desvanecen** (entrada rápida, fade largo). ~45% son "fallback": suben y
  **recaen al sol** (arco balístico de prominencia). Specs deterministas
  (mulberry32 con semilla) → estables entre renders, sin Math.random. En los
  mini-soles la intensidad va atada al FOCO (sutiles en reposo, protagonistas
  en el activo). Solo GPU real.
- **Fin del teletransporte post-click (root cause):** el snap de asentado se
  disparaba cuando el movimiento POR FRAME era chico — pero con el damping
  adaptativo el planeo lejano es lento, y el snap saltaba con ~30px todavía
  pendientes ("el modelo se acomoda de golpe"). Ahora el snap exige que la
  **distancia RESTANTE** sea sub-pixel (`SNAP_EPS 0.012` ≈ 2-3px) — el planeo
  termina completo, siempre.
- **Aterrizaje exacto del click en secciones altas:** la rampa de transición
  era 42% de la sección; al clickear, el scroll aterriza en el tope (centro =
  media pantalla), que en secciones altas caía DENTRO de la rampa → t < k y el
  nodo no terminaba de centrarse. La rampa ahora se capa a **media pantalla**
  (`min(0.42·h, vh/2 − 24)`) → el click siempre aterriza con el nodo centrado.

### v3.4.1 — Fix del parpadeo negro (fuera transmission + MSAA)
Felipe reportó frames NEGROS intermitentes en GPU real (no reproducible en
headless/SwiftShader → problema de driver). Las dos fuentes conocidas de black
frames con este stack en Chrome/ANGLE, eliminadas por ingeniería:
- **Fuera `transmission`** del vidrio: la transmisión re-renderiza la escena
  por frame dentro del composer (fuente clásica de frames negros + costo). El
  vidrio pasa a ser "óptico": `transparent opacity 0.14 + clearcoat + envmap`
  — con el skybox reflejándose se ve casi igual, es inmune y más rápido.
- **`multisampling={0}`** en el EffectComposer: el MSAA sobre el buffer HDR es
  la otra fuente conocida; el DPR alto compensa el aliasing.
Verificado con un probe de ráfaga de frames (14 capturas consecutivas, un JPEG
negro pesa ~10× menos): 0 frames oscuros. Look idéntico (captura comparada).

### v3.3.2 — Crecimiento épico del sol activo + subrayado vivo del HUD
- **Foco gradual por nodo**: cada mini-sol tiene su PROPIO material y un valor
  de foco (0..1) animado por frame (easing exponencial, ~95% en 0.7s): escala,
  brillo del plasma (`uBright`), corona (tamaño+opacidad) y la LUZ crecen
  juntos — "una etapa de crecimiento épica en 1s", no un salto. La pointLight
  es una sola, siempre montada, que **viaja** hacia el sol activo y se apaga en
  la portada (cero pops). El sol central usa la misma curva. reduced-motion:
  snap instantáneo.
- **Subrayado vivo del HUD**: un único indicador absoluto que se DESLIZA
  horizontalmente hasta el botón activo (medido contra el DOM real, descontando
  el padding; transición de transform+width con cubic-bezier). Se re-mide en
  resize y tras la carga de la fuente.

### v3.3.1 — La animación del sol, verificada con píxeles
Felipe reportó el sol totalmente estático. Endurecimiento + prueba:
- **Tiempo propio por delta** (`advanceSuns`): el uniform `uTime` acumula el
  delta de cada frame renderizado en vez de leer `clock.elapsedTime` de fiber
  (inmune a cualquier stop/reset del clock al alternar `frameloop`).
- **Velocidades ×4** (la deriva del plasma era demasiado sutil para percibirse
  como movimiento) + **rotación real de los soles** (`spinSun`: el plasma vive
  en espacio local → girar el mesh gira el plasma; las llamas contra-rotan).
- **Override `?fx=full|lite`** en `lib/gpu.ts`: fuerza la ruta GPU completa o
  el modo lite (debug + testing headless).
- **`npm run anim`** (`scripts/anim.mjs`): prueba EMPÍRICA de animación — abre
  `/?fx=full`, captura el sol central 3 veces separadas 3.5s y compara hashes
  de píxeles; falla si el sol está estático. Verificado: 3 hashes distintos.

---

## v3.2.0 — Cámara continua + soles de plasma con bloom + sol central FD

Feedback de Felipe sobre v3.1: (a) al cruzar de una sección a otra con un solo
scroll el modelo pegaba un latigazo; (b) los soles no encandilaban; (c) quería
un SOL CENTRAL más grande con el FD adentro y llamas hiperrealistas (referencia:
foto de un sol naranja turbulento).

### Cámara: ruta continua por waypoints (fin del salto abrupto)
- Causa del latigazo: el estado (active, dive) era DISCRETO por sección — al
  cruzar el borde, el objetivo saltaba de "pegado al nodo A" a "overview" de
  golpe, y con el settle snappy eso era un latigazo.
- Ahora el scroll produce un progreso **continuo `t`** (0 = portada, k = nodo k;
  decimales = transición). `CameraRig` interpola entre waypoints: dirección
  (lerp+normalize), distancia (con un **retroceso a mitad de camino** entre
  nodos — arco de respiro, `sin(π·f)·0.45`), y pan lateral (pasa por el centro
  al cambiar de lado), todo con smoothstep por segmento. `t` es continuo a
  través de los bordes → **nunca hay salto de objetivo**.
- Bonus: debajo de la última sección (footer) la cámara se queda en Contacto
  (antes volvía de golpe al overview).

### Soles de plasma (la referencia de Felipe)
- **Superficie con domain-warping animado** (`sun.ts`: fbm alimentado por fbm +
  granulación): la turbulencia del sol real. Paleta rojo profundo → naranja
  fuego → oro; el grueso del disco queda en rango LDR (la textura SE VE) y solo
  el núcleo y el limbo pasan de 1.0 (HDR).
- **Bloom selectivo reactivado** (umbral de luminancia 1.0, HDR buffer): SOLO
  los píxeles calientes de los soles derraman luz → **encandilan de verdad**
  (luz renderizada del render real, no un halo pegado). El cielo, el vidrio y
  el balón quedan limpios. En lite (software) se omite; el sol usa la variante
  estática barata.
- La animación corre SOLO en frames renderizados (`tickSuns` desde `useFrame`)
  → compatible con el render on-demand; en reposo el sol queda como foto.

### Sol central con el FD adentro
- `SunCore`: superficie de plasma (48 seg) + **shell de LLAMAS** (prominencias:
  máscara Fresnel × fbm animado con deriva ascendente, aditivo) + corona + una
  **pointLight que ilumina el balón desde adentro**. El **FD** va en Billboard
  entre el sol y la cámara: silueta tinta sobre el disco ardiente (eclipse).
- En un tópico el sol central **se achica y el FD se desvanece** (quedaban
  alineados con el sol del tópico en el eje de cámara y competían); al volver a
  la portada crece de nuevo (`easeSunCore`, lerp en frames renderizados).
- Reemplaza al FD metálico + punto dorado de v3.1 (el punto del logo ahora ES
  el sol central).

### QA
Gate verde · smoke desktop+mobile 0 errores · perf: 60 reposo / ~30 moviendo
bajo SwiftShader (lite sin bloom/llamas; GPU real vuela). Sin dependencias
nuevas (el bloom ya estaba en @react-three/postprocessing).

---

## v3.1.0 — Escena 3D real: skybox fotorealista + soles que iluminan + glass iOS

Feedback duro de Felipe sobre v3.0.0 ("parece cartón"): pensar la página **como
una escena 3D real (Blender)**, no como una página con canvas. Cambios de fondo:

### Skybox + environment map (la gran diferencia)
- **Skybox fotorealista:** "Kloofendal 48d Partly Cloudy Pure Sky" de **Poly
  Haven (CC0)** — cielo celeste real con cúmulos y sol. Descargado del Tonemapped
  JPG 8K oficial y redimensionado a **4K/354KB** (más 1K/42KB para software
  rendering) con System.Drawing. Es `scene.background` equirectangular
  (`SkyDome`): al orbitar/panear la cámara **se ve otra parte del cielo por
  sección** — el modelo nunca se mueve, se mueve la cámara.
- **Environment map:** el HDR 1K del mismo cielo (`<Environment files>`) ilumina
  el balón → `meshPhysicalMaterial` blanco con clearcoat que **refleja el cielo**
  (nacarado real, adiós "cartón gris"). El FD y el punto oro son metal pulido que
  también refleja.
- **Modo lite (software rendering):** skybox 1K + `meshStandardMaterial` +
  luces simples en vez de envmap (el PBR con envmap se paga carísimo sin GPU).
  Medido: 60 fps reposo / ~32 moviendo bajo SwiftShader (peor caso absoluto;
  cualquier GPU real vuela).

### La cámara hace TODO el encuadre (fuera el transform CSS)
- Se eliminó el corrimiento CSS del canvas. En un tópico la cámara **orbita** al
  sol activo, **se acerca** (`CLOSE = r*2.55`, balón grande) y **panea el punto
  de mira** (`PAN_F = 0.3` del semiancho visible, con vector right de cámara) →
  el balón queda del lado opuesto al texto, **sin salirse de pantalla**, invadiendo
  un poco el lado del texto. El settle on-demand ahora vigila posición **y** punto
  de mira (snap de ambos).
- El overlay de labels ya no necesita transform espejo: la proyección sale de la
  cámara real → siempre pegado a los soles.

### Soles que encandilan e iluminan (sin post-proceso)
- **Corona con textura:** destello radial cálido generado en canvas
  (`CanvasTexture` + sprite con `AdditiveBlending`) → el sol satura a blanco y se
  disipa sobre el cielo: encandila de verdad, sin bloom ni glow CSS.
- **El sol activo emite una `pointLight`** cálida que baña los struts cercanos
  del balón → la "reacción realista en el modelo" (como una luz en Blender).
- Shader del núcleo más caliente (satura a blanco, `pow(facing,4)*0.9`).

### Liquid Glass real (iOS-style)
- El vidrio ahora es **muy translúcido** (`rgba(255,255,255,0.26)`) con
  `backdrop-filter: blur(26px) saturate(200%) brightness(1.06)` — el cielo se ve
  A TRAVÉS del panel, borroso y saturado (eso es liquid glass; antes era una capa
  blanca casi opaca).
- **Borde especular direccional**: gradiente EN el anillo del borde
  (arriba-izq brillante → abajo-der tenue) con mask-composite `exclude` —
  como la luz moja el canto del vidrio en iOS. + sheen interno arriba
  (`glass-spec::after`) y sombra de profundidad. Cero glow.

### Acentos: fuera el dorado del texto
- El dorado en letras "no daba puro/místico" → el **oro queda SOLO en los soles
  3D y micro-marcas** (punto del logo). El acento de texto/UI pasa a **azul
  celeste profundo** (`--acento #0b5385`, AA sobre cielo) y las palabras-acento
  de display usan **`.accent-grad`**: gradiente azul profundo → celeste luminoso
  (background-clip: text) — luz del cielo atravesando la letra, no un color chato.
- Se quitó el último bullet vivo (punto con glow del `Eyebrow` del detalle).
- **Email de corrido**: `whitespace-nowrap` + `font-size: clamp()` adaptativo
  (nunca quiebra en "il.com").

### QA
Gate verde (tsc 0 · lint 0 · build ok) · smoke desktop+mobile 0 errores de
consola · perf: 60 fps reposo (on-demand intacto) · assets +1.8MB (skybox 4K
354KB + HDR 1.4MB + lite 42KB), cargados dentro del Suspense del canvas (el
preloader ya espera al hero).

---

## v3.0.0 — Rediseño «cielo» (UI espacial + Liquid Glass + mini-soles)

Giro drástico de identidad pedido por Felipe: de la noche verde-agua a un **CIELO
claro**. El balón flota en el cielo (UI espacial), acento **ORO** (guiño al sol —
easter egg argentino celeste+blanco, nunca se nombra), **cero glow**, contenedores
**Liquid Glass** y paneles que **dejan de sentirse "slide"**.

### Identidad — tema «cielo»
- **Paleta:** fondo celeste (`--ink` ahora `#a9d3ea`), superficies blancas/vidrio,
  texto **tinta** fría (`--chalk #10293b`), acento **oro** (`--agua`→oro `#e0a63a`;
  para texto-acento AA sobre claro se usa `--oro-deep #8a5a0f`). Los tokens son por
  **rol**: sus valores giraron al tema cielo pero los nombres marcan la función; se
  agregaron alias nuevos (`--oro*`, `--cielo*`, `--nube`, `--glass-*`). Reemplazos
  seguros con sed (`text-agua`→`text-oro-deep`, `text-ink`→`text-chalk`).
- **Cielo procedural (CSS, costo cero):** `.sky` = gradiente horizonte→cielo +
  nubes con radial-gradients, deriva lenta (`.sky-drift`). No es imagen (Felipe
  eligió procedural sobre foto). Se usa en la home y en el detalle.
- **Liquid Glass:** utilidades `.glass` / `.glass-spec` / `.glass-pill` /
  `.glass-hover` (blur+saturate del fondo, borde especular, sombra de elevación —
  sin glow). HUD, nav, labels, tarjetas de datos, foto y cards de proyecto son
  vidrio. Reemplaza a los `bg-ink/90` oscuros de v2.
- **Favicon/OG regenerados** al tema (OG celeste + tinta + nodo oro; `icon.tsx` /
  `apple-icon.tsx` generados con ImageResponse, reemplazan los PNG estáticos).

### El 3D (cero glow, mini-soles)
- **Balón BLANCO nacarado** (`meshPhysicalMaterial` con clearcoat/sheen → struts
  definidos) sobre el cielo. **Se sacó el bloom/EffectComposer por completo.**
- **Nodos = mini-soles realistas** (`components/three/sun.ts`, shader GLSL a mano):
  núcleo blanco-caliente, plasma granulado (fbm) y borde tipo corona (Fresnel EN la
  superficie, **no** halo/glow externo). **Estático** (sin `uTime`) → el render
  on-demand sigue pausando en reposo; costo trivial. El nodo activo es un sol más
  grande y brillante, protagonista de la sección.
- **Logo FD 3D:** metal tinta pulido (`meshStandardMaterial` metálico → definido),
  solo en la portada; en un tópico el sol activo toma el centro.
- **Luz de día:** relleno frío del cielo + sol cálido cenital + rim sutil.

### Paneles espaciales (fin del "slide")
- **Se eliminó el scrim oscuro** del `TopicPanel`. El texto **flota** directo sobre
  el cielo (tinta sobre claro = legible); los datos van en **tarjetas Liquid Glass**
  (herramientas, principios, timeline, links) — **cero bullets** (se quitaron los
  puntos de los eyebrows y los `·` de listas). El eyebrow va sin bullet.
- **Modelo al costado + más grande:** al entrar a un tópico la cámara se **acerca**
  (balón grande) y **orbita** para poner el sol activo de frente; un transform CSS
  corre el modelo al lado **opuesto** al texto (alterna por tópico, `ladoModelo`).
  El sol activo queda protagonista en el espacio vacío.
- **Nav 3D siempre viva:** los labels de nodo se muestran **en todo momento** (no
  solo en la portada) y son clickeables → se salta a cualquier sección desde el
  modelo aun estando dentro de una. El overlay recibe el **mismo transform** que el
  canvas (quedan pegados a los nodos); los de la cara de atrás quedan atenuados pero
  clickeables. (Antes solo servía para el primer nodo.)
- **Mobile:** el modelo queda detrás del texto (una columna); sin scrim, al entrar a
  un tópico se **atenúa** (`.graph-layer.is-topic`, opacity 0.28 <768px) para que el
  texto gane. En desktop va al costado, pleno.

### Perf / QA
- Gate verde (tsc 0 · lint 0 · build ok). Smoke desktop+mobile: 0 errores de
  consola. **`npm run perf`: 60/61 FPS** aun bajo SwiftShader (sin bloom + sun
  estático + on-demand). El glass solo aparece en scroll (canvas casi siempre
  pausado) → no re-blurea por frame.

---

## v2.1 — Cámara scroll-driven + fixes cross-browser

Iteración sobre la v2.0 con feedback de Felipe. Cambios de fondo:

- **Fix cross-browser (el bug clave):** el canvas 3D se gateaba por `detect-gpu`
  (`tier >= 2`); en Chrome con GPU integrada daba tier bajo → **poster estático**
  (sin rotación ni nodos clickeables), mientras que el navegador de VS Code daba
  tier alto → canvas. Ahora el gate es **WebGL disponible** (`hooks/useWebGL.ts`),
  no el tier. DPR desde `window.devicePixelRatio`. Se eliminó `useGpuTier` del
  home. El poster queda solo para navegadores sin WebGL.
- **Fuentes 100% self-hosted** (`app/fonts/*.woff2`, vía `next/font/local`):
  Bricolage Grotesque + Spline Sans Mono (fontsource). Cero dependencia de Google
  Fonts en build → la fuente no "desaparece" por un fetch fallido.
- **Navegación = cámara que se mete al nodo (scroll-driven):** se reemplazó la
  rotación del balón por un **rig de cámara** (`CameraRig`) que siempre mira al
  centro y cuya dirección+distancia salen del scroll: en overview ve el balón
  entero; al entrar a un tópico la cámara **bucea** por la dirección del nodo
  (`dive` = progreso de scroll dentro de la sección, primeros ~42%). Click en un
  nodo/HUD = `scrollTo` → misma animación (Lenis la hace suave/rápida). El balón
  queda **estático y centrado** (todas las direcciones de nodo fijas en el mundo →
  la cámara las encara con precisión y todos los nodos son clickeables).
- **Logo FD flotando en el centro 3D** del balón (`Billboard` + `Text` de drei,
  fuente `public/fonts/logo.ttf`), visible a través del wireframe.
- **UI autoexplicativa:** la portada muestra solo el balón + el logo + "Felipe
  Doval — Portfolio" (sin la línea grande ni el "tocá un nodo"). Los 5 nodos con
  su label alrededor del balón (overlay, solo desktop) dicen solos que son
  clickeables. En mobile la nav es el HUD.
- **Sin numeración ni look de slides:** HUD y eyebrows de sección muestran solo el
  label (Perfil, Enfoque…), sin `01/02` ni `0X/05`. Enfoque/Recorrido/detalle:
  bloques separados por hairlines, sin números.
- **Nota:** el warning `THREE.Clock deprecated` en consola viene de
  `@react-three/fiber` (interno), es inofensivo y no es un error.

### Performance (v2.1.1)
Síntoma: ~15 fps al mover el mouse incluso en una máquina potente. Causa:
render GPU-bound (DPR alto en pantalla hi-DPI × bloom × shader fullscreen) +
un *layout thrash* en el scroll. Sin tocar UX ni bajar calidad visible:

- **DPR adaptivo** (`PerformanceMonitor` de drei): arranca nítido (techo
  `min(devicePixelRatio, 1.5)`) y **baja a 1 solo si la GPU no sostiene el
  framerate** → smooth en cualquier máquina, crisp en las buenas.
- **`antialias: false`** (+ `stencil: false`): el bloom disimula el aliasing;
  gran ahorro de GPU. Se sacó `detect-gpu` del gate (ya reemplazado por WebGL).
- **Shader de fondo más barato:** un solo `fbm` de 3 octavas (era 2× de 4) —
  mismo look, ~½ del costo por pixel.
- **Scroll sin thrash:** los offsets de sección se **cachean** (mount/resize/
  carga); el handler de scroll usa `scrollY` y no llama `getBoundingClientRect`
  por frame → scroll fluido. Loop de proyección de nodos sin allocations.

Segunda pasada (seguía a ~15fps al mover el mouse):
- **La mesh NO era el problema:** el balón tiene **4.140 vértices / 7.680
  triángulos** (12 KB) — trivial para cualquier GPU. Reducir caras no daba nada;
  el costo era fill-rate + compositor, no geometría.
- **`backdrop-blur` fuera (el gran culpable):** el HUD y los 5 labels de nodo
  tenían vidrio esmerilado **sobre el canvas animado**, así que el navegador
  **re-blureaba cada frame** (y peor al mover el mouse por el parallax). Se
  reemplazó por fondo sólido (`bg-ink/90`) — casi imperceptible en tema oscuro.
- **Sin luz que sigue al mouse:** era un `pointLight` que re-sombreaba el balón
  (PBR) cada frame; se dejaron solo las luces estáticas (el emissive compensa).
- Esferas de nodo (24→16) y punto del logo (20→12) con menos segmentos.

Tercera pasada — el diagnóstico clave (el detalle iba fluido, el grafo no):
- **On-demand rendering (la solución de fondo):** el canvas renderizaba 60 fps
  para siempre, incluso quieto. Ahora `frameloop` se PAUSA (`"never"`) cuando no
  hay actividad. `GraphHome` lo prende con el scroll y lo apaga 600ms después de
  que la cámara se asentó (`onActivity` de `CameraRig` avisa mientras se mueve →
  la pausa no congela un frame en blanco en máquinas lentas). En reposo: **0
  frames → 0% GPU → la página va a 60fps** (el grafo tan fluido como el detalle).
- Se **sacó el parallax de mouse**: mover el mouse ya no dispara ningún render.
- **Medidor de FPS** (`components/motion/DevOverlay.tsx`): con `?stats` en la URL
  muestra el framerate real de la página (rAF). Es la forma de medir "¿va a
  60?". Verificado: en reposo da 60 incluso con render por software.
- **Warning `THREE.Clock` silenciado:** viene de `@react-three/fiber` (interno,
  benigno). `DevOverlay` filtra SOLO ese mensaje de `console.warn`; el resto pasa.
- Nodos sin pulso continuo (tamaño/brillo por prop) para ser compatibles con el
  render on-demand.

Cuarta pasada (v2.1.4) — la causa raíz medida:
- **Diagnóstico con datos:** un medidor headless (`scripts/perf.ts`) que fuerza el
  render y reporta el renderer de GPU + FPS. Reveló que en reposo la página iba a
  **165fps pero moviéndose caía a 10** (en la máquina de Felipe) y a **4fps** en
  headless — y el renderer era **SwiftShader (software)**. Conclusión: el WebGL
  estaba corriendo **por software** (Chrome con aceleración por hardware apagada o
  GPU en blocklist); 7.680 triángulos son triviales, el costo real es **fill-rate**
  de bloom + shader fullscreen, que el render por software paga carísimo.
- **Modo "lite" automático (`lib/gpu.ts` → `isSoftwareRenderer`):** si el renderer
  es software (SwiftShader/llvmpipe/basic), el canvas va **sin bloom y con DPR 1**;
  en GPU real, calidad completa. El emissivo (`toneMapped=false`) sostiene el glow
  aun sin bloom. Medido: bajo SwiftShader pasó de **4 → 60fps** (¡moviéndose!).
- **Fondo fbm → CSS:** el shader de telemetría full-screen se redibujaba cada frame;
  se reemplazó por un `radial-gradient` CSS (glow agua sobre el pino) — mismo clima,
  **costo cero**, y se ve igual con el canvas pausado.
- **Settle casi instantáneo (el pedido de Felipe):** la cámara perseguía un umbral
  `1e-5` asintótico → tardaba **~4s** en asentarse a bajo fps (esa era la
  "recalibración"). Ahora hace **snap apenas el movimiento por frame es imperceptible**
  (`MOVE_EPS`) y deja de pedir frames; el tracking del scroll es más ajustado
  (`SETTLE` más chico → menos residuo al frenar). Buffer de pausa **600 → 180ms**.
  La ventana de "recalibración" queda **≤0.5s** y, ya sin bloom, esos frames van a
  60fps → no se siente lag.
- **Renderer en `?stats`:** el overlay ahora muestra la GPU y marca **⚠ SOFTWARE**
  si no hay aceleración → diagnóstico de un vistazo (para Felipe y cualquier visita).
- **Limpieza:** se borró `hooks/useGpuTier.ts` (muerto) y la dependencia
  `detect-gpu`; se borró `components/three/shaders.ts` (el fbm ya no se usa).

> Nota para el dueño del equipo: si `?stats` dice **SOFTWARE**, el fix ideal es
> prender la aceleración por hardware en Chrome (`chrome://gpu` para diagnosticar,
> `chrome://settings/system` para activarla) → se ve el bloom completo a 165fps. El
> modo lite es la red de seguridad para quien no la tenga.

---

## v2.0.0 — Rediseño «verde agua» + navegación por grafo

Felipe pidió un cambio drástico de concepto y de identidad sobre la v1 ya
shippeada. Núcleo del cambio: **la home deja de ser un hero con texto y pasa a
ser el balón-grafo como navegación** (cada nodo = un tópico; se entra clickeando
un nodo o **scrolleando** por un orden por defecto), **los proyectos pasan a ser
un medio para mostrar habilidades** (fuera el "fútbol × ML" como bandera;
FutbolVision se baja de protagonista, Superlum al frente) e **identidad nueva
no-IA**.

### Paleta — "verde agua" (Fase A)
Verde agua **claro y sólido** como señal (protagonista), sobre base verde-noche.
Fundamento colorimétrico: **análogos** en la base (pino profundo → panel) + verde
agua claro protagonista + un **cálido complementario** (terracota `--brasa`) como
respiro para que no quede sofocante mono-verde.

- `--ink #0f1e1b` base · `--panel #16302a` · `--agua #8fe3c6` señal ·
  `--agua-bright #b7f0da` glow · `--jade #47a88c` struts · `--chalk #ece7db`
  texto · `--chalk-dim #a6bab0` · `--muted #83978d` · `--brasa #e7a06a` chispa ·
  `--line #2a3f39`.
- **Regla de Felipe:** los colores atenuados son **hex sólidos**, NO `rgba()` con
  alpha bajado (eso "delata IA"). El alpha solo se usa en scrims de degradado,
  sombras y glows —nunca en texto ni marca—.
- **No fluo:** el verde es "tirando a claro / agua", no fosforescente (Felipe
  descartó el acid/lima). Contraste AA verificado en todos los pares (script node;
  el más justo, muted/panel, da 4.55:1).
- **Nombres de token honestos:** solo se renombró la familia que mentía
  (`celeste*` → `agua`/`jade`); los genéricos (`ink`, `chalk`, `muted`, `line`,
  `panel`, `paper`) mantienen nombre y cambian de valor. Menos churn, menos riesgo
  de clase Tailwind muerta que el gate no detecta.

### Tipografía — Bricolage Grotesque + Spline Sans Mono (Fase A)
- **Display + body: Bricolage Grotesque** (Google Fonts, variable con ejes
  `opsz` + `wght`), vía `next/font/google`. Reemplaza Archivo (local) y Hanken.
  Grotesca con carácter/cortes editoriales — evita las "default de IA"
  (Inter/Poppins/Space Grotesk). Una sola familia = coherencia.
- **Mono: Spline Sans Mono** (se mantiene) para labels de nodo, índices y datos.
- **Juego de firma (pedido de Felipe):** Bricolage NO tiene eje `wdth`, así que el
  "expandido/condensado" se logra con interlineado apretado (`line-height` ~0.84
  en display) + `letter-spacing` + los modificadores **`.stretch-x` / `.stretch-y`
  / `.squish-x`** (`transform: scale`) para deformar palabras/líneas puntuales.
- **Logo actualizado:** el `FD_` de terminal evoluciona → el guión bajo pasa a ser
  un **nodo** (círculo agua con glow), atando la marca al grafo. Componente
  `components/ui/Logo.tsx` (`full` = nombre completo). Favicons regenerados como un
  micro-grafo de nodos (`scripts/gen-favicons.mjs`, solo primitivas circle/line).

### Navegación por grafo (Fases C–D) — resumen del diseño
Un solo mecanismo, dos formas de usarlo: el balón-grafo vive en capa sticky; el
scroll (o el click en un nodo) elige el **nodo activo**; el grafo **rota** para
ponerlo al frente y aparece el panel del tópico. Página scrolleable real (5
secciones en el DOM → SEO/a11y/no-JS). Nodos = botones HTML proyectados sobre las
coordenadas 3D (accesibles, tab-order natural). Nav = **HUD** (rail de 5 nodos con
progreso `03/05`) que reemplaza la pill-nav y es el fallback de teclado/mobile/
sin-WebGL. 5 tópicos: Perfil · Enfoque · Trabajo · Recorrido · Contacto.

### Implementación (Fases C–F) y decisiones finas
- **Layout home:** capa 3D FIJA (`fixed inset-0 z-0`) detrás del contenido
  (`z-10`); footer `z-10` opaco tapa el balón al final. Secciones-panel con scrim
  direccional (`TopicPanel`) para leer sobre el 3D; Trabajo usa scrim "strong".
- **Rotación al nodo (Fase D):** grupos anidados `sway` (parallax/idle) + `aim`
  (slerp de quaternion que lleva la dirección del nodo activo a la cámara). El
  `activeIndex` sale del scroll (IntersectionObserver, `useActiveSection`), así
  scroll y click comparten una sola fuente de verdad.
- **Nodos clickeables:** overlay HTML proyectado (`camera.project` cada frame,
  entregado por callback para cumplir `react-hooks/immutability`). Son azúcar de
  puntero (`tabIndex -1`, `aria-hidden`); la nav accesible es el HUD. Overlay con
  `overflow-hidden` para no generar scroll horizontal con labels fuera de pantalla.
- **Estética del grafo:** estructura del balón atenuada (jade, emissive 0.5) para
  que los 5 nodos brillen (constelación); bloom moderado. Poster de fallback
  recoloreado a agua con `sharp`.
- **`?gl=1`:** fuerza el canvas (preview en cualquier máquina) vía
  `useSyncExternalStore` (sin mismatch de hidratación).
- **Detalle:** "Decisiones y features" pasó a lista numerada (sin viñetas); los
  números van en `--agua` (el acento de Superlum `#6D5BFF` da 3.76:1 sobre ink,
  por debajo de AA, así que no se usa para texto — solo para barras decorativas).

### Verificación v2
- **Contraste AA:** todos los pares de texto pasan (script node; muted/panel 4.55
  el más justo). Acentos de proyecto que quedaban como texto → movidos a agua.
- **Responsive:** 0 overflow horizontal en 360 / 390 / 768 (bug del email largo y
  del overlay corregidos).
- **Teclado:** skip-link, logo, links de proyecto, copiar-email, redes y los 5
  nodos del HUD alcanzables por Tab, todos con foco visible; sin trampa; overlay
  3D excluido.
- **Gate:** `tsc` 0 · `eslint` 0 · `build` ok · smoke sin errores de consola, en
  cada fase. three.js va en chunk dinámico (no en el bundle inicial).
- **QA regla de oro:** 0 `<path>` dibujado a mano, 0 `console.log`, 0 `any`, 0
  `@ts-ignore`, 0 viñetas renderizadas, 0 "fútbol × ML" como bandera.
- **Pendiente de Felipe:** validar Lighthouse mobile sobre Vercel (con GPU real);
  en local el canvas se testeó con SwiftShader (software).

---

## Dirección de diseño (v1 — histórico)

**"Noche de estadio" (dark).** Lienzo ink azulado dominante (no negro plano),
celeste bandera `#74ACDF` como señal, chalk cálido como texto. Elegido sobre la
alternativa "pizarra chalk (light)" porque el elemento firma —el balón-grafo 3D
con bloom— pega más fuerte emergiendo de la oscuridad, y porque lee como
"telemetría de transmisión / noche de partido", que es el mundo real de Felipe
(fútbol × datos).

**Por qué es propia y no genérica.** El brief advierte contra tres looks que
delatan IA; el riesgo acá era el #2 ("dark + un acento"). Lo mitigamos con:
(1) ink azulado real, no near-black; (2) una segunda superficie cálida (papel
chalk en la sección About); (3) el celeste es *significativo* (está en el logo
de Felipe, es la Selección), no un acento random; (4) todo deriva de un
vocabulario concreto (transmisión / telemetría / grafo de nodos), no "oscuro
porque queda lindo".

**Diferenciación de los proyectos de Felipe.** La paleta aurora (azul/violeta/
magenta/naranja + glassmorphism) es la marca de **Superlum** → se cita solo
dentro de su case study (`acento: #6D5BFF`). El look dark + verde lima + Oswald/
JetBrains Mono es la marca de **FutbolVision** → nos despegamos por matiz (ink
más azul), acento (celeste, no verde ácido) y tipografía (nada de Oswald/
JetBrains).

**Descartado (Chanel — "sacá un accesorio"):** el dorado "Sol de Mayo" como
acento. Connotaba apuestas/casino, justo lo contrario a la ética anti-apuestas
de FutbolVision. La paleta quedó en 6 tokens.

### Tipografía
- **Display — Archivo** (variable, ejes wght+wdth), cargada con `next/font/local`
  desde los TTF de Felipe. Es la misma tipografía del logo FD_ (fundición
  Omnibus-Type, Buenos Aires). Se usa expandida (wdth 120) + black (900) para el
  look scoreboard. Consistencia logo ↔ sitio + guiño argentino.
- **Body — Hanken Grotesk** (Google, variable). Grotesca cálida y legible. NO
  Inter.
- **Data/mono — Spline Sans Mono** (Google). Números, labels, eyebrows tipo
  telemetría. Distinta de JetBrains Mono (que es de FutbolVision).

### Elemento firma
El **balón-grafo**: `pelota-estructura.glb` (icosaedro truncado como red de nodos
y struts) renderizado como wireframe celeste con bloom. Se lee a la vez como
pelota de fútbol, red de pases y red neuronal = fútbol × ML hecho objeto. Toda la
audacia va acá; el resto, quieto. (Se implementa en Fase 3.)

---

## Stack técnico y versiones (lockfile de decisiones)

Versiones verificadas con `npm view` el **2026-07-06** y fijadas exactas para el
stack 3D/animación (lo más propenso a romper por peer deps).

| Paquete | Versión | Nota |
|---|---|---|
| next | 16.2.10 | App Router, Turbopack |
| react / react-dom | 19.2.4 | versión que Next 16 fija y testea |
| typescript | ^5 | modo `strict` |
| tailwindcss + @tailwindcss/postcss | 4.3.2 | v4, tokens vía CSS vars + `@theme` |
| three | 0.185.1 | |
| @react-three/fiber | 9.6.1 | **v9 = compatible con React 19** ✓ |
| @react-three/drei | 10.7.7 | v10, compatible con fiber v9 |
| @react-three/postprocessing | 3.0.4 | bloom para el balón-grafo |
| gsap + @gsap/react | 3.15.0 / 2.1.2 | ScrollTrigger + SplitText (gratis desde 2025) |
| motion | 12.42.2 | ex framer-motion, para transiciones de layout |
| lenis | 1.3.25 | scroll suave, se integra con ScrollTrigger |
| lucide-react | 1.23.0 | íconos (migraron a 1.x; verificado que es el latest) |
| playwright | 1.61.1 | devDep, smoke test |
| @next/bundle-analyzer | 16.2.10 | devDep, `npm run analyze` |
| sharp | (via next) | favicon/OG en Fase 10 |

**Descartadas por ahora:**
- `@splinetool/react-spline` — usamos el `.glb` provisto (más liviano, sin dep
  externa).
- `lottie-react` — la carpeta `contenido/assets/lotties/` está vacía; esos
  momentos se resuelven con GSAP/CSS.
- `@react-three/rapier` — solo si el easter egg (Konami + pelota con física)
  entra en el presupuesto de bundle (se evalúa en Fase 7/9).

---

## Vulnerabilidades conocidas (npm audit)

`npm audit` reporta **2 moderate** en `postcss` (<8.5.10, XSS vía `</style>` en
el stringify de CSS), traído **transitivamente por Next 16**. El único "fix"
disponible es `npm audit fix --force`, que **degradaría Next a la v9 (breaking)**
→ inaceptable.

**Decisión: no tocar.** Es una dependencia de *build-time* (generación de CSS),
no un vector de runtime del sitio publicado, y no hay fix no-breaking. Se
revisará cuando Next actualice su postcss interno.

---

## Discrepancia de datos: API de FutbolVision

El `contenido/proyectos/futbolvision/descripcion.md` dice **Sportmonks (plan
Growth)**. Una memoria de otra sesión del repo de FutbolVision menciona
**API-Football (api-sports.io) Pro**. Como `contenido/` es la fuente de verdad
del portfolio, el sitio dice **Sportmonks**. → Pendiente que Felipe confirme
(ver TODO-FELI.md).

---

## Andamiaje (Fase 0)

- Scaffold generado con `create-next-app@16.2.10` (`--ts --tailwind --eslint
  --app --no-src-dir`) en un temp y movido a la raíz para preservar `.git` y
  `contenido/`. Se descartaron el README/AGENTS/CLAUDE generados.
- `content/` es la **única fuente de verdad** tipada (perfil.ts, proyectos.ts,
  types.ts). Las secciones leen de ahí.
- **Smoke test** (`scripts/smoke.ts`, Playwright): levanta el build de
  producción, abre las rutas, saca screenshots y falla si hay errores de
  consola. Configurable por env (`SMOKE_ROUTES`, `SMOKE_VIEWPORT`). Corre en el
  gate de todas las fases.
- Se corre como `node scripts/smoke.ts` (Node 26 ejecuta TypeScript nativo, sin
  necesidad de `tsx`).
- **Nota Windows/Git Bash:** pasar `SMOKE_ROUTES="/..."` desde Git Bash rompe por
  la conversión de paths de MSYS (convierte `/` en una ruta de Windows). Usar
  **PowerShell** para correr el smoke con env vars: `$env:SMOKE_ROUTES="/,/ruta";
  npm run smoke`.

---

## Design system (Fase 1)

- **Tokens** como CSS variables en `globals.css`, mapeados a utilidades de
  Tailwind v4 con `@theme inline`. Escala tipográfica con clamps
  (`.type-hero/h1/h2/h3`, `.lead`, `.eyebrow`, `.data`).
- **Componentes base** en `components/ui/`: Container, Section, Eyebrow, Heading,
  Button (polimórfico botón/enlace), Tag, DeviceFrame (browser/phone/terminal),
  Placeholder (honesto), BrandIcon. Barrel en `index.ts`. Helper `cn`
  (clsx + tailwind-merge) en `lib/utils.ts`.
- **Contraste AA verificado** por script: todos los pares de texto pasan ≥ 4.5:1
  (el más ajustado, muted/panel, da 5.57; chalk/ink da 15.2; celeste/ink 7.8;
  ink sobre botón celeste 7.8).
- **Íconos de marca:** lucide-react 1.x **removió los íconos de marca**
  (GitHub/LinkedIn/etc.) por trademark. El brief autoriza Iconify para lo que
  falte → se extraen offline de **Simple Icons (CC0)** a `lib/brand-icons.ts`
  (solo 2 íconos, no la colección) y se renderizan con `<BrandIcon>` (SVG desde
  data, RSC-safe, sin runtime de Iconify). No hay SVG dibujado a mano.
- `/dev/tokens` es temporal (se borra en Fase 9) y tiene `robots: noindex`.

---

## Layout, navegación y scroll (Fase 2)

- **Lenis ↔ ScrollTrigger** cableados según los pitfalls: `lenis.on("scroll",
  ScrollTrigger.update)`, Lenis driveado desde `gsap.ticker` con
  `lagSmoothing(0)` y `autoRaf:false` (para no tener doble RAF). Todo en
  `components/motion/SmoothScroll.tsx`, que además provee `useSmoothScroll()`.
- **Reduced motion:** si el usuario lo prefiere, NO se instancia Lenis (scroll
  nativo) y el sitio queda 100% usable.
- **Nav activa** con IntersectionObserver (`useActiveSection`, rootMargin que
  marca activa la sección que cruza el centro). Config de secciones única en
  `lib/navigation.ts` (nav y anclas nunca se desincronizan).
- **Offset de ancla:** en vez del `offset` relativo de Lenis (que quedaba
  impreciso, ~176px), la nav calcula la posición absoluta del target menos la
  altura de la nav (92px) y hace `scrollTo(number)`. Verificado: la sección
  aterriza a 92px, hash y estado activo correctos.
- **`react-hooks/set-state-in-effect`** (regla nueva del ESLint de Next 16):
  `useReducedMotion` se reescribió con `useSyncExternalStore` (SSR-safe, sin
  setState en el cuerpo del effect).
- **Nota de estructura:** los componentes de chrome (Nav, Footer) viven en
  `components/layout/` (además de ui/sections/three/motion).
- **Email ofuscado:** `EmailLink` arma la dirección en el cliente desde partes;
  el HTML/RSC servido no la contiene en texto plano (anti-scraping, como pidió
  Felipe).

---

## Hero 3D — elemento firma (Fase 3)

- **Modelo:** `pelota-estructura.glb` procesado con `gltfjsx --transform`
  (142KB → 12.6KB, 91%). Una sola malla mergeada (`geometry_0`) →
  `public/models/`. Material celeste emisivo + bloom = balón-grafo glow.
- **Escena** (`components/three/`): shader de fondo GLSL (ruido celeste sutil,
  `<shaderMaterial>` nativo, sin extend), luz que persigue al puntero, parallax
  por lerp sobre refs (nunca setState en useFrame), bloom con EffectComposer.
  Sin `<Environment>` de drei (evita fetch de HDRI externo → self-contained).
- **Carga:** `HeroCanvas` se importa con `next/dynamic({ ssr:false })` → no entra
  al bundle inicial.
- **Degradación (v2.1.4):**
  - sin WebGL → **poster estático** (render real del balón). Gate por
    disponibilidad de WebGL (`hooks/useWebGL.ts`), no por tier.
  - WebGL por **software** (SwiftShader/llvmpipe) → canvas en **modo lite**
    (sin bloom, DPR 1) para sostener FPS (`lib/gpu.ts`).
  - reduced-motion → cámara sin buceo (overview fijo), saltos instantáneos.
  - dpr capado a `min(devicePixelRatio, 1.5)` (1 en modo lite).
  - Override de debug `?gl` para forzar el canvas en testing/headless.
- **Poster:** generado screenshoteando el render real (ruta temporal
  `/dev/poster`) → `public/assets/hero-poster.png`, servido con `next/image`.
- **Preloader** (`useProgress` de drei): progreso real de assets, mínimo 700ms,
  techo 2.4s (nunca se cuelga si no hay 3D), salida GSAP que solapa con la
  entrada del hero (`onStart` → `marcarListo`). Respeta reduced-motion.
- **Entrada del nombre:** SplitText (GSAP, gratis) por caracteres, disparada al
  terminar el preloader (`AppReady` context). Tras animar, `split.revert()`
  (DOM limpio para el resize). Con reduced-motion se muestra estático — **bug
  arreglado:** una render de hidratación previa lo escondía; el branch reduced
  ahora restaura `autoAlpha:1`.
- **Reglas React Compiler (ESLint Next 16):** `Date.now()` fuera del render
  (Preloader), y mutar uniforms vía ref del material (no el objeto de useMemo)
  en HeroCanvas.
- **FPS:** el diseño es leak-safe y sin allocs por frame (refs, delta clamp,
  malla única). La medición real de ~60 FPS queda para hardware real de Felipe /
  Lighthouse (Fase 9); headless usa SwiftShader (software).
- **Nota:** `scripts/_*.mjs` (capturas dev) están gitignoreados y fuera del lint;
  `/dev/poster` y `/dev/tokens` se borran en Fase 9.

---

## Proyectos y recorrido (Fase 5)

- **Destacados con pinning:** `FeaturedProject` pinea la media con ScrollTrigger
  (`pin`, `pinSpacing:false`) SOLO en desktop, vía `gsap.matchMedia()`, con
  cleanup en `useGSAP` → sin triggers zombie al cambiar de ruta. En mobile /
  reduced-motion se apila normal (sin pin).
- **Grid secundaria:** `ProjectCard` con hover CSS (elevación + glow) + tilt JS
  sutil (solo `pointerType==='mouse'`, sin reduced-motion, mutando el style por
  ref sin setState). Si hay repo, toda la card enlaza; si no, es informativa.
- **Placeholders honestos:** proyectos sin captura muestran el bloque punteado
  "FALTA: ..."; los incompletos (PC Builder, Nindo, LOST) llevan badge "en
  progreso". Nada inventado.
- **Timeline:** marcadores numerados 01/02/03 — legítimos acá porque el orden
  codifica una secuencia real (no decorativos). Íconos por tipo (educación /
  competencia / trabajo).
- Todo alimentado desde `content/proyectos.ts` y `content/perfil.ts`
  (single source of truth).

---

## Páginas de detalle y transiciones (Fase 6)

- **Rutas** `/proyectos/[slug]` **SSG** (`generateStaticParams` con los 2
  destacados, `dynamicParams=false` → otros slugs 404). Deep-link safe (SSR/SSG).
  `generateMetadata` por proyecto.
- **Case study:** problema → solución → decisiones/features → capturas →
  aprendizajes → siguiente caso, alimentado desde content. El acento del proyecto
  (ej. violeta aurora de Superlum) se usa en los marcadores — cita la marca DENTRO
  de su propio caso.
- **Transición** con `motion` en `template.tsx` (fade + slide up), respeta
  reduced-motion. Se eligió motion sobre un morph de View Transitions
  (shared-element) por robustez; el morph queda como mejora futura.
- **Preloader** solo en la home (`usePathname`): deep-link a un detalle no espera.
- **Verificado:** navegación ida y vuelta 10× → **heap plano (x1.00), 0 errores,
  sin leaks** (la limpieza de useGSAP/matchMedia evita ScrollTriggers zombie).
  La verificación de dispose del canvas WebGL queda para hardware real (headless
  usa poster).

---

## Contacto, micro-interacciones y easter egg (Fase 7)

- **Contacto:** email con micro-interacción de "copiado" (`EmailLink` modo copy,
  arma la dirección en cliente) + GitHub/LinkedIn. **Sin formulario** (Felipe no
  configuró Formspree/Resend → no ponemos un form falso).
- **Cursor custom:** aro celeste + punto que siguen al puntero (lerp), crecen
  sobre interactivos. Gating por CSS: solo `pointer: fine` **y** sin
  reduced-motion; en touch/reduced-motion queda el cursor nativo. Verificado:
  activo en desktop, inactivo en mobile.
- **Easter egg Konami:** ↑↑↓↓←→←→ B A → lluvia de ⚽🏀 con física simple (guiño
  deportivo). Costo cero salvo al activarse; en reduced-motion muestra un
  cartelito estático. Verificado (28 pelotas). Pista sutil en el copy de
  contacto.
- **Verificado por script:** copiar email OK, Konami OK, gating de cursor OK.

---

## Responsive y accesibilidad (Fase 8)

- **Sin overflow horizontal** en 360 / 768 / 1440 (home y detalle), verificado por
  script (scrollWidth vs innerWidth).
- **Hero mobile:** el balón se escala/reposiciona según el ancho del canvas
  (`useThree` size) y el scrim se reforzó (horizontal + fade inferior) para que el
  texto quede legible sobre el 3D en pantallas chicas.
- **frameloop pausado:** IntersectionObserver en el hero → `frameloop="never"`
  cuando sale del viewport (ahorra GPU). Pin de proyectos solo en desktop
  (matchMedia).
- **Teclado:** verificado — sin trampa de foco (21 elementos únicos alcanzables),
  **foco visible en el 100%** (0 sin outline), skip-link primero. Jerarquía de
  headings correcta (un solo h1 por página). Canvas decorativo con `aria-hidden`.
- **reduced-motion** respetado en todo (Lenis off, reveals off, cursor nativo,
  preloader instantáneo, hero poster, Konami estático, sin pin).
- Smoke en viewport mobile (390×844) sin errores de consola.
- **Pendiente Felipe:** probar en su celular real
  (`npm run dev -- -H 0.0.0.0` + su IP local).

---

## Performance (Fase 9)

- **Win grande:** el `useProgress` de drei en el Preloader arrastraba **three.js**
  al bundle inicial (aunque el poster path no usa 3D). Se reemplazó por una señal
  `heroCargado` que sube desde el Hero (canvas `onReady` / poster `onLoad`) por
  el contexto `AppReady`. Resultado: **JS inicial 324 KB → 225.8 KB gz**.
- **Presupuesto (verificado por script, poster path sin chunk 3D):**
  - JS inicial home: **225.8 KB gz** ✓ (< 300 KB, sin contar el chunk 3D lazy)
  - **CLS: 0.0000** ✓
- **3D lazy:** `HeroCanvas` con `next/dynamic({ ssr:false })` → three/drei quedan
  100% en un chunk aparte que solo se baja en GPU capaz.
- **Limpieza:** borradas las rutas dev (`/dev/tokens`, `/dev/poster`); nunca se
  agregó `r3f-perf` en producción.
- **Lighthouse (build de producción, Chromium por software / SwiftShader):**
  - **Desktop: Performance 94** — FCP 0.3s, **LCP 1.2s**, **TBT 130ms**, CLS 0. ✓
  - **Mobile: Accesibilidad 100 · Best Practices 100 · SEO 100** ✓;
    **Performance 50** ⚠️.
  - El 50 de mobile **NO es representativo**: Lighthouse mobile aplica 4× de CPU
    throttling **sobre** SwiftShader (renderizado por software, sin GPU), lo que
    infla "Script Evaluation" a ~4.5s (rendering-bound, no un problema de código).
    En hardware mobile real (con GPU + el poster liviano en gama baja) los números
    se acercan a los de desktop.
  - **TODO Felipe / deploy:** validar el Lighthouse mobile final sobre el preview
    de **Vercel** (condiciones reales). Las métricas independientes del entorno ya
    están verdes (CLS 0, JS 225 KB, A11y/BP/SEO 100, desktop 94).

---

## SEO, metadata y cierre (Fase 10)

- **Metadata** completa en `app/layout.tsx`: title template, description, keywords,
  `openGraph` y `twitter` (summary_large_image). URL centralizada en `lib/site.ts`.
- **Imagen OG** generada con `next/og` (`app/opengraph-image.tsx`) desde los
  tokens: Archivo Black + celeste sobre ink, texto + color, **sin ilustración**.
  1200×630, aplica a todas las rutas.
- **`sitemap.xml`** (home + 2 casos) y **`robots.txt`** (allow all + sitemap).
- **Favicons** derivados del logo de Felipe (no dibujados): `favicon.ico` (PNG del
  logo embebido en contenedor ICO), `icon.png` (512), `apple-icon.png` (180).

### Checklist maestro de QA (Fase 10)

- [x] Gate mínimo verde (tsc, lint, build, smoke) sobre producción.
- [x] Cero `any`, cero `@ts-ignore`, cero `console.log` residuales (auditado por grep).
- [x] Ningún `TODO(` crudo renderizado (solo en comentarios). Placeholders usan "FALTA:".
- [x] Reduced motion: sitio 100% usable y entendible con animaciones apagadas.
- [x] Teclado: sin trampa de foco, foco visible al 100%, skip-link.
- [x] 360 → 1920 sin overflow horizontal.
- [x] **Ningún SVG complejo autorado a mano** (`grep 'path d='` → 0 hits). Íconos de
      lucide + Simple Icons (Iconify). Modelos 3D, logo, foto: assets provistos.
- [x] `CREDITS.md` completo (todo CC0 / OFL / ISC; sin CC-BY pendiente).
- [x] `README.md` con setup, comandos, estructura, cómo editar `content/`, deploy.
- [~] Lighthouse mobile ≥ 90: desktop 94 y A11y/BP/SEO 100 ✓; Performance mobile a
      validar en Vercel (SwiftShader local infla el score). Presupuesto JS y CLS ✓.
- [x] Links funcionan; TODO(FELI) restantes listados en `TODO-FELI.md`.

---

## v4.0 — "Espacio": skybox de la Vía Láctea + asteroides vivos + paleta invertida

Pedido de Felipe: fondo de espacio exterior ultra realista, con asteroides
pasando a alta velocidad y rotando sobre su propio eje al azar; además, cero
"—" (em dash) en todo texto renderizado del sitio.

- **Skybox fotográfico REAL**: panorámica 360° de la Vía Láctea de **ESO/S.
  Brunier** (`eso0932a`, CC BY 4.0, crédito en el footer). 3200×1600 q78
  (827 KB) + versión 1K para lite. No es una ilustración: es una fotografía
  del cielo real. En GPU real, el mismo equirect es el **environment map**:
  la galaxia ilumina y se refleja en el cromo y el vidrio.
- **El cielo deriva** (SKY_DRIFT 0.005 rad/s, vuelta ≈ 21 min): fondo y
  reflejos giran juntos; el espacio nunca está congelado.
- **Asteroides** (`components/three/Asteroids.tsx`): 12 rocas 3D (5 en lite)
  100% procedurales: icosaedro subdividido + deformación radial multibanda
  (posicional → sin costuras, mergeVertices → normales suaves) + aplaste
  anisotrópico; textura FOTOGRÁFICA de roca lunar (NASA, dominio público, vía
  repo de three.js) con ventana/tinte distinto por material (4 siluetas × 4
  materiales). Trayectorias rectas TANGENCIALES por banda de profundidad
  (d ∈ [16, 58]: jamás entre cámara y balón), velocidad ∝ profundidad
  (paralaje real), giro sobre eje propio aleatorio (0.4–4.4 rad/s, 25%
  tumbeadores rápidos) y renacimiento fuera de cuadro con nueva ruta. Spawn
  sesgado 70% al hemisferio visible. PRNG mulberry32 con semillas fijas:
  reproducible. `prefers-reduced-motion`: cinturón estático.
- **Paleta invertida** ("cielo" → "espacio", mismos tokens por rol): texto
  celeste-blanco sobre espacio profundo (la dupla celeste/blanco de la marca
  sigue, ahora en luz), Liquid Glass OSCURO estilo iOS (specular celeste
  tenue, brightness 1.25), `--acento` pasa a celeste luminoso #7cc4ea → los
  botones `bg-acento` cambian `text-white` por `text-ink` (AA), `.sky`
  procedural ahora es bóveda espacial con 3 capas de estrellas CSS + nebulosa
  (fallback sin WebGL / preloader), `surface-paper` invierte (momento claro),
  OG re-tematizada, etiquetas 3D de los soles en claro con halo oscuro.
  Los soles ganan MUCHO contra fondo oscuro (las referencias de Felipe tenían
  espacio negro detrás).
- **Em dashes**: barrido total en strings renderizados (bios, metas, aria-
  labels, title, OG alt, HUD, footer) parafraseando con comas, paréntesis,
  dos puntos o "·". Verificado con `dashcheck` (fetch del HTML de las 3 rutas
  → 0 apariciones). Los comentarios de código no renderizan y quedan fuera
  del alcance.
- **Póster de fallback** regenerado con la escena nueva (captura cuadrada del
  balón en el espacio). Skybox diurno de Poly Haven retirado.
- Verificación: gate verde, `anim` (sol hirviendo) ✓, `touch` 14/14 ✓,
  `smoke` 0 errores ✓, `dashcheck` 0 ✓, screenshots desktop/tópico/footer/
  mobile revisados a ojo (etiqueta Trabajo con margen en 390px tras subir el
  factor de distancia mobile a 4.75/aspect).

### v4.1 — Skybox de calidad real (feedback de Felipe: "la calidad es horrible")

Diagnóstico: a fov 40 la pantalla ve ~75° del panorama → con 3200px de ancho
eso era una franja de ~670px estirada casi 3× (mushy), la foto de Brunier es
un cielo profundo con MILLONES de estrellas débiles que a escala web leen
como ruido sal-y-pimienta gris, y el tonemapping ACES lavaba el contraste.
Salida (tres capas, pipeline propio en `scratchpad/grade.mjs` re-ejecutable):

1. **La foto aporta SOLO la nube galáctica**: EROSIÓN morfológica (min-filter
   separable, radio 2 sobre la fuente ESO de 6000px) que borra todo punto
   estelar de ≤5px conservando la estructura extendida de la banda; luego
   blur 3px, grading (exp 1.1, black 0.045, gamma 1.12, sat 1.22) y export
   4096×2048 q90 (~96 KB) + lite 1024 (~8 KB). Sin puntos que estirar, el
   fondo es nube limpia a cualquier fov: cero grano, cero macrobloques.
2. **Las estrellas puntuales son PROCEDURALES** (`Stars.tsx`): 2600 puntos 3D
   (800 en lite) sobre una bóveda r=90, tamaño por ley de potencias, color
   por temperatura (12% cálidas), ShaderMaterial aditivo sin tonemapping →
   nítidas a resolución NATIVA en cualquier pantalla/DPR. Giran con la misma
   deriva que el skybox (SKY_DRIFT compartido, exportado desde Stars).
3. **Inclinación de la bóveda** (SKY_TILT 0.3): la banda cruza en diagonal
   arriba, el resto del encuadre es espacio negro; el polo del equirect (donde
   la proyección pincha y bloquea) queda fuera de la vista típica.

Intentos descartados y por qué: servir 6000px nativo (el "ruido" son
estrellas reales, sobreviven a cualquier crush y siguen leyendo como grano),
blur global sin erosión (la banda se volvía niebla gris), crush de negros
solo (las estrellas débiles son más brillantes que cualquier umbral útil).

---

## v4.2 — Skybox procedural + favicon nuevo + logo libre + SEO del nombre

Pedidos de Felipe: (1) favicon coherente con la identidad, (2) logo sin el
contenedor glass, (3) skybox espacial "deslumbrante" sin necesidad de foto
real, (4) que buscar "felipe doval" encuentre el sitio primero, sin pagar.

- **Skybox 100% procedural, propio** (retira la foto ESO y su crédito):
  nebulosas GLSL con fbm 3D + domain warping DOBLE (técnica iq) muestreado
  sobre la ESFERA (sin costuras ni polos pinchados), núcleo galáctico
  luminoso blanco-celeste con ruptura de nubes, banda gaussiana ondulada con
  vetas de polvo oscuro, acentos dorados que riman con los soles y glitter
  estelar horneado en 4 escalas (+ estrellas grandes con halo). Renderizado
  OFFLINE vía WebGL en Chromium a equirect 4096×2048 (JPEG q92, ~306 KB) +
  lite 1024. Determinístico por seed. Mismo cableado: fondo + environment
  map (la nebulosa ilumina el cromo) + tilt diagonal + deriva.
- **Favicon**: el sol dorado dentro de la ventana hexagonal del fullereno
  sobre espacio con estrellas (la portada en 32px). `gen-favicons.mjs`
  regenera icon.png/apple-icon.png/favicon.ico desde primitivas SVG
  (polygon de vértices calculados + gradientes radiales; cero <path> a
  mano). Se eliminaron app/icon.tsx y app/apple-icon.tsx (los estáticos
  mandan).
- **Logo sin contenedor**: SiteNav pierde el glass-pill; el FD· flota con
  drop-shadow para leerse sobre cualquier zona del cielo.
- **SEO del nombre** (todo lo técnico del lado del sitio): JSON-LD
  Person + WebSite (@graph, sameAs GitHub/LinkedIn, knowsAbout, dirección
  Buenos Aires), canonical self-referencing ("./" en metadata → cada ruta se
  canoniza a sí misma), más lo que ya estaba (dominio exacto, H1 con el
  nombre, sitemap, robots, metadata OG). Verificado con seocheck (JSON-LD +
  canonical en el HTML de home y subpáginas). Los pasos que requieren SUS
  cuentas (Search Console + TXT de verificación, Bing, backlinks de
  GitHub/LinkedIn) quedaron guiados en TODO-FELI.md.
- **Fix**: lint rojo que se coló en v4.1 (mutación inline de uniform en
  Stars.tsx; ahora vía helper de módulo, patrón del repo). El gate de esa
  corrida quedó tapado por un pipe; lección: chequear exit codes, no solo
  la cola del output.

### v4.3 — Calidad gráfica del skybox + chips 3D + favicon FD + limpieza

Feedback de Felipe: partes del skybox pixeladas y zonas oscuras saturadas
con "el negro horrible"; favicon a solo "FD"; sin logo sobre la home; "|"
en el título de la pestaña; etiquetas de los soles rediseñadas; fuera las
cards de NASA y Sadosky.

- **Diagnóstico gráfico del skybox** (tres culpables, todos confirmados):
  (1) el value noise con interpolación CÚBICA deja artefactos de grilla que
  a fov angosto se leen como "pixelado" → interpolación QUÍNTICA (C2) + una
  sexta octava de detalle; (2) el JPEG macro-bloquea los gradientes oscuros
  (violetas posterizados = "el negro horrible") → export WebP q95; (3) la
  cuantización a 8 bits banda los degradés suaves → DITHERING de ±0.75 LSB
  en el shader antes de cuantizar. Resultado: 260 KB, gradientes limpios.
- **Etiquetas 3D nuevas**: CHIPS PILL de vidrio espacial (Shape de arcos
  computados: pill + anillo especular celeste con agujero) con texto claro y
  CONECTOR fino al sol (callout de spatial UI). El chip del sol activo/hover
  se ENCIENDE (easeChip sigue al foco suavizado). Es la identidad Liquid
  Glass del HUD llevada a la escena; se evaluó texto extruido (TextGeometry)
  y se descartó: requiere fuente typeface.json aparte y rompe la coherencia
  con el resto de la UI.
- **Favicon**: solo el monograma FD· (Archivo Black real vía canvas de
  Chromium + punto dorado) sobre espacio profundo. gen-favicons.mjs ahora
  renderiza con la tipografía auténtica en vez de aproximar con SVG.
- **Home sin logo**: SiteNav no renderiza nada en la home (el FD del sol es
  la marca); en rutas de detalle sigue logo + volver.
- **Título de pestaña**: separador "|" (default y template).
- **Recorrido**: fuera NASA Space Apps y Premios Sadosky (siguen en la bio).

### v4.3.1 — Skybox: el fix DEFINITIVO de los artefactos + aire en los chips

Felipe volvió a señalar bloques y saturación altísima en las zonas oscuras
(con razón: el zoom 2x lo confirmó). Causa raíz REAL, encontrada al fin: el
WebP lossy SIEMPRE submuestrea el croma a 4:2:0, y en las sombras violetas
la luminancia es plana pero el COLOR dibuja el degradé → el croma a media
resolución se ve en bloques. Ningún q lo arregla. Solución triple:

1. **Sombras desaturadas EN EL SHADER** (saturación dependiente de
   luminancia): las zonas oscuras viran a azul-gris profundo. Arregla la
   estética (la "saturación altísima") Y deja casi sin croma que romper.
2. **WebP SIN PÉRDIDA** (quality 1.0 en Chromium = lossless): cero
   submuestreo, cero bloques. Para que pese poco: se sirve a 2048×1024 (las
   nubes son suaves, el upscale bilineal es invisible; las estrellas
   nítidas ya las pone la bóveda procedural en vivo) y el glitter horneado
   se moderó (el ruido infla el lossless).
3. **Dither ordenado (Bayer 8x8)** en lugar de random: rompe el banding
   igual pero comprime mucho mejor (random: 1.4 MB → Bayer: 1.17 MB).

Verificación con evidencia: crops con zoom 2x de la zona señalada (vista
Perfil, cuadrante inferior-izquierdo) antes y después → gradiente limpio,
sin bloques ni bandas ni violeta quemado. Corroborado también en
producción tras el deploy.

Chips: la fórmula de ancho no descontaba las puntas semicirculares del pill
(zona no usable por el texto) → "RECORRIDO" tocaba el borde. Ahora:
ancho = texto (glifo + tracking) + altura del pill (las dos puntas) + aire
real de 0.45·FS por lado. Verificado con crop 2x del chip más largo.

---

## v5.0 — "Estudio blanco": fuera el contenedor de metal + fondo estudio

Pedido de Felipe: eliminar el contenedor de metal (que quede el sol + los
mini-soles, más cerca del centro) y cambiar el fondo por un ESTUDIO BLANCO 3D
(pared + piso, con la sombra del sol en el suelo, tipo render de producto).

- **Fuera el metal**: se retiró `Lattice.tsx` (icosaedro truncado + vidrio).
  Las constantes compartidas (`BALL_R`, escala) pasaron a `scene-config.ts` con
  `NODE_RING = 0.86`: los mini-soles orbitan más cerca del sol (antes 1.32,
  empujados por el contenedor). `NodeProjector` usa el mismo anillo → los
  hit-areas siguen alineados.
- **Estudio blanco** (`Studio.tsx`): cúpula (esfera BackSide) con un shader de
  gradiente por ALTURA (piso luminoso abajo → pared gris muy claro arriba) +
  la sombra del sol como textura radial en un plano tumbado. Es CAMERA-ROBUSTO:
  la cámara orbita adentro y ve blanco desde cualquier ángulo (verificado el
  caso crítico "Contacto", donde la cámara mira desde ABAJO: un piso rígido
  fijo se habría roto; la cúpula no). Sin luces: los soles son shaders sin
  iluminar y no hay PBR que iluminar → más barato y sin tonemapeo disparejo.
- **Sol sobre blanco**: se quitaron la CORONA y las LLAMAS (blending ADITIVO →
  invisibles sobre blanco, la vieja trampa "aditivo sobre cielo claro"). El
  resplandor lo da el BLOOM (núcleo HDR) bajado a 0.42 (sobre blanco un bloom
  fuerte embarra). Las protuberancias quedan (NormalBlending → se ven). Igual
  en los mini-soles (sin sprites de corona).
- **Chips claros**: el pill pasó a vidrio CLARO (frost + borde azul definido +
  texto tinta) para leer sobre blanco; el chip activo/hover se enciende.
- **Paleta v5 "estudio"**: se revierte a la luz (fondo casi blanco, texto
  tinta, Liquid Glass claro, acento azul profundo, oro a los soles). `.sky`
  procedural = ciclorama blanco (espejo del estudio 3D). `surface-paper`
  vuelve a ser el momento oscuro.
- Verificado: gate 0, touch 14/14, anim (sol vivo), smoke, dashcheck,
  seocheck; capturas de portada + Perfil/Trabajo/Contacto/Recorrido + mobile +
  footer + página de proyecto; póster de fallback regenerado.

### v5.1 — Encuadre: portada centrada + los 5 soles clickeables desde toda sección

Feedback de Felipe: en la portada el sol quedaba bajo (mucho espacio vacío
arriba); y desde una sección no se podían clickear las otras (los soles de
abajo se metían bajo el nav-bar, y los del lado opuesto quedaban detrás del
sol central porque la cámara buceaba de LLENO al nodo). Pidió: subir el modelo
en TODAS las secciones, con margen en todos lados, y poder clickear los 5.

Tres cambios coordinados en `CameraRig`:
- **Órbita PARCIAL** (`TILT = 0.34`): la cámara ya no encara de lleno el nodo,
  solo orbita un tercio hacia él. Así los CINCO soles siguen mirando a cámara
  en toda sección → todos clickeables (verificado que el dot·cámara de cada sol
  queda > umbral en las 5 secciones). El realce del sol activo lo dan el
  crecimiento + el pan + el chip, no un encuadre que esconde a los demás.
- **ELEVACIÓN** (`LIFT = 0.14`): la cámara mira un poco por debajo del centro
  → el cúmulo sube en pantalla. Centra la portada (adiós espacio vacío arriba)
  y, en los tópicos, despega los soles de abajo del nav-bar (que antes los
  tapaba: el overlay de hit-areas es z-30, debajo del HUD z-40).
- **PAN mayor** (`PAN_F = 0.44`) + distancias OVER/CLOSE cercanas: con la
  órbita corta el cúmulo se mantiene entero, así que se lo empuja bien al lado
  del modelo (sin pisar la columna de texto) y el tópico casi no hace zoom.
  Umbral `front` bajado a 0.06 por seguridad.

Verificación NUEVA y automática (`clickable.mjs`): navega a cada sección por
el HUD y comprueba que las 5 hit-areas de sol estén `front` + con
pointerEvents auto + con el centro POR ENCIMA del nav-bar. Resultado: 5/5 en
las 5 secciones. Más capturas de portada/secciones/mobile y póster regenerado.

### v5.2 — Vuelve la rotación: el test de visibilidad era el culpable, no la órbita

Feedback de Felipe: le gustaba la rotación anterior (quizá algo menos
exagerada); con la órbita corta de v5.1 la sección ya no se leía como
referida a SU mini-sol.

Tensión aparente: en v5.1 había recortado la órbita (TILT 0.34) para que los 5
soles siguieran clickeables desde cualquier sección. Pero al revisarlo con
números, esa premisa era FALSA:

- El `front` que habilitaba cada hit-area era un test de **cara de atrás**
  (`dirSol · dirCámara > umbral`). Ese test era herencia del BALÓN sólido: con
  el contenedor de metal, un sol del lado lejano quedaba realmente escondido
  detrás. **Sin balón ya no es cierto**: los mini-soles orbitan a
  NODE_RING·S = 1.2 y el sol central solo mide 0.7 de radio (0.315 dentro de un
  tópico, que se achica) → un sol "del otro lado" proyecta MUY por fuera del
  disco del núcleo: se ve perfecto. Comprobado a mano: con la cámara en Perfil
  y órbita PLENA, el punto del rayo cámara→Contacto más cercano al origen está
  a 0.99 (> 0.7) → nunca estuvo tapado; el dot lo desactivaba por error.
- Fix: `occludedByCore()` — test real **segmento-esfera** (el rayo cámara→sol
  ¿pasa a menos del radio del núcleo del origen?). Solo se desactiva lo que
  está tapado DE VERDAD.
- Con eso, la órbita vuelve fuerte (`TILT = 0.78`, algo menos que el pleno de
  antes para que no maree): la cámara se va hacia el sol de la sección y lo
  trae al frente, grande → se lee clarísimo que la sección ES ese sol. Y los
  otros cuatro siguen clickeables: verificado 5/5 en las 5 secciones (local y
  producción) con `clickable.mjs`.

Lección: cuando un invariante viejo (el balón tapaba) deja de existir, hay que
revisar los tests que dependían de él, en vez de compensar recortando features.

---

## v5.8 — El vidrio se aclara, el nombre se queda abierto, el sol llega a las netbooks

Tres pedidos de Felipe: (a) que el Liquid Glass parezca **vidrio** de una vez
(sus referencias: paneles de vidrio transparentes con glints blancos en el canto,
y el blob del arte de WWDC25); (b) que el interlineado del nombre, que crece al
entrar y le gusta, **se quede** en ese tamaño en vez de acomodarse con un golpe;
(c) que el sol 3D aparezca en las netbooks del colegio, donde no se veía en
absoluto aun con la aceleración por hardware activada.

### (a) El vidrio era niebla — y la niebla la hacía el ALPHA, no el blur
El v5.7 arregló la refracción pero el material seguía siendo **frosted**: un
tinte `rgba(232,240,248,0.55)` + blur 24 + `brightness(1.04)`. Al 55% de blanco
el fondo no se ve: eso es una cortina, no un vidrio — daba igual cuánto doblara
el borde. La receta compartida por las recreaciones fieles de iOS 26 (kube.io,
kevinbism, webtricks.dev, shuding/liquid-glass) es la inversa: **cara casi
transparente (tinte ~10%), blur moderado, y TODA la definición en el canto**.

- `--glass-bg` 0.55 → **0.10**; blur 24 → **10**; fuera el `brightness` (lavaba).
- La cara lleva un **barrido diagonal de luz** (gradiente 115°, 0.22 → 0 → 0.16):
  el reflejo del estudio sobre la cara plana, coherente con el bisel.
- **`--glass-glints`** (inset box-shadows): labio superior nítido (0.95), eco
  inferior tenue (0.6) y dos bloomos de esquina con spread negativo — el
  "espesor" del vidrio. Es la firma del material; sin esto es un rectángulo.
- El anillo especular del `::after` sube a 1.5px y alphas más presentes.
- Un **hairline frío de 1px** en la sombra (`--glass-drop`): vidrio blanco sobre
  pared blanca no tiene silueta; la sombra sola no alcanzaba a dibujar el borde.
- `background-color` (no el shorthand) en los estados hover/activo, para no
  pisar el gradiente de la cara. `Button secondary` pasa a usar el material.
- La refracción de v5.7 (la lente por `feDisplacementMap`) quedó intacta: con la
  cara clara, ahora por fin SE VE doblar el fondo en el borde.

### (b) El interlineado del nombre: el reposo ES el pico
Las dos líneas subían 0.18em escalonadas 90ms → el gap entre FELIPE y DOVAL
crecía (lindo) y después se **cerraba de golpe** cuando DOVAL alcanzaba a
FELIPE (el easing expo hace casi todo su recorrido en 300ms: un portazo).
En vez de suavizar el portazo, se eliminó: el interlineado de reposo pasa de
0.86 a **0.95** (el pico que la entrada alcanzaba), y cada línea sube desde una
altura DISTINTA (`--sube`: 0.18em la primera, 0.09em la segunda) → el gap crece
monótono de 0.86 a 0.95 y ahí se queda. Medido con Playwright muestreando
`getBoundingClientRect` cada 100ms: gap 170.29px → 184.22px, mayor retroceso
entre muestras 0.02px (ruido subpixel). El encuadre de la cámara no se toca:
mide la columna real del DOM, así que absorbió el cambio solo.

### (c) El sol en las netbooks: no era la GPU, era una regla de layout
La regla `chato` (v5.6: viewport < 620px de alto → se apaga el canvas, sin
poster siquiera) estaba pensada para un iPhone SE en layout ANGOSTO, donde el
texto se apila sobre el modelo. Pero medía solo el ALTO: una netbook escolar
(1024x600, o 1366x768 con el escalado de Windows al 125% → ~614px CSS) caía en
la regla **en layout ancho**, donde el texto va al costado y el alto no compite
— y se quedaba sin sol por completo. Ahora `chato` exige además ancho < 768px:
en pantallas anchas y chatas el canvas vive y la cámara encuadra el cúmulo en
la banda que haya (verificado por screenshot en 1024x600 y 1093x614).

Endurecimiento GPU, además (cinturón y tiradores para "todos los dispositivos"):
- **Bloom solo si hay con qué**: el EffectComposer renderiza a buffers
  half-float (WebGL2 + `EXT_color_buffer_(half_)float`). Sin eso no arranca y el
  canvas queda NEGRO. `bloomSupported()` (lib/gpu.ts) lo prueba antes de montar
  el composer: en WebGL1 el sol se dibuja igual, solo que sin halo.
- **Fuera los `precision highp float` a mano** de los fragment shaders: three
  antepone la máxima precisión que la GPU soporta; el highp explícito no compila
  en GPUs sin highp fragment y el mesh desaparece sin error visible.
- **`CanvasGuard`** (error boundary) + `webglcontextlost` → poster estático y se
  suelta el preloader: el 3D nunca deja la página rota ni colgada.
- `onReady` (que suelta el preloader) recién en el **primer frame renderizado**,
  no al montar: en una netbook el compile de shaders tarda segundos.
- `powerPreference: "default"` en software rendering (pedir "high-performance"
  a un driver viejo puede negar el contexto) y `failIfMajorPerformanceCaveat:
  false` explícito.

### Verificación
`gate` 0 · screenshots Chromium en 1920x941, 1024x600 y 1366@125% (sol presente
en los tres) · **SwiftShader** (GPU en blocklist, el caso real de la netbook):
sol visible, 0 errores de consola · gap del nombre medido (arriba) · hover, HUD,
chips, cards y página de proyecto inspeccionados de cerca en 2x · `smoke`.
---

## v5.12.1 — El acomodo del sol: la cámara viajaba en cámara lenta

Felipe insistió (con razón) en que el tirón seguía, y agregó la pista decisiva:
también lo veía en el MODELO del sol. El gap de texto ya era monótono (medido:
retroceso 0.00px), así que el tirón que quedaba era del sol. Dos capas de
diagnóstico:

1. Primera hipótesis (parcialmente cierta): la entrada del nombre anima el PESO
   de las letras (200→800) y una letra flaca es más angosta — la columna
   respira ~50px y la cámara, que mide la columna real, la seguía. Se congeló
   la banda durante la entrada (la medición previa ya tiene el ancho final: el
   reposo ES wght 800) + medición por `document.fonts.ready` en vez del timeout
   a ciegas. Necesario… pero el acomodo seguía: 9.1px de movimiento tardío.
2. La causa REAL, cazada con una timeline fina (chip del sol + columna + capa +
   HUD muestreados juntos): la columna ya NO cambiaba — el que se movía era el
   vuelo de la cámara, estirado en el tiempo. La animación de las letras
   (font-variation → layout por frame) tira los FPS abajo, y el rig capaba el
   delta a 0.05s: con frames reales de 0.2s la cámara avanzaba a 1/4 de su
   velocidad TEMPORAL, y al terminar la entrada "recuperaba" el viaje
   pendiente. Ese catch-up era el acomodo. Fix: cap del delta a 0.25s — el
   damping exponencial (damp^dt) es exacto en el tiempo para cualquier dt; la
   capa solo debe proteger del dt monstruo (volver de otra pestaña), no del
   jank normal.

Verificado con el test de acomodo (muestrea la etiqueta del sol 4.2s):
movimiento después de t=2.6s: 0.0px (era 9.1). Gap: retroceso 0.00px, termina
en el máximo. Regresión: clickable 5/5, touch, cta, smoke, gap — verdes.

---

## v5.12 — El estudio con textura, el vidrio interactivo y el iPhone arreglado

### El bug del "Chrome sin blur" en el iPhone (era mío, y grave)
Felipe reportó que en Chrome de su iPhone no había blur, solo transparencia.
Causa: en iOS TODOS los navegadores son WebKit por regla de Apple — "Chrome"
en iPhone es Safari con otra cara y su UA dice `CriOS`. Mi detección trataba
CriOS como Chromium, le escribía la cadena con url()... y WebKit descartaba la
declaración ENTERA: ni lente ni blur. Ahora iOS (iphone/ipad/ipod, y el iPad
que se disfraza de Mac pero lo delata el multitouch) es SIEMPRE frost.
Verificado con el UA real de CriOS: motor frost, cero cadenas inline, blur
vivo. La distorsión real en iOS sigue siendo imposible (limitación de WebKit,
no nuestra): ahí queda el frost + canto + reflejos, que es el mismo fallback
del componente de referencia.

### El tirón del interlineado del nombre (matemática, no estilo)
La v5.8 dejaba el interlineado en el pico (0.95) con las líneas subiendo
distancias distintas — pero mantenía un delay de 90ms entre líneas. Con ese
desfase el gap NO es monótono: la línea de arriba aterriza primero y la de
abajo sigue subiendo su resto, y subir la de abajo CIERRA el gap al final (el
"tirón" que Felipe veía). Fix: mismo reloj para las dos líneas (sin delay); la
cascada la siguen dando las letras. Verificado muestreando el gap real durante
la entrada: 134.5 → 138.2px monótono, retroceso 0.00px, termina en el máximo.

### Las ideas aprobadas, implementadas
1. **Estudio con textura** (GLSL en el ciclorama): grilla técnica en el piso
   (proyección gnomónica sobre el plano del piso → líneas RECTAS en perspectiva
   real, AA por fwidth, doble desvanecido) + matriz de puntos sutil en la pared
   frontal. No es solo estética: la lente del vidrio necesita detalle que
   doblar, y ahora lo tiene en todo momento.
2. **Resplandor del sol**: lobe cálido en la pared de atrás + pileta de luz en
   el piso, DESPUÉS de la grilla (la entibia: una línea bajo luz naranja se ve
   naranja). Todo < 1.0: el bloom (umbral 1.0) no florece jamás. Además de
   clima, es un gradiente de COLOR: la aberración cromática lo agarra mucho
   mejor que el gris.
3. **CTA prominente** (el tinted glass de Apple): "Hablemos" con la cara al
   azul de identidad (0.78 sobre blanco ≈ #425f80 → AA con texto #f2f8fc).
   Sigue siendo vidrio: la lente dobla el fondo detrás del tinte.
4. **Vidrio interactivo** (.interactive() de SwiftUI): al PRESIONAR cualquier
   vidrio flotante, la lupa se HUNDE (depth ×1.8, strength ×1.4, CA +2) y
   vuelve al soltar. Cadenas precalculadas (nada se arma en el pointerdown),
   listeners cableados una sola vez. El vidrio suave no lo hace: no es control.
5. **Barrido especular en hover**: una línea de luz diagonal cruza el vidrio
   (capa extra de background que viaja de -160% a 160% en 0.9s). Solo
   `background-position`: compositor, cero layout.

Póster regenerado (el estudio cambió). Batería completa verde, perf 50 FPS en
SwiftShader con la grilla y el resplandor incluidos.

---

## v5.11 — El reflejo especular, el azul intencional y la lente que no fantasmea

Tres reportes de Felipe sobre la v5.10:

### 1. Cards fantasma en el stack (bug real, diagnóstico geométrico)
En el stack de Perfil las cards se veían "superpuestas". No era layout: era la
LENTE PLENA en vidrio EN FLUJO. Una card de ~90px con strength 68 muestra en su
borde lo que hay hasta 68px afuera — y la card vecina está a 12px: el borde la
traía ADENTRO como un fantasma. Solución: `data-lente="suave"` para el vidrio
en flujo (cards en grillas: stack, Enfoque, Recorrido, Contacto, Trabajo,
ProjectCard) con depth 3-7 / strength 12-24 / ca 1 — distorsión de borde sutil
que nunca alcanza a la vecina. El vidrio FLOTANTE (HUD, CTAs, chips, pill sobre
captura) mantiene la lente plena: no tiene vecinos pegados y es donde luce.
Bonus medido: el peor caso de perf subió de 33 a 53 FPS (SwiftShader).

### 2. El reflejo especular de las referencias (fotos de paneles de vidrio)
Felipe pasó fotos stock de paneles con el brillo blanco característico. Se
implementó en TODO el vidrio, por capas y sin JS:
- CARA: barrido diagonal visible (blanco 0.5 entrando por arriba-izquierda,
  réplica FRÍA celeste saliendo por abajo-derecha). Pinta DETRÁS de los hijos:
  no vela texto ni capturas (la lección del velo de v5.7 sigue vigente).
- CANTO (`::after`): el anillo ahora lleva dos HOTSPOTS (arcos quemados de
  blanco en esquinas opuestas), la firma de las fotos de referencia.
- GLINTS: el eco inferior y los bloomos pasan de blanco puro a AZUL FRÍO.

### 3. El "borde azul" que Felipe cazó al scrollear
Lo que vio es un artefacto de la aberración cromática: en el borde del
viewport, el canal ROJO (el de mayor desplazamiento) muestrea fuera de lo
renderizado y desaparece → queda G+B = destello celeste. Le gustó. En vez de
intentar reproducir el artefacto (incontrolable), el vidrio ahora lleva ese
reflejo frío A PROPÓSITO y SIEMPRE: glints y hotspot inferior en celeste — el
vidrio real refleja el cielo.

### El iPhone: la verdad de la plataforma + hallazgo de tooling
Safari (incluido Safari 26 / iOS 26) NO soporta filtros SVG en backdrop-filter:
la refracción real es imposible ahí hoy. Las libs que "refractan en Safari" lo
hacen CLONANDO el DOM de atrás — y un canvas WebGL clonado queda EN BLANCO, así
que nuestros soles no se pueden refractar con ese truco. Lo que sí se hizo:
canto grueso perimetral + los reflejos nuevos (CSS puro, cross-browser).
HALLAZGO: el WebKit de Playwright EN WINDOWS (WinCairo) no compone
backdrop-filter — sirve para validar CSS/JS, NO los píxeles del iPhone. Por eso
el canto del fallback es SOLO PINTURA: un backdrop-filter anidado no se puede
validar desde acá, y si rompiera el blur del padre en iOS real, el vidrio se
perdería entero sin que lo veamos.

### Verificación
gate 0 · lg-juicio 33/33 · clickable 5/5 · touch · cta · smoke · dashcheck ·
hud-fit · perf 53 FPS (SwiftShader) · stack sin fantasmas (verificado con
captura en los dos motores) · deploy manual con `vercel deploy --prod` (el
webhook de GitHub sigue sin disparar builds — pendiente de revisar en el
dashboard).

---

## v5.10 — La lente en todos los contenedores

A Felipe le gustó el resultado del nav-bar ("Hermoso quedó, ahora sí parece más
liquid glass") y pidió extender el efecto al resto de los contenedores: cards
de proyectos, botones, paneles. Hecho con criterio, no a ciegas:

- **Reciben lente** (33 elementos): cards de proyectos + su pill "en progreso"
  (flota sobre la captura: la lente dobla la imagen de atrás), panel y enlaces
  de Contacto, principios de Enfoque, stack de Perfil, timeline de Recorrido,
  el article de Superlum en Trabajo, el Button secundario (variante de vidrio),
  "Volver al grafo" del nav y el cartel del Konami.
- **NO reciben lente**: las cajas de capturas del detalle de proyecto (la
  imagen opaca las cubre: el backdrop nunca se ve, sería costo sin efecto) y la
  figure de la foto de Perfil (ídem).

Dos piezas de infraestructura que esto exigió:
1. **MutationObserver**: las páginas de proyecto montan sus elementos DESPUÉS
   (navegación client-side con layout persistente); sin esto, todo lo que
   aparece tras la carga inicial quedaba sin lente. childList solamente:
   escribir style/dataset no dispara childList, así que no se retroalimenta.
   Verificado navegando de la home a /proyectos/superlum con click real.
2. **Cache por tamaño**: `data-liquid` guarda el WxH aplicado y si no cambió no
   se rearma el data URI (el observer dispara seguido; el filtro solo se
   regenera cuando el elemento cambió de verdad).

Perf con 33 lentes (algunas de 600px+): SwiftShader 33 FPS moviéndose (peor
caso sintético; eran 38 con 8 lentes) y GPU real 161 FPS. El costo real del
backdrop-filter es por píxel cubierto, y las cards grandes están casi siempre
fuera del viewport de la portada.

Trampa de verificación que casi me hace corregir un bug inexistente: una
captura salió con la página SIN CSS (HTML crudo). No era el sitio: era mi
`next start` de fondo sirviendo un build que yo había pisado con `npm run
build` (los chunks viejos ya no existían). Server limpio, captura limpia.

---

## v5.9 — Liquid Glass genuino: el port del componente de referencia

Feedback de Felipe sobre v5.7, con razón: "el liquid glass no es el blur de los
objetos que pasan detrás, es el efecto de un vidrio que refleja... ¿a vos te
parece liquid glass esto? No lo es, en absoluto". Pasó el repo
github.com/srdavo/liquid-glass (web component que adapta el artículo de
ekino-France) con la orden de leerlo COMPLETO y portearlo.

### En qué se equivocaba la v5.7 (leído el repo, admitido)
1. **El bisel era tímido.** Mi mapa de Snell doblaba una franja de ~2px con
   escala 17-34. El del repo cubre el ELEMENTO ENTERO con dos gradientes
   lineales (R→x, G→y) de borde a borde, neutralizados en el centro por un
   rectángulo #808080 redondeado y desenfocado (`depth`): el interior queda
   limpio y el borde MAGNIFICA como una lupa, con strength 40-100.
2. **Faltaba la aberración cromática.** El repo desplaza el fondo TRES veces
   (strength+2ca / strength+ca / strength), aísla cada pasada a un canal con
   feColorMatrix y recombina con feBlend screen. Ese fringe de color en el
   borde es la mitad de lo que el ojo lee como "vidrio".
3. **Mi propio frost tapaba el efecto.** blur(24px) + fondo al 55% no dejan
   detalle que doblar. El repo usa blur 1-3px y fondo al 40%; la cadena es
   blur(b/2) → url(filtro) → blur(b) → brightness → saturate, con el pre-blur
   ablandando lo que la lente dobla (parte del look "líquido").

### Simplificación que vino gratis
El filtro viaja como data URI (`backdrop-filter: url('data:image/svg+xml;...')`):
se fue el <svg> del DOM, el canvas y el PNG del mapa. `lib/lente.ts` ahora
genera dos strings.

### Lo que se conservó de v5.7 (verificado entonces, sigue valiendo)
- WebKit revienta si la declaración de backdrop-filter incluye el url(): la
  cadena va INLINE desde JS y SOLO en Chromium (detección por UA como el repo;
  CSS.supports miente porque Safari parsea url() como válido). Safari/Firefox
  se quedan con el frost del CSS: el mismo fallback del repo.
- El bisel especular en `::after` y la sombra azul.
- `data-lente` solo en lo que FLOTA (HUD, CTA, chips de los soles): 8 elementos.

### Calibración por tamaño (del video del componente)
"Si dejamos strength al 100% en un elemento chico se forma un borde raro
alrededor": strength = clamp(lado*1.2, 26, 68), depth = clamp(lado*0.16, 4, 12),
ca = 1 en chips / 2 en grandes, blur 1 chico / 2 grande.

### Reconciliación con la v5.8 (sesión paralela)
Este port aterrizó rebasado sobre la v5.8, que en paralelo había aclarado la
CARA del vidrio (tinte 10%, glints de canto, sin brightness). Las dos mitades
componen: la v5.8 puso la cara y el canto; esta pone la LENTE. Dos ajustes al
integrar: (a) se descartó el fondo al 34% para elementos con lente — la cara
al 10% de la v5.8 es mejor todavía (menos velo, más doblez visible), y el
shorthand `background:` habría pisado su barrido de luz; (b) la cadena inline
perdió el brightness(1.06) del repo, porque la calibración v5.8 encontró que
aclarar el backdrop es exactamente lo que vuelve "leche" al vidrio.

### Verificación (visual además de programática, como pidió Felipe)
Sobre franjas de colores (el fondo de juicio): las diagonales se curvan en S al
cruzar el borde del HUD y se ENVUELVEN alrededor de la punta redondeada del CTA
— la distorsión fiel a la forma del video de referencia. Programático: 8/8 con
la cadena inline en Chromium · WebKit con CERO estilos inline y su frost
intacto · gate 0 · clickable 5/5 · touch · cta · smoke · dashcheck · hud-fit.
Perf: SwiftShader (software, peor caso sintético) 38 FPS moviéndose; GPU real
(RTX 2080) 95 FPS. El costo de las 3 pasadas vive solo en software rendering.

Créditos en CREDITS.md: srdavo/liquid-glass (Salvador Camacho) + ekino-France.

---

## v5.7 — Liquid Glass de verdad: el borde que DOBLA el fondo

Dos pedidos de Felipe que resultaron ser **el mismo bug**: (a) las capturas de los
proyectos tenían un velo blanco arriba; (b) la UI no parecía Liquid Glass sino
plástico. Los dos salían de `.glass-spec::after`: un lavado blanco al 45% sobre
el tercio superior de cada elemento de vidrio, pintado ENCIMA de los hijos. En el
vidrio real el brillo especular vive en el BISEL, no como una mancha sobre la
cara. Sacando el lavado se fueron el velo y el plástico de una.

### Qué dicen las fuentes (leídas, no resumidas de memoria)
Apple define el material por una palabra: **lensing**. Su documentación habla de
componentes que "dejan pasar sus elementos de color, resaltando el efecto de
lente del material". O sea: el vidrio no difumina el fondo, lo **dobla** en el
canto. Sin refracción es frosted glass, que es lo que teníamos. Donny Wals suma
la regla de uso: el vidrio es una CAPA que se apoya sobre el contenido (toolbars,
tab bars, botones flotantes), nunca el contenido mismo.

La receta técnica salió de kube.io: un `feDisplacementMap` cuyo mapa codifica las
normales de un bisel con perfil de **squircle convexo** (`y = (1-(1-x)^4)^(1/4)`,
el que usa Apple porque mantiene el gradiente parejo aunque la forma se estire),
con el desvío calculado por **Snell** (n = 1.5). El mapa va en R/G con 128 = cero
y el `scale` del filtro lo lleva a píxeles.

### Tres cosas que solo aparecieron al prototipar
1. **El test mentía.** Probé la refracción sobre una grilla que se repite cada
   20px, con un desplazamiento de ~20px: un patrón periódico corrido un período
   se ve IDÉNTICO. No se veía nada y el código estaba bien. Con franjas
   diagonales (sin repetición) el doblez saltó a la vista.
2. **La región del filtro necesita margen.** La lente del borde tiene que traer
   píxeles de AFUERA del elemento. Con la región terminando en el borde no hay de
   dónde traerlos y el fondo se DESGARRA en vez de doblarse. Va a -50%/200%.
3. **El mapa hay que desenfocarlo.** La pendiente del squircle se dispara en el
   último píxel: sin suavizar, el desplazamiento sale como un pico de 1-2px que
   corta el fondo en tajos.

### Lo que decidió la arquitectura: WebKit
Probado en WebKit real (Playwright trae el motor de Safari): con
`backdrop-filter: blur() saturate() url(#lente)` **en una sola declaración**, el
fondo DESAPARECE y queda un bulto blanco. En capas separadas (el frost en el
elemento, la lente en `::before`), Safari simplemente ignora la lente y el frost
queda intacto. Por eso la refracción vive en su propia capa: no es prolijidad, es
lo único que no rompe el iPhone de Feli. Solo Chromium aplica filtros SVG en
`backdrop-filter`; `--lente` sin definir cae en `none` por el `var()`.

### Dónde se ve (y dónde no, dicho de frente)
El sitio es un estudio BLANCO, y sobre un fondo plano el vidrio no tiene nada que
doblar: ahí Liquid Glass es —también en iOS— una pastilla sutil con un buen
bisel. Donde canta es donde el vidrio pasa sobre contenido: **el HUD flotando
sobre el texto que scrollea**, que es exactamente el caso de la tab bar de iOS 26
sobre una lista. Ahí se ve el texto doblarse en el filo. Por eso la lente va solo
en lo que flota (HUD, CTA, etiquetas de los soles): 8 elementos, un canvas chico
cada uno al cargar, cero costo por frame.

### Verificación
`gate` 0 · vidrio verificado en **Chromium Y WebKit** (8 lentes, y el HUD
conserva su frost en los dos) · `perf` 56 FPS en movimiento con render por
software · `clickable` 5/5 · `touch` · `cta` · `capturas` 6/6 sin velo ·
`smoke` · `dashcheck` · `hud-fit`.

Fuentes: developer.apple.com/documentation/technologyoverviews/liquid-glass ·
donnywals.com/designing-custom-ui-with-liquid-glass-on-ios-26 ·
kube.io/blog/liquid-glass-css-svg · medium.com/ekino-france/liquid-glass-in-css-and-svg ·
webtricks.dev/blog/liquid-glass-css

---

## v5.6 — El celular de verdad: 185px de alto que el emulador inventaba

Feedback de Felipe: en el emulador de Chrome a 390px se ve perfecto, pero en su
**iPhone real** el modelo queda mucho más chico, los mini-soles más cerca del sol
central y las etiquetas los tapan.

### El bug estaba en cómo probaba, no en el código
Su observación era la pista exacta: que los mini-soles se vean "más cerca" del
sol solo puede pasar si la CÁMARA está más lejos (achica todo junto,
proporcionalmente). Y como las etiquetas ya no escalan (v5.5), quedan enormes.

Causa: **estaba probando con un alto que no existe**. 844 es la PANTALLA de un
iPhone; el viewport real, con la barra de Safari puesta, es **659** (descriptor
`iPhone 15 Pro` de Playwright). Me faltaban 185px, un 22% del alto. Con el alto
real, medido en producción:

| | emulador (390x844) | iPhone real (393x659) |
|---|---|---|
| banda libre para el modelo | 388px | **233px** |
| ancho de los soles | 260px | **95px** |

O sea: el texto del hero se comía el **65%** de la pantalla de su teléfono. En un
iPhone SE la banda daba **negativa**: no entraba ni el texto.

### Lo que se hizo
1. **Devolverle el alto al modelo**: en angosto el hero va compacto (`pb-16` en
   vez de `pb-28`, aires `mt-3/4/6` en vez de `mt-5/6/9`) y el aire vertical de
   la cámara baja a 3.5%. En md+ no cambia nada: ahí sobra lugar. La banda pasa
   de 233 a **309px** y los soles de 95 a **220px** (2.3x), con el ajuste a lo
   alto dando 100.5% (la cámara usa toda la banda).
2. **Medir contra la caja del CANVAS, no contra `window.innerHeight`**. No son lo
   mismo en iOS (ventana, viewport visual y elemento fijo pueden diferir por la
   barra), y la cámara razona en las coordenadas de SU canvas. Midiendo la banda
   contra la misma caja que ve la cámara, esa familia entera de bugs no puede
   pasar. Ningún emulador la habría mostrado.
3. **Plan B donde el modelo NO entra** (lo autorizó Felipe): abajo de 620px de
   alto útil, el modelo se apaga y quedan el HUD y el scroll. La cuenta: el hero
   necesita ~350px de texto y el cúmulo ~270 de banda; abajo de 620 no entran los
   dos y el modelo quedaría en ~120px, ilegible e intocable. Afuera quedan el
   iPhone SE (553) y Androids viejos; los iPhone modernos (659+) mantienen la
   navegación por soles. El umbral se lee del canvas, no de una media query: las
   de CSS miden el viewport de layout, que en iOS ignora la barra.
4. **El HUD entraba justo o se cortaba**: en un Android de 360 se cortaban
   "Perfil" y "Contacto", y en un iPhone Pro entraba al límite exacto (367 de
   367px). Era un bug viejo, pero el plan B lo vuelve crítico: en pantallas
   chatas el HUD es la ÚNICA navegación. Abajo de 400px ahora se compacta.
   `scratchpad/hud-fit.mjs` lo verifica en 5 pantallas.
5. **`scripts/touch.mjs` ahora emula 393x659**, no 390x844: la prueba mentía
   regalando 185px. El test tiene que doler donde duele el teléfono.

### Verificación
`gate` 0 · `touch` (iPhone real, tap táctil) · `clickable` 5/5 en las 5
secciones · `hud-fit` 5/5 pantallas · `cta` · `anim` · `smoke` · `dashcheck` ·
`seocheck` · `hero-metrics` en 1920/1440/1280/393x659/320x568.

---

## v5.5 — Las etiquetas salen del 3D: el celular también navega por los soles

Feedback de Felipe: en la computadora le encanta, pero **en el celular se ve
horrible**: el modelo queda chiquito arriba del nombre y las secciones no se
leen. Ofreció como alternativa apagar el 3D en mobile y navegar solo por el HUD;
pidió primero intentar en serio mantener la navegación por los soles.

### La causa raíz: el texto vivía en el mundo 3D
Las etiquetas eran geometría (`drei/Text` + pills de `ShapeGeometry`), así que su
tamaño lo decidía la DISTANCIA DE LA CÁMARA: **12.5px en 1920 y ~5px en un
celular**, donde la escena entera entra en 289px. Ningún encuadre arregla eso —
para que el texto llegara a 11px en el celular, el cúmulo tendría que medir
640px de ancho en una pantalla de 390. Agrandar el modelo era tratar el síntoma.

La etiqueta es UI, no geometría. Ahora vive en **píxeles de pantalla** (HTML) y
lo 3D es lo que importa: su POSICIÓN sale de proyectar cada sol con la cámara
real por frame, así que va pegada a su sol, con su paralaje, y desaparece cuando
el sol queda tapado (mismo test que decide si se puede clickear: si no lo ves,
no está). Tres cosas que se ganaron de yapa:
- **La etiqueta y su zona clickeable pasaron a ser la MISMA cosa** (un botón con
  la pastilla colgando: tocás el sol o su nombre, es igual). Antes eran dos
  sistemas paralelos: hit-areas invisibles + chips 3D.
- Usa el vidrio REAL de la identidad (`.glass`, el mismo del HUD y los CTA) en
  vez de imitarlo con planos opacos, y el texto sale nítido a cualquier DPI.
- Se fue `drei/Text`, la fuente del atlas y toda la geometría de pills.

Perf medida con las 5 pastillas de vidrio moviéndose: **56 FPS en movimiento con
render por SOFTWARE** (SwiftShader, el peor caso). El blur no se nota.

### La regla que hacía falta: el callout apunta hacia AFUERA
Con la etiqueta en px fijos, en el celular es relativamente más grande y las de
los soles de arriba (Perfil, Enfoque) caían **sobre el disco del sol central**.
Se resolvió con una regla, no con un número: la etiqueta va siempre hacia afuera
del cúmulo (arriba la de los soles del tope, abajo el resto). Como los soles
están quietos, es una constante por nodo: cero trabajo por frame.

### Encuadrar la geometría, no el resplandor
Las constantes `CL_*` medidas de v5.4 estaban contaminadas: incluían el halo del
bloom, que **no es modelable en unidades de mundo** (mide ~60px en 1920 y casi
nada en un celular, donde los soles miden 10px). Por eso el celular quedaba un
24% más chico de lo que podía. Ahora `CL` se **deriva de los nodos** (exacta, se
recalcula sola si cambian las direcciones o el anillo) y el halo derrama sobre el
aire del borde, que es lo que hace cualquier foto de una fuente de luz: se
encuadra el objeto, no su resplandor.
También se separó el aire en `HERO_MARGEN_X` (0.09) y `HERO_MARGEN_Y` (0.05): a
los costados el aire es composición, pero arriba y abajo, en el celular, cada
píxel se le saca al modelo.

**Resultado en el celular (390x844)**: los soles pasan de 193 a 260px de ancho
(+35%), las 5 secciones se leen, ninguna etiqueta pisa al sol, y la navegación
por soles sigue viva. No hizo falta el plan B de apagar el 3D.

### Verificación
`gate` 0 · `clickable` 5/5 en las 5 secciones · `touch` (tap real en iPhone
emulado) · `cta` · `anim` · `perf` · `smoke` · `dashcheck` · `seocheck` ·
`hero-metrics` en 1920/1440/1280/390.
Trampa que costó media hora y una medición fantasma: **`h1.is-in` NO significa
que la escena esté lista** — el preloader se va solo por su techo de 2.4s, así
que con el dev server compilando yo estaba midiendo la cámara EN PLENO VUELO
(230px de error) y la medición contradecía a la captura. Hay que esperar al
`canvas`. Cuando dos verificaciones no coinciden, una miente: vale la pena
encontrar cuál antes de tocar el código.

---

## v5.4 — El cúmulo quieto + la cámara enmarca el hueco que deja el layout

Feedback de Felipe sobre v5.3: (a) que los mini-soles giren termina escondiéndolos
detrás del sol o superponiendo secciones → que queden QUIETOS y gire solo el sol
central; (b) el modelo tiene que ser más grande, "queda mucho espacio vacío";
(c) el nombre, un poco más grande, para que tenga más foco; (d) el margen entre
el texto y el sol es DEMASIADO (mandó una captura con los cuatro márgenes
marcados: el de la izquierda "demasiado", los otros tres "achicaría solo un poco").

### El cúmulo no gira (y no es una concesión: es geometría)
Girar el conjunto tenía tres costos que ninguna calibración arregla:
1. Un mini-sol que orbita **pasa detrás del sol central**: media vuelta sin
   verse ni poder clickearse. Exactamente lo que reportó Felipe.
2. Al girar, **dos chips cualesquiera terminan superpuestos**: los nodos viven
   en una esfera y su proyección se cruza. Las direcciones de `nodos` están
   elegidas para leerse separadas DE FRENTE; quietas cumplen esa promesa.
3. El encuadre se volvía **no determinista**: medido con hero-metrics, el margen
   de arriba daba entre 13% y 23% según en qué ángulo agarrara la captura. Por
   eso las capturas de Felipe y las mías nunca coincidían.

El movimiento ahora lo pone el sol central girando sobre su **propio eje**
(`spinSun`, 0.06 → 0.085 rad/s ya que es el único giro de la escena): se ve vivo
sin mover a nadie de lugar. Se fue `SpinDriver`/`spinRef` y con él toda la
maquinaria de invariancia-θ de v5.2 (los waypoints y las hit-areas ya no tienen
que rotar con el cúmulo). Menos código y más determinismo.

### La cámara enmarca la BANDA LIBRE, medida contra el DOM
Primero calibré a mano tres constantes en 1920 y los cuatro márgenes quedaron
parejos (135/135/135/144 px). Pero al medir el resto de las pantallas: **1440
dejaba el cúmulo a 4.4% del borde derecho y 1366x768 a 3.7%** (casi cortado).

Causa: el contenedor centrado (`max-w-[88rem]`) mueve el borde derecho del nombre
del **35% del ancho (1440) al 47% (1920)**, mientras que el cúmulo se dimensiona
contra el ALTO. Con esas dos escalas peleando, **ningún pan constante puede
servir para las dos** — no era cuestión de afinar el número.

Solución: `GraphHome` mide el hueco real que deja el layout (`bandaRef`: a la
derecha de la columna de texto y arriba del HUD en ancho; arriba del texto en
angosto) y la cámara (`encuadreHero`) se aleja lo justo para cumplir la más
exigente de las dos restricciones (que entre a lo alto y a lo ancho) y centra
ahí el **bbox real** del cúmulo. Detalles que la medición corrigió y la intuición
erraba:
- El cúmulo **no es un círculo**: los chips lo estiran a lo ancho (744x609 px en
  1920) y lo empujan hacia abajo (cuelgan) → su centro óptico no es el sol. De
  ahí las constantes asimétricas `CL_R/CL_L/CL_T/CL_B`, medidas, no supuestas.
- La banda vertical **no es la pantalla**: termina arriba del HUD.
- Para que la columna pueda medirse tiene `w-fit` (mide lo que mide el nombre).

No hay ninguna fórmula de CSS copiada en el archivo del 3D: si cambia la
tipografía, el copy o el contenedor, el encuadre se recalibra solo.

**Resultado en 1920x941** (hero-metrics.mjs): arriba 135 · derecha 135 · abajo
hasta el HUD 135 · gap con el nombre 144. Antes: 214 / 196 / 176 / **427**.

### El nombre y el tamaño del modelo
- Nombre: `clamp(2.9rem, 9.2vw, 8rem)` → `clamp(2.9rem, 10.1vw, 12.2rem)`. No es
  gusto, es composición: el nombre y el cúmulo se reparten el ancho, así que
  agrandar el nombre es lo que cierra el gap. "FELIPE" pasa de 391 a 593 px en
  1920 y la columna a `max-w-2xl` para acompañarlo.
- Cúmulo en la portada: 602 → 744 px de ancho (+24%). En mobile 221 → 289 (+31%).
- **En los TÓPICOS la distancia NO se toca (4.2)**: probé 3.95 (+6%) y el sol de
  Enfoque quedaba con el centro a 45px del borde superior en la vista de
  Contacto, o sea cortado (lo cazó `clickable.mjs`: 4/5). La cuenta dice que para
  dejarle 70px de aire no puede bajar de 4.17 → el 4.2 original ya estaba en su
  límite. El pedido de "más grande" lo absorbe la portada, que es donde sobraba.

### Póster de fallback auto-calibrado
`scratchpad/poster.mjs` ya no recorta en coordenadas escritas a mano: mide el
bbox del cúmulo por saturación y recorta un cuadrado centrado en él, e imprime
dónde va la caja en el CSS. El encuadre del póster sigue al de la cámara solo.

### Verificación
`gate` 0 · `clickable` 5/5 en las 5 secciones · `cta` · `touch` · `anim` ·
`smoke` · `dashcheck` (0 em dashes) · `seocheck` · `hero-metrics` en 1920/1440/
1280/390. Trampa que costó una hora: Next 16 bloquea los recursos de dev pedidos
desde `127.0.0.1` (los trata como cross-origin) → la página no hidrata y se mide
el **preloader** en vez de la escena. Tiene que ser `localhost`. Lo delató
dumpear la máscara de detección en vez de confiar en el número.

---

## v5.3 — Portada de verdad: el nombre a la izquierda, el sol girando a la derecha

Pedido de Felipe: portada con su NOMBRE grande a la izquierda (colores de la
identidad, con algo innovador, ni degradado pelado ni pinta de hecho con IA),
el sol y los mini-soles a la derecha GIRANDO, el sol sin el FD, y dos CTA de
Liquid Glass a Trabajo y Contacto. Sin guiones ni viñetas en el texto.

- **El nombre** (`HeroName.tsx` + `.nombre` en globals.css). Antes de elegir
  investigué la técnica de referencia (Awwwards 2026, fancycomponents,
  Michelle Barker): lo que se premia hoy no son los degradados sino animar los
  EJES de una fuente VARIABLE. Bricolage Grotesque, que ya usamos y está
  self-hosted, es variable con eje `wght` 200..800 → cero dependencias nuevas.
  1. MATERIALIZACIÓN: cada letra entra en wght 200 y engorda a 800 en cascada
     mientras la línea sube: la letra no aparece, se FORMA. Interpola porque
     `--w` se registra con `@property` como `<number>` (sin eso saltaría).
  2. LUZ DEL SOL: el sol vive a la derecha, así que el degradé va tinta →
     azul → celeste con una luz CÁLIDA entrando por la derecha y la sombra
     cayendo al lado opuesto. Primer intento con oro: el oro sobre el celeste
     vira a VERDE y ensucia; se cambió por blanco cálido (que es lo que hace la
     luz de verdad).
  3. PARALAJE: el bloque se inclina siguiendo el puntero (solo custom props →
     transform en el compositor, cero reflow). Se descartó el hover que engorda
     letras por proximidad: con el peso base ya en 800 no hay margen hacia
     arriba y forzaba reflow del h1 en cada frame.
- **SEO/a11y sin ceder ninguno**: el texto del h1 son las letras reales con un
  espacio entre palabras → en el DOM se lee "Felipe Doval". El patrón habitual
  (`sr-only` con el nombre + letras `aria-hidden`) DUPLICABA el texto para los
  buscadores ("Felipe DovalFelipeDoval": Google lee el DOM crudo, no respeta
  aria-hidden). Los lectores reciben el nombre entero por `aria-label`.
- **El sol GIRA en la portada** (`SpinDriver` + `spinRef` compartido). Truco
  para no romper nada: los waypoints de TÓPICO se rotan por el MISMO ángulo que
  el cúmulo. Como es una rotación rígida alrededor de Y y el "arriba" de la
  cámara también es Y, el encuadre de cada tópico es IDÉNTICO gire lo que gire
  → se conserva la calibración de v5.1/v5.2 (5/5 soles clickeables). El giro se
  frena al entrar a un tópico (si no, la cámara perseguiría un objetivo móvil y
  nunca asentaría). El proyector rota igual → las hit-areas siguen a los soles.
- Portada responsive: en pantalla ancha el cúmulo se corre a la DERECHA
  (heroPan) y el nombre ocupa la izquierda; en angosta no hay lados, así que el
  cúmulo SUBE (heroLift 0.45) y el nombre va debajo. Póster de fallback
  reubicado y regenerado con el encuadre nuevo.
- Fuera el FD del sol: en la portada la marca es el nombre.
- Verificado: gate 0, `cta.mjs` nuevo (CTA → sección correcta, h1 exacto, cero
  guiones/viñetas), clickable 5/5 x5, touch, anim, smoke, dashcheck, seocheck.
