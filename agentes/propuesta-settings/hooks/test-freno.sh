#!/usr/bin/env bash
# test-freno.sh — casos que deben pasar y casos que deben bloquear, con repos de mentira.
# Uso: bash agentes/propuesta-settings/hooks/test-freno.sh   (no toca el repo real ni GitHub)
set -uo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRENO="$AQUI/freno.sh"
SETTINGS="$AQUI/../settings.json"
SCRIPTS_REALES="$(cd "$AQUI/../../scripts" && pwd)"
T=$(mktemp -d "${TMPDIR:-/tmp}/freno.XXXXXX")
T=$(cd "$T" && pwd -P)
trap 'rm -rf "$T"' EXIT
pasa=0; falla=0
mal() { falla=$((falla+1)); echo "FALLA: $*"; }

# --- repo "humano" (checkout de Felipe): main con upstream, y una rama local sin upstream
git init -q -b main --bare "$T/origen.git"
git clone -q "$T/origen.git" "$T/humano" 2>/dev/null
H="$T/humano"
( cd "$H" && git config user.email t@t && git config user.name t
  mkdir -p web/src/app src && echo a > web/src/app/page.tsx && echo a > src/x.ts
  echo "SECRETO=1" > web/.env.local && echo "SECRETO=" > web/.env.local.example
  printf '.env*\n!.env.local.example\n' > .gitignore
  git add -A && git commit -qm base && git push -q origin main ) || exit 2
mkdir -p "$H/agentes/scripts"
printf '#!/usr/bin/env bash\nexit "${FAKE_COND:-1}"\n' > "$H/agentes/scripts/condiciones-merge.sh"

# --- repo "equipo" (carpeta de línea): marcador, scripts reales de frontera, rama equipo/ui-1-hilo con hilo
git clone -q "$T/origen.git" "$T/linea" 2>/dev/null
L="$T/linea"
( cd "$L" && git config user.email t@t && git config user.name t
  git switch -qc equipo/ui-1-hilo
  mkdir -p docs/superpowers/hilos agentes/scripts web/src/lib/agent
  printf '# Hilo ui-1\n\n- **Dependencias declaradas:** zod, @radix-ui/react-dialog\n' > docs/superpowers/hilos/ui-1.md
  echo a > web/src/lib/agent/a.ts
  git add -A && git commit -qm hilo ) || exit 2
cp "$SCRIPTS_REALES/verificar-frontera.sh" "$L/agentes/scripts/"
printf '#!/usr/bin/env bash\nexit "${FAKE_COND:-1}"\n' > "$L/agentes/scripts/condiciones-merge.sh"
touch "$L/.equipo-mausbot"
printf '.equipo-mausbot\n.torre/\n' >> "$L/.git/info/exclude"

# --- carpeta del equipo SIN scripts (para probar el fallo cerrado)
git clone -q "$T/origen.git" "$T/rota" 2>/dev/null; touch "$T/rota/.equipo-mausbot"

mkdir -p "$T/tmp"; export FRENO_TEMPORALES="$T/tmp"
correr() { # correr <dir-proyecto> <json> → código de salida del freno
  printf '%s' "$2" | CLAUDE_PROJECT_DIR="$1" bash "$FRENO" >"$T/out" 2>&1
}
bash_json() { jq -nc --arg c "$1" --arg d "$2" '{tool_name:"Bash",tool_input:{command:$c},cwd:$d}'; }
tool_json() { jq -nc --arg t "$1" --arg k "$2" --arg v "$3" --arg d "$4" '{tool_name:$t,tool_input:{($k):$v},cwd:$d}'; }

pasa_b()    { correr "$1" "$(bash_json "$2" "$1")"; [ $? = 0 ] && pasa=$((pasa+1)) || { mal "debía PASAR [$1] $2"; sed 's/^/    /' "$T/out"; }; }
bloquea_b() { correr "$1" "$(bash_json "$2" "$1")"; [ $? = 2 ] && pasa=$((pasa+1)) || mal "debía BLOQUEAR [$1] $2"; }
pasa_t()    { correr "$1" "$(tool_json "$2" "$3" "$4" "$1")"; [ $? = 0 ] && pasa=$((pasa+1)) || { mal "debía PASAR [$1] $2 $4"; sed 's/^/    /' "$T/out"; }; }
bloquea_t() { correr "$1" "$(tool_json "$2" "$3" "$4" "$1")"; [ $? = 2 ] && pasa=$((pasa+1)) || mal "debía BLOQUEAR [$1] $2 $4"; }

