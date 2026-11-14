# Plan — Equipo de bots de Estilo en OpenMausBot

**Estado:** preparado, **nada instalado** · **Fecha:** 2026-11-14 · **Decisión:** DP-21 · **Base:** el equipo de Prendie
(`vault research/prendie-equipo-mausbot.md` v4 + §7c, clon `prendie-torre`) con los cambios que pidió Felipe.
**App revisada:** OpenMausBot **0.1.158** (`/Applications/OpenMausBot.app/Contents/Resources/server/package.json`); la nota de
Prendie describía la 0.1.123, así que todo lo de la app se volvió a verificar en el código.

## 0. Resumen

1. **6 bots, una línea, Sonnet 5.5:** Productor, Diseño (+ validador Opus), Constructor, Revisor, QA, DevOps. Construyen la
   interfaz (UI-1…UI-6) contra el asesor simulado; Felipe no aprueba nada por historia.
2. **Los bots sí conversan entre ellos**, por `coordinate_bots`: hoy la app permite cadenas de encargos de hasta 4 niveles y
   que quien encarga reciba el resultado y vuelva a encargar sobre lo mismo. El **Constructor lleva la conversación** con
   Revisor, QA y Diseño (tope 4 vueltas con QA), sin pasar por el Productor. El hilo `docs/superpowers/hilos/<id>.md`
   es la memoria compartida y la evidencia.
3. **DevOps mergea solo** cuando se cumplen 7 condiciones objetivas (`agentes/scripts/condiciones-merge.sh`), reemplazo de
   la etiqueta `torre:aprobado`. Revierte si `main` se pone roja.
4. **Permisos full con control en mecanismos:** freno `PreToolUse` que falla cerrado (180 casos de prueba en verde), frontera
   de archivos (39 casos) y condiciones de merge (28 casos).
5. **Pendiente para encender:** PR #1 en `main`, PR con este trabajo, aplicar la propuesta de `.claude/`, preparar carpetas,
   importar y configurar en la app, humo con `ui-0`. Pasos en §11.

## 1. Qué permite hoy la app (evidencia)

Rutas relativas a `/Applications/OpenMausBot.app/Contents/Resources/server/`.

