#!/usr/bin/env bash
# revertir.sh <pr> [--ensayo] — main quedó roja por el PR <pr> del equipo: lo revierte con git revert.
#
# Camino de emergencia, sin veredictos de Revisor ni QA (deshacer no agrega código nuevo):
#   1. el PR <pr> está mergeado, venía de una rama equipo/* y su squash es el commit que se revierte;
#   2. rama equipo/revert-<pr> desde origin/main en un worktree temporal del clon de la Torre;
#   3. `git revert --no-edit <squash>` LIMPIO (si choca, aborta y escala a Felipe);
#   4. el diff de la rama es exactamente el inverso del squash (patch-id) y respeta la frontera;
#   5. PR, espera la CI (máx. 20 min), y si queda verde: squash merge. Si no, lo deja abierto y escala.
# Nunca reescribe historia ni fuerza nada. Avisar a Productor con el resultado es parte del paso.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
PR="${ARGS[0]:-}"; PR="${PR#\#}"
case "$PR" in ''|*[!0-9]*) no_hecho "uso: revertir.sh <número de PR> [--ensayo]";; esac
INFO=$(gh pr view "$PR" -R "$REPO" --json state,headRefName,mergeCommit,title 2>/dev/null) || no_hecho "no leo #$PR"
[ "$(jq -r .state <<<"$INFO")" = "MERGED" ] || no_hecho "#$PR no está mergeado"
case "$(jq -r .headRefName <<<"$INFO")" in equipo/*) ;; *) no_hecho "#$PR no es del equipo: el revert lo decide Felipe";; esac
SQ=$(jq -r '.mergeCommit.oid // ""' <<<"$INFO"); [ -z "$SQ" ] && no_hecho "#$PR no tiene commit de merge"
RAMA="equipo/revert-$PR"
git -C "$RAIZ" fetch -q origin main || no_hecho "fetch falló"
git -C "$RAIZ" merge-base --is-ancestor "$SQ" origin/main || no_hecho "el squash ${SQ:0:7} no está en main"
TMP=$(mktemp -d "${TMPDIR:-/tmp}/revert-$PR.XXXXXX")
limpiar() { git -C "$RAIZ" worktree remove --force "$TMP" >/dev/null 2>&1; rm -rf "$TMP"; }
trap limpiar EXIT
if [ "$ENSAYO" -eq 1 ]; then
  echo "ENSAYO: worktree temporal, git switch -c $RAMA origin/main, git revert --no-edit ${SQ:0:7}, verificaciones, push, PR, CI, merge"
  exit 0
fi
git -C "$RAIZ" worktree add -q --detach "$TMP" origin/main || no_hecho "no pude crear el worktree temporal"
git -C "$TMP" switch -q -c "$RAMA" || no_hecho "no pude crear $RAMA"
if ! git -C "$TMP" revert --no-edit "$SQ" >/dev/null 2>&1; then
  git -C "$TMP" revert --abort >/dev/null 2>&1
  no_hecho "el revert de ${SQ:0:7} choca con lo que entró después: ESCALAR a Felipe (main sigue roja)"
fi
a=$(git -C "$TMP" diff "$SQ" "$SQ^" | git patch-id --stable | cut -d' ' -f1)
b=$(git -C "$TMP" diff origin/main HEAD | git patch-id --stable | cut -d' ' -f1)
[ -n "$a" ] && [ "$a" = "$b" ] || no_hecho "el revert no es el inverso exacto del squash; no sigo"
bash "$TMP/agentes/scripts/verificar-frontera.sh" --repo "$TMP" "origin/main...HEAD" >/dev/null || no_hecho "el revert toca rutas fuera de la frontera"
git -C "$TMP" push -q -u origin "$RAMA" || no_hecho "no pude empujar $RAMA"
URL=$(gh pr create -R "$REPO" --base main --head "$RAMA" --title "Revert: $(jq -r .title <<<"$INFO") (#$PR)" \
  --body "CI de main roja tras #$PR. Revert exacto del squash ${SQ:0:7} por DevOps (DP-21). La historia vuelve al Constructor." 2>/dev/null) || no_hecho "gh pr create falló"
N=$(printf '%s' "$URL" | sed -n 's#.*/pull/\([0-9][0-9]*\).*#\1#p')
gh pr checks "$N" -R "$REPO" --watch --interval 30 >/dev/null 2>&1 &
w=$!; s=0; while kill -0 "$w" 2>/dev/null && [ "$s" -lt 1200 ]; do sleep 10; s=$((s+10)); done
kill "$w" 2>/dev/null
ROJO=$(gh pr view "$N" -R "$REPO" --json statusCheckRollup --jq '[.statusCheckRollup[]? | select((.conclusion // .state // "") as $c | ($c|IN("SUCCESS","SKIPPED","NEUTRAL"))|not)] | length' 2>/dev/null)
[ "$ROJO" = "0" ] || no_hecho "la CI del revert #$N no quedó verde en 20 min: queda abierto, ESCALAR a Felipe"
OID=$(git -C "$TMP" rev-parse HEAD)
gh pr merge "$N" -R "$REPO" --squash --delete-branch --match-head-commit "$OID" >/dev/null 2>&1 || no_hecho "no pude mergear el revert #$N"
anotar "#$PR" "REVERTIDO por #$N (CI de main roja)" "revertir.sh $PR"
echo "HECHO: #$PR revertido por #$N. → SIGUIENTE: avisar a Productor; la historia vuelve al Constructor con el log de la CI."
