# TODO-FELI: lo que falta que completes vos

Todo lo que sigue está resuelto en el sitio con algo honesto mientras tanto
(fotos interinas, "FALTA: ..."). El sitio funciona igual; completarlo lo hace
pasar de "muy bueno" a "tuyo de verdad".

Formato: `[ ]` pendiente · `[x]` hecho.

## 🔴 La sesión de fotos (lo más importante)

En la v7 Feli **no habla**: tus fotos te acompañan mientras se navega, una
por sección (Inicio, Perfil, Recorrido, Contacto y el 404). Hoy usa los 4
recortes viejos como interinos, y por eso el 404 repite la de Recorrido.

- [ ] **Hacer la sesión de fotos** siguiendo el guion:
  `obsidian/Portfolio/la-sesion-de-fotos-es-un-guion-no-un-book.md`
  (actualizado para la v7). Resumen:
  1. **Luz desde la izquierda de la foto** (la luz de todo el sitio).
  2. **Ropa:** buzo o remera lisa **gris grafito, crema o tostado** + pantalón
     claro. **Nada azul ni cobalto** (se pierde contra el fondo del sitio),
     nada blanco puro, nada negro puro, sin logos ni rayas.
  3. **Pared lisa clara**, a 1,5–2 m. **No** pantalla verde ni azul.
  4. Celular en **2x o 3x** desde 3–4 m, **sin modo retrato**.
  5. Las 5 imprescindibles (ver `content/guia.ts`): `inicio` (de frente,
     apoyado en los antebrazos), `perfil` (sentado, mano en el mentón),
     `recorrido` (de perfil, cuerpo entero, caminando), `contacto` (tres
     cuartos, brazos cruzados) y `perdida` (encogido de hombros, palmas
     arriba).
- [ ] **Mandame los originales** (o recortalos con "Copiar sujeto" de la Mac y
  dejalos como PNG en `contenido/guia/<nombre>.png`). Después:
  `node scripts/gen-guia.mjs` y en `content/guia.ts` cada pose apunta a su
  archivo.

## 🟢 Los cianotipos del fondo (opcional)

Los seis fondos (auriculares, lupa, teclas, zapatillas, tazas, mapa) están
generados con IA: son objetos "de cualquiera". Si querés que sean tuyos:

- [ ] Sacá fotos **cenitales** (desde arriba, a 90°) de tus cosas sobre una mesa
  lisa, ordenadas como en los de ahora (todo alineado, cables enrollados), o
  hacé cianotipos de verdad (un kit de papel cianotipo cuesta poco y es un
  plan lindo). Dejalos como JPG en `brand/cianotipos/<nombre>.jpg` (mismos
  nombres: musica, curiosidad, herramientas, movimiento, gente, mapa) y corré
  `node scripts/gen-cianotipos.mjs`.

## 🟡 Ver las notas en Obsidian

- [ ] En la Mac, desde la carpeta del repo (después de `git pull`):
  `bash scripts/obsidian-enlazar.sh`. Crea `Proyectos/Portfolio` en tu vault
  (enlazado al repo: se actualiza solo con cada pull) y agrega
  `- [[Portfolio]]` a tu Índice. Si el vault está en iCloud y lo querés ver en
  el celular: `bash scripts/obsidian-enlazar.sh --copiar`.

## 🟡 La tipografía en Figma

- [ ] Doble clic en `brand/tipografia/doval-grotesk/DovalGrotesk.ttf` →
  **Instalar**. Reiniciá Figma: aparece *Doval Grotesk* con 54 estilos (de
  *ExtraCondensed Thin* a *Expanded Black*). Por qué esta fuente y no las
  otras cuatro: `brand/tipografia/LEEME.md`.
- El diseño final está en el Figma *Mood Board Portfolio*, página
  **Diseño v7** (sistema + 7 secciones en desktop y mobile). El texto editable
  usa Archivo (mismos contornos) y los títulos van en contornos; con la fuente
  instalada se pueden pasar a Doval Grotesk.

## 🔴 Contenido faltante (genera placeholders visibles)

- [ ] **PC Builder:** falta descripción, qué hace, stack y features
  (`content/proyectos.ts`, slug `pcbuilder`). Repo: `github.com/Felgimon/TP2-ivo`.
- [ ] **Nindo:** falta género, engine, de qué va, tu rol y el stack
  (`content/proyectos.ts`, slug `nindo`).
- [ ] **LOST:** falta qué hace exactamente, stack, tu rol y el equipo
  (`content/proyectos.ts`, slug `lost`).

## 🟡 Capturas de proyectos

En `public/assets/proyectos/<slug>/` y la ruta en `content/proyectos.ts`
(`capturas`).

- [x] Superlum, FutbolVision, CourtSide, Buscaminas, PC Builder, LOST, Nindo
  (una cada uno).
- [ ] Nindo: 2–3 de gameplay (o un GIF/video corto).
- [ ] Revisá las capturas de Superlum: `superlum-clientes.png` muestra marcas
  de clientes reales y `superlum-admin-actividad.png` tiene datos de prueba con
  nombres de empresas. ¿Las dejamos?

## 🟡 Confirmaciones

- [ ] **API de FutbolVision:** el sitio dice **Sportmonks**. Una nota vieja
  mencionaba API-Football. ¿Cuál es?
- [ ] **Recorrido:** el sitio muestra "FALTA: período" en la pasantía. Pasame
  fechas reales (ORT: ¿año de egreso?; Taquion: ¿de cuándo a cuándo?).
  `content/perfil.ts` → `timeline`.
- [ ] **Hitos de Superlum:** "presentado en TIC Experience" y la "entrevista en
  TN". ¿Tenés link o foto? Si no se puede respaldar, lo saco.
- [ ] **El panel "Ahora"** del inicio dice "Construyendo Superlum, un
  workspace operativo a medida para una empresa real." (`content/ui.ts`).
  ¿Así está bien?

## 🟡 La palabra que no se nombra, en el historial de git

La palabra de la herramienta de workspace que pediste sacar no aparece en el
sitio ni en ningún archivo del repo (la auditoría lo chequea en cada página).
Pero **los commits viejos la siguen teniendo**. El repo hoy es **privado**, así
que sólo la ve quien tenga acceso. Limpiarla del todo implica reescribir la
historia y hacer force-push (cambian todos los hashes).

- [ ] Decidime: ¿alcanza con el repo privado, o reescribimos la historia?

## 🟢 Opcionales

- [ ] **Medir en tu Mac y en tu celular:** la gota es raymarching y baja de
  calidad sola si un equipo no llega (`?stats` en la URL muestra los FPS). Si
  en algún equipo se siente pesado, avisame en cuál.
- [ ] **CV en PDF:** si armás uno, ponelo en `public/` y lo linkeo.
- [ ] **Google Search Console / Bing:** sigue pendiente de la v5 (verificar
  `felipedoval.com`, mandar el sitemap). Ver el historial de este archivo.
- [ ] **Deploy de la v7:** el push a `main` dispara el deploy de Vercel a
  https://felipedoval.com. Si el webhook no lo toma (ya pasó en la v5.10),
  `npx vercel --prod` desde la carpeta del repo. Mirá el sitio en tu celular.