# ================= deben PASAR (sesión humana) =================
for c in "ls -la" "git status" "git log --oneline -5" "git push -u origin feat/x" \
  'git commit -m "no usar git push --force ni git rebase"' "echo 'git push --force'" \
  "cat web/.env.local.example" "npm ci" "npm install" "npm run verify" "cd web && npm test" \
  "rm -rf web/.next" "rm -rf node_modules" "rm -rf $T/tmp/cualquiera" "rm web/src/app/page.tsx" \
  "vercel ls" "vercel inspect abc" "vercel --version" "git merge origin/main" \
  "git branch -d equipo/ui-1-hilo" "git push origin --delete equipo/ui-1-hilo" \
  "gh pr view 3" "gh pr create --draft --title x --body y" "gh api repos/o/r/pulls/3" \
  "grep -r foo src" "rg KEY web" "git fetch origin" "git switch -c feat/nueva" \
  "supabase --version" "npx vitest run" "bash agentes/torre/scripts/mergear.sh 5 --ensayo" \
  "$(printf 'cat > nota.md <<'"'"'EOF'"'"'\ngit push --force y git rebase\nEOF')" \
  "python3 scripts/algo.py" "node -e 'console.log(1)'"; do
  pasa_b "$H" "$c"
done
( cd "$H" && git switch -qc solo-local ) && pasa_b "$H" "git reset --hard HEAD~0" && ( cd "$H" && git switch -q main )

# ================= deben BLOQUEAR (sesión humana) =================
for c in "git push --force" "git push -f origin main" "git push origin +feat/x" "git push --force-with-lease" \
  "git push --mirror" "git rebase main" "git rebase -i HEAD~3" "cd web && git rebase main" \
  'bash -c "git rebase main"' 'sh -c "cd web && git push --force"' 'eval "git push -f"' \
  'echo $(git push --force)' 'echo "x $(git rebase main)"' 'echo `git push -f`' \
  "git reset --hard" "git reset --hard origin/main" "git branch -D feat/x" "git branch -d feat/otra" \
  "git branch -df equipo/ui-1-hilo" "git push origin --delete feat/otra" "git push origin :feat/otra" \
  "git clean -fdx" "git clean -fX" "git filter-branch --all" "git update-ref -d refs/heads/main" \
  "vercel" "vercel --prod" "vercel deploy" "npx vercel --prod" "npx -y vercel deploy" "vercel env pull" \
  "vercel promote x" "pnpm dlx vercel" \
  "cat web/.env.local" "head .env" "cp web/.env.local /tmp/x" "grep KEY web/.env.local" "source web/.env.local" \
  ". web/.env.local" "less web/.env.local" "cat web/.env*" "tail -f web/.env.production" "cat < web/.env.local" \
  "git add -f web/.env.local" "node -e \"require('fs').readFileSync('web/.env.local','utf8')\"" \
  "python3 -c \"print(open('.env.local').read())\"" "dotenv -- npm run x" "grep -r SECRETO ." "grep -R KEY $H" \
  "supabase db push" "npx supabase link --project-ref abc" "supabase migration up" "supabase db reset --linked" \
  "supabase functions deploy x" "supabase secrets set A=b" "psql postgres://x" "pg_dump x" \
  "npm install left-pad" "npm i -D left-pad" "pnpm add zod" "yarn add zod" "bun add zod" \
  "rm -rf docs" "rm -rf agentes" "rm -rf ." "rm -rf *" "rm -rf $H" "rm -r web/src" "rm -rf ~" \
  "find . -delete" "find . -name x -exec rm -rf {} ;" "ls | xargs rm -rf" \
  "gh pr merge 5 --squash" "gh pr merge 5 --admin --squash" "gh pr merge --squash" "gh pr merge 5 --auto --squash" \
  "gh pr merge 5 --rebase" "gh api -X DELETE repos/o/r/git/refs/heads/x" "gh api --method DELETE repos/o/r/labels/x" \
  "gh api -X PUT repos/o/r/pulls/5/merge" "gh api -X PATCH repos/o/r/git/refs/heads/main" "gh secret set X" \
  "gh variable list" "gh repo delete o/r" "bash agentes/torre/scripts/mergear.sh 5" "./mergear.sh 5" \
  "$(printf 'cat <<EOF | bash\ngit push --force\nEOF')" 'bash -c "bash -c \"bash -c \\\"bash -c \\\\\\\"bash -c ls\\\\\\\"\\\"\""' \
  'echo "sin cerrar'; do
  bloquea_b "$H" "$c"
done

# condiciones de merge que SÍ se cumplen: pasa por el freno (el deny de settings igual frena el tipeado)
FAKE_COND=0 bash -c ':' ; export FAKE_COND=0
pasa_b "$H" "gh pr merge 5 --squash"
pasa_b "$H" "bash agentes/torre/scripts/mergear.sh 5"
export FAKE_COND=1

# ================= herramientas que no son Bash =================
pasa_t "$H" Read file_path "$H/web/.env.local.example"
bloquea_t "$H" Read file_path "$H/web/.env.local"
bloquea_t "$H" Read file_path "web/.env"
pasa_t "$H" Grep path "$H/src"
bloquea_t "$H" Grep path "$H/web/.env.local"
bloquea_t "$H" Grep glob ".env*"
bloquea_t "$H" Edit file_path "$H/web/.env.local"
pasa_t "$H" Edit file_path "$H/src/x.ts"                       # Felipe: sin frontera
pasa_t "$H" mcp__supabase__list_tables x y
bloquea_t "$H" mcp__supabase__apply_migration name x
bloquea_t "$H" mcp__supabase-prod__execute_sql query x
bloquea_t "$H" mcp__f6ca021e__create_deployment project x
bloquea_t "$H" mcp__f6ca021e__request_rollback project x

