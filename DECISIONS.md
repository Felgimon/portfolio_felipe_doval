# DECISIONS.md — bitácora de decisiones

Registro de las decisiones no triviales del proyecto (diseño, arquitectura,
dependencias y bugs). Se actualiza en cada fase.

> La sección **v3.3.0** es la vigente. Debajo quedan v3.2, v3.1, v3.0, v2.x y
> la v1 como registro histórico.

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
