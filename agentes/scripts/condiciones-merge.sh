#!/usr/bin/env bash
# condiciones-merge.sh <pr> [--repo <dir>] — ¿se puede mergear este PR del equipo SIN Felipe?
#
# Reemplaza la etiqueta torre:aprobado de Prendie por condiciones objetivas
# (DP-21). Lo corren DevOps (mergear.sh) y el freno (antes de dejar pasar
# `gh pr merge` o `mergear.sh`). Todas deben cumplirse:
#   1. PR abierto, no borrador, contra main, desde una rama equipo/<id>-<slug>.
#   2. Sin pausa: ni la etiqueta `equipo:pausa` en el PR ni el archivo .torre/PAUSA.
#   3. CI en verde: ningún check rojo ni corriendo; si el PR toca web/**, el check
#      `verify` (npm run verify en GitHub) tiene que estar en SUCCESS.
#   4. GitHub lo reporta MERGEABLE y el sha del PR es el mismo que ve git.
#   5. Rama al día con main por merge: origin/main está contenido en la rama.
#   6. El diff respeta la frontera (verificar-frontera.sh).
#   7. En docs/superpowers/hilos/<id>.md, el último VEREDICTO de Revisor y el de
#      QA dicen `aprobado` sobre un sha de la rama, y después de ese sha solo hay
#      commits que tocan el hilo o merges limpios desde main (sin código nuevo
#      que nadie revisó).
#   (El squash lo impone mergear.sh; el freno rechaza cualquier otro modo.)
#
# Código: 0 = se cumplen todas · 1 = falta alguna (las lista) · 2 = no pude
# comprobar (falla CERRADO: sin datos no se mergea).
# Para tests: CONDICIONES_GH_JSON=<archivo> reemplaza `gh pr view`;
# CONDICIONES_SIN_FETCH=1 omite el fetch. Compatible con bash 3.2.
set -uo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_GH="${REPO_GH:-pipoandre05/ai-personal-stylist}"

PR=""; REPO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="${2:-}"; shift 2 ;;
    *) PR="$1"; shift ;;
  esac
done
case "$PR" in ''|*[!0-9]*) echo "ERROR: uso: condiciones-merge.sh <número de PR> [--repo <dir>]" >&2; exit 2 ;; esac
[ -z "$REPO" ] && REPO=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$REPO" ] && { echo "ERROR: no encuentro el repo (usa --repo)" >&2; exit 2; }
command -v jq >/dev/null || { echo "ERROR: falta jq; no puedo comprobar nada" >&2; exit 2; }

CAMPOS=state,isDraft,baseRefName,headRefName,headRefOid,labels,mergeable,statusCheckRollup,files
if [ -n "${CONDICIONES_GH_JSON:-}" ]; then
  INFO=$(cat "$CONDICIONES_GH_JSON") || exit 2
else
  INFO=$(gh pr view "$PR" -R "$REPO_GH" --json "$CAMPOS" 2>/dev/null) || { echo "ERROR: gh no pudo leer el PR #$PR" >&2; exit 2; }
fi
jq -e . >/dev/null 2>&1 <<<"$INFO" || { echo "ERROR: respuesta de gh ilegible" >&2; exit 2; }

NL=$'\n'; faltan=""
falta() { faltan="$faltan$NL  - $1"; }

estado=$(jq -r '.state // ""' <<<"$INFO")
borrador=$(jq -r '.isDraft // false' <<<"$INFO")
base=$(jq -r '.baseRefName // ""' <<<"$INFO")
head=$(jq -r '.headRefName // ""' <<<"$INFO")
oid=$(jq -r '.headRefOid // ""' <<<"$INFO")

# 1. forma del PR
[ "$estado" != "OPEN" ] && falta "el PR no está abierto ($estado)"
[ "$borrador" = "true" ] && falta "sigue en borrador"
[ "$base" != "main" ] && falta "no apunta a main (apunta a '$base')"
id=""
case "$head" in
  equipo/*) id=$(printf '%s' "${head#equipo/}" | sed -n 's/^\([a-z][a-z0-9]*-[0-9][0-9]*\).*/\1/p') ;;
  *) falta "la rama '$head' no es del equipo (equipo/<id>-<slug>)" ;;