| Tema | Lo que hay | Evidencia |
|---|---|---|
| Archivo de equipo | `openmaus.team` **v2**: por miembro `key`, `name`, `title`, `description`, `soul` (≤ 24.000 bytes), `appearance.color`. **No** transporta modelo, carpeta, aprobación, MCP, skills ni rutinas. El v1 trae una sala, pero el importador no la usa | `server/team-manifest.js`; `server/package-import.js` (`runImport`) |
| Formato más rico | `openmaus.package` v2: salas con boletín, rutinas (llegan pausadas), skills de un solo `SKILL.md`, aprobación sugerida solo `ask`/`auto`. Tampoco lleva modelo ni carpeta. Exige muchos campos de catálogo; no lo usé | `shared/package-format.js` |
| Importar sin la interfaz | Existe `POST /api/teams/import?mode=add\|project&cwd=…&room=…` en el servidor local, pero requiere la autenticación de la app (token). Una sesión de Claude no debe leer ese token: **la importación se hace en la interfaz** ("+" → Plantillas → "Trae tu propio equipo", con Modo avanzado). Con `mode=project` y `cwd` la sala fijaría **una** carpeta para todos (mal para la línea) | `server/routes/teams.js` (l. ~271–360), `server/package-import.js` (l. ~353) |
| Nombres | Un nombre repetido se numera ("Productor 2"). Ya existen "Productor", "QA", "DevOps", "Revisor", "Diseño" de Prendie: por eso los bots se llaman "… Estilo" | `shared/import-name.js` vía `importedMemberProfile`; `~/.openmausbot/bots.json` (solo nombres) |
| Validación | El JSON pasó el **parser real de la app** (`parseTeamManifest` de 0.1.158, ejecutado en una copia en el scratchpad) | salida: "VALIDO: openmaus.team v2 … 6 miembros" |
| Aprobación | Niveles `ask`, `edits`, `auto`, `full`, `custom`; **default `full`** en un espacio personal; el import no fija nivel ("an imported bot starts at the defaults"). `full` = `--permission-mode bypassPermissions` de Claude Code | `packages/phone-protocol/src/approval-mode.js`; `server/drivers/claude.js` l. ~876–905 |
| Fijar `full` por bot | En la interfaz (ajustes del bot) o, como se probó en Prendie (2026-11-03), escribiendo `approvalMode`, `modelSelection {model, effort}`, `cwd`, `chiefOfStaff` en `~/.openmausbot/bots.json` **con la app cerrada** (los bots de Prendie hoy tienen esos campos) | `prendie-torre/agentes/README.md` §3.6; `~/.openmausbot/bots.json` |
| Aislamiento | Cada turno: `--setting-sources project`, `--strict-mcp-config`, `--add-dir <skills importadas>`. El bot lee `CLAUDE.md`, `.claude/settings.json` (hooks y `permissions`) y `.claude/skills/` **de su carpeta** | `server/drivers/claude.js` l. ~929–940 |
| Skills | No ve las de `~/.claude/skills` ni plugins. Llegan por `.claude/skills/` de la carpeta (Prendie lo resolvió así el 2026-11-03) o por la biblioteca (`~/.openmausbot/imported-skills/`: archify, brag-slim, i-have-adhd, remotion-motion-graphics, video) | `prendie-torre/agentes/README.md` §3.4; `ls ~/.openmausbot/imported-skills` |
| `coordinate_bots` | 1–4 bots por llamada, mensaje ≤ 4.000 caracteres, `reply: resume\|none`, `rework`, `thread: standing\|new\|<id>`, `consult`, `done_when`, `answers`, `in_my_folder` (**default true: el encargo corre en la carpeta de quien encarga**) | `server/drivers/agents-catalog.js` l. 223–240; `server/bot-cwd.js` `inMyFolderCwd`; `server/index.js` l. ~14134 y ~14211 |
| Profundidad | El árbol de encargos admite **profundidad 4**, 64 encargos y 96 turnos por raíz sin progreso. No se puede encargar trabajo a un ancestro (se le pregunta terminando el turno). `MAX_COMMS_DEPTH = 1` sigue existiendo, pero gobierna los turnos de sala, no la cadena de encargos. Prendie verificó una cadena de 3 (Productor → Opus → Fable) el 2026-11-04 | `server/runtime-coordinator.js` l. 12–35 y 161; `server/runtime/runtime.js` l. 184–189; `prendie-torre/.claude/skills/prendie-handoff/SKILL.md` § Quién encarga a quién |
| Conversación directa en sala | En una sala, si un bot menciona a otro con `@Nombre`, el otro responde: **máximo 3 saltos por mensaje humano**, solo en turnos que nacen de una persona (en un encargo `followMentions: false`). Freno de bucles: anillo A→B→C→A en 2 min cierra la sala 5 min; 10 mensajes por bot por minuto; los trabajos de la sala van de a uno | `server/index.js` l. 9872 (`MAX_GROUP_HOPS = 3`), l. ~10779; `server/room-post-budget.js`; `server/room-queue.js` |
| Meta de sala ("goal") | Un mensaje en modo meta lo conduce un coordinador (respondedor elegido o el Chief of Staff): hasta **13 turnos** alternando coordinador → especialista; se corta si repite la misma tarea 3 veces. Lo inicia una persona o una rutina `room-goal` | `server/group-goal-run.js`; `server/routes/channels.js` l. ~309; `server/routines.js` (`target: "room-goal"`) |
| `post_to_room` | Publica en una sala sin iniciar turnos; máx. 3 por turno y 4.000 caracteres | `server/index.js` l. 1661, 9884, ~14428 |
| Carpeta de sala | Si la sala tiene carpeta, todos sus turnos corren ahí; sin carpeta, cada bot usa la suya | `server/room-cwd.js`; `server/store.js` `pinGroupCwd` |
| Consumo | `~/.openmausbot/usage/<año-mes>.jsonl`: `botName`, `model`, `input`, `cachedInput`, `output`, `costUsd`, `costSource`, `trigger`, `threadId` | lectura de las claves de una línea |

