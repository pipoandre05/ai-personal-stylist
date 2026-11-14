#!/usr/bin/env bash
# estado.sh [linea] — foto del equipo: pausa, línea y su rama, PRs abiertos del equipo, CI de main.
# Solo lectura (el fetch actualiza refs remotas, nada más).
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
L="${ARGS[0]:-1}"; D=$(linea_dir "$L")
git -C "$RAIZ" fetch -q origin 2>/dev/null || echo "AVISO: fetch falló; muestro lo que hay en local"

echo "== Pausa"
[ -e "$PAUSA" ] && echo "EN PAUSA desde $(stat -f '%Sm' "$PAUSA" 2>/dev/null) ($PAUSA)" || echo "activo"

echo "== Línea $L ($D)"
if [ ! -d "$D" ]; then
  echo "NO EXISTE: correr agentes/scripts/preparar-carpetas.sh"
else
  rama=$(rama_de_linea "$L")
  if [ -z "$rama" ]; then
    echo "libre (HEAD suelto en $(git -C "$D" rev-parse --short HEAD))"
  else
    atras=$(git -C "$D" rev-list --count "HEAD..origin/main" 2>/dev/null || echo "?")
    sin=$(git -C "$D" status --porcelain | wc -l | tr -d ' ')
    echo "rama $rama · $atras commits atrás de main · $sin archivos sin commitear"
    id=$(printf '%s' "${rama#equipo/}" | sed -n 's/^\([a-z][a-z0-9]*-[0-9][0-9]*\).*/\1/p')
    [ -n "$id" ] && (cd "$D" && bash agentes/scripts/hilo.sh estado "$id" 2>/dev/null | sed 's/^/  hilo: /')
  fi
fi

echo "== PRs abiertos del equipo"
gh pr list -R "$REPO" --state open --json number,title,headRefName,isDraft,mergeable \
  --jq '.[] | select(.headRefName|startswith("equipo/")) | "#\(.number) \(.headRefName) · \(if .isDraft then "borrador" else "listo" end) · \(.mergeable) · \(.title)"' 2>/dev/null \
  || echo "AVISO: gh no respondió"

echo "== CI de main"
gh run list -R "$REPO" --branch main --limit 1 --json status,conclusion,headSha,displayTitle \
  --jq '.[] | "\(.status) \(.conclusion // "-") · \(.headSha[0:7]) · \(.displayTitle)"' 2>/dev/null || echo "AVISO: gh no respondió"
