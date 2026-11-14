#!/usr/bin/env bash
# test-condiciones-merge.sh — pruebas de condiciones-merge.sh y hilo.sh con un repo y un gh de mentira.
# Uso: bash agentes/scripts/test-condiciones-merge.sh   (no toca GitHub ni el repo real)
set -uo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
C="$AQUI/condiciones-merge.sh"; HILO="$AQUI/hilo.sh"
T=$(mktemp -d "${TMPDIR:-/tmp}/condiciones.XXXXXX")
trap 'rm -rf "$T"' EXIT
pasa=0; falla=0
ok()  { pasa=$((pasa+1)); }
mal() { falla=$((falla+1)); echo "FALLA: $*"; }
export CONDICIONES_SIN_FETCH=1 TORRE_PAUSA="$T/PAUSA"

cd "$T" || exit 2
git init -q -b main --bare origen.git
git clone -q origen.git repo 2>/dev/null
R="$T/repo"; cd "$R" || exit 2
git config user.email t@t; git config user.name t
mkdir -p web/src/app web/src/components web/src/lib/agent
echo a > web/src/app/page.tsx; echo a > web/src/lib/agent/a.ts; echo a > README.md
git add -A; git commit -qm base; git push -q origin main

git switch -qc equipo/ui-1-hilo
bash "$HILO" crear ui-1 "El hilo" >/dev/null
echo b > web/src/components/hilo.tsx
git add -A; git commit -qm "feat: hilo"
SHA=$(git rev-parse HEAD)
echo "Revisión ok" | bash "$HILO" veredicto ui-1 Revisor aprobado "$SHA" >/dev/null
echo "Humo ok"     | bash "$HILO" veredicto ui-1 QA aprobado "$SHA" >/dev/null
git add -A; git commit -qm "docs: veredictos"; git push -q origin equipo/ui-1-hilo
git fetch -q origin

json() { # json <archivo> [jq-modificación]
  local h; h=$(git -C "$R" rev-parse "origin/equipo/ui-1-hilo")
  jq -n --arg oid "$h" '{state:"OPEN",isDraft:false,baseRefName:"main",headRefName:"equipo/ui-1-hilo",headRefOid:$oid,
     labels:[],mergeable:"MERGEABLE",
     statusCheckRollup:[{name:"verify",status:"COMPLETED",conclusion:"SUCCESS"}],
     files:[{path:"web/src/components/hilo.tsx"},{path:"docs/superpowers/hilos/ui-1.md"}]}' | jq "${2:-.}" > "$1"
}
espera() { # espera <codigo> <desc> [jq-mod]
  json "$T/pr.json" "${3:-.}"
  CONDICIONES_GH_JSON="$T/pr.json" bash "$C" 7 --repo "$R" > "$T/salida" 2>&1; local got=$?
  [ "$got" = "$1" ] && ok || { mal "$2 (esperaba $1, salió $got)"; sed 's/^/    /' "$T/salida"; }
}

espera 0 "todo en orden"
espera 1 "borrador"                  '.isDraft=true'
espera 1 "no apunta a main"          '.baseRefName="develop"'
espera 1 "rama ajena al equipo"      '.headRefName="feat/otra"'
espera 1 "etiqueta equipo:pausa"     '.labels=[{name:"equipo:pausa"}]'
espera 1 "CI rojo"                   '.statusCheckRollup=[{name:"verify",status:"COMPLETED",conclusion:"FAILURE"}]'
espera 1 "CI corriendo"              '.statusCheckRollup=[{name:"verify",status:"IN_PROGRESS",conclusion:null}]'
espera 1 "toca web sin check verify" '.statusCheckRollup=[]'
espera 1 "no mergeable"              '.mergeable="CONFLICTING"'
espera 1 "sha del PR distinto"       '.headRefOid="0000000000000000000000000000000000000000"'
touch "$T/PAUSA"; espera 1 "archivo PAUSA"; rm -f "$T/PAUSA"

# commit que solo toca el hilo después del veredicto: sigue valiendo
git switch -q equipo/ui-1-hilo
echo "nota de cierre" | bash "$HILO" turno ui-1 DevOps nota >/dev/null
git add -A; git commit -qm "docs: nota"; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 0 "commit de solo hilo después del veredicto"

