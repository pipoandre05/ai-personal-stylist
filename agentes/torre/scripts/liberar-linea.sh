#!/usr/bin/env bash
# liberar-linea.sh [linea] [--ensayo] — tras el merge, deja la línea libre: HEAD suelto en origin/main.
# Solo si la rama de la línea ya no tiene PR abierto y no hay cambios sin commitear.
# No borra la rama local (squash: git no la ve mergeada); la limpieza local la hace Felipe cuando quiera.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
L="${ARGS[0]:-1}"; D=$(linea_dir "$L"); RAMA=$(rama_de_linea "$L")
[ -z "$RAMA" ] && { echo "YA LIBRE: línea $L"; exit 0; }
[ -n "$(git -C "$D" status --porcelain --untracked-files=normal)" ] && no_hecho "hay cambios sin commitear en $D"
abierto=$(gh pr list -R "$REPO" --head "$RAMA" --state open --json number --jq '.[0].number' 2>/dev/null)
[ -n "$abierto" ] && no_hecho "$RAMA todavía tiene el PR #$abierto abierto"
correr git -C "$D" fetch -q origin main || no_hecho "fetch falló"
correr git -C "$D" switch -q --detach origin/main || no_hecho "no pude soltar HEAD en origin/main"
anotar "línea $L" "libre (antes $RAMA)" "git switch --detach origin/main"
echo "HECHO: línea $L libre en origin/main. → SIGUIENTE: Productor elige la próxima historia."