## 2. Qué se toma de Prendie y qué cambia

| Se toma | Cambia |
|---|---|
| Bots con SOUL, memoria, modelo y carpeta propios; SOUL versionados en `agentes/bots/` y exportados a JSON | 6 bots en vez de 10: sin Arquitectos ni Analista (el contrato ya existe), una línea |
| Modelo de autoridad v4: Productor director de ejecución | **Escala a Felipe solo dudas funcionales** que no estén en `docs/producto/`, tras buscarlas y con formato corto |
| Optimización §7c: Sonnet por defecto; Opus solo validando la maqueta | Sin Haiku ni Gemini (pocas historias, interfaz con criterio visual) |
| Torre como DevOps, scripts reversibles, `HICE:`/`→ SIGUIENTE:`, bitácora | **Merge por condiciones objetivas**, sin `torre:aprobado`; DevOps crea la rama, mergea y revierte |
| Clon de la Torre + carpeta fija de línea (git no permite dos checkouts de `main`) | Sin Supabase por línea ni migraciones: asesor simulado, cero esquema |
| Freno `PreToolUse` y `deny` del repo | Freno nuevo que **falla cerrado**, cubre `.env*`, Supabase, deploys, dependencias, `rm -r` y la frontera; pensado para bots en `full` |
| Encargos por archivo y veredictos de QA | **Conversación Constructor ↔ QA/Revisor/Diseño** con tope de vueltas y un hilo por historia con veredictos firmados sobre un sha |
| Skills copiadas a `.claude/skills/` | Una skill de protocolo (`estilo-equipo`) en vez de cinco `prendie-*` |

## 3. Roles

| Bot | Decide | No decide | Modelo · esfuerzo |
|---|---|---|---|
| Productor | qué historia sigue; criterios de aceptación (citando `docs/producto/`); si la maqueta cumple; qué se difiere; desacuerdos al tope | frontera y contrato (los pide a la integradora); reglas de negocio ausentes (escala); el merge | Sonnet 5.5 · medio |
| Diseño | la maqueta y su copy dentro de `DESIGN.MD`; hallazgos visuales | tokens (`DESIGN.MD` está fuera de la frontera); código de producción | Sonnet 5.5 · medio + 1 subagente Opus validador |
| Constructor | cómo implementar dentro de la frontera; cuándo pedir revisión; cómo responder hallazgos | nada fuera de la frontera; dependencias; veredictos | Sonnet 5.5 · alto (subagentes Sonnet si > 3 archivos) |
| Revisor | su veredicto, sobre un sha | arreglar código; aprobar con hallazgos de Diseño abiertos | Sonnet 5.5 · alto |
| QA | su veredicto, sobre un sha; severidad de hallazgos | producto (lo funcional va al Productor) | Sonnet 5.5 · medio |
| DevOps | crear rama, actualizar, abrir PR, mergear y revertir **cuando el script lo permite** | saltar una condición; quitar la pausa; tocar código | Sonnet 5.5 · medio |

## 4. Mecanismo de conversación entre bots

**Elegido: `coordinate_bots` con el Constructor como anfitrión de la conversación técnica + hilo por historia.**

