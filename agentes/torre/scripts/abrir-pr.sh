#!/usr/bin/env bash
# abrir-pr.sh [linea] [--ensayo] — abre (listo, no borrador) el PR de la rama de la línea contra main.
# El cuerpo sale del hilo: título, decisiones y la sección ## Humo que dejó QA.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
L="${ARGS[0]:-1}"; D=$(linea_dir "$L"); RAMA=$(rama_de_linea "$L")
case "$RAMA" in equipo/*) ;; *) no_hecho "la línea $L no tiene una rama del equipo";; esac
en_pausa
ID=$(printf '%s' "${RAMA#equipo/}" | sed -n 's/^\([a-z][a-z0-9]*-[0-9][0-9]*\).*/\1/p')
HILO="$D/docs/superpowers/hilos/$ID.md"
[ -f "$HILO" ] || no_hecho "no existe el hilo $HILO"
existente=$(gh pr list -R "$REPO" --head "$RAMA" --state open --json number --jq '.[0].number' 2>/dev/null)
[ -n "$existente" ] && { echo "YA EXISTE: PR #$existente para $RAMA"; exit 0; }
FRONTERA=$(bash "$D/agentes/scripts/verificar-frontera.sh" --repo "$D" "$RAMA" 2>&1) || no_hecho "la rama no respeta la frontera: $FRONTERA"
TITULO=$(sed -n '1s/^# Hilo [a-z0-9-]* — //p' "$HILO")
HUMO=$(awk '/^## Humo/{p=1} p' "$HILO" | head -n 40)
CUERPO=$(cat <<EOF
## Qué cambia y por qué

Historia **$ID** — $TITULO. Hecha por el equipo de bots (DP-21). Conversación completa y veredictos: \`docs/superpowers/hilos/$ID.md\`.

${HUMO:-## Humo
(QA no dejó sección de humo en el hilo: no se mergea hasta que exista.)}

## Condiciones de merge (las verifica DevOps con agentes/scripts/condiciones-merge.sh)

- [ ] CI y \`verify\` en verde
- [ ] Revisor y QA con VEREDICTO aprobado en el hilo, sobre el último código
- [ ] Frontera: $(printf '%s' "$FRONTERA" | tail -n 1)
- [ ] Al día con main por merge · squash

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)
correr gh pr create -R "$REPO" --base main --head "$RAMA" --title "$ID: $TITULO" --body "$CUERPO" || no_hecho "gh pr create falló"
anotar "$RAMA" "PR abierto" "gh pr create"
echo "HECHO: PR abierto para $RAMA. → SIGUIENTE: esperar CI y correr mergear.sh <N>."