# main avanza (archivo que no choca) y la rama se actualiza por merge limpio: sigue valiendo
git switch -q main; echo z > web/src/app/otra.tsx; git add -A; git commit -qm "main avanza"; git push -q origin main
git fetch -q origin
espera 1 "rama atrás de main"
git switch -q equipo/ui-1-hilo; git merge -q --no-edit origin/main; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 0 "merge limpio desde main después del veredicto"

# código nuevo después del veredicto: ya no vale
echo c > web/src/components/hilo.tsx; git add -A; git commit -qm "fix sin revisar"; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 1 "código nuevo después del veredicto"
SHA2=$(git rev-parse HEAD)
echo ok | bash "$HILO" veredicto ui-1 Revisor aprobado "$SHA2" >/dev/null
echo ok | bash "$HILO" veredicto ui-1 QA aprobado "$SHA2" >/dev/null
git add -A; git commit -qm "docs: veredictos 2"; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 0 "veredictos renovados sobre el código nuevo"

# QA rechaza al final: el último veredicto manda
echo "vuelve" | bash "$HILO" veredicto ui-1 QA rechazado "$SHA2" >/dev/null
git add -A; git commit -qm "docs: qa rechaza"; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 1 "último veredicto de QA es rechazado"
echo ok | bash "$HILO" veredicto ui-1 QA aprobado "$SHA2" >/dev/null
git add -A; git commit -qm "docs: qa aprueba"; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 0 "QA vuelve a aprobar"

# se cuela un archivo fuera de la frontera
echo x > web/src/lib/agent/a.ts; git add -A; git commit -qm "toca agente"; SHA3=$(git rev-parse HEAD)
echo ok | bash "$HILO" veredicto ui-1 Revisor aprobado "$SHA3" >/dev/null
echo ok | bash "$HILO" veredicto ui-1 QA aprobado "$SHA3" >/dev/null
git add -A; git commit -qm "docs: aprueban"; git push -q origin equipo/ui-1-hilo; git fetch -q origin
espera 1 "diff fuera de la frontera aunque esté aprobado"

# entradas inválidas: falla cerrado
echo "no es json" > "$T/malo.json"
CONDICIONES_GH_JSON="$T/malo.json" bash "$C" 7 --repo "$R" >/dev/null 2>&1; [ $? = 2 ] && ok || mal "json ilegible debe dar 2"
bash "$C" abc --repo "$R" >/dev/null 2>&1; [ $? = 2 ] && ok || mal "PR no numérico debe dar 2"
json "$T/pr.json" '.headRefName="equipo/ui-9-no-existe"'
CONDICIONES_GH_JSON="$T/pr.json" bash "$C" 7 --repo "$R" >/dev/null 2>&1; [ $? = 2 ] && ok || mal "rama inexistente debe dar 2"

# hilo.sh: validaciones y tope de vueltas
git switch -q equipo/ui-1-hilo
bash "$HILO" turno ui-1 Gerente nota </dev/null >/dev/null 2>&1; [ $? = 2 ] && ok || mal "rol inválido"
echo x | bash "$HILO" veredicto ui-1 Constructor aprobado "$SHA2" >/dev/null 2>&1; [ $? = 2 ] && ok || mal "Constructor no da veredicto"
echo x | bash "$HILO" veredicto ui-1 QA aprobado deadbeef1 >/dev/null 2>&1; [ $? = 2 ] && ok || mal "sha inexistente"
for i in 1 2 3 4; do echo "hallazgo $i" | bash "$HILO" turno ui-1 QA hallazgos >/dev/null || mal "vuelta $i"; done
echo "hallazgo 5" | bash "$HILO" turno ui-1 QA hallazgos >/dev/null 2>&1; [ $? = 3 ] && ok || mal "la quinta vuelta debe toparse"
[ "$(bash "$HILO" vueltas ui-1)" = "4" ] && ok || mal "cuenta de vueltas"
antes=$(head -c 200 docs/superpowers/hilos/ui-1.md)
echo "otra" | bash "$HILO" turno ui-1 Constructor respuesta >/dev/null
[ "$(head -c 200 docs/superpowers/hilos/ui-1.md)" = "$antes" ] && ok || mal "append-only: cambió el inicio"

echo "condiciones-merge + hilo: $pasa pasan, $falla fallan"
[ "$falla" -eq 0 ]
