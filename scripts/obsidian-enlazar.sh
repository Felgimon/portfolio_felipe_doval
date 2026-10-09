#!/usr/bin/env bash
# Enlaza las notas del proyecto (obsidian/Portfolio) dentro de tu vault de
# Obsidian, en Proyectos/Portfolio. Por defecto crea un symlink: las notas
# siguen viviendo en el repo y se actualizan solas con cada `git pull`.
#
# Uso (desde la carpeta del repo, en tu Mac):
#   bash scripts/obsidian-enlazar.sh                 # busca el vault solo
#   bash scripts/obsidian-enlazar.sh "/ruta/al/vault" # o se lo pasás
#   bash scripts/obsidian-enlazar.sh --copiar         # copia en vez de enlazar
#
# Qué toca: crea Proyectos/Portfolio en el vault y, si existe Índice.md,
# le agrega UNA línea "- [[Portfolio]]" (solo si no estaba). Nada más.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
ORIGEN="$REPO/obsidian/Portfolio"
MODO="enlazar"
VAULT=""

for arg in "$@"; do
  case "$arg" in
    --copiar) MODO="copiar" ;;
    *) VAULT="$arg" ;;
  esac
done

es_vault() { [ -d "$1/.obsidian" ]; }

if [ -z "$VAULT" ]; then
  # Lugares típicos en macOS. El vault de Feli se llama "Obsidian" y tiene
  # una carpeta "Proyectos".
  for c in \
    "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian" \
    "$HOME/Documents/Obsidian" \
    "$HOME/Obsidian" \
    "$HOME/Desktop/Obsidian" \
    "$HOME/Library/CloudStorage/"*/Obsidian; do
    if [ -d "$c" ] && es_vault "$c"; then VAULT="$c"; break; fi
  done
fi

if [ -z "$VAULT" ]; then
  # Último recurso: cualquier vault con una carpeta Proyectos (profundidad acotada).
  VAULT="$(find "$HOME/Documents" "$HOME/Library/Mobile Documents" -maxdepth 4 -type d -name .obsidian 2>/dev/null \
    | while read -r d; do v="$(dirname "$d")"; [ -d "$v/Proyectos" ] && echo "$v" && break; done || true)"
fi

if [ -z "$VAULT" ] || ! es_vault "$VAULT"; then
  echo "No encontré el vault. Pasale la ruta: bash scripts/obsidian-enlazar.sh \"/ruta/al/vault\"" >&2
  echo "(En Obsidian: abajo a la izquierda, nombre del vault → Manage vaults → Reveal in Finder.)" >&2
  exit 1
fi

DESTINO="$VAULT/Proyectos/Portfolio"
mkdir -p "$VAULT/Proyectos"

if [ -e "$DESTINO" ] || [ -L "$DESTINO" ]; then
  if [ -L "$DESTINO" ] && [ "$(readlink "$DESTINO")" = "$ORIGEN" ]; then
    echo "Ya estaba enlazado: $DESTINO → $ORIGEN"
  else
    echo "Ya existe $DESTINO y no es este enlace. No lo toco; movelo o borralo y volvé a correr." >&2
    exit 1
  fi
elif [ "$MODO" = "copiar" ]; then
  cp -R "$ORIGEN" "$DESTINO"
  echo "Copiado: $ORIGEN → $DESTINO (para actualizar, volvé a copiar)"
else
  ln -s "$ORIGEN" "$DESTINO"
  echo "Enlazado: $DESTINO → $ORIGEN"
fi

INDICE="$VAULT/Índice.md"
if [ -f "$INDICE" ] && ! grep -q "\[\[Portfolio\]\]" "$INDICE"; then
  printf '\n- [[Portfolio]]\n' >> "$INDICE"
  echo "Agregué - [[Portfolio]] al final de Índice.md"
fi

echo "Listo. Abrí Obsidian: Proyectos → Portfolio."
