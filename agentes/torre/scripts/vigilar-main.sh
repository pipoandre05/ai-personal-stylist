#!/usr/bin/env bash
# vigilar-main.sh — ¿la CI de main está verde después del último merge? Solo lectura.
# Salida: VERDE | CORRIENDO | ROJO (con el PR que lo causó si el commit es un squash "… (#N)").
# Código: 0 verde · 1 corriendo · 4 rojo · 2 no se pudo leer.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
J=$(gh run list -R "$REPO" --branch main --workflow ci --limit 1 --json status,conclusion,headSha,displayTitle 2>/dev/null) || { echo "NO PUDE LEER la CI de main"; exit 2; }
[ "$(jq 'length' <<<"$J")" = "0" ] && { echo "SIN CORRIDAS: el último merge no tocó web/ (la CI no corre); nada que vigilar."; exit 0; }
st=$(jq -r '.[0].status' <<<"$J"); co=$(jq -r '.[0].conclusion // ""' <<<"$J")
sha=$(jq -r '.[0].headSha' <<<"$J"); tit=$(jq -r '.[0].displayTitle' <<<"$J")
pr=$(printf '%s' "$tit" | sed -n 's/.*(#\([0-9][0-9]*\))$/\1/p')
if [ "$st" != "completed" ]; then echo "CORRIENDO: ${sha:0:7} $tit"; exit 1; fi
case "$co" in
  success) echo "VERDE: ${sha:0:7} $tit"; exit 0 ;;
  *) echo "ROJO ($co): ${sha:0:7} $tit${pr:+ → revertir.sh $pr y avisar a Productor}"; anotar "main" "CI roja en ${sha:0:7}" "vigilar-main.sh"; exit 4 ;;
esac
