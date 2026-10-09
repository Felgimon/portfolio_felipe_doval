---
proyecto: "[[Portfolio]]"
tipo: proceso
fecha: 2026-10-09
---
# Las notas viven en el repo

Este proyecto lo trabajó Claude desde una **sesión en la nube** (un contenedor
con el repo clonado), no desde la Mac. Desde ahí no hay forma de escribir
directo en el vault de Obsidian, que vive en la Mac.

La solución: las notas están en `obsidian/Portfolio/` **dentro del repo** y se
enlazan al vault con un symlink:

```bash
# en la Mac, desde la carpeta del repo (después de git pull)
bash scripts/obsidian-enlazar.sh
```

El script busca el vault (iCloud, Documents, Home), crea
`Proyectos/Portfolio → <repo>/obsidian/Portfolio` y agrega `- [[Portfolio]]` a
[[Índice]] si no estaba. Con el symlink, cada `git pull` actualiza las notas
solas. Si preferís una copia quieta: `--copiar`.

Ojo: si el vault está en iCloud, el symlink funciona en esta Mac pero **no se
sincroniza** a otros dispositivos (iCloud no sigue symlinks). Para verlo en el
celular, usá `--copiar`.
