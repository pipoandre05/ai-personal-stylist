#!/usr/bin/env bash
# hilo.sh — el archivo de conversación de una historia: docs/superpowers/hilos/<id>.md
#
# Es el registro append-only de lo que los bots se dicen sobre una historia
# (Productor, Diseño, Constructor, Revisor, QA, DevOps). El transporte de cada
# turno es `coordinate_bots` de OpenMausBot; el hilo es la memoria compartida y
# la evidencia que DevOps lee antes de mergear (los VEREDICTO). Nunca se edita
# un turno anterior: solo se agregan turnos al final, siempre con este script.
#
# Uso (desde la carpeta de la línea, en la rama de la historia):
#   hilo.sh crear <id> "<título>" [dependencias…]   crea el hilo (lo usa DevOps al crear la rama)
#   hilo.sh turno <id> <Rol> <tipo> [archivo]       agrega un turno; el cuerpo sale del archivo o de stdin
#   hilo.sh veredicto <id> <Revisor|QA> <aprobado|rechazado> <sha> [archivo]
#   hilo.sh vueltas <id>                            cuántas vueltas QA→Constructor van (tope 4)
#   hilo.sh estado <id>                             último veredicto de Revisor y de QA
#
# Rol: Productor | Diseño | Constructor | Revisor | QA | DevOps
# tipo: encargo | hallazgos | respuesta | decision | nota | escalamiento
# Un turno "hallazgos" de QA abre una vuelta; el Constructor responde con "respuesta".
# Compatible con bash 3.2. Escribe con un candado (mkdir) para que dos bots no se pisen.
set -uo pipefail

TOPE_VUELTAS="${HILO_TOPE_VUELTAS:-4}"
ROLES="Productor Diseño Constructor Revisor QA DevOps"
TIPOS="encargo hallazgos respuesta decision nota escalamiento"

raiz=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "ERROR: no estoy dentro de un repo git" >&2; exit 2; }
gitdir=$(git rev-parse --absolute-git-dir 2>/dev/null) || exit 2
DIR="$raiz/docs/superpowers/hilos"

valida_id() { case "$1" in ''|*[!a-z0-9-]*) echo "ERROR: id inválido '$1' (minúsculas, números y guiones, p. ej. ui-1)" >&2; exit 2 ;; esac; }
en_lista()  { local x="$1"; shift; for y in "$@"; do [ "$x" = "$y" ] && return 0; done; return 1; }
archivo()   { echo "$DIR/$1.md"; }

con_candado() { # con_candado <comando…>
  local c="$gitdir/hilo.lock" i=0
  until mkdir "$c" 2>/dev/null; do
    i=$((i + 1)); [ "$i" -gt 50 ] && { echo "ERROR: el hilo está tomado hace más de 10 s ($c). Si nadie escribe, borra esa carpeta vacía." >&2; exit 2; }
    sleep 0.2
  done
  "$@"; local r=$?
  rmdir "$c" 2>/dev/null
  return $r
}

ahora() { TZ=America/Santiago date '+%Y-%m-%d %H:%M'; }

cuerpo() { # cuerpo [archivo] → el texto del turno (archivo o stdin)
  if [ -n "${1:-}" ]; then cat "$1"; elif [ ! -t 0 ]; then cat; fi
}

vueltas() { [ -f "$(archivo "$1")" ] || { echo 0; return; }; grep -c '^### .* · QA · hallazgos' "$(archivo "$1")" | tr -d ' '; }

escribir_turno() { # escribir_turno <id> <rol> <tipo> <texto>
  local f; f=$(archivo "$1")
  {
    printf '\n### %s · %s · %s · vuelta %s\n\n' "$(ahora)" "$2" "$3" "$(vueltas "$1")"
    printf '%s\n' "$4"
  } >> "$f"
}