esac
[ -z "$id" ] && case "$head" in equipo/*) falta "no saco el id de historia de '$head' (se espera equipo/ui-1-slug)" ;; esac

# 2. pausa
jq -e '[.labels[]?.name] | index("equipo:pausa") != null' >/dev/null <<<"$INFO" && falta "el PR tiene la etiqueta equipo:pausa"
PAUSA="${TORRE_PAUSA:-$REPO/.torre/PAUSA}"
[ -e "$PAUSA" ] && falta "el equipo está en pausa ($PAUSA existe)"

# 3. CI
read -r rojo pend total verify_ok < <(jq -r '
  def rojo: (.conclusion // "" | ascii_upcase) as $c | (.state // "" | ascii_upcase) as $s
    | ($c|IN("FAILURE","CANCELLED","TIMED_OUT","ACTION_REQUIRED","STARTUP_FAILURE","STALE")) or ($s|IN("FAILURE","ERROR"));
  def pend: (.status // "" | ascii_upcase) as $st | (.state // "" | ascii_upcase) as $s
    | (has("status") and $st != "COMPLETED") or ($s|IN("PENDING","EXPECTED"));
  [.statusCheckRollup[]?] as $ch
  | [($ch|map(select(rojo))|length), ($ch|map(select(pend))|length), ($ch|length),
     ($ch|map(select(((.name // .context // "") == "verify") and (((.conclusion // .state // "")|ascii_upcase) == "SUCCESS")))|length)]
  | @tsv' <<<"$INFO" 2>/dev/null) || { echo "ERROR: no pude leer los checks de CI" >&2; exit 2; }
toca_web=$(jq -r '[.files[]?.path | select(startswith("web/"))] | length' <<<"$INFO")
[ "${rojo:-0}" != "0" ] && falta "CI en rojo ($rojo checks)"
[ "${pend:-0}" != "0" ] && falta "CI todavía corriendo ($pend checks)"
if [ "${toca_web:-0}" != "0" ] && [ "${verify_ok:-0}" = "0" ]; then
  falta "el PR toca web/ y no hay un check 'verify' en verde"
fi

# 4. mergeable
mergeable=$(jq -r '.mergeable // ""' <<<"$INFO")
[ "$mergeable" != "MERGEABLE" ] && falta "GitHub lo reporta '$mergeable' (no MERGEABLE)"

# Una rama que no es del equipo no sigue a las comprobaciones de git: no se mergea por esta vía.
if [ -z "$id" ]; then
  echo "NO SE CUMPLEN las condiciones de merge de #$PR:$faltan"
  exit 1
fi

# 5–7 necesitan git
if [ -z "${CONDICIONES_SIN_FETCH:-}" ]; then
  git -C "$REPO" fetch -q origin main "$head" 2>/dev/null || { echo "ERROR: git fetch falló; no compruebo a ciegas" >&2; exit 2; }
fi
H=$(git -C "$REPO" rev-parse --verify --quiet "origin/$head^{commit}") || { echo "ERROR: no existe origin/$head" >&2; exit 2; }
M=$(git -C "$REPO" rev-parse --verify --quiet "origin/main^{commit}") || { echo "ERROR: no existe origin/main" >&2; exit 2; }
[ -n "$oid" ] && [ "$oid" != "$H" ] && falta "el PR apunta a ${oid:0:7} y git ve ${H:0:7}: alguien empujó entre medio; vuelve a correr"

# 5. al día con main
git -C "$REPO" merge-base --is-ancestor "$M" "$H" || falta "la rama está atrás de main: actualizar-rama.sh (merge, nunca rebase)"

# 6. frontera
if ! salida=$(bash "$AQUI/verificar-frontera.sh" --repo "$REPO" "$M...$H" 2>&1); then
  falta "frontera: $(printf '%s' "$salida" | tr '\n' ' ' | cut -c1-400)"
fi

# 7. veredictos en el hilo
solo_hilo_despues() { # solo_hilo_despues <sha> → 0 si después de <sha> no hay código sin revisar
  local c padres p1 p2 arbol auto
  for c in $(git -C "$REPO" rev-list "$1..$H" --not "$M"); do
    padres=$(git -C "$REPO" rev-list --parents -n 1 "$c" | cut -d' ' -f2-)
    set -- $padres
    if [ $# -ge 2 ]; then
      p1="$1"; p2="$2"
      git -C "$REPO" merge-base --is-ancestor "$p2" "$M" || return 1   # solo merges desde main
      arbol=$(git -C "$REPO" rev-parse "$c^{tree}")
      auto=$(git -C "$REPO" merge-tree --write-tree "$p1" "$p2" 2>/dev/null | head -n 1) || return 1
      [ "$arbol" = "$auto" ] || return 1                               # merge limpio, sin retoques
    else
      if git -C "$REPO" diff-tree --no-commit-id --name-only -r "$c" | grep -qv '^docs/superpowers/hilos/'; then
        return 1
      fi
    fi
  done
  return 0
}
if [ -n "$id" ]; then
  HILO=$(git -C "$REPO" show "$H:docs/superpowers/hilos/$id.md" 2>/dev/null)
  if [ -z "$HILO" ]; then
    falta "no existe docs/superpowers/hilos/$id.md en la rama"
  else
    for rol in Revisor QA; do
      linea=$(printf '%s\n' "$HILO" | grep "^VEREDICTO: $rol " | tail -n 1)
      if [ -z "$linea" ]; then falta "$rol no ha dado veredicto en el hilo"; continue; fi
      ver=$(printf '%s' "$linea" | awk '{print $3}')
      sha=$(printf '%s' "$linea" | sed -n 's/.* sha=\([0-9a-f]\{7,40\}\)$/\1/p')
      [ "$ver" != "aprobado" ] && { falta "el último veredicto de $rol es '$ver'"; continue; }
      [ -z "$sha" ] && { falta "el veredicto de $rol no trae sha"; continue; }
      git -C "$REPO" merge-base --is-ancestor "$sha" "$H" 2>/dev/null || { falta "$rol aprobó ${sha:0:7}, que no está en la rama"; continue; }
      solo_hilo_despues "$sha" || falta "hay código nuevo después de que $rol aprobó ${sha:0:7}: hay que volver a revisarlo"
    done
  fi
fi

if [ -n "$faltan" ]; then
  echo "NO SE CUMPLEN las condiciones de merge de #$PR:$faltan"
  exit 1
fi
echo "OK: #$PR cumple las 7 condiciones (CI, verify, al día con main, frontera, Revisor y QA aprobados sobre ${H:0:7})."
exit 0
