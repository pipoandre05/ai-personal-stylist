# Equipo de bots de Estilo — guía operativa

Seis bots en OpenMausBot construyen la **interfaz** de ai-personal-stylist contra el asesor simulado, sin
aprobación tuya por historia. Diseño completo, evidencia y riesgos: `docs/superpowers/plans/2026-11-14-equipo-mausbot.md`.

| Bot | Carpeta | Hace |
|---|---|---|
| Productor Estilo | `…/ai-personal-stylist-torre` | elige y abre historias, arma las conversaciones, decide, te escala solo dudas funcionales |
| Diseño Estilo | `…/ai-personal-stylist-linea-1` | maqueta (validada por Opus) y revisión visual |
| Constructor Estilo | `…/ai-personal-stylist-linea-1` | construye y conversa con Revisor, QA y Diseño hasta que aprueban |
| Revisor Estilo | `…/ai-personal-stylist-linea-1` | revisa la rama y firma VEREDICTO sobre un sha |
| QA Estilo | `…/ai-personal-stylist-linea-1` | humo a 390 px contra el asesor simulado y firma VEREDICTO |
| DevOps Estilo | `…/ai-personal-stylist-torre` | rama, PR, merge por condiciones, vigila `main`, revierte |

## 1. Cómo le hablas al equipo

Solo al **Productor Estilo** (su conversación o la sala "Estilo — taller"). Ejemplos:

- "Arranca UI-1" · "Después de UI-2 va UI-4" · "Estado" · "Para UI-3: la paleta va antes que el look".
- Cuando te llegue una `DUDA FUNCIONAL · <id>`: responde con la letra y, si quieres, una frase. El equipo siguió con lo demás mientras tanto.
- Cuando te llegue un `PEDIDO A LA INTEGRADORA`: es algo fuera de la frontera (tipo, asesor simulado, dependencia). Lo haces en tu sesión integradora y le avisas al Productor.
- Después de cada merge te llega `MERGEADO · <id>` con qué mirar en el teléfono. No tienes que aprobar nada.

## 2. Cómo ves en qué está

1. La sala "Estilo — taller": el Productor publica el inicio y el cierre de cada historia.
2. `bash agentes/torre/scripts/estado.sh` desde cualquier terminal (o "/torre estado" a DevOps): pausa, línea, PRs `equipo/*`, CI de `main`.
3. El hilo de la historia: `docs/superpowers/hilos/<id>.md` en la línea (toda la conversación entre bots, con veredictos).
4. `…/ai-personal-stylist-torre/.torre/bitacora.md`: cada acción de DevOps.
5. Consumo: `~/.openmausbot/usage/<año-mes>.jsonl` (campos `botName`, `model`, `costUsd`, `input`, `cachedInput`, `output`). Por bot en el día:
   `jq -r 'select(.botName|test("Estilo$")) | [.at[0:10], .botName, .model, .costUsd] | @tsv' ~/.openmausbot/usage/2026-11.jsonl | awk -F'\t' '{s[$1" "$2]+=$4} END {for (k in s) printf "%s  US$ %.2f\n", k, s[k]}' | sort`

## 3. Cómo lo detienes

| Qué quieres | Cómo |
|---|---|
| Que nadie empiece nada ni se mergee nada | `touch /Users/pipoandre/Documents/claude.nosync/ai-personal-stylist-torre/.torre/PAUSA` — los SOUL la respetan y `condiciones-merge.sh` no deja mergear |
| Frenar el merge de un PR puntual | etiqueta `equipo:pausa` en el PR |
| Parar un turno que está corriendo | botón de detener en la conversación del bot en la app |
| Cortar en seco a un bot | detener su turno y bajarlo a "Pregúntame primero" (Ask): desde ahí cada herramienta pide tarjeta. La app tiene una bajada de emergencia a Ask que corta el turno (`isEmergencyApprovalDowngrade`, `shared/approval-mode.js`), pero no verifiqué que se dispare al bajarlo a mano |
| Apagar lo automático | desactivar las rutinas "Avanzar el equipo" (Productor) y "Vigilar main" (DevOps) |
| Reanudar | `rm …/ai-personal-stylist-torre/.torre/PAUSA` y decirle al Productor "sigue" |

Nada corre con el Mac dormido. Si `main` queda roja y el revert automático no basta, te llega directo.

## 4. Cómo se agrega una segunda línea

Cuando la línea 1 lleve dos historias mergeadas sin incidentes (plan §3.2 de agente-primero):

1. Sesión integradora: `git -C …/ai-personal-stylist-torre worktree add --detach ../ai-personal-stylist-linea-2 origin/main`, marcador `.equipo-mausbot`, skills y `web/.env.local` como en `preparar-carpetas.sh` (agregarle un parámetro de línea), `npm ci`.
2. Ajustar los scripts de la Torre que hoy fijan la línea 1 (`crear-rama.sh` usa `L=1`) para recibir la línea, y la regla de §2 de `agentes/torre/references/reglas.md` para dos ramas a la vez (historias con archivos disjuntos; merge en el orden de sus dependencias; la segunda se actualiza desde `main` antes de su humo).
3. En la app: importar solo el miembro `constructor` (o duplicar el bot) como "Constructor 2 Estilo", carpeta `…-linea-2`, mismo modelo y aprobación; agregarlo a la sala.
4. Revisor, QA y Diseño atienden las dos líneas: reciben la carpeta en cada encargo (hoy su carpeta fija es la línea 1; con dos líneas conviene pasarlos a la Torre y trabajar con `git -C`).
5. El Productor reparte: una historia por línea, nunca dos que toquen los mismos archivos.

## 5. Qué hay en `agentes/`

| Ruta | Qué es |
|---|---|
| `bots/<rol>/SOUL.md`, `bots/_comun.md` | instrucciones de cada bot; el bloque común sale de `_comun.md` |
| `ai-personal-stylist.mausteam.json` | archivo de equipo para importar (formato `openmaus.team` v2) |
| `configuracion-bots.json` | lo que el archivo de equipo no transporta: modelo, esfuerzo, carpeta, aprobación, sala, rutinas |
| `scripts/exportar-equipo.py` | regenera SOUL y JSON (`--verificar` para comprobar) |
| `scripts/verificar-frontera.sh` (+ test) | frontera de archivos del equipo |
| `scripts/condiciones-merge.sh` (+ test) | las 7 condiciones objetivas de merge |
| `scripts/hilo.sh` | el hilo de conversación por historia, append-only, con tope de vueltas |
| `scripts/preparar-carpetas.sh` | crea el clon de la Torre y la línea (tiene `--ensayo`) |
| `torre/` | skill `/torre` de DevOps, propuesta lista para copiar (la copia `preparar-carpetas.sh`) |
| `skills/estilo-equipo/` | protocolo común: encargos, hilo, veredictos, humo, maqueta, escalamiento |
| `propuesta-settings/` | `settings.json` y `hooks/freno.sh` (+ test) para `.claude/`; `ci-frontera.yml` para la CI |

Pruebas: `bash agentes/scripts/test-verificar-frontera.sh` · `bash agentes/scripts/test-condiciones-merge.sh` ·
`bash agentes/propuesta-settings/hooks/test-freno.sh` · `python3 -I agentes/scripts/exportar-equipo.py --verificar`.
