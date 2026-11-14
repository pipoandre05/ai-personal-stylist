#!/usr/bin/env bash
# graphify-precontext.sh
# Refresca el grafo de Graphify ANTES de que brainstorming/writing-plans corran,
# para que el diseño de spec/plan razone sobre el código real y no sobre un grafo viejo.
# Instalado por project-inception. Se dispara vía PreToolUse (matcher: Skill).
# Nunca bloquea la skill: ante cualquier problema, exit 0.
set -uo pipefail

input=$(cat)
skill=$(printf '%s' "$input" | jq -r '.tool_input.skill // empty' 2>/dev/null)

case "$skill" in
  superpowers:brainstorming|superpowers:writing-plans) ;;
  *) exit 0 ;;   # no es una skill de diseño — no hacer nada
esac

proj="${CLAUDE_PROJECT_DIR:-.}"
dir="${GRAPHIFY_DIR:-$proj}"   # override si el código no está en la raíz (ej. web/)

command -v graphify >/dev/null 2>&1 || exit 0   # graphify no instalado — no bloquear
[ -d "$dir/graphify-out" ] || exit 0            # el proyecto no usa graphify — nada que refrescar

( cd "$dir" && graphify update . ) >/dev/null 2>&1

cat <<'JSON'
{"continue": true, "systemMessage": "Graphify: grafo de código actualizado. Antes de diseñar, consulta graphify-out/ (graphify query / graphify explain) para razonar sobre la estructura real del código."}
JSON
exit 0
