#!/usr/bin/env bash
# crear-rama.sh <id> <slug> "<título>" [dependencias…] [--ensayo]
# Crea equipo/<id>-<slug> desde origin/main en la línea 1, abre el hilo de la historia
# (docs/superpowers/hilos/<id>.md, con las dependencias declaradas), lo commitea y empuja.
# Solo si la línea está libre y el equipo no está en pausa.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
ID="${ARGS[0]:-}"; SLUG="${ARGS[1]:-}"; TITULO="${ARGS[2]:-}"
DEPS=("${ARGS[@]:3}")
case "$ID" in ''|*[!a-z0-9-]*) no_hecho "id inválido '$ID' (p. ej. ui-1)";; esac
case "$SLUG" in ''|*[!a-z0-9-]*) no_hecho "slug inválido '$SLUG' (minúsculas y guiones)";; esac
[ -z "$TITULO" ] && no_hecho "falta el título"
en_pausa
L=1; D=$(linea_dir "$L"); RAMA="equipo/$ID-$SLUG"
[ -d "$D" ] || no_hecho "no existe la línea $D (preparar-carpetas.sh)"
linea_libre "$L" || no_hecho "la línea $L no está libre: tiene '$(rama_de_linea "$L")' o cambios sin commitear. Mira con los ojos (git status) antes de tocarla."
git -C "$D" ls-remote --exit-code --heads origin "$RAMA" >/dev/null 2>&1 && no_hecho "la rama $RAMA ya existe en origin"

correr git -C "$D" fetch -q origin main || no_hecho "fetch falló"
correr git -C "$D" switch -q -c "$RAMA" origin/main || no_hecho "no pude crear $RAMA"
if [ "$ENSAYO" -eq 1 ]; then
  echo "ENSAYO: (cd $D && bash agentes/scripts/hilo.sh crear $ID \"$TITULO\" ${DEPS[*]:-})"
else
  (cd "$D" && bash agentes/scripts/hilo.sh crear "$ID" "$TITULO" ${DEPS[@]+"${DEPS[@]}"}) || no_hecho "no pude abrir el hilo"
fi
correr git -C "$D" add "docs/superpowers/hilos/$ID.md"
correr git -C "$D" commit -q -m "docs(hilo): abre $ID $SLUG" || no_hecho "no pude commitear el hilo"
correr git -C "$D" push -q -u origin "$RAMA" || no_hecho "no pude empujar $RAMA"
anotar "$RAMA" "rama creada en línea $L con hilo $ID" "crear-rama.sh $ID $SLUG"
echo "HECHO: $RAMA lista en $D con docs/superpowers/hilos/$ID.md. → SIGUIENTE: Diseño hace la maqueta en esa rama."
