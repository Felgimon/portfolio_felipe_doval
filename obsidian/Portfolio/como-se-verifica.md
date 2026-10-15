---
proyecto: "[[Portfolio]]"
tipo: referencia
fecha: 2026-10-09
---
# Cómo se verifica

Antes de cada push a `main` (que deploya a felipedoval.com):

```bash
npm run gate                 # typecheck + lint + build
npm run smoke                # abre las páginas y falla si hay errores de consola
node scripts/audit.mjs       # la auditoría de riesgo (36 chequeos)
node scripts/idioma.mjs      # español/inglés automático, sin errores de hidratación
node scripts/touch.mjs       # el celular de verdad (393×659)
node scripts/anim.mjs        # la gota ondula (y no con reducir movimiento)
node scripts/perf.ts         # frame time por sección (sólo comparativo)
```

En una máquina sin GPU (un contenedor, una VM): `GL_SOFT=1` para WebGL por
software, y `PW_CHROMIUM=/ruta/al/chrome` si Playwright trae otra revisión de
Chromium. En la Mac no hace falta nada.

Cuando cambia lo visual, regenerar:

```bash
node scripts/gen-og.mjs        # la imagen al compartir el link
node scripts/gen-favicons.mjs  # la F en Doval Grotesk sobre cobalto
node scripts/gen-guia.mjs      # las fotos de Feli
```

Y lo más importante, que ningún test reemplaza: **mirarlo**. En la Mac, en el
celular, con el mouse y con el dedo.
