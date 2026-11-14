#!/usr/bin/env bash
# verificar-frontera.sh — ¿el cambio del equipo de bots respeta su frontera?
#
# Uso:
#   verificar-frontera.sh <rama>                 compara origin/main...<rama>
#   verificar-frontera.sh <A>...<B> | <A>..<B>   rango explícito (git diff)
#   verificar-frontera.sh --ruta <ruta>          una sola ruta (la usa el freno)
#   opciones: --base <ref> (default origin/main) · --repo <dir> (default: cwd)
#
# Salida: una línea por ruta fuera de la frontera y el veredicto.
# Código: 0 = respeta la frontera · 1 = toca rutas prohibidas · 2 = error de uso
#         o de git (falla CERRADO: si no puede calcular el diff, no aprueba).
#
# La frontera (DP-21, plan 2026-11-14-equipo-mausbot §8). Lista blanca: lo que no
# está permitido explícitamente, está prohibido. La lista negra va primero y
# gana siempre (p. ej. web/src/app/api/** queda fuera aunque esté bajo app/**).
# Lo usan: el freno (Edit/Write en carpetas del equipo), condiciones-merge.sh
# (DevOps antes de mergear) y, si la integradora lo agrega, la CI.
# Compatible con bash 3.2 (macOS).
set -uo pipefail

PROHIBIDAS='
web/src/lib/agent/
web/src/lib/ai/
web/src/lib/domain/types.ts
web/src/lib/client/api.ts
web/src/app/api/
web/supabase/
web/evals/
docs/producto/
.claude/
.githooks/
.github/
agentes/
CLAUDE.md
DESIGN.MD
'
PERMITIDAS='
web/src/app/
web/src/components/
web/public/
web/tests/ui/
docs/superpowers/
'

# motivo_ruta <ruta> → imprime el motivo si está FUERA de la frontera; nada si está dentro.
motivo_ruta() {
  local r="$1" p base
  r="${r#./}"
  case "$r" in
    /*|*..*) echo "ruta absoluta o con '..': no se puede evaluar"; return ;;
  esac
  base="${r##*/}"
  case "$base" in
    .env.local.example|.env.example) ;;
    .env|.env.*) echo "archivo de secretos (.env*)"; return ;;
  esac
  for p in $PROHIBIDAS; do
    case "$p" in
      */) case "$r" in "$p"*) echo "prohibida para el equipo ($p**)"; return ;; esac ;;
      *)  [ "$r" = "$p" ] && { echo "prohibida para el equipo ($p)"; return; } ;;
    esac
  done
  for p in $PERMITIDAS; do
    case "$r" in "$p"*) return ;; esac
  done
  echo "fuera de la frontera (no está en la lista blanca)"
}

BASE="origin/main"; REPO="."; RUTA=""; OBJ=""
while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="${2:-}"; shift 2 ;;
    --repo) REPO="${2:-}"; shift 2 ;;
    --ruta) RUTA="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) OBJ="$1"; shift ;;
  esac
done

if [ -n "$RUTA" ]; then
  m=$(motivo_ruta "$RUTA")
  if [ -n "$m" ]; then echo "FUERA: $RUTA — $m"; exit 1; fi
  echo "DENTRO: $RUTA"; exit 0
fi

[ -z "$OBJ" ] && { echo "ERROR: falta la rama o el rango (uso: verificar-frontera.sh <rama>|<A>...<B>)" >&2; exit 2; }
case "$OBJ" in
  *..*) RANGO="$OBJ" ;;
  *)    RANGO="$BASE...$OBJ" ;;
esac

if ! archivos=$(git -C "$REPO" diff --name-only --no-renames "$RANGO" -- 2>/dev/null); then
  echo "ERROR: git no pudo calcular el diff de '$RANGO' en $REPO (¿fetch hecho? ¿existe la rama?). No apruebo." >&2
  exit 2
fi
if [ -z "$archivos" ]; then
  echo "OK: '$RANGO' no cambia archivos."
  exit 0
fi

fuera=0; total=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  total=$((total + 1))
  m=$(motivo_ruta "$f")
  if [ -n "$m" ]; then echo "FUERA: $f — $m"; fuera=$((fuera + 1)); fi
done <<EOF
$archivos
EOF

if [ "$fuera" -gt 0 ]; then
  echo "NO RESPETA LA FRONTERA: $fuera de $total archivos fuera. Si la historia lo necesita, el Productor lo pide a la sesión integradora (Felipe)."
  exit 1
fi
echo "OK: los $total archivos de '$RANGO' están dentro de la frontera."
exit 0
