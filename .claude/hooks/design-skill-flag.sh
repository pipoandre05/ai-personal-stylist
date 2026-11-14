#!/usr/bin/env bash
# Marca que una skill de diseño fue invocada en esta sesión.
# Leído por design-gate.sh. Nunca bloquea: ante cualquier problema, exit 0.
set -uo pipefail
input=$(cat)
skill=$(printf '%s' "$input" | jq -r '.tool_input.skill // empty' 2>/dev/null)
sid=$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null)
case "$skill" in
  frontend-design|impeccable|ckm-design|ckm-brand|ui-ux-pro-max|emil-design-eng|stageshow|design-critique|accessibility-review|ux-copy)
    touch "/tmp/claude-design-skill-${sid}-${skill}" 2>/dev/null ;;
esac
exit 0