```
Felipe ──(una vez)──▶ Productor ──▶ DevOps (rama + hilo)
                         │
                         ├──▶ Diseño ──consult──▶ Constructor        (factibilidad de la maqueta)
                         │
                         └──▶ Constructor ──▶ Revisor ∥ Diseño        (reply: resume)
                                   ▲  │  ◀── hallazgos (resultado)
                                   │  └──▶ corrige, turno "respuesta", rework al mismo bot, mismo hilo
                                   └──▶ QA ◀──▶ … hasta VEREDICTO aprobado (tope 4) ──▶ "LISTA <id> <sha>" al Productor
                         └──▶ DevOps (actualizar → PR → condiciones → merge → vigilar → liberar)
```

- **QA reporta, el Constructor corrige y responde, y repiten:** QA devuelve sus hallazgos como resultado del encargo (eso
  despierta al Constructor); el Constructor corrige, escribe su `respuesta` en el hilo y le vuelve a encargar a QA con
  `rework: true` en el mismo hilo de conversación (QA conserva el contexto). El Productor no participa en las vueltas.
  QA no puede encargarle trabajo al Constructor (es su ancestro), pero no lo necesita: su resultado es el mensaje.
- **Tope:** `hilo.sh` se niega a abrir una quinta vuelta de hallazgos de QA; las dos partes llevan su evidencia al Productor.
- **Profundidad usada:** Productor (0) → Constructor (1) → QA (2) → consulta de QA a Diseño (3). Cabe en el límite de 4.
- **`in_my_folder: false` en todo encargo**, o el bot que recibe trabaja en la carpeta de quien encarga.

| Opción | Cómo | Costo | Por qué no / sí |
|---|---|---|---|
| **A. Encargos con el Constructor de anfitrión (elegida)** | arriba | por vuelta: 1 turno de QA + 1 del Constructor; cero turnos del Productor | conversación real y automática; respeta la regla del ancestro; evidencia en el hilo |
| B. Sala con `@menciones` | bots se mencionan en "Estilo — taller" | cada turno carga toda la conversación de la sala; trabajos en serie | solo 3 saltos por mensaje **humano** y no funciona dentro de encargos: no sirve para un ciclo autónomo |
| C. Meta de sala (goal) | Felipe o una rutina `room-goal` lanza "lleva UI-1 a mergeable" | 13 turnos máx., la mitad son del coordinador (Productor) | útil como plan B o para que Felipe empuje una historia trabada; cada salto pasa por el coordinador |
| D. Solo archivo de hilo, Productor dispara cada turno | el Productor relee el hilo y encarga cada vuelta | +1 turno del Productor por vuelta y más latencia | es el relevo secuencial que Felipe quiere evitar |

La sala "Estilo — taller" (sin carpeta) queda para que Felipe vea el avance: el Productor publica inicio y cierre de cada
historia con `post_to_room`.

## 5. Flujo de una historia, sin aprobación humana

| # | Paso | Quién | Salida |
|---|---|---|---|
| 1 | Elegir historia (orden §3.4 de agente-primero; UI-5 espera el contrato del shopper) | Productor | decisión |
| 2 | Rama `equipo/<id>-<slug>` desde `origin/main` + hilo | DevOps (`crear-rama.sh`) | rama empujada, hilo con dependencias declaradas |
| 3 | Criterios de aceptación con fuente (`PRODUCT_BACKLOG`, `FUNCTIONAL_SPECS`, `UX_UI_SPEC`) | Productor | turno `encargo` |
| 4 | Maqueta (validada por Opus; `consult` al Constructor si hay duda de factibilidad) | Diseño | `docs/superpowers/mockups/<f>-<id>.html` |
| 5 | Aprobar maqueta (tope 2 vueltas) | Productor | turno `decision` |
| 6 | Construir; `npm run verify` verde; push | Constructor | commits en la rama |
| 7 | Revisión ∥ revisión visual → corrección → … | Constructor ↔ Revisor, Diseño | hallazgos/respuestas; VEREDICTO Revisor |
| 8 | Humo → corrección → … (tope 4) | Constructor ↔ QA | VEREDICTO QA con `## Humo` |
| 9 | Si hubo código tras un `aprobado`: re-revisión corta | Constructor ↔ Revisor/QA | veredictos sobre el último sha |
| 10 | "LISTA <id> <sha>" | Constructor → Productor | — |
| 11 | Actualizar (merge), PR, CI, condiciones, merge squash | DevOps | PR mergeado |
| 12 | Vigilar CI de `main`; si roja: revert exacto | DevOps | `main` verde |
| 13 | Liberar línea; informe `MERGEADO` a Felipe | DevOps, Productor | siguiente historia |

