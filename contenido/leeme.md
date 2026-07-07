# Carpeta `contenido/` — fuente de verdad del portfolio

Descomprimí este paquete en la **raíz del proyecto** (al lado de donde va a vivir el código). El prompt le indica a Opus que use TODO lo que hay acá y que jamás invente lo que falte.

## Estado

**Ya resuelto (viene en este paquete):**
- Bios corta y larga → `bio.md`
- Descripción de los 7 proyectos → `proyectos/*/descripcion.md`
- Logo completo (monograma FD_, wordmark, favicons, variantes claro/oscuro) → `assets/logo/`
- Tipografías Archivo + licencia OFL → `assets/fuentes/`
- 3 modelos 3D `.glb` con previews y script generador → `assets/modelos-3d/`

**Te toca a vos (⬜):**
- ⬜ Tu foto → `assets/foto/` (specs en el leeme de esa carpeta)
- ⬜ Completar `links.md` (GitHub, LinkedIn, email)
- ⬜ Completar la descripción de PC Builder → `proyectos/pcbuilder/descripcion.md`
- ⬜ Tirar 2–4 capturas PNG dentro de la carpeta de cada proyecto
- ⬜ Leer las bios y los textos y ajustar lo que no suene a vos — están escritos en tu voz, pero la última palabra es tuya

## Estructura

```
contenido/
├── leeme.md            ← este archivo
├── bio.md
├── links.md
├── proyectos/
│   ├── superlum/       descripcion.md + capturas
│   ├── futbolvision/
│   ├── pcbuilder/
│   ├── courtside/
│   ├── lost/
│   ├── nindo/
│   └── buscaminas/
└── assets/
    ├── logo/           PNGs + script generador + leeme
    ├── fuentes/        Archivo (Black + variable) + OFL.txt
    ├── modelos-3d/     3 .glb + previews + script generador + leeme
    ├── foto/           ⬜ tu foto va acá
    └── lotties/        opcional, puede quedar vacía
```