# ================= modo equipo (carpeta con marcador) =================
for c in "npm install zod" "npm i @radix-ui/react-dialog@1.2.0" "git push -u origin equipo/ui-1-hilo" \
  "git commit -m x" "supabase --version" "bash agentes/scripts/hilo.sh estado ui-1" "npm run build"; do
  pasa_b "$L" "$c"
done
for c in "npm install left-pad" "npm i zod left-pad" "git push origin main" "git push origin HEAD:main" \
  "git push origin equipo/ui-1-hilo:main" "git push --no-verify -u origin equipo/ui-1-hilo" \
  "git -c core.hooksPath=/dev/null commit -m x" "git config core.hooksPath /dev/null" "supabase start" \
  "supabase status --linked" "gh pr close 3" "git worktree remove ../otra"; do
  bloquea_b "$L" "$c"
done
( cd "$L" && git switch -q -c otra-sin-hilo ) && bloquea_b "$L" "npm install zod" && ( cd "$L" && git switch -q equipo/ui-1-hilo )
pasa_t "$L" Edit file_path "$L/web/src/components/chat/hilo.tsx"
pasa_t "$L" Write file_path "$L/docs/superpowers/hilos/ui-1.md"
pasa_t "$L" Write file_path "$L/docs/superpowers/mockups/2026-11-15-ui-1.html"
pasa_t "$L" Write file_path "$L/.torre/bitacora.md"           # ignorado: no viaja en el PR
pasa_t "$L" Write file_path "$T/tmp/nota.md"
pasa_t "$L" Read file_path "$L/web/src/lib/agent/a.ts"        # leer el asesor sí
bloquea_t "$L" Edit file_path "$L/web/src/lib/agent/a.ts"
bloquea_t "$L" Write file_path "$L/web/src/app/api/chat/route.ts"
bloquea_t "$L" Write file_path "$L/CLAUDE.md"
bloquea_t "$L" Write file_path "$L/web/package.json"
bloquea_t "$L" Write file_path "$L/.claude/settings.json"
bloquea_t "$L" Write file_path "$L/agentes/bots/qa/SOUL.md"
bloquea_t "$L" Write file_path "$H/src/x.ts"                  # el checkout de Felipe
bloquea_t "$L" Write file_path "$L/web/.env.local"

# ================= falla cerrado =================
bloquea_t "$T/rota" Edit file_path "$T/rota/web/src/app/x.tsx"     # sin verificar-frontera.sh
rm -f "$H/agentes/scripts/condiciones-merge.sh"; export FAKE_COND=0
bloquea_b "$H" "gh pr merge 5 --squash"                             # sin condiciones-merge.sh
printf 'esto no es json' | CLAUDE_PROJECT_DIR="$H" bash "$FRENO" >/dev/null 2>&1; [ $? = 2 ] && pasa=$((pasa+1)) || mal "entrada ilegible debe bloquear"

# el comando del settings.json propuesto: sin freno.sh bloquea; con freno que revienta, bloquea
CMD=$(jq -r '.hooks.PreToolUse[0].hooks[0].command' "$SETTINGS")
mkdir -p "$T/sin-freno"
printf '%s' "$(bash_json ls "$T/sin-freno")" | CLAUDE_PROJECT_DIR="$T/sin-freno" bash -c "$CMD" >/dev/null 2>&1
[ $? = 2 ] && pasa=$((pasa+1)) || mal "settings: sin freno.sh debe bloquear"
mkdir -p "$T/freno-roto/.claude/hooks"; printf 'exit 1\n' > "$T/freno-roto/.claude/hooks/freno.sh"
printf '%s' "$(bash_json ls "$T/freno-roto")" | CLAUDE_PROJECT_DIR="$T/freno-roto" bash -c "$CMD" >/dev/null 2>&1
[ $? = 2 ] && pasa=$((pasa+1)) || mal "settings: freno que falla con 1 debe bloquear"
mkdir -p "$T/freno-ok/.claude/hooks"; cp "$FRENO" "$T/freno-ok/.claude/hooks/freno.sh"
printf '%s' "$(bash_json ls "$T/freno-ok")" | CLAUDE_PROJECT_DIR="$T/freno-ok" bash -c "$CMD" >/dev/null 2>&1
[ $? = 0 ] && pasa=$((pasa+1)) || mal "settings: freno sano deja pasar ls"
jq -e . "$SETTINGS" >/dev/null && pasa=$((pasa+1)) || mal "settings.json no es JSON válido"

echo "freno: $pasa pasan, $falla fallan"
[ "$falla" -eq 0 ]
