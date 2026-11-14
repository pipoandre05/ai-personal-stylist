#!/usr/bin/env bash
# actualizar-rama.sh [linea] [--ensayo] — trae origin/main a la rama de la línea por MERGE (nunca rebase).
# Si hay conflicto, aborta el merge y devuelve el trabajo al Constructor: la Torre no resuelve conflictos.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
L="${ARGS[0]:-1}"; D=$(linea_dir "$L"); RAMA=$(rama_de_linea "$L")
[ -z "$RAMA" ] && no_hecho "la línea $L está libre: no hay rama que actualizar"
case "$RAMA" in equipo/*) ;; *) no_hecho "la línea $L tiene '$RAMA', que no es del equipo";; esac
[ -n "$(git -C "$D" status --porcelain --untracked-files=no)" ] && no_hecho "hay cambios sin commitear en $D: el Constructor está trabajando, no lo piso"
correr git -C "$D" fetch -q origin main || no_hecho "fetch falló"
atras=$(git -C "$D" rev-list --count "HEAD..origin/main")
[ "$atras" = "0" ] && { echo "AL DÍA: $RAMA no está atrás de main."; exit 0; }
if ! correr git -C "$D" merge --no-edit -q origin/main; then
  correr git -C "$D" merge --abort
  no_hecho "merge de main en $RAMA con conflictos: lo aborté. → Constructor resuelve (merge, nunca rebase) y vuelve a pedir veredictos."
fi
correr git -C "$D" push -q origin "$RAMA" || no_hecho "no pude empujar $RAMA"
anotar "$RAMA" "al día con main (merge de $atras commits)" "git merge origin/main"
echo "HECHO: $RAMA al día con main (merge limpio de $atras commits; los veredictos siguen valiendo)."
