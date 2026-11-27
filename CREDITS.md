# CREDITS: assets y licencias

Todo lo que usa el sitio es propio de Felipe o de licencia libre. No hay ningún
asset CC-BY, así que no hay créditos obligatorios en el pie.

## Tipografía

| Fuente | Uso | Licencia |
|---|---|---|
| **Mona Sans** (variable: peso y ancho) | Todo el texto | **SIL OFL 1.1**. GitHub. Vía Google Fonts. |
| **Gloock** | La palabra acentuada de cada título | **SIL OFL 1.1**. Duarte Pinto. Vía Google Fonts. |

`next/font` las baja en el build y las sirve desde el mismo origen. Piazzolla
(v10), Doval Grotesk (v7 a v9) y Doval Script (v6) ya no se usan; las dos
últimas quedan en `brand/tipografia/` con sus licencias.

## Fotos y capturas

- **Felipe** (`public/assets/fotos/`: `apoyado`, `piensa`, `cruzado`,
  `parado`): fotos propias, interinas hasta la sesión de fotos (ver
  `TODO-FELI.md`).
- **Buenos Aires** (`public/assets/fotos/nueve-de-julio.webp`): la avenida 9 de
  Julio y el Obelisco, de **@alschim en Unsplash**
  (`images.unsplash.com/photo-1662393372595-861498121e90`), bajo la
  [licencia de Unsplash](https://unsplash.com/license) (uso libre, sin crédito
  obligatorio).
- **Capturas de proyectos** (`public/assets/proyectos/`): de los proyectos de
  Felipe, tomadas de sus propios repos.
  - `taquion/`: del script de capturas de `taquion-website`.
  - `tableros/`: de `tableros-de-clientes/capturas`, con **datos de
    demostración** (cliente ficticio).
  - `nindo/`: de `Nindo/Docs/img`.

## Logos del stack

`content/stack.ts`: trazos de **Simple Icons** (CC0). Las marcas son de sus
dueños; se usan solo para nombrar la herramienta.

## Íconos

La flecha es propia (`components/ui/Titulo.tsx`). El sol del inicio es un SVG
propio. Los favicons y la imagen para compartir salen del sitio mismo
(`scripts/gen-marca.mjs`).

## Historial de assets retirados

v10: Piazzolla (SIL OFL) y los dibujos de objetos generados con IA. v7 a v9:
Doval Grotesk (derivada de Archivo, SIL OFL), el shader de la gota y el vidrio,
la canción sintetizada, Lucide. v6: Doval Script, Bricolage Grotesque y Spline
Sans Mono (SIL OFL). v5: textura solar de Solar System Scope (CC BY 4.0). v4:
Vía Láctea de ESO (CC BY 4.0). v3: cielo de Poly Haven (CC0). Todo eso vive en
el historial de git.

---

*Si agregás un asset de terceros, sumá acá nombre, autor, URL y licencia. Si es
CC-BY, además agregá el crédito visible en el pie.*