Dudas funcionales en cualquier paso: el bot → Productor; el Productor busca en `docs/producto/`, cita y sigue, o escala con
`DUDA FUNCIONAL` y el equipo avanza en lo que no depende.

## 6. Condiciones de merge (`agentes/scripts/condiciones-merge.sh <N>`)

1. PR abierto, no borrador, contra `main`, desde `equipo/<id>-<slug>`.
2. Sin pausa: ni `.torre/PAUSA` en el clon de la Torre ni etiqueta `equipo:pausa`.
3. CI sin rojos ni pendientes; si toca `web/`, el check `verify` (`npm run verify` en GitHub) en SUCCESS.
4. GitHub lo reporta MERGEABLE y su sha es el que ve git (y `mergear.sh` usa `--match-head-commit`).
5. `origin/main` contenido en la rama (al día por merge; el freno impide rebase y force).
6. Frontera respetada (`verificar-frontera.sh`).
7. Último `VEREDICTO` de Revisor y de QA = `aprobado`, sobre un sha de la rama; después solo commits que tocan el hilo o
   merges **limpios** desde `main` (se compara el árbol con `git merge-tree --write-tree`).

Squash siempre (`mergear.sh`). El freno vuelve a correr el script antes de dejar empezar `mergear.sh` o `gh pr merge`.
Rollback: `revertir.sh N` (revert exacto por patch-id, frontera, PR, CI verde en ≤ 20 min, squash); si choca o no queda
verde, escala.

## 7. Freno (`agentes/propuesta-settings/hooks/freno.sh`)

Hook `PreToolUse` para `Bash|Read|Grep|Edit|Write|MultiEdit|NotebookEdit` y para las herramientas MCP de migraciones y
deploys. Lo lee toda sesión del repo, bots incluidos. **Falla cerrado** en tres capas: el comando de `settings.json`
bloquea si `freno.sh` no existe y convierte cualquier salida ≠ 0 en 2; `freno.sh` bloquea si falta `python3` o si el
revisor revienta; las reglas que dependen de un script (frontera, condiciones) bloquean si no lo encuentran.

Bloquea: `push --force`/`-f`/`--force-with-lease`/`+refspec`/`--mirror`; `rebase`; `filter-branch`; `reset --hard` en
`main`, HEAD suelto o rama con upstream; borrar ramas que no sean `equipo/*` (y `branch -D` siempre); `clean -x`;
`vercel` salvo `ls|inspect|logs|whoami`; MCP de deploy; leer, imprimir, copiar o editar `.env*` (salvo los `example`), también
con Read/Grep y con `grep -r` sobre carpetas que los contienen; `supabase db push|link|migration up|functions deploy|secrets|…`,
`psql`, `pg_dump`; MCP `apply_migration`/`execute_sql`; `npm i <pkg>`/`pnpm|yarn|bun add` si el paquete no está en
"Dependencias declaradas" del hilo de la rama; `rm -r` y `find -delete` salvo carpetas regenerables o temporales;
`gh pr merge` sin condiciones o con `--admin|--auto|--merge|--rebase`; `gh api` con DELETE o sobre `/merge`; `gh secret|variable`.
En carpetas del equipo (marcador `.equipo-mausbot`): además push a `main`, `--no-verify`, `core.hooksPath`, toda la CLI de
Supabase, `gh pr close`, `worktree remove`, y **Edit/Write fuera de la frontera** o fuera de las carpetas del equipo.

