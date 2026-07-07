# DECISIONS.md — bitácora de decisiones

Registro de las decisiones no triviales del proyecto (diseño, arquitectura,
dependencias y bugs). Se actualiza en cada fase.

---

## Dirección de diseño

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
