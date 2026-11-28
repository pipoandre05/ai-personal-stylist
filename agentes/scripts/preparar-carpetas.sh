#!/usr/bin/env bash
# preparar-carpetas.sh [--ensayo] [--sin-npm] — arma las carpetas del equipo de bots.
#
# Crea (o pone al día) dos carpetas hermanas del checkout de Felipe:
#   ai-personal-stylist-torre    CLON aparte del repo, siempre en main (Productor y DevOps).
#                                Es un clon y no un worktree del checkout de Felipe porque git no
#                                permite dos checkouts de main en el mismo repo (lección de Prendie).
#   ai-personal-stylist-linea-1  worktree de ese clon con HEAD suelto en origin/main
#                                (Diseño, Constructor, Revisor y QA trabajan aquí, en la rama de la historia).
# Y en las dos: marcador .equipo-mausbot (el freno aplica la frontera), core.hooksPath=.githooks
# (config LOCAL del clon, nunca global), .torre/ excluido de git, y las skills copiadas a
# .claude/skills/ (no se versionan: .gitignore las deja fuera y los bots no ven las globales).
# En la línea: web/.env.local mínimo (solo NEXT_PUBLIC_*, AI_MODE=mock, sin clave de Anthropic) y npm ci.
#
# Idempotente: si algo ya está, lo deja. --ensayo imprime lo que haría sin tocar nada.
# Requisito: que origin/main ya traiga agentes/ y el freno (.claude/hooks/freno.sh); si no, se detiene.
# NO lo corre esta sesión: lo corre la sesión integradora o Felipe (plan §11, paso 4).
set -uo pipefail
ENSAYO=0; NPM=1
for a in "$@"; do case "$a" in --ensayo) ENSAYO=1 ;; --sin-npm) NPM=0 ;; *) echo "opción desconocida: $a" >&2; exit 2 ;; esac; done

BASE="${EQUIPO_BASE:-/Users/pipoandre/Documents/claude.nosync}"
CHECKOUT="$BASE/ai-personal-stylist"
TORRE="$BASE/ai-personal-stylist-torre"
LINEA="$BASE/ai-personal-stylist-linea-1"
PRENDIE_SKILLS="$BASE/prendie-torre/.claude/skills"
URL=$(git -C "$CHECKOUT" remote get-url origin 2>/dev/null) || { echo "NO HECHO: no leo el origin de $CHECKOUT" >&2; exit 3; }

# skills por origen (los bots las ven sin prefijo: brainstorming, no superpowers:brainstorming)
SKILLS_DISENO="frontend-design ui-ux-pro-max impeccable emil-design-eng stageshow design-critique accessibility-review ux-copy design-handoff"
SKILLS_PRENDIE="brainstorming writing-plans subagent-driven-development dispatching-parallel-agents test-driven-development requesting-code-review receiving-code-review verification-before-completion systematic-debugging finishing-a-development-branch testing-strategy agent-security write-spec sprint-planning"

hacer() { if [ "$ENSAYO" -eq 1 ]; then echo "ENSAYO: $*"; else "$@"; fi; }
paso()  { echo; echo "== $*"; }
aviso() { echo "AVISO: $*"; AVISOS=$((AVISOS + 1)); }
AVISOS=0

paso "0. Requisitos en origin/main"
git -C "$CHECKOUT" fetch -q origin main 2>/dev/null || { echo "NO HECHO: fetch falló" >&2; exit 3; }
for f in agentes/scripts/verificar-frontera.sh agentes/scripts/condiciones-merge.sh agentes/scripts/hilo.sh .claude/hooks/freno.sh; do
  if ! git -C "$CHECKOUT" cat-file -e "origin/main:$f" 2>/dev/null; then
    echo "NO HECHO: origin/main no trae $f. Primero se mergea el PR del equipo y el de la propuesta de settings (plan §11, pasos 1–3)." >&2
    [ "$ENSAYO" -eq 1 ] && { echo "(ensayo: sigo para mostrar el resto)"; } || exit 3
  fi
done
command -v rsync >/dev/null || { echo "NO HECHO: falta rsync" >&2; exit 3; }

