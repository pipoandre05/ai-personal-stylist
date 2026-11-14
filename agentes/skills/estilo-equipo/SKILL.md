---
name: estilo-equipo
description: Protocolo de trabajo del equipo de bots de ai-personal-stylist (Estilo) en OpenMausBot — usar al encargar trabajo a otro bot, al recibir un encargo, al escribir en el hilo de una historia (docs/superpowers/hilos/<id>.md), al dar o pedir un veredicto, al hacer el humo de QA, al entregar una maqueta o al escalar una duda funcional a Felipe.
---

# Estilo — protocolo del equipo

Una historia = una rama `equipo/<id>-<slug>` = un hilo `docs/superpowers/hilos/<id>.md` = un hilo nuevo de
conversación en cada bot. El transporte entre bots es `coordinate_bots`; el hilo es la memoria compartida y la
evidencia que DevOps lee antes de mergear. **Lo que no está en el hilo no pasó.**

## 1. Encargo (`coordinate_bots`, máx. 4.000 caracteres)

```
HISTORIA: <id> — <título>  ·  RAMA: equipo/<id>-<slug>  ·  CARPETA: /Users/pipoandre/Documents/claude.nosync/ai-personal-stylist-linea-1
QUÉ: <una frase con el resultado esperado>
LEE: docs/superpowers/hilos/<id>.md · <maqueta> · <spec/criterios> (rutas exactas)
NO TOQUES: lo que está fuera de la frontera (agentes/scripts/verificar-frontera.sh --ruta <ruta> si dudas)
TERMINADO CUANDO: <criterio binario y verificable>
DEVUELVE: turno en el hilo (hilo.sh) + resumen de 5 líneas en tu respuesta
```

- **Siempre `in_my_folder: false`.** Por defecto la app abre el encargo en la carpeta de quien encarga (`server/bot-cwd.js`, `inMyFolderCwd`): el Constructor terminaría trabajando en el clon de la Torre. Con `false`, cada bot trabaja en su carpeta.
- `reply: resume` cuando necesitas el resultado para seguir (vuelve solo y te despierta). No esperes ni preguntes "¿terminaste?".
- Vuelta sobre lo mismo: al **mismo** bot, `rework: true`, en el **mismo** hilo de conversación (pasa su id en `thread`) para que conserve el contexto. Solo lo que falló, numerado.
- `consult: true` para una pregunta que no es trabajo (Diseño pregunta al Constructor si algo es factible).
- Límites reales de la app: 1 a 4 bots por llamada; no puedes encargarle trabajo a quien está arriba tuyo en la cadena
  (regla "ancestor"): para preguntarle algo, terminas tu turno con la pregunta y te retoma con la respuesta.

## 2. El hilo (`agentes/scripts/hilo.sh`, siempre desde la carpeta de la línea)

```bash
bash agentes/scripts/hilo.sh turno <id> <Rol> <tipo> <<'EOF'
<texto del turno>
EOF
bash agentes/scripts/hilo.sh veredicto <id> <Revisor|QA> <aprobado|rechazado> "$(git rev-parse HEAD)" <<'EOF'
<evidencia>
EOF
bash agentes/scripts/hilo.sh estado <id>
```

- Roles: Productor · Diseño · Constructor · Revisor · QA · DevOps. Tipos: encargo · hallazgos · respuesta · decision · nota · escalamiento.
- Append-only: nunca editas un turno anterior ni el encabezado (salvo el Productor, que declara dependencias al abrir).
- **Vueltas QA ↔ Constructor: tope 4.** Cada `hallazgos` de QA abre una vuelta; el Constructor responde con `respuesta`
  (qué cambió, commit, cómo verificarlo). A la quinta, `hilo.sh` se niega: ambos llevan su evidencia al Productor, que decide.
- Revisor ↔ Constructor y Diseño ↔ Constructor siguen la misma forma (hallazgos → respuesta), tope 3 cada uno.
- El Constructor commitea y empuja el hilo junto con su código: un turno sin commit no lo ve DevOps.

## 3. Veredictos (lo que habilita el merge)

- Solo Revisor y QA. Forma única: `aprobado` o `rechazado`, **sobre un sha** (`git rev-parse HEAD` del código que revisaste).
- Si después de tu `aprobado` entra código nuevo (no hilo, no merge limpio desde main), tu veredicto deja de valer:
  `condiciones-merge.sh` lo detecta y hay que revisar de nuevo. Por eso aprueba al final, no a mitad de camino.
- QA traduce su humo a veredicto: Cumple → `aprobado`; No cumple, Cumple parcialmente, Bloqueado por dependencia o
  Requiere definición funcional → `rechazado` con la categoría en la evidencia. Lo parcial solo pasa si el Productor
  saca lo faltante del alcance (turno `decision`) y QA vuelve a aprobar.

## 4. Humo de QA (receta)

1. En la carpeta de la línea, en la rama de la historia: `cd web && npm run build && PORT=3210 npm start` (en segundo plano; `AI_MODE=mock`, sin clave de Anthropic: el asesor es simulado y determinista).
2. Navegador de la app contra `http://localhost:3210`, viewport 390 × 844 (y 375 × 812), tema claro y oscuro si la historia lo toca.
3. Cuenta de prueba: la que Felipe dejó para QA (plan §11). Nunca una cuenta real ni datos personales; nunca producción.
4. Recorre cada criterio de la historia y cada estado de la maqueta: vacío, cargando/streaming, error, éxito, sin conexión.
5. Accesibilidad mínima: foco visible, orden de tabulación, contraste AA, objetivos táctiles ≥ 44 px, `aria-live` en el streaming.
6. Voz: tutea, sin emoji, "prenda/look/clóset/asesor/persona" (CLAUDE.md § Vocabulario).
7. Al terminar: detén el servidor. Escribe en el veredicto una sección `## Humo` (una línea por cosa probada → resultado), que DevOps copia al PR.

## 5. Maqueta (Diseño)

`docs/superpowers/mockups/<fecha>-<id>.html`, estática, solo tokens de `DESIGN.MD`, con todos los estados y la
conversación como eje (DP-17: el producto es una conversación con el asesor; tarjetas dentro del hilo, no formularios).
Antes de entregarla: un subagente **Opus** la valida contra DESIGN.MD, UX_UI_SPEC y la voz; corriges lo que encuentre.
Si tienes dudas de factibilidad, `consult` al Constructor antes de cerrar.

## 6. Escalamiento a Felipe (solo el Productor, solo dudas funcionales)

Antes: buscar en `docs/producto/` (DTR, DECISION_LOG, FUNCTIONAL_SPECS, UX_UI_SPEC). Si está, se cita y se sigue.
Si no está (regla de negocio ausente, o dos interpretaciones válidas sin antecedente), un mensaje:

```
DUDA FUNCIONAL · <id>
Duda: <una frase>
Busqué en: <documentos y secciones>
Alternativas: A) … B) …
Recomiendo: <A|B> porque <una frase>
Mientras tanto: <qué sigue avanzando>
```

## 7. Informe a Felipe tras el merge (Productor)

```
MERGEADO · <id> — <título> · PR #<n>
Qué mirar en el teléfono: <2–3 cosas>
Decisiones que tomamos sin ti: <lista corta, con su fuente>
Diferido: <qué y por qué>
```
