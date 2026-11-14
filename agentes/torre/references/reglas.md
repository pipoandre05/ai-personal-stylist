# Reglas de la Torre — ai-personal-stylist

Adaptadas de `prendie-torre/.claude/skills/torre/references/reglas.md` y de las retros de Lo Nuestro
(`proyectos/lo-nuestro-torre-f2-aprendizajes.md`). Lo que no aplica aquí (líneas paralelas, migraciones,
ClickUp, `torre:aprobado`) se sacó a propósito.

## 1. Estado de una historia

| Estado | Cómo se reconoce | Qué haces |
|---|---|---|
| `SIN_RAMA` | el Productor la eligió y no hay `equipo/<id>-*` | `crear-rama.sh` si la línea está libre |
| `EN_DISEÑO` | rama con hilo y sin código en `web/` | nada; Diseño trabaja |
| `CONSTRUYENDO` | commits en `web/`, sin VEREDICTO aprobado de ambos | nada; si te piden, `actualizar` |
| `EN_REVISION` | hay hallazgos abiertos en el hilo | nada; es la conversación Constructor ↔ Revisor/QA |
| `LISTA` | Revisor y QA `aprobado` sobre el último código, rama empujada | `abrir-pr.sh` |
| `CI_ROJA` | algún check rojo | encargas al Constructor (`rework`) con el log; tope 2 intentos, luego Productor |
| `ATRASADA` | `origin/main` no está en la rama | `actualizar-rama.sh` (merge limpio o devuelves) |
| `MERGEABLE` | `condiciones-merge.sh` OK | `mergear.sh`, luego `vigilar-main.sh` y `liberar-linea.sh` |
| `MAIN_ROJA` | CI de main roja tras tu merge | `revertir.sh N` y avisas al Productor |

## 2. Una sola línea

- Una rama a la vez en la línea. Si el Productor pide otra historia con la línea ocupada, respondes "línea ocupada por
  <rama>" y él decide (esperar o pedir una segunda línea a Felipe; ver `agentes/README.md` § Segunda línea).
- Antes de crear o liberar: `git status` y mtimes. Archivos tocados hace menos de 30 min = alguien trabaja.

## 3. Actualizar ramas

- Solo merge desde `origin/main`, nunca rebase. Un merge limpio no invalida los veredictos (lo comprueba
  `condiciones-merge.sh` con `git merge-tree`); uno con conflicto lo resuelve el Constructor y obliga a revisar de nuevo.
- Lección de Lo Nuestro: las ramas quedan atrás por commits de docs en `main`. Actualizas tú justo antes de mergear;
  no le pides a Felipe que lo haga.

## 4. Merge y después

1. `mergear.sh N` (squash, `--match-head-commit`). 2. `vigilar-main.sh` hasta VERDE o ROJO (si la PR no tocó `web/`,
no hay CI en main: VERDE por definición). 3. ROJO → `revertir.sh N`; si el revert choca o su CI no queda verde en
20 min, **escalas al Productor y él a Felipe**: main roja es lo único que se le lleva a Felipe sin filtro.
4. `liberar-linea.sh`. 5. Turno `nota` en el hilo con el número de PR y el resultado de la CI.

## 5. Lo que nunca decides

Cambiar la frontera, saltar una condición, mergear una rama que no es `equipo/*`, cerrar o borrar PRs, tocar `.claude/`,
`.githooks/`, `.github/` o `agentes/`. Todo eso es de Felipe vía Productor.

## 6. Retro heredada (Lo Nuestro y Prendie)

1. Mirar la carpeta con los ojos, no solo el registro.
2. El encargo al Constructor lleva rutas, criterio de terminado y respuestas a las dudas previsibles.
3. Todo código entra por rama + PR, aunque sean dos líneas de copy.
4. Tokens de Tailwind inexistentes llegaron a producción una vez (Lo Nuestro #33): el Revisor compara cada clase contra
   `DESIGN.MD` / `globals.css`; tú no mergeas si el Revisor no lo dejó escrito.
5. Una sola Torre a la vez: si ves otra sesión mergeando PRs del equipo, paras y avisas.