paso "1. Clon de la Torre ($TORRE)"
if [ -d "$TORRE/.git" ]; then
  echo "existe"
  [ -n "$(git -C "$TORRE" status --porcelain --untracked-files=no)" ] && { echo "NO HECHO: $TORRE tiene cambios sin commitear; míralo antes" >&2; exit 3; }
  hacer git -C "$TORRE" fetch -q origin
  hacer git -C "$TORRE" switch -q main
  hacer git -C "$TORRE" merge -q --ff-only origin/main
else
  hacer git clone -q "$URL" "$TORRE"
fi
hacer git -C "$TORRE" config core.hooksPath .githooks
hacer mkdir -p "$TORRE/.torre"

paso "2. Línea 1 ($LINEA)"
if [ -e "$LINEA/.git" ]; then
  rama=$(git -C "$LINEA" symbolic-ref --quiet --short HEAD 2>/dev/null)
  if [ -n "$rama" ]; then echo "existe y tiene la rama $rama: no la toco"
  elif [ -n "$(git -C "$LINEA" status --porcelain --untracked-files=no)" ]; then echo "existe con cambios sin commitear: no la toco"
  else hacer git -C "$LINEA" switch -q --detach origin/main; echo "libre en origin/main"; fi
else
  hacer git -C "$TORRE" worktree add -q --detach "$LINEA" origin/main
fi

paso "3. Marcador del equipo y exclusiones (sin tocar .gitignore)"
EXCL="$TORRE/.git/info/exclude"
for patron in ".equipo-mausbot" ".torre/"; do
  if [ "$ENSAYO" -eq 1 ] || ! grep -qxF "$patron" "$EXCL" 2>/dev/null; then hacer sh -c "printf '%s\n' '$patron' >> '$EXCL'"; fi
done
hacer touch "$TORRE/.equipo-mausbot" "$LINEA/.equipo-mausbot"

paso "4. Skills en .claude/skills/ de las dos carpetas"
copiar_skill() { # copiar_skill <origen> <nombre>
  local o="$1/$2" d
  [ -d "$o" ] || { aviso "no encuentro la skill $2 en $1"; return; }
  for d in "$TORRE" "$LINEA"; do
    hacer mkdir -p "$d/.claude/skills"
    hacer rsync -a --copy-links --delete --exclude __pycache__ "$o/" "$d/.claude/skills/$2/"
  done
}
for s in $SKILLS_DISENO; do copiar_skill "$CHECKOUT/.claude/skills" "$s"; done
for s in $SKILLS_PRENDIE; do copiar_skill "$PRENDIE_SKILLS" "$s"; done
copiar_skill "$TORRE/agentes" "torre"
copiar_skill "$TORRE/agentes/skills" "estilo-equipo"

paso "5. web/.env.local de la línea (mínimo, sin clave de Anthropic)"
ORIGEN_ENV="$CHECKOUT/web/.env.local"; DEST_ENV="$LINEA/web/.env.local"
if [ -f "$DEST_ENV" ]; then echo "ya existe: no lo piso"
elif [ ! -f "$ORIGEN_ENV" ]; then aviso "no existe $ORIGEN_ENV: Felipe crea $DEST_ENV a mano desde web/.env.local.example (solo NEXT_PUBLIC_* y AI_MODE=mock)"
elif [ "$ENSAYO" -eq 1 ]; then echo "ENSAYO: copiaría solo NEXT_PUBLIC_* y CHAT_DAILY_LIMIT, y fijaría AI_MODE=mock (sin imprimir valores)"
else
  ( umask 077
    grep -E '^(NEXT_PUBLIC_[A-Z0-9_]+|CHAT_DAILY_LIMIT)=' "$ORIGEN_ENV" > "$DEST_ENV"
    printf 'AI_MODE=mock\n' >> "$DEST_ENV" )
  echo "creado con $(wc -l < "$DEST_ENV" | tr -d ' ') variables (valores no se muestran)"
fi

paso "6. Dependencias de la línea"
if [ "$NPM" -eq 1 ]; then hacer sh -c "cd '$LINEA' && npm ci --no-audit --no-fund >/dev/null"; else echo "omitido (--sin-npm)"; fi

paso "Resumen"
echo "Torre: $TORRE · Línea 1: $LINEA · avisos: $AVISOS"
[ "$ENSAYO" -eq 1 ] && echo "ENSAYO: no se tocó nada."
echo "→ SIGUIENTE: importar el equipo en OpenMausBot y configurar cada bot (plan §11, pasos 5–9)."
