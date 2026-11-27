# Portfolio: Felipe Doval

Sitio personal de **Felipe Doval**, desarrollador full-stack y datos de Buenos
Aires: **https://felipedoval.com**.

## v10 «Amarillo taxi»

Un recorrido que mueve el scroll. Cinco secciones con nombre directo (Inicio,
Proyectos, Fotos, Sobre mí, Contacto), cada una un campo entero de un color
plano: amarillo, tinta, papel y rojo. Una sola letra, **Piazzolla**, de la
hairline cursiva a la negra; los títulos engordan mientras suben por la
pantalla y la cursiva se inclina con la velocidad del scroll.

| Sección | Qué hace el scroll |
|---|---|
| Inicio | El nombre queda fijo: el peso pasa de «Felipe» a «Doval» mientras se separan, y Proyectos sube y lo tapa |
| Proyectos | Un carril horizontal: el scroll vertical mueve la pista y cada captura se destapa al entrar |
| Fotos | La palabra queda fija y las fotos pasan por delante, cada una a su velocidad |
| Sobre mí | El texto se entinta palabra por palabra, Buenos Aires se abre de una ventana a la pantalla entera y el stack corre en dos cintas opuestas |
| Contacto | Tres filas enormes que engordan al pasar; la del mail lo copia |

El porqué de cada versión está en [`DECISIONS.md`](./DECISIONS.md) y en las
notas de [`obsidian/Portfolio/`](./obsidian/Portfolio/Portfolio.md).

## Stack

Next.js 16 (App Router, 100% estático) · React 19 · TypeScript strict ·
Tailwind CSS v4 · GSAP (ScrollTrigger) + Lenis · next/font (Piazzolla,
variable) · Vercel Analytics.

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `content/` | Todo el texto y los datos, en español e inglés: `perfil`, `proyectos`, `fotos`, `ui` |
| `components/secciones/` | Una sección por archivo, con su animación de scroll adentro |
| `app/globals.css` | El sistema visual: colores, letra y el estado final de cada cosa |
| `lib/gsap.ts` | Registro de GSAP y los dos helpers de movimiento |
| `public/assets/` | Fotos y capturas de proyectos |

Con «reducir movimiento» activado no hay fijados ni carril: todo se lee de
corrido, en el estado que deja el CSS. El idioma se detecta solo (español o
inglés) según el navegador.

## Setup

Node.js 22 o más nuevo, y npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run gate` | Typecheck, lint y build: lo que tiene que pasar antes de subir |
| `npm run marca` | Regenera la imagen para compartir y los favicons (después de `npm run build`) |

El push a `main` publica en Vercel.
