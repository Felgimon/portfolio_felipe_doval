---
proyecto: "[[Portfolio]]"
tipo: bug arreglado
fecha: 2026-10-09
---
# El mail ya no viaja en el HTML

Felipe pidió el mail **ofuscado** (anti-scraping). En la v5 no lo estaba:

1. El componente armaba la dirección **durante el render**, y como la sección
   de Contacto se prerenderiza en el server, el HTML estático la traía escrita
   en texto plano. Cualquier scraper que lea HTML la tenía.
2. Además estaba entera en `content/perfil.ts`, que viaja en el bundle de JS.

Ahora la dirección **no existe en ningún archivo**: el botón "Copiar mi mail"
la arma recién en el clic, desde partes sueltas. La auditoría
(`scripts/audit.mjs`) verifica que no aparezca en el HTML de ninguna página.

Bonus: al copiarla, Feli lo comenta en su globo ("Copiado. Te leo cuando me
escribas.") y cambia a la pose de pulgar arriba.
