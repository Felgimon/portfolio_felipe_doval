# TODO-FELI: lo que falta que completes vos

Todo lo que sigue está resuelto en el sitio con algo honesto mientras tanto
(fotos interinas, "FALTA: ..."). El sitio funciona igual; completarlo lo hace
pasar de "muy bueno" a "tuyo de verdad".

Formato: `[ ]` pendiente · `[x]` hecho.

## 🔴 Fotos tuyas (lo más importante)

La sección **Fotos** hoy tiene cuatro fotos tuyas (tres recortes con el mismo
buzo y la del espejo) y cinco dibujos de objetos del sitio anterior, que son
ilustrativos. Con fotos de verdad pasa a ser tuya.

- [ ] Mandame entre 8 y 12 fotos: vos, tus lugares, lo que hacés (jugando al
  básquet, en ORT, con amigos, viajes, tu escritorio). Verticales y
  horizontales mezcladas.
- Para sumarlas vos: el archivo en `public/assets/fotos/` y una entrada en
  `content/fotos.ts` (ahí se explica cada campo).
- [ ] La foto del inicio (`apoyado`) es un recorte interino. Si hacés una
  mejor, de frente y con buena luz, reemplaza a esa.

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
- [ ] **Recorrido:** faltan las fechas. Pasame
  fechas reales (ORT: ¿año de egreso?; Taquion: ¿de cuándo a cuándo?).
  `content/perfil.ts` → `recorrido`.
- [ ] **Hitos de Superlum:** "presentado en TIC Experience" y la "entrevista en
  TN". ¿Tenés link o foto? Si no se puede respaldar, lo saco.

## 🟡 La palabra que no se nombra, en el historial de git

No aparece en el sitio ni en ningún archivo del repo, pero los commits viejos
la siguen teniendo. El repo es privado.

- [ ] Decidime: ¿alcanza con el repo privado, o reescribimos la historia?

## 🟢 Opcionales

- [ ] **CV en PDF:** si armás uno, ponelo en `public/` y lo linkeo.
- [ ] **Google Search Console / Bing:** verificar `felipedoval.com` y mandar el
  sitemap.
