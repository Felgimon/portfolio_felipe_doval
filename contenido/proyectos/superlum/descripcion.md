# Superlum

**Una línea:** workspace operativo a medida que reemplazó a Notion en la operación diaria de una empresa real.

**Contexto / problema:** Taquion manejaba toda su operación en Notion: flexible, pero genérico. Faltaba estructura propia, permisos finos por cliente y flujos pensados para cómo trabaja la empresa de verdad. Después de mi pasantía ahí (automatización con n8n y workflows de Notion), la propuesta fue construirles su propia herramienta.

**Qué hace:** centraliza la operación de Taquion en un workspace propio: gestión de clientes y proyectos con un modelo de acceso por cliente con scoping a nivel de fila (default-deny: nadie ve nada que no le corresponda), y un sistema de agentes para validación de features y consistencia de diseño. Cliente referente: Sergio Doval, CEO de Taquion.

**Stack:** Next.js, React, TypeScript, Prisma (SQLite en desarrollo, Supabase/PostgreSQL en producción).

**Mi rol:** diseño y desarrollo full-stack de punta a punta — arquitectura, modelado de datos, UX y marketing del producto.

**Hitos:** presentado en TIC Experience; entrevista en TN sobre el proyecto. *TODO(FELI): confirmá cómo querés contar estos dos hitos y si tenés link o foto de la nota.*

**Links:** TODO(El repositorio es privado)

**Capturas:** ⬜ poné acá 3–4 PNG (1600px+ de ancho): dashboard, vista de cliente, algo del sistema de permisos. Nombres descriptivos tipo `superlum-dashboard.png`.

**Ángulo para el sitio:** cliente real + producto en uso. Es EL case study fuerte: problema → decisión de arquitectura (row-level default-deny) → resultado.