Revisa por segmentos (`;`, `&&`, `|`…), entra en `bash -c`, `eval`, `$( )`, backticks, `xargs`, `find -exec`, `npx`; trata los
cuerpos de heredoc como dato salvo si van a un shell. Límites conocidos: no abre scripts corridos por ruta (salvo reconocer
`mergear.sh`), no ve `curl` contra la API de GitHub ni código que un intérprete arma en tiempo de ejecución.

Nota sobre dependencias: `web/package.json` está fuera de la frontera, así que una dependencia nueva, aunque se declare,
no puede llegar a `main` por el equipo. Hoy el camino es: el Productor la pide a la integradora. La declaración en el hilo
queda lista por si Felipe abre `package.json` al equipo más adelante.

## 8. Frontera (`agentes/scripts/verificar-frontera.sh`)

Lista blanca: `web/src/app/**`, `web/src/components/**`, `web/public/**`, `web/tests/ui/**`, `docs/superpowers/**`.
Lista negra (gana siempre): la de DP-21 **más `web/src/app/api/**`** (agregado por mí: las rutas de API están bajo `app/`
pero son servidor y hablan con el asesor; confirmar) y cualquier `.env*`. Todo lo demás (p. ej. `web/package.json`,
`web/src/lib/format.ts`, `web/src/proxy.ts`, los tests actuales de `web/tests/`) queda fuera por defecto. Lo usan el freno
(al editar), `condiciones-merge.sh` (antes de mergear) y, si la integradora lo agrega, la CI (`agentes/propuesta-settings/ci-frontera.yml`).

## 9. Carpetas

| Carpeta | Qué es | Bots |
|---|---|---|
| `/Users/pipoandre/Documents/claude.nosync/ai-personal-stylist` | checkout de Felipe y de la sesión integradora. Los bots no lo tocan | — |
| `…/ai-personal-stylist-torre` | **clon** aparte, siempre en `main` (dos checkouts de `main` en un repo no se pueden) | Productor, DevOps |
| `…/ai-personal-stylist-linea-1` | worktree del clon; libre = HEAD suelto en `origin/main`; una rama a la vez | Diseño, Constructor, Revisor, QA |

`preparar-carpetas.sh` las crea (idempotente, `--ensayo`), pone `core.hooksPath=.githooks` en la config **local** del clon,
el marcador `.equipo-mausbot`, excluye `.torre/` y el marcador vía `.git/info/exclude` (sin tocar `.gitignore`), copia las
skills y deja en la línea un `web/.env.local` mínimo (solo `NEXT_PUBLIC_*`, `CHAT_DAILY_LIMIT`, `AI_MODE=mock`, **sin**
`ANTHROPIC_API_KEY`), y corre `npm ci`.

## 10. Modelos y consumo

Todo Sonnet 5.5; Opus solo como subagente validador de cada maqueta. Subagentes del Constructor solo si la historia
toca más de 3 archivos. Sin cifras inventadas: se mide en `~/.openmausbot/usage/<año-mes>.jsonl` (sumar `costUsd` por
`botName` y día; one-liner en `agentes/README.md` §2) y se compara con la semana de Prendie (US$ 724 equivalentes, 88 % Opus,
§7c). Qué mirar en las dos primeras historias: costo por historia y por bot, turnos del Productor (no deberían crecer con
las vueltas), turnos de QA y Constructor por vuelta, y cuánto pesa `cachedInput` (en Prendie fue casi todo el costo).

## 11. Instalación

**Sesión de Claude (integradora)** — no toca `~/.openmausbot` salvo el atajo opcional del paso 8:

