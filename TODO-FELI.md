# TODO-FELI — lo que falta que completes vos

Todo lo que sigue está resuelto en el sitio con un **placeholder honesto**
(bloque punteado con "FALTA: ...") y anotado acá. El sitio funciona igual sin
esto; completarlo lo hace pasar de "muy bueno" a "tuyo de verdad".

Formato: `[ ]` pendiente · `[x]` hecho.

## 🆕 v2 — rediseño «verde agua» + navegación por grafo

El sitio se rediseñó: la home ahora ES el balón-grafo (cada nodo = un tópico;
entrás clickeando un nodo o scrolleando), paleta verde agua, tipografía Bricolage,
sin bullets. Lo que tenés que completar sigue siendo lo de abajo (contenido de
proyectos, capturas, confirmaciones, dominio). Novedades a tener en cuenta:

- **Navegación (v2.1):** clickeás un nodo (o el HUD, o scrolleás) y la **cámara
  se mete al nodo**; el scroll maneja esa animación frame por frame. El balón ya
  se ve animado en cualquier navegador con WebGL (se arregló el bug de Chrome).
  `/?gl=1` sigue existiendo por si querés forzar el canvas.
- **Foto:** ahora se usa `foto_frente.png` en el nodo Perfil con un tratamiento
  verde agua (duotono + grano). Si querés otra, reemplazala en
  `public/assets/foto/` (ver punto "Tu foto" más abajo).
- **La sección "Obras" ahora es el nodo "Trabajo".** Superlum quedó como caso
  principal; FutbolVision pasó a la grilla, presentado como proyecto anterior.
- **Mobile:** validado sin overflow horizontal (360/390/768). El HUD colapsa a
  índices.
- **OG:** la imagen social usa Archivo Black (grotesca bold). Si querés que use
  Bricolage como el resto, avisá (hay que bundlear un TTF estático).

## 🔴 Contenido faltante (genera placeholders visibles)

- [ ] **PC Builder** — falta TODO: descripción de una línea, qué hace, stack y
  features. Es el único proyecto sin descripción. Editá
  `content/proyectos.ts` (slug `pcbuilder`). Repo: `github.com/Felgimon/TP2-ivo`.
- [ ] **Nindo** — falta: género, engine (¿Unity? ¿Godot?), de qué va el juego,
  tu rol específico y el stack. Editá `content/proyectos.ts` (slug `nindo`).
- [ ] **LOST** — falta: qué hace exactamente (¿objetos perdidos? ¿inventario?),
  stack, tu rol y quiénes eran el equipo. Editá `content/proyectos.ts`
  (slug `lost`). ¿El repo es público? Si sí, pegá la URL.

## 🟡 Capturas de proyectos (recomendado, mejoran mucho el sitio)

Tirá 2–4 PNG (1600px+ de ancho) por proyecto en `public/assets/proyectos/<slug>/`
y agregá la ruta en `content/proyectos.ts` (campo `capturas`, sacando
`falta: true`).

- [x] Superlum — 3 capturas: la interfaz, la base de Clientes en galería y el
  panel de administración con el registro de actividad.
- [x] FutbolVision — 2 capturas de predicción (Arsenal vs Sporting CP y
  Manchester United vs Leeds). Si algún día querés, falta una del modelo ML.
- [ ] CourtSide — home con partidos, búsqueda de jugadores, dark mode.
- [x] Buscaminas — 1 captura del tablero en la terminal (los colores ANSI
  quedan muy bien). Su card muestra solo una: los secundarios no tienen página
  de detalle.
- [ ] Nindo — 2–3 de gameplay (o un GIF/video corto, mejor todavía).
- [ ] PC Builder — 2–3 del producto.
- [ ] LOST — 1–2 si tenés.

## 🟡 Tu foto

- [ ] En `contenido/assets/foto/` hay dos: `foto_frente.png` (headshot) y
  `foto_casual.png` (con la camiseta de la Selección). El sitio va a usar la
  frontal con un tratamiento (máscara + grain). **Recomendación del leeme:**
  cropeá para tomar solo tu cuerpo/cara sobre fondo limpio y que quede más
  inmersivo. Si preferís otra foto (mejor luz, fondo simple), reemplazala en
  `public/assets/foto/`. La casual (Selección) encaja tanto con el tema fútbol
  que podríamos usarla — decime.

## 🟡 Confirmaciones

- [ ] **API de FutbolVision:** el sitio dice **Sportmonks** (según tu
  `descripcion.md`). Una nota vieja del repo mencionaba API-Football. ¿Cuál es la
  correcta? (Ver DECISIONS.md.)