cmd="${1:-}"; shift || true
case "$cmd" in
  crear)
    id="${1:-}"; titulo="${2:-}"; valida_id "$id"; shift 2 || true
    [ -z "$titulo" ] && { echo "ERROR: falta el título" >&2; exit 2; }
    f=$(archivo "$id"); [ -e "$f" ] && { echo "YA EXISTE: $f (no lo piso)"; exit 0; }
    mkdir -p "$DIR"
    deps="ninguna"; [ $# -gt 0 ] && deps="$*"
    rama=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
    cat > "$f" <<EOF
# Hilo $id — $titulo

- **Rama:** \`$rama\`
- **Dependencias declaradas:** $deps
- **Tope de vueltas QA ↔ Constructor:** $TOPE_VUELTAS (al tope decide el Productor)
- **Reglas:** append-only con \`agentes/scripts/hilo.sh\`; nunca se edita un turno anterior. Los VEREDICTO los lee DevOps antes de mergear.
EOF
    echo "CREADO: $f"
    ;;
  turno)
    id="${1:-}"; rol="${2:-}"; tipo="${3:-}"; valida_id "$id"
    en_lista "$rol" $ROLES || { echo "ERROR: rol '$rol' no es uno de: $ROLES" >&2; exit 2; }
    en_lista "$tipo" $TIPOS || { echo "ERROR: tipo '$tipo' no es uno de: $TIPOS" >&2; exit 2; }
    [ -f "$(archivo "$id")" ] || { echo "ERROR: no existe el hilo $id (DevOps lo crea con la rama)" >&2; exit 2; }
    texto=$(cuerpo "${4:-}")
    [ -z "$texto" ] && { echo "ERROR: el turno viene vacío" >&2; exit 2; }
    if [ "$rol" = "QA" ] && [ "$tipo" = "hallazgos" ] && [ "$(vueltas "$id")" -ge "$TOPE_VUELTAS" ]; then
      echo "TOPE: ya van $TOPE_VUELTAS vueltas de hallazgos. No abro otra: el Constructor y QA llevan su evidencia al Productor, que decide." >&2
      exit 3
    fi
    con_candado escribir_turno "$id" "$rol" "$tipo" "$texto" || exit 2
    echo "TURNO: $rol · $tipo en $(archivo "$id") (vuelta $(vueltas "$id"))"
    ;;
  veredicto)
    id="${1:-}"; rol="${2:-}"; estado="${3:-}"; sha="${4:-}"; valida_id "$id"
    en_lista "$rol" Revisor QA || { echo "ERROR: solo Revisor y QA emiten veredicto" >&2; exit 2; }
    en_lista "$estado" aprobado rechazado || { echo "ERROR: el veredicto es 'aprobado' o 'rechazado'" >&2; exit 2; }
    case "$sha" in ''|*[!0-9a-f]*) echo "ERROR: falta el sha revisado (git rev-parse HEAD)" >&2; exit 2 ;; esac
    [ "${#sha}" -lt 7 ] && { echo "ERROR: el sha debe tener al menos 7 caracteres" >&2; exit 2; }
    completo=$(git rev-parse --verify --quiet "$sha^{commit}") || { echo "ERROR: el sha $sha no existe en este repo" >&2; exit 2; }
    [ -f "$(archivo "$id")" ] || { echo "ERROR: no existe el hilo $id" >&2; exit 2; }
    texto=$(cuerpo "${5:-}")
    [ -z "$texto" ] && texto="(sin detalle)"
    con_candado escribir_turno "$id" "$rol" "veredicto" "$texto

VEREDICTO: $rol $estado sha=$completo" || exit 2
    echo "VEREDICTO: $rol $estado sha=$completo"
    ;;
  vueltas) id="${1:-}"; valida_id "$id"; vueltas "$id" ;;
  estado)
    id="${1:-}"; valida_id "$id"; f=$(archivo "$id")
    [ -f "$f" ] || { echo "sin hilo"; exit 1; }
    for r in Revisor QA; do
      v=$(grep "^VEREDICTO: $r " "$f" | tail -n 1)
      echo "${v:-VEREDICTO: $r pendiente}"
    done
    echo "vueltas: $(vueltas "$id") de $TOPE_VUELTAS"
    ;;
  *) sed -n '2,20p' "$0"; exit 2 ;;
esac
