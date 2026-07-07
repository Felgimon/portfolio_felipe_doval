# Modelos 3D (.glb) — generados proceduralmente, licencia CC0 (son tuyos)

Los tres se generaron con el script incluido (`generar_modelos.py`, trimesh). Sin descargas, sin atribuciones pendientes, radio normalizado ≈ 1, listos para `gltfjsx`.

| Archivo | Qué es | Para qué sirve |
|---|---|---|
| `pelota-facetada.glb` | Icosaedro truncado (60 vértices, 90 aristas): la geometría exacta del balón de fútbol clásico | Hero object sólido; brilla con `flatShading` o materiales de vidrio/transmission |
| `pelota-estructura.glb` | El mismo poliedro como red de nodos y struts | **El candidato para el hero**: lee como fútbol × red neuronal — FutbolVision hecho forma |
| `esfera-lowpoly.glb` | Icoesfera facetada (162 vértices) | Alternativa abstracta / objeto secundario |

`previews/` tiene un render de cada uno para verlos sin abrir nada.

**Para Opus:**
- Pipeline: `npx gltfjsx <modelo>.glb --transform --types` → componente tipado + compresión.
- La geometría es deliberadamente neutra: el carácter lo ponen materiales, luces y shaders (tu fortaleza). Ideas: wireframe + bloom sutil sobre `pelota-estructura`, MeshTransmissionMaterial sobre `pelota-facetada`, rotación lenta + parallax de mouse con lerp.
- Son livianos (3–140 KB): no hace falta Draco, pero `--transform` no molesta.

**Opcional a futuro (Feli):** si querés algo más elaborado, las rutas Spline (spline.design → export React/.glb) o Sketchfab/Poly Haven (CC0/CC-BY, guardando licencias en CREDITS.md) siguen abiertas — estos tres garantizan que el proyecto arranca hoy sin depender de eso.
