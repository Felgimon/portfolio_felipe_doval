# Portfolio: Felipe Doval

Sitio personal de **Felipe Doval**, desarrollador full-stack y datos de Buenos
Aires: **https://felipedoval.com**.

## v11 «Celeste y blanco»

Siete secciones, las mismas del portfolio de siempre, una debajo de la otra:
Inicio, Sobre mí, Enfoque, Trabajo, Proyectos, Recorrido y Contacto. Todo el
movimiento sale del scroll y va hacia abajo. Dos letras (Mona Sans y una serif
para la palabra acentuada de cada título) y cuatro colores planos: blanco,
celeste, azul noche y el amarillo del sol.

| Sección | Qué hace el scroll |
|---|---|
| Inicio | Es la bandera: el nombre en la franja blanca y el sol atrás del retrato. El sol gira y la franja se abre hasta ocupar la pantalla |
| Sobre mí | Cuatro datos, el stack en dos cintas de logos que corren en sentidos opuestos y Buenos Aires, que se abre de una ventana a la pantalla entera |
| Enfoque | Cuatro pasos de una línea; el sol baja por la línea y los enciende |
| Trabajo | Lo hecho en Taquion, en tres tarjetas que se apilan |
| Proyectos | Dos columnas que corren a distinta velocidad |
| Recorrido | ORT y Taquion: cada fila se abre con un clic y muestra el detalle |
| Contacto | Mail, GitHub y LinkedIn, del mismo tamaño |

El porqué de cada versión está en [`DECISIONS.md`](./DECISIONS.md) y en las
notas de [`obsidian/Portfolio/`](./obsidian/Portfolio/Portfolio.md).

## Stack

Next.js 16 (App Router, 100% estático) · React 19 · TypeScript strict ·
Tailwind CSS v4 · GSAP (ScrollTrigger) + Lenis · next/font (Mona Sans y
Gloock) · Vercel Analytics.

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `content/` | Todo el texto y los datos, en español e inglés: `perfil`, `proyectos`, `stack`, `ui` |
| `components/secciones/` | Una sección por archivo, con su animación de scroll adentro |
| `app/globals.css` | El sistema visual: colores, la escala de tamaños y el estado final de cada cosa |
| `lib/gsap.ts` | Registro de GSAP y las entradas atadas al scroll |
| `public/assets/` | Fotos y capturas de proyectos |

Con «reducir movimiento» activado no hay fijados: todo se lee de corrido, en
el estado que deja el CSS. El idioma se detecta solo (español o inglés) según
el navegador.

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
