#!/usr/bin/env bash
# _comun.sh — se hace `source` desde cada script de la Torre. Rutas, ensayo, bitácora.
# Compatible con bash 3.2. Todo lo que muta git o GitHub pasa por `correr`, así
# --ensayo (último argumento) no cambia nada.
#
# Carpetas (plan 2026-11-14-equipo-mausbot §9):
#   $RAIZ                       clon ai-personal-stylist-torre, siempre en main (Productor, DevOps)
#   $(linea_dir 1)              worktree ai-personal-stylist-linea-1 de ese clon (Diseño, Constructor, Revisor, QA)
# Una línea lleva UNA rama a la vez; libre = HEAD suelto en origin/main.
# TORRE_RAIZ / TORRE_LINEAS_BASE / TORRE_REPO solo para pruebas.
RAIZ="${TORRE_RAIZ:-/Users/pipoandre/Documents/claude.nosync/ai-personal-stylist-torre}"
LINEAS_BASE="${TORRE_LINEAS_BASE:-$(dirname "$RAIZ")}"
REPO="${TORRE_REPO:-pipoandre05/ai-personal-stylist}"
BITACORA="$RAIZ/.torre/bitacora.md"
PAUSA="$RAIZ/.torre/PAUSA"
ACCION="$(basename "${BASH_SOURCE[1]:-$0}" .sh)"

ENSAYO=0
if [ $# -gt 0 ] && [ "${@: -1}" = "--ensayo" ]; then ENSAYO=1; set -- "${@:1:$(($#-1))}"; fi
ARGS=("$@")

linea_dir() { echo "$LINEAS_BASE/ai-personal-stylist-linea-${1:-1}"; }
scripts_repo() { echo "$RAIZ/agentes/scripts"; }   # frontera, condiciones e hilo: versionados en main

anotar() { # anotar <objeto> <resultado> <comando>
  local marca=""; [ "$ENSAYO" -eq 1 ] && marca=" (ensayo)"
  mkdir -p "$(dirname "$BITACORA")" 2>/dev/null
  printf '%s · %s%s · %s · %s · %s\n' "$(TZ=America/Santiago date '+%Y-%m-%d %H:%M')" "$ACCION" "$marca" "$1" "$2" "$3" >> "$BITACORA"
}
correr() { if [ "$ENSAYO" -eq 1 ]; then echo "ENSAYO: $*"; return 0; fi; "$@"; }
no_hecho() { echo "NO HECHO: $1" >&2; anotar "${ARGS[0]:--}" "NO HECHO: $1" "-"; exit 3; }
en_pausa() { [ -e "$PAUSA" ] && no_hecho "el equipo está en pausa ($PAUSA). Felipe la levanta borrando ese archivo."; }

rama_de_linea() { git -C "$(linea_dir "${1:-1}")" symbolic-ref --quiet --short HEAD 2>/dev/null; }
linea_libre() { # 0 si la línea tiene HEAD suelto y nada sin commitear
  local d; d=$(linea_dir "${1:-1}")
  [ -d "$d" ] || return 1
  [ -z "$(rama_de_linea "$1")" ] && [ -z "$(git -C "$d" status --porcelain --untracked-files=normal 2>/dev/null)" ]
}