- [ ] **Recorrido / timeline:** confirmá el **orden real** y agregá **fechas** de:
  ORT TIC (¿año de egreso?), NASA Space Apps (año), Premios Sadosky (año),
  pasantía en Taquion (período). Editá `content/perfil.ts` (`timeline`).
- [ ] **Hitos de Superlum:** ¿cómo querés contar lo de "presentado en TIC
  Experience" y la "entrevista en TN"? ¿Tenés link o foto de la nota? Editá
  `content/proyectos.ts` (slug `superlum`, `destacados`).
- [ ] **Bios:** leé las dos bios en voz alta (`content/perfil.ts`). Si algo no
  suena a vos, cambialo. Podés sumar edad, año de egreso o adónde apuntás.

## 🟢 Opcionales

- [ ] **Email:** el sitio lo muestra **ofuscado** (anti-scraping), como pediste.
- [ ] **CV en PDF:** no tenés uno. Si armás uno, ponelo en `public/` y avisá para
  linkearlo.
- [ ] **Form de contacto:** no hay form (no configuraste Formspree/Resend). El
  contacto es email (con "copiar") + GitHub + LinkedIn. Si querés un form real,
  configurá Formspree o Resend y avisá.
- [x] **Deploy:** ✅ DEPLOYEADO en tu Vercel (cuenta `felgimon`, proyecto
  `felipe.doval.portfolio`): **https://felipedovalportfolio.vercel.app** (alias:
  https://felipe-doval-portfolio.vercel.app). Vercel no permite puntos en la URL
  (romperían el certificado HTTPS de *.vercel.app). Para deploys futuros:
  `npx vercel --prod` desde la carpeta del proyecto, o conectá el repo de GitHub
  en el dashboard para deploy automático en cada push.
- [x] **Dominio propio:** ✅ **https://felipedoval.com** — comprado en Vercel
  el 12/07/2026 (USD 11,25/año, auto-renovación; expira 12/07/2027) y asignado
  al proyecto: apex + `www` redirigiendo 308. `lib/site.ts` (`siteUrl`) ya
  apunta acá (metadata, OG, sitemap y robots incluidos). Los dominios
  `*.vercel.app` del proyecto siguen funcionando como secundarios.
- [ ] **SEO para que "felipe doval" te encuentre PRIMERO (sin pagar):** el
  sitio ya tiene todo lo técnico (dominio exacto felipedoval.com, JSON-LD de
  Person+WebSite, canonical, sitemap, robots, metadata, H1 con tu nombre).
  Lo que falta lo tenés que hacer VOS porque requiere tus cuentas:
  1. **Google Search Console** (el paso más importante): entrá a
     https://search.google.com/search-console → "Añadir propiedad" →
     "Dominio" → `felipedoval.com`. Te va a dar un registro TXT para
     verificar: agregalo en Vercel (dashboard → Domains → felipedoval.com →
     DNS → Add record, tipo TXT) o pasámelo y lo agrego yo por API. Una vez
     verificado: Sitemaps → enviar `https://felipedoval.com/sitemap.xml`, y
     en "Inspección de URLs" pegá `https://felipedoval.com` → "Solicitar
     indexación". Google suele indexar en horas/días.
  2. **Bing Webmaster Tools** (https://www.bing.com/webmasters): "Importar
     desde Google Search Console" y listo (cubre Bing + DuckDuckGo).
  3. **Backlinks propios** (señal fuerte para la búsqueda del nombre):
     poné `https://felipedoval.com` como sitio web en tu perfil de GitHub
     (Settings → Profile → Website), en LinkedIn (sección Contacto →
     sitio web) y en cualquier bio que tengas (Instagram, X, etc.).
  4. Paciencia: para un nombre propio + dominio exacto + estas señales,
     rankear primero suele tomar de días a un par de semanas.
- [ ] **Lighthouse mobile:** validalo sobre el preview de Vercel (ver
  DECISIONS.md, Fase 9). En local con Chromium por software da bajo el
  Performance mobile, pero desktop da 94 y A11y/BP/SEO 100.
- [ ] **Figma de Superlum:** dejaste acceso a los diseños/logos en Figma. Si
  querés que use algún asset específico de ahí (un logo, una captura), pasame el
  nodo puntual y lo integro.
- [ ] **Easter egg (Konami → pelota con física):** opcional, se evalúa según el
  presupuesto de performance (Fase 7/9). ¿Lo querés?
