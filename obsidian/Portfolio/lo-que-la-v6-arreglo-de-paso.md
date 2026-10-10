---
proyecto: "[[Portfolio]]"
tipo: bugs arreglados
fecha: 2026-10-09
---
# Lo que la v6 arregló de paso

Antes de rediseñar se auditó la v5 entera. Además de cambiar todo el look, la
v6 arregla bugs reales que tenía (todos verificados):

| Bug de la v5 | Qué pasaba | Cómo quedó |
|---|---|---|
| Preloader trabado | Entrar directo a `/proyectos/superlum`, esperar 3 s y tocar "Volver" dejaba la home tapada para siempre | El preloader no existe: el contenido aparece al instante y el líquido entra con un fundido |
| Mail en el HTML | Ver [[el-mail-ya-no-viaja-en-el-html]] | Se arma en el clic |
| Sin `<main>` | Ni la home ni los casos tenían el landmark principal | Todas las páginas tienen `<main id="contenido">` |
| "Saltar al contenido" roto | Apuntaba a `#inicio`, que no existía en los casos; y estaba sólo en español | Apunta a `#contenido` (existe siempre) y se traduce |
| Foco perdido | Navegar con el teclado no movía el foco: Tab volvía a la nav | El foco pasa al título de la parada |
| Secciones sin link | La nav eran botones: no se podía compartir `/#trabajo` ni volver con Atrás | Son anclas de verdad |
| Casos compartidos como la home | Un link a un caso mostraba la tarjeta de la portada | Cada caso tiene su Open Graph |
| 404 con el nombre dos veces | "… · Felipe Doval \| Felipe Doval" | "Parada perdida \| Felipe Doval" |
| Año del footer | Se horneaba en el build: el 1 de enero sin deploy, error de hidratación | Ya no rompe |
| Konami más rápido a 120 Hz | La física avanzaba por cuadro, no por tiempo | Por tiempo |
| Scripts de test colgados en Mac | Cortaban el server con `taskkill` (sólo Windows) | Helper común en `scripts/lib/servidor.mjs` |

También se fue el peso muerto: three.js, react-three, postprocessing y motion
(el líquido es WebGL crudo), la textura del sol, el póster viejo, los modelos
3D y la fuente Archivo. `public/` pasó de 5,9 MB a 1,6 MB.
