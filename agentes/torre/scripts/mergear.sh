#!/usr/bin/env bash
# mergear.sh <pr> [--ensayo] — mergea con squash SOLO si condiciones-merge.sh dice OK.
# Sin etiqueta humana: las condiciones objetivas reemplazan a torre:aprobado (DP-21).
# El freno reconoce este script por su nombre y vuelve a correr las condiciones antes
# de dejarlo empezar; aquí se corren otra vez justo antes del merge.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
PR="${ARGS[0]:-}"; PR="${PR#\#}"
case "$PR" in ''|*[!0-9]*) no_hecho "uso: mergear.sh <número de PR> [--ensayo]";; esac
en_pausa
COND="$(scripts_repo)/condiciones-merge.sh"
[ -f "$COND" ] || no_hecho "no encuentro $COND (¿el clon de la Torre está en main al día?)"
if ! salida=$(bash "$COND" "$PR" --repo "$RAIZ" 2>&1); then
  no_hecho "$salida"
fi
TITULO=$(gh pr view "$PR" -R "$REPO" --json title --jq .title 2>/dev/null) || no_hecho "no leo el título de #$PR"
OID=$(gh pr view "$PR" -R "$REPO" --json headRefOid --jq .headRefOid 2>/dev/null) || no_hecho "no leo el sha de #$PR"
# --match-head-commit: si alguien empujó entre la verificación y el merge, GitHub lo rechaza.
correr gh pr merge "$PR" -R "$REPO" --squash --delete-branch --match-head-commit "$OID" --subject "$TITULO (#$PR)" \
  || no_hecho "gh pr merge falló en #$PR"
anotar "#$PR" "MERGEADO a main (squash) por condiciones" "gh pr merge $PR --squash"
echo "HECHO: #$PR mergeado a main con squash. → SIGUIENTE: vigilar-main.sh (si la CI de main se pone roja: revertir.sh $PR) y liberar-linea.sh."
