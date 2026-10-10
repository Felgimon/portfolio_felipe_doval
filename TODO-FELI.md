# TODO-FELI: lo que falta que completes vos

Todo lo que sigue está resuelto en el sitio con algo honesto mientras tanto
(fotos interinas, "FALTA: ..."). El sitio funciona igual; completarlo lo hace
pasar de "muy bueno" a "tuyo de verdad".

Formato: `[ ]` pendiente · `[x]` hecho.

## 🔴 v6: la sesión de fotos (lo más importante)

El rediseño v6 «Visita guiada» te pone de **guía**: en cada parada subís del
líquido, señalás lo que importa y decís una frase. Hoy usa los 4 recortes
viejos como interinos (y por eso hay poses repetidas y nadie señala nada).

- [ ] **Hacer la sesión de fotos** siguiendo el guion completo:
  `obsidian/Portfolio/la-sesion-de-fotos-es-un-guion-no-un-book.md`
  (ropa, luz, cámara, orden de la sesión y las 10 poses con su trabajo).
  Resumen:
  1. **Luz desde la izquierda de la foto** (la luz de todo el sitio).
  2. **Ropa:** buzo liso gris grafito o azul marino + pantalón claro. Nada
     verde, nada blanco, nada negro puro, sin logos ni rayas.
  3. **Pared lisa clara**, a 1,5–2 m. **No** pantalla verde.
  4. Celular en **2x o 3x** desde 3–4 m, **sin modo retrato**.
  5. Las 10 imprescindibles: `saludo`, `apoyado`, `sentado`, `sostiene`,
     `senala`, `camina`, `celular`, `pulgar`, `mira`, `encoge`.
- [ ] **Mandame los originales** nombrados con su id (o recortalos vos con
  "Copiar sujeto" de la Mac y dejalos como PNG en `contenido/guia/<id>.png`).
  Después: `node scripts/gen-guia.mjs` y en `content/guia.ts` cada id apunta a
  su foto.

## 🟡 Ver las notas en Obsidian

- [ ] En la Mac, desde la carpeta del repo (después de `git pull`):
  `bash scripts/obsidian-enlazar.sh`. Crea `Proyectos/Portfolio` en tu vault
  (enlazado al repo: se actualiza solo con cada pull) y agrega
  `- [[Portfolio]]` a tu Índice. Si el vault está en iCloud y lo querés ver en
  el celular: `bash scripts/obsidian-enlazar.sh --copiar`.

## 🟡 La tipografía en Figma

- [ ] Doble clic en `brand/tipografia/DovalScript-Regular.otf` → **Instalar**.
  Reiniciá Figma. Detalle en `brand/tipografia/LEEME.md`.
- La original del screenshot es **Artisan Script de HRDR** (comercial, ~USD 19
  desktop, la web pide otra licencia). Doval Script es propia (derivada de
  Norican, OFL). Si algún día querés la original, comprala y es una línea en
  `lib/fonts.ts`.

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
- [ ] **Las frases de Feli:** leelas en voz alta (`content/guia.ts`). Si alguna
  no suena a vos, cambiala; es una sola frase por parada.
- [ ] **El lima:** en la v2 habías descartado el "lima fluo". En la v6 el lima
  `#78D561` del mood board va como **material** (el líquido iluminado sobre
  blanco), nunca como neón sobre oscuro. Si igual te molesta, se baja.

## 🟡 La palabra que no se nombra, en el historial de git

La palabra de la herramienta de workspace que pediste sacar no aparece en el
sitio ni en ningún archivo del repo (la auditoría lo chequea en cada página).
Pero **los commits viejos la siguen teniendo**. El repo hoy es **privado**, así
que sólo la ve quien tenga acceso. Limpiarla del todo implica reescribir la
historia y hacer force-push (cambian todos los hashes).

- [ ] Decidime: ¿alcanza con el repo privado, o reescribimos la historia?

## 🟢 Opcionales

- [ ] **Medir en tu Mac y en tu celular:** el líquido está calibrado para
  bajar de calidad solo si un equipo no llega (`?stats` en la URL muestra los
  FPS). Si en algún equipo se siente pesado, avisame en cuál.
- [ ] **CV en PDF:** si armás uno, ponelo en `public/` y lo linkeo.
- [ ] **Google Search Console / Bing:** sigue pendiente de la v5 (verificar
  `felipedoval.com`, mandar el sitemap). Ver el historial de este archivo.
- [ ] **Deploy de la v6:** el push a `main` dispara el deploy de Vercel a
  https://felipedoval.com. Si el webhook no lo toma (ya pasó en la v5.10),
  `npx vercel --prod` desde la carpeta del repo. Mirá el sitio en tu celular.
