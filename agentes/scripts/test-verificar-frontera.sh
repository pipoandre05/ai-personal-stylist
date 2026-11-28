#!/usr/bin/env bash
# test-verificar-frontera.sh — pruebas de verificar-frontera.sh en un repo de mentira.
# Uso: bash agentes/scripts/test-verificar-frontera.sh   (no toca el repo real)
set -uo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
F="$AQUI/verificar-frontera.sh"
T=$(mktemp -d "${TMPDIR:-/tmp}/frontera.XXXXXX")
trap 'rm -rf "$T"' EXIT
pasa=0; falla=0

ok()   { pasa=$((pasa+1)); }
mal()  { falla=$((falla+1)); echo "FALLA: $*"; }
espera() { # espera <codigo-esperado> <descripcion> <comando…>
  local want="$1" desc="$2"; shift 2
  "$@" >/dev/null 2>&1; local got=$?
  [ "$got" = "$want" ] && ok || mal "$desc (esperaba $want, salió $got)"
}

# --- rutas sueltas (modo --ruta, el que usa el freno) ---
for r in web/src/app/asesor/page.tsx web/src/components/chat/hilo.tsx web/public/icono.svg \
         web/tests/ui/hilo.test.tsx docs/superpowers/hilos/ui-1.md docs/superpowers/mockups/x.html; do
  espera 0 "permitida $r" bash "$F" --ruta "$r"
done
for r in web/src/lib/agent/run.ts web/src/lib/ai/claude.ts web/src/lib/domain/types.ts \
         web/src/lib/client/api.ts web/src/app/api/chat/route.ts web/supabase/migrations/001.sql \
         web/evals/casos.json docs/producto/DTR.md .claude/settings.json .githooks/pre-push \
         .github/workflows/ci.yml agentes/bots/qa/SOUL.md CLAUDE.md DESIGN.MD \
         web/package.json web/src/lib/format.ts web/src/proxy.ts web/tests/sse.test.ts \
         web/.env.local web/.env.local.example .env ../fuera.txt /etc/passwd README.md \
         packages/core/src/sse.ts mobile/src/app/index.tsx; do
  espera 1 "prohibida $r" bash "$F" --ruta "$r"
done

# --- ramas en un repo de mentira ---
cd "$T" || exit 2
git init -q -b main origen.git --bare
git clone -q origen.git repo 2>/dev/null
cd repo || exit 2
git config user.email t@t; git config user.name t
mkdir -p web/src/app web/src/lib/agent docs/superpowers
echo a > web/src/app/page.tsx; echo a > web/src/lib/agent/a.ts; echo a > README.md
git add -A; git commit -qm base; git push -q origin main

git switch -qc equipo/ui-1-ok
mkdir -p web/src/components/chat docs/superpowers/hilos
echo b > web/src/components/chat/hilo.tsx; echo h > docs/superpowers/hilos/ui-1.md
git add -A; git commit -qm ok; git push -q origin equipo/ui-1-ok

git switch -qc equipo/ui-2-mal main
echo b > web/src/lib/agent/a.ts
git add -A; git commit -qm mal; git push -q origin equipo/ui-2-mal

git switch -qc equipo/ui-3-renombre main
git mv web/src/lib/agent/a.ts web/src/app/a.ts
git commit -qm renombre; git push -q origin equipo/ui-3-renombre

git switch -qc equipo/ui-4-borra main
git rm -q README.md; git commit -qm borra; git push -q origin equipo/ui-4-borra

git switch -qc equipo/ui-5-core main
mkdir -p packages/core/src; echo b > packages/core/src/sse.ts
git add -A; git commit -qm core; git push -q origin equipo/ui-5-core

git switch -qc equipo/ui-6-mobile main
mkdir -p mobile/src/app; echo b > mobile/src/app/index.tsx
git add -A; git commit -qm mobile; git push -q origin equipo/ui-6-mobile
git fetch -q origin

espera 0 "rama dentro de la frontera"            bash "$F" --repo "$T/repo" equipo/ui-1-ok
espera 1 "rama que toca lib/agent"               bash "$F" --repo "$T/repo" equipo/ui-2-mal
espera 1 "renombre desde lib/agent cuenta"       bash "$F" --repo "$T/repo" equipo/ui-3-renombre
espera 1 "borrar un archivo fuera también cuenta" bash "$F" --repo "$T/repo" equipo/ui-4-borra
espera 1 "rama que toca packages/core"           bash "$F" --repo "$T/repo" equipo/ui-5-core
espera 1 "rama que toca mobile/"                 bash "$F" --repo "$T/repo" equipo/ui-6-mobile
espera 0 "rango explícito dentro"                bash "$F" --repo "$T/repo" origin/main...origin/equipo/ui-1-ok
espera 2 "rama inexistente falla cerrado"        bash "$F" --repo "$T/repo" equipo/no-existe
espera 2 "sin argumentos es error de uso"        bash "$F" --repo "$T/repo"
espera 0 "rango sin cambios"                     bash "$F" --repo "$T/repo" main...main

# main avanzó después de crear la rama: lo de main no cuenta contra la rama (diff A...B)
git switch -q main; echo c > web/src/lib/agent/b.ts; git add -A; git commit -qm main-avanza; git push -q origin main
git fetch -q origin
espera 0 "cambios de main no se le cargan a la rama" bash "$F" --repo "$T/repo" equipo/ui-1-ok

echo "verificar-frontera: $pasa pasan, $falla fallan"
[ "$falla" -eq 0 ]