1. Mergear PR #1 (base) a `main`; sin eso, no hay interfaz que el equipo pueda tocar.
2. PR propio con este trabajo: `agentes/` y este plan. Correr antes las cuatro pruebas de `agentes/README.md` §5.
3. PR propio "freno": copiar `agentes/propuesta-settings/hooks/freno.sh` → `.claude/hooks/freno.sh` y fusionar
   `agentes/propuesta-settings/settings.json` en `.claude/settings.json`; correr `test-freno.sh` en el checkout; probar que la
   sesión integradora sigue trabajando (el freno también la frena: Supabase con SQL, `rm -r`, `.env*`). Opcional: el job de
   `ci-frontera.yml` en `.github/workflows/ci.yml` (y `docs/**` en sus `paths`).
4. `gh label create equipo:pausa -R pipoandre05/ai-personal-stylist -c B3362B -d "Detiene el merge automatico del equipo"`.
5. `bash agentes/scripts/preparar-carpetas.sh --ensayo`, revisar, y luego sin `--ensayo`.

**Felipe en la app (o la integradora con el atajo del paso 8):**

6. Respaldar: `cp -R ~/.openmausbot ~/Documents/MausBot-backups/openmausbot-$(date +%Y%m%d)` (sin `tools/` ni `browser/`).
7. Ajustes → General → Modo avanzado; "+" → Plantillas → "Trae tu propio equipo" → `agentes/ai-personal-stylist.mausteam.json`.
   Crea la sección "Estilo — Equipo de interfaz" con los 6 bots.
8. Por bot, según `agentes/configuracion-bots.json`: modelo `claude-sonnet-5-5` y esfuerzo, carpeta de trabajo, **Full access**
   (confirmar en cada uno aunque sea el default), sin MCP. Chief of Staff: Productor Estilo. Atajo probado en Prendie: con la
   app cerrada, escribir `modelSelection`, `approvalMode: "full"`, `cwd` y `chiefOfStaff` en `~/.openmausbot/bots.json`.
9. Crear la sala "Estilo — taller" con los 6, **sin carpeta**, respondedor Productor Estilo, boletín de `configuracion-bots.json`.
10. Guardar para QA Estilo una cuenta de prueba de la app (email y contraseña creados por Felipe solo para QA) en los
    logins guardados del bot, no en el repo.
11. Rutinas (opcionales, después del humo): "Avanzar el equipo" (Productor) y "Vigilar main" (DevOps), textos en
    `configuracion-bots.json`. Respaldar de nuevo.

## 12. Humo del equipo (antes de UI-1)

| # | A quién | Qué | Debe pasar |
|---|---|---|---|
| 1 | DevOps | `/torre estado` y `/torre ensaya rama ui-0 no-encontrado "Página no encontrada con la voz de Estilo"` | línea libre; ensayo sin tocar nada; `HICE:`/`→ SIGUIENTE:` |
| 2 | Constructor | "Lista las skills que ves; intenta editar `web/src/lib/format.ts` y `git push --force`; no insistas" | ve `estilo-equipo`, `frontend-design`…; **el freno bloquea las dos** (confirma que los hooks y el `deny` corren en `bypassPermissions`) |
| 3 | QA | "Explica el humo según estilo-equipo, sin correrlo" | puerto 3210, `AI_MODE=mock`, 390 px, cuenta de QA |
| 4 | Productor | "Arranca la historia ui-0: pulir `web/src/app/not-found.tsx` con la voz y tokens de Estilo" | recorre §5 completo; Constructor ↔ QA conversan sin el Productor; DevOps mergea por condiciones; llega `MERGEADO` |
| 5 | Felipe | revisar `docs/superpowers/hilos/ui-0.md`, el PR, `.torre/bitacora.md` y el consumo del día | vueltas registradas, veredictos sobre el sha final, nada fuera de la frontera |

