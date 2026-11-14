#!/usr/bin/env bash
# Gate estructural de diseño: exige skill de diseño antes de editar UI pública.
# Advisory (continue:true) — informa, no bloquea. Nunca falla: ante error, exit 0.
set -uo pipefail
input=$(cat)
fp=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
sid=$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null)
[ -z "$fp" ] && exit 0

# Solo UI pública: src/app y src/components, excluyendo admin y api
case "$fp" in
  */src/app/admin/*|*/src/app/api/*) exit 0 ;;
  */src/app/*|*/src/components/*) ;;
  *) exit 0 ;;
esac
# Solo archivos con superficie visual
case "$fp" in
  *.tsx|*.css) ;;
  *) exit 0 ;;
esac
# Skill de diseño ya invocada en esta sesión → pasar
d="/tmp/claude-design-skill-${sid}"
if [ -f "${d}-impeccable" ] || [ -f "${d}-ckm-design" ] || [ -f "${d}-ckm-brand" ] || \
   { [ -f "${d}-frontend-design" ] && [ -f "${d}-ui-ux-pro-max" ]; }; then
  exit 0
fi

cat <<'JSON'
{"continue": true, "systemMessage": "GATE DE DISEÑO: vas a editar UI pública sin las skills de diseño de esta sesión. Para construir o rediseñar: invoca frontend-design Y ui-ux-pro-max (AMBAS — con una sola el gate sigue avisando). Para revisar/pulir: impeccable. Lee DESIGN.MD (raíz del repo) (tokens, tipografía, reglas de componentes) antes de tocar UI. Si esta edición no es visual (imports, tipos, lógica pura), continúa — pero ejecuta impeccable antes de declarar la tarea terminada."}
JSON
exit 0
