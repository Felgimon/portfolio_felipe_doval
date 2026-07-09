# DECISIONS.md — bitácora de decisiones

Registro de las decisiones no triviales del proyecto (diseño, arquitectura,
dependencias y bugs). Se actualiza en cada fase.

> La sección **v2.1** es la vigente. Debajo quedan v2.0.0 y la v1 como registro.

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
| detect-gpu | 5.0.70 | degradación por hardware |
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
- **Degradación:**
  - reduced-motion → **poster estático** (render real del balón).
  - GPU tier < 2 / sin WebGL (detect-gpu) → poster.
  - mientras detecta GPU → ink (no se carga el poster en dispositivos capaces).
  - dpr capado a `[1,2]` (tier 3) / `[1,1.5]` (menor).
  - Override de debug `?forcegl=1` para forzar el 3D en testing/headless.
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