Aceptación tras ui-0 y UI-1: cero intervenciones de Felipe salvo dudas funcionales; ningún bloqueo del freno esquivado;
`main` siempre verde o revertida sola; consumo razonable frente a §10.

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| **Permisos full + merge automático:** un error de un bot llega a producción sin ojos humanos | dos veredictos sobre el sha final, CI, frontera, freno, `vigilar` + revert automático, pausa con un `touch`; Felipe recibe `MERGEADO` con qué mirar |
| Los veredictos son texto en el hilo: un bot podría escribir uno falso (no hay identidad por bot en git) | SOUL lo prohíbe; `hilo.sh` restringe roles pero no autentica. Residual aceptado; Felipe puede auditar en el hilo y en las conversaciones de la app |
| El freno se esquiva a propósito (scripts por ruta, `curl` a la API, intérpretes) | es una barrera de errores y automatismos; suma `deny`, frontera en merge y (opcional) en CI |
| `bypassPermissions` y `deny`: según la documentación de Claude Code los hooks y las reglas `deny` siguen aplicando, pero no lo verifiqué en esta versión | prueba 2 del humo |
| `in_my_folder` por defecto en `true` | regla en el bloque común y en `estilo-equipo`; si un bot la olvida, el freno no lo detecta: el Constructor trabajaría en el clon de la Torre (en `main`) y su push a `main` sí lo bloquea el freno |
| La rama queda atrás de `main` por la Pista A (commits frecuentes) | DevOps actualiza justo antes de mergear; merge limpio no invalida veredictos |
| Contrato insuficiente para una historia (tarjeta que el simulador no emite) | el Productor lo pide a la integradora y la historia espera; la siguiente avanza |
| La sesión integradora queda sujeta al freno (Supabase con SQL, `rm -r`, `npm i`) | está pedido así; Felipe aplica migraciones e instala dependencias desde su terminal |
| Cuota del plan compartida con Prendie, Lo Nuestro y tus sesiones | todo Sonnet; medir tras ui-0 y UI-1 |
| Nada corre con el Mac dormido | rutinas solo de día; la pausa no depende de rutinas |
| App joven (0.1.123 → 0.1.158 en dos semanas) | SOUL y scripts versionados; respaldo antes de importar; revisar este §1 tras cada actualización |

## 14. No verificado

1. La importación real del JSON en la interfaz de 0.1.158 (solo validé con su parser).
2. Que los hooks `PreToolUse` y el `deny` se apliquen en `bypassPermissions` dentro de un bot (humo, prueba 2).
3. Que un encargo con `in_my_folder: false` corra en la carpeta configurada del bot que lo recibe (leí el código, no lo ejecuté).
4. Cadenas de encargos de profundidad 3 en esta versión (límite 4 en el código; Prendie probó 3 en 0.1.12x).
5. Cómo usa QA el navegador de la app contra `localhost` y los logins guardados.
6. Que `code-review` y `security-review` aparezcan como skills nativas en los bots.
7. Si existe una vía documentada para importar por línea de comandos: no la encontré en `~/.openmausbot/app-docs/` (son documentos de apps MCP en caché, sin índice legible) y la API local requiere autenticación.
8. Comportamiento de `gh pr checks --watch` y del revert automático contra el GitHub real (probados solo los guiones y el análisis).

## 15. Entregado y probado

| Archivo | Prueba | Resultado |
|---|---|---|
| `agentes/scripts/verificar-frontera.sh` | `test-verificar-frontera.sh` | 39 / 39 |
| `agentes/scripts/condiciones-merge.sh`, `hilo.sh` | `test-condiciones-merge.sh` | 28 / 28 |
| `agentes/propuesta-settings/hooks/freno.sh`, `settings.json` | `test-freno.sh` | 180 / 180 |
| `agentes/bots/*/SOUL.md`, `agentes/ai-personal-stylist.mausteam.json` | `exportar-equipo.py --verificar` + parser de la app | bloque común idéntico; 7,4–9,8 KB por SOUL; válido |
| `agentes/torre/`, `agentes/skills/estilo-equipo/`, `agentes/scripts/preparar-carpetas.sh` | `bash -n` | sintaxis ok; no ejecutados contra GitHub ni carpetas reales |
