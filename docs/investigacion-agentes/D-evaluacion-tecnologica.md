# D — Evaluación tecnológica

> Parte de la base de conocimiento `docs/investigacion-agentes/`. Investigación, no decisión.
> Marcas: **[DOC]** documentado por el proveedor · **[EXP]** terceros · **[REC]** juicio de esta investigación. **Todos los puntajes son [REC]**: son juicio razonado a partir de documentación; nada fue instalado ni ejecutado.
> Fecha de consulta: **2026-11-14**. Versiones anotadas en cada ficha. Enlaces al final y en `fuentes.md`.

## 1. Qué se evalúa y contra qué

**Pregunta**: ¿sobre qué base técnica conviene construir el sistema de agentes del producto: seguir con el loop propio sobre la API de Claude, o adoptar LangGraph u otra alternativa?

**Restricciones reales** (del repositorio y de `DECISION_LOG.md`):

| Restricción | Detalle |
|---|---|
| Lenguaje | TypeScript, Next.js 16 (App Router), Node 24 |
| Despliegue | Vercel; hoy `maxDuration = 60` en `/api/chat` |
| Datos | Supabase/Postgres **con la sesión de la persona y RLS, sin service role** (DT-02); migraciones aplicadas a mano por Felipe (DT-14) |
| Modelos | Claude vía `@anthropic-ai/sdk`, con streaming, caché de prompt, `strict`, pensamiento adaptativo y fallback del lado servidor (beta) |
| Escala | Piloto de decenas de personas; un equipo muy pequeño |
| Producto | Conversación con streaming y tarjetas estructuradas; `AI_MODE=mock` debe seguir funcionando |
| Límite duro | Ninguna compra o pago sin autorización explícita (DP-09) |

Dato de plataforma que cambia el análisis: con Fluid compute, las funciones de Vercel tienen 300 s por defecto en todos los planes y hasta 800 s en Pro. [DOC] [VERCEL-LIMITS]. Un turno de asesoría (3 a 8 llamadas a herramienta) cabe con holgura en un request. **No hay un requisito técnico de ejecución durable para el flujo básico.** [REC]

## 2. Filtro de descarte

Antes de puntuar, cuatro condiciones eliminatorias: SDK TypeScript mantenido; uso directo de Claude con streaming; ejecutable en funciones de Vercel sin un servicio aparte obligatorio; proyecto vigente.

| Opción | Versión leída | ¿Pasa? | Motivo |
|---|---|---|---|
| API de Claude + loop propio | `@anthropic-ai/sdk` (la base actual) | Sí | Es lo que existe |
| Tool runner del SDK de Claude | beta | Sí | [DOC] [TOOL-RUNNER] |
| Vercel AI SDK | `ai` 7.0.173 | Sí | [DOC] [AISDK-AGENTS] |
| LangGraph.js | `@langchain/langgraph` 1.7.4 | Sí | Guía oficial para Route Handlers de Next.js en Vercel [DOC] [LG-NEXT] |
| Mastra | `@mastra/core` 1.83.0 | Sí | [DOC] [MASTRA-VERCEL] |
| OpenAI Agents SDK | `@openai/agents` 0.22.0 | Sí, con reservas | Claude solo vía adaptador en beta con funciones recortadas [DOC] [OAI-AISDK] |
| Claude Agent SDK | sin versión en la doc | Sí, con reservas | Lanza un subproceso con estado en disco; requiere contenedor o almacén de sesiones [DOC] [CAS-HOSTING] |
| Claude Managed Agents | beta `managed-agents-2026-04-01` | Sí, con reservas | Alojado por Anthropic; beta [DOC] [CMA-OVERVIEW] |
| Google ADK | `@google/adk` 2.5.0 | **No** | En TypeScript, Claude solo vía Google Cloud y sin streaming [DOC] [ADK-CLAUDE] |
| LlamaIndex Workflows (TS) | 1.3.4 | **No** | Repositorio archivado el 2026-04-30 [DOC] [LLAMA-TS] |
| CrewAI | 1.15.41 | **No** | Solo Python [DOC] [CREW] |
| Pydantic AI | 2.68.0 | **No** | Solo Python [DOC] [PYD-AGENT] |
| Microsoft Agent Framework | Python 1.26.0 | **No** | Sin SDK TypeScript [DOC] [MAF-OVERVIEW] |
| AutoGen | — | **No** | Archivado [DOC] [AUTOGEN] |

Las descartadas siguen sirviendo como referencia de diseño (ver `A1` §9 y `A2`): CrewAI por su guardrail de tarea con reintentos, Pydantic AI por sus límites de uso y validación de salida con reintento acotado, Agent Framework por checkpoints por superstep y detección de estancamiento, LlamaIndex por conectar pasos mediante tipos de evento.

## 3. Criterios y pesos

| # | Criterio | Qué mide | Peso | Por qué ese peso |
|---|---|---|---|---|
| 1 | **Control** | Cuánto decide nuestro código sobre el loop: salidas, topes, políticas, aprobación | 15 | Es el objetivo declarado de esta investigación y la condición de DP-09 |
| 2 | **Complejidad de implementación** | Esfuerzo de adoptar y mantener (más puntaje = menos esfuerzo) | 15 | Equipo muy pequeño; ya existe una base funcionando con 85 tests |
| 3 | **Flexibilidad** | Expresar patrones distintos (flujo fijo, router, subagente, aprobación) | 10 | La hipótesis combina varios patrones |
| 4 | **Persistencia** | Estado de ejecución, checkpoints, reanudación, y encaje con Supabase + RLS | 10 | Hoy no existe; la aprobación la necesita |
| 5 | **Observabilidad** | Trazas por paso, evals, costo | 10 | Sin trazas no hay análisis de errores |
| 6 | **Soporte TypeScript y de Claude** | Calidad del SDK TS y acceso a las funciones de Claude que ya usamos | 10 | Restricción del stack |
| 7 | **Madurez** | Versión, estabilidad de API, evidencia de uso real | 10 | Las APIs de este campo cambian rápido |
| 8 | **Escalabilidad** | Encaje con funciones serverless; crecer en usuarios y en duración de procesos | 10 | Piloto pequeño hoy; el peso sube si el producto crece |
| 9 | **Dependencia del proveedor** | Costo de salir (más puntaje = menos dependencia) | 5 | Ya dependemos de Claude, Vercel y Supabase por decisión |
| 10 | **Costo** | Licencias y servicios, sin contar tokens | 5 | Piloto sin monetización (DP-14) |
| | | | **100** | |

Escala: 1 muy débil · 2 débil · 3 aceptable · 4 bueno · 5 muy bueno, **para nuestro caso**, no en abstracto.

## 4. Matriz de puntajes

| Opción | Control (15) | Complej. (15) | Flexib. (10) | Persist. (10) | Observ. (10) | TS + Claude (10) | Madurez (10) | Escalab. (10) | Depend. (5) | Costo (5) | **Ponderado** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Loop propio sobre la API de Claude** | 5 | 4 | 5 | 2 | 2 | 5 | 4 | 4 | 4 | 5 | **4,00** |
| **LangGraph.js** | 5 | 2 | 5 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | **3,90** |
| **Mastra** | 4 | 3 | 4 | 4 | 4 | 5 | 3 | 4 | 3 | 5 | **3,85** |
| **Vercel AI SDK 7 (`ToolLoopAgent`)** | 4 | 3 | 4 | 2 | 4 | 4 | 4 | 4 | 4 | 5 | **3,70** |
| **AI SDK + Vercel Workflows (`WorkflowAgent`)** | 4 | 2 | 4 | 4 | 4 | 4 | 3 | 5 | 2 | 4 | **3,60** |
| **Tool runner de Claude** | 3 | 4 | 3 | 1 | 2 | 5 | 3 | 4 | 4 | 5 | **3,30** |
| **Claude Managed Agents** | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 4 | 1 | 3 | **3,20** |
| **Claude Agent SDK** | 4 | 2 | 3 | 3 | 3 | 5 | 4 | 2 | 2 | 3 | **3,15** |
| **OpenAI Agents SDK** | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 4 | 2 | 5 | **3,10** |

Cómo leer la tabla: las diferencias de menos de 0,2 no son significativas; dependen de pesos que son juicio. La sección 6 muestra cuánto cambia el orden al mover los pesos.

## 5. Ficha de cada opción y razón de sus puntajes

### 5.1 Loop propio sobre la API de Claude (la base actual)

- **Qué es.** `runStylistTurn()`: un `for` con tope de 6 iteraciones sobre `client.beta.messages.stream()`, herramientas validadas con zod y eventos SSE propios.
- **A favor.** Control total y ya ejercido: manejo explícito de cada `stop_reason`, cierre forzado con `tool_choice: none`, caché de prompt diseñada, fallback del lado servidor, modo simulado. Anthropic recomienda partir por la API directa porque las capas de abstracción ocultan prompts y respuestas y dificultan depurar. [DOC] [BEA]. En producción de cara a clientes abundan los loops propios. [EXP] [12F]
- **En contra.** Todo lo que falta hay que construirlo: estado persistido del turno, compuerta de aprobación, trazas, presupuestos, detector de repetición (`A2` §11). Riesgo de reinventar mal lo que un runtime ya resolvió.
- **Puntajes.** Persistencia y observabilidad en 2 porque hoy no existen; complejidad en 4 porque el punto de partida ya funciona y los componentes faltantes son acotados.

### 5.2 Tool runner del SDK de Claude

- **Qué es.** `client.beta.messages.toolRunner(...)`: el SDK corre el loop hasta un mensaje sin herramientas o hasta `max_iterations`. [DOC] [TOOL-RUNNER]
- **A favor.** Menos código de loop.
- **En contra.** Está en beta; para aprobación humana dentro del loop la propia página recomienda el loop manual [DOC] [TOOL-RUNNER]; nuestra base ya tiene el loop manual con más control del que el runner expone.
- **Puntajes.** Control 3 y persistencia 1: quita control sin aportar estado.

### 5.3 Vercel AI SDK 7

- **Qué es.** Librería TypeScript multi-proveedor. `ToolLoopAgent` con `stopWhen` (por defecto 20 pasos), `prepareStep` para cambiar modelo, mensajes o herramientas activas por paso, `toolApproval`, `repairToolCall`, y telemetría OpenTelemetry en `@ai-sdk/otel`. [DOC] [AISDK-AGENTS], [AISDK-LOOP], [AISDK-APPROVAL], [AISDK-TEL]
- **A favor.** Resuelve bien varias piezas que nos faltan: topes componibles, aprobación (que no pausa: termina y se retoma con el historial, igual que necesita una función serverless) con firma HMAC, trazas estándar. Licencia Apache-2.0.
- **En contra.** Es una reescritura del loop y de las definiciones de herramientas. No persiste checkpoints. [DOC] [VERCEL-KB]. Renombres frecuentes entre versiones mayores (de la 6 a la 7 cambiaron más de diez nombres) [DOC] [AISDK-MIG]. No se verificó que exponga todo lo que usamos del SDK de Anthropic (en particular el fallback del lado servidor en beta). El registro de entradas y salidas viene activo por defecto, relevante con fotos y datos personales. [DOC] [AISDK-TEL]
- **Puntajes.** Observabilidad 4 por la telemetría incluida; complejidad 3 por la migración.

### 5.4 AI SDK + Vercel Workflows

- **Qué es.** `WorkflowAgent` corre el mismo loop dentro de un workflow durable: cada llamada al modelo y cada herramienta marcada como paso queda registrada y se reintenta; puede esperar una aprobación sin consumir cómputo. [DOC] [WF-AI], [WF-FOUND]
- **A favor.** Durabilidad sin operar infraestructura; duración de run sin límite; observabilidad por paso en el panel. [DOC] [WF-PRICING]. El plan Hobby incluye 50.000 eventos al mes. [DOC] [WF-PRICING]
- **En contra.** El orquestador debe ser determinista y se re-ejecuta en cada reanudación [DOC] [WF-FOUND]. **El estado vive en la persistencia de Vercel, no en Supabase**: el adaptador de Postgres necesita un proceso de larga vida y no es compatible con despliegues en Vercel [DOC] [WF-PG]. Los datos de cada paso quedan legibles para los dueños del equipo en Vercel [DOC] [WF-PRICING]: hay que revisar qué datos personales pasan por ahí. `stream()` no trae tope por defecto [DOC] [VERCEL-KB]. Contradicción entre documentos oficiales sobre la API de aprobación (ver `preguntas-abiertas.md`).
- **Puntajes.** Escalabilidad 5; dependencia 2.

### 5.5 LangGraph.js

- **Qué es.** Runtime de grafos con estado: nodos, aristas condicionales, estado tipado con reducers, checkpoint en cada paso, `interrupt()` para aprobación humana, subgrafos y streaming. Detalle completo en `A3`.
- **A favor.**
  - Es el modelo conceptual más completo para lo que esta investigación busca: estado explícito, árbol de decisión en aristas, checkpoint y pausa como primitivas. [DOC] [LG-GRAPH], [LG-CKPT], [LG-HITL]
  - Camino oficial para embeberlo en Route Handlers de Next.js en Vercel, sin proceso aparte, con `PostgresSaver` como checkpointer durable. [DOC] [LG-NEXT]
  - La librería es open source y no exige LangSmith ni el servidor de pago. [DOC] [LG-OVERVIEW]
  - Casos de producción contados por las propias empresas (LinkedIn, Uber, Elastic); ver `A3`.
- **En contra.**
  - **Choque con DT-02.** `PostgresSaver` usa una conexión Postgres directa con credenciales de base de datos, y sus tablas (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`) no tienen `user_id`: el estado completo del hilo, incluido el historial, queda fuera de RLS. [DOC] [LG-PG] (verificado en las migraciones del paquete). Adoptarlo exige decidir explícitamente una excepción a DT-02 o escribir un checkpointer propio.
  - No está verificado que `PostgresSaver` funcione con el pooler de Supabase en modo transacción, que es el recomendado para serverless y no soporta sentencias preparadas. [EXP] [SUPA-CONN]. No se encontró ningún ejemplo con Supabase + Vercel.
  - El ejemplo oficial para Vercel usa Redis, no Postgres; y para reconectar el streaming entre invocaciones hace falta un almacén compartido adicional. [DOC] [LG-NEXT]
  - Curva de aprendizaje y cambios de API: la forma de declarar estado cambió (`Annotation.Root` pasó a "legacy"), `createReactAgent` quedó deprecado. Ver `A3`.
  - Thoughtworks lo bajó de *Adopt* a *Trial* en abril de 2026, señalando que el estado global compartido en un grafo no siempre es lo mejor y que agentes simples comunicados por código suelen ser más fáciles de probar. [EXP] [TW-RADAR]
  - La versión JavaScript va detrás de la de Python en partes del ecosistema (por ejemplo, LangMem no tiene versión JS). Ver `A3`.
  - Reescritura completa del loop actual, de los eventos SSE y del modo simulado.
- **Puntajes.** Control y flexibilidad 5; complejidad 2; persistencia 4 y no 5 por el choque con RLS.

### 5.6 Mastra

- **Qué es.** Framework TypeScript con agente, workflows en grafo (`.then`, `.branch`, `.parallel`, `suspend`/`resume`), memoria (de trabajo, semántica, observacional), aprobación de herramientas, evaluadores y observabilidad. [DOC] [MASTRA-AGENTS], [MASTRA-WF], [MASTRA-HITL], [MASTRA-MEM], [MASTRA-EVALS]
- **A favor.** Es el más completo nativo de TypeScript; storage en Postgres; despliegue en Vercel documentado; Apache-2.0. [DOC] [MASTRA-PG], [MASTRA-VERCEL]
- **En contra.** Crea y migra **sus propias tablas** de forma automática, sin `user_id` ni RLS nuestras: choca con DT-02 y DT-14 salvo que se desactive la inicialización y se aísle en otro esquema [DOC] [MASTRA-PG]. Tope por defecto de 5 pasos; sin tope automático en loops de workflow [DOC] [MASTRA-AGENT], [MASTRA-WF]. Ritmo de versiones muy alto (1.83). En Vercel hay que vaciar la observabilidad a mano antes de responder. [DOC] [MASTRA-VERCEL]
- **Puntajes.** TS 5; madurez 3.

### 5.7 OpenAI Agents SDK (TypeScript)

- **Qué es.** `Agent`, `Runner`, handoffs, guardrails en tres familias, `needsApproval` con `RunState` serializable, `Session` de cinco métodos, trazas. [DOC] [OAI-RUN]
- **A favor.** El vocabulario de control más limpio; buen modelo de aprobación como estado serializado.
- **En contra.** Versión 0.x con cambios incompatibles en versiones menores [DOC] [OAI-REL]; Claude solo vía un adaptador en beta, sin varias funciones [DOC] [OAI-AISDK]; trazas hacia OpenAI por defecto [DOC] [OAI-TRACE]; sin sesión para Postgres incluida.
- **Puntajes.** TS + Claude 2; madurez 2.

### 5.8 Claude Agent SDK

- **Qué es.** El harness de Claude Code como librería: loop, herramientas de archivos y shell, hooks, permisos, subagentes, sesiones, compactación. [DOC] [CAS-OVERVIEW]
- **A favor.** El harness más maduro para agentes que trabajan sobre un sistema de archivos; modelo de permisos y hooks muy completo.
- **En contra.** Cada sesión es un subproceso con estado en disco local; punto de partida de 1 GiB de RAM y 1 CPU por agente; la doc dice que alojarlo no es como alojar un wrapper sin estado [DOC] [CAS-HOSTING]. Ninguna página afirma ni niega que funcione en funciones de Vercel. Está pensado para agentes de trabajo largo con archivos, no para un turno conversacional de segundos.
- **Puntajes.** Escalabilidad 2; complejidad 2.

### 5.9 Claude Managed Agents

- **Qué es.** Harness alojado por Anthropic: agente versionado, sesión con estado en el servidor, eventos por SSE, herramientas propias resueltas por la aplicación, confirmación de herramientas, presupuesto por sesión. [DOC] [CMA-OVERVIEW], [CMA-REF]
- **A favor.** Persistencia y reanudación resueltas; multiagente de un nivel incluido.
- **En contra.** Beta. Cobra US$0,08 por hora de sesión en ejecución además de tokens [DOC] [PRICING]. El historial y los datos de la conversación quedan con estado en el servidor del proveedor y no es elegible para retención cero [DOC] [CMA-OVERVIEW]: con fotos y perfil personal, es una decisión de privacidad. No disponibles dentro: salida estructurada ni llamadas programáticas a herramientas [DOC] [CMA-MULTI]. Máxima dependencia.
- **Puntajes.** Persistencia 5; madurez 2; dependencia 1.

## 6. Sensibilidad: cuándo cambia el orden

| Si cambia… | Efecto |
|---|---|
| **Persistencia y escalabilidad pesan el doble** (procesos de horas o días, aprobaciones multi-paso, trabajo en segundo plano) | LangGraph.js y AI SDK + Workflows superan al loop propio |
| **Complejidad pesa el doble** (equipo mínimo, lanzar el piloto) | El loop propio amplía su ventaja; LangGraph cae bajo Mastra y AI SDK |
| **Se acepta una excepción a DT-02** para tablas técnicas de checkpoint | LangGraph sube a 5 en persistencia y empata con el loop propio |
| **Se decide ser multi-proveedor de modelos** | AI SDK y Mastra suben; el loop propio baja en dependencia |
| **El producto crece a varios flujos con ramas, pausas y subgrafos** | El loop propio empieza a replicar un runtime de grafos: es el gatillo para migrar |

## 7. LangGraph frente a la base actual: la comparación directa

| Dimensión | Loop propio | LangGraph.js | Quién gana y por qué |
|---|---|---|---|
| Estado del turno | Variables en memoria | Esquema tipado con reducers | LangGraph: el estado es explícito e inspeccionable |
| Árbol de decisión | `if` y `stop_reason` dentro del loop | Aristas condicionales visibles | LangGraph en legibilidad; empate en capacidad |
| Checkpoint | No hay | Por super-step, automático | LangGraph, pero fuera de RLS |
| Aprobación humana | No hay | `interrupt()` + reanudación | LangGraph en primitiva; en serverless ambos terminan la función y reanudan desde estado guardado |
| Streaming a la interfaz | SSE propio, ya integrado con las tarjetas | Modos de stream propios; habría que mapearlos | Loop propio: ya funciona |
| Funciones de Claude | Todas, directas | A través de la integración; no verificado el fallback beta | Loop propio |
| Caché de prompt | Diseñada a mano y medible | Depende de cómo el grafo arme los mensajes | Loop propio |
| Modo simulado | Existe | Habría que rehacerlo | Loop propio |
| Tests | 85 en verde | Reescribir | Loop propio |
| Depuración | Código propio | Studio y trazas en LangSmith (de pago sobre el plan gratis) | LangGraph si se paga la plataforma |
| Riesgo | Reinventar un runtime | Dependencia de un ecosistema que cambia nombres | Depende del tamaño del sistema |

**[REC]** Conclusión de la comparación: para un agente conversacional con turnos de segundos, una docena de herramientas y una sola compuerta de aprobación, LangGraph resuelve con elegancia problemas que todavía no tenemos (grafos con muchas ramas, pausas largas, viaje en el tiempo) y trae dos costos que sí tendríamos de inmediato (reescritura y estado fuera de RLS). Sus **ideas** se pueden adoptar sin la librería: estado tipado del turno, checkpoint por paso en una tabla propia con RLS, y aprobación como "terminar, guardar y reanudar". `A3` §6 lista esas ideas.

## 8. La capa de ejecución durable

Es una decisión independiente de la anterior. **Ejecución durable**: el resultado de cada paso se guarda, de modo que un proceso puede fallar, esperar horas o reiniciarse y continuar donde quedó.

| Opción | Modelo | ¿Corre con Vercel sin worker propio? | Dónde vive el estado | Espera por aprobación | Costo de entrada | Notas |
|---|---|---|---|---|---|---|
| **Tabla propia en Supabase** | El turno termina; el estado pendiente se guarda en una tabla con RLS; otro request reanuda | Sí | Supabase, con RLS | Sí, sin proceso esperando | Cero | No reintenta pasos sola; basta para una aprobación por turno [REC] |
| **Vercel Workflows** | `"use workflow"` / `"use step"`; log de eventos | Sí | Vercel | `createHook()` | Hobby: 50.000 eventos al mes incluidos | Orquestador determinista; datos legibles por el equipo [DOC] [WF-PRICING], [WF-HOOKS] |
| **Inngest** | Funciones por pasos re-invocadas por HTTP | Sí, "nativo serverless" | Inngest | `step.waitForEvent` con timeout | Gratis: 50.000 ejecuciones al mes | `step.ai` aún sin streaming; servidor bajo SSPL [DOC] [INNGEST-EXEC], [INNGEST-PRICING] |
| **Temporal** | Workflows deterministas + activities; historial de eventos | **No**: requiere workers aparte (o Lambda/Cloud Run en preview) | Temporal | Signals + `condition()` | Cloud: US$50 por millón de acciones | El más maduro y general; MIT [DOC] [TEMPORAL-TS], [TEMPORAL-PRICING] |
| **Checkpointer de LangGraph** | Checkpoint por super-step | Sí | Postgres o Redis propios | `interrupt()` | Cero (librería) | Fuera de RLS; ver 5.5 |
| **DBOS / Trigger.dev / Restate** | Librería con checkpoints en base de datos / plataforma de tareas / runtime durable | No verificado para nuestro stack | Varía | Sí | Varía | Solo leídas en una línea; ver `preguntas-abiertas.md` |

Qué problema resuelve cada cosa para agentes: reintentos por paso (un fallo en la herramienta 4 no repite las llamadas 1 a 3), esperas largas sin cómputo, y trabajo en segundo plano. Ninguno garantiza "exactamente una vez" hacia afuera: la idempotencia sigue siendo nuestra. [DOC] [INNGEST-STEPS], [LG-FAULT]

**[REC]** Para el piloto, la aprobación de una compra **no necesita motor durable**: el turno termina con una solicitud guardada en Supabase y el clic de la persona abre otro request. Un motor durable se justifica cuando aparezca trabajo que **no cabe en un request o no lo inicia la persona**: consolidación nocturna de memoria, monitoreo de precios, búsqueda multi-tienda larga, ingesta de feeds. Entre los dos que corren en Vercel sin worker, la elección queda abierta (ver `E` §6).

## 9. Observabilidad y evals: opciones

También es independiente del framework de agentes.

| Opción | Licencia y alojamiento | Costo de entrada | Funciona sin su framework | Nota |
|---|---|---|---|---|
| **Tablas propias** (`ai_usage` + trazas por paso) | Propio, en Supabase con RLS | Cero | — | Máxima privacidad; hay que construir la vista |
| **Langfuse** | MIT salvo carpetas `ee`; autoalojable o nube | Nube gratis: 50.000 unidades al mes, 30 días | Sí | [DOC] [LANGFUSE] |
| **LangSmith** | Propietaria; autoalojamiento solo Enterprise | Gratis: 1 asiento, 5.000 trazas al mes; Plus US$39 por asiento | Sí: `wrapAnthropic` u OpenTelemetry | [DOC] [LS-PRICING], [LS-ANTHROPIC] |
| **Arize Phoenix** | Elastic License 2.0; autoalojable | Gratis autoalojado | Sí (OpenTelemetry) | [DOC] [PHOENIX] |
| **Braintrust** | Propietaria | Gratis hasta 10.000 evaluaciones | Sí | [DOC] [BRAINTRUST] |

Condición común: las trazas contienen conversaciones y, potencialmente, referencias a fotos. Enviar trazas a un tercero es una decisión de privacidad, no solo técnica (ver `E` §6). Las convenciones de OpenTelemetry para GenAI aún no son estables. [DOC] [OTEL-GENAI]

## 10. Síntesis

**[REC]**

1. **Base de agentes**: mantener el loop propio sobre la API de Claude y completarlo con los componentes de harness faltantes. Es la opción con mejor puntaje bajo nuestras restricciones y la única que no exige reescritura ni excepción a DT-02.
2. **LangGraph.js**: no adoptarlo ahora; adoptar sus ideas. Reevaluar con gatillos explícitos: tres o más flujos con ramas y pausas, aprobaciones de varios pasos, o que el estado propio del turno empiece a parecerse a un checkpointer.
3. **Vercel AI SDK 7**: es la alternativa a mirar si se quisiera dejar de mantener el loop a mano; su modelo de aprobación y sus trazas son las piezas más aprovechables. No se justifica migrar solo por eso.
4. **Ejecución durable**: no hace falta para el piloto. Decidir entre Vercel Workflows e Inngest cuando exista el primer proceso en segundo plano.
5. **Observabilidad**: es la decisión tecnológica más urgente de todas, porque condiciona poder evaluar. Opciones abiertas en la sección 9.

Esta síntesis es una recomendación para discutir; las decisiones están listadas en `E` §6.

## Enlaces

[BEA]: https://www.anthropic.com/engineering/building-effective-agents
[TOOL-RUNNER]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
[CAS-OVERVIEW]: https://code.claude.com/docs/en/agent-sdk/overview
[CAS-HOSTING]: https://code.claude.com/docs/en/agent-sdk/hosting
[CMA-OVERVIEW]: https://platform.claude.com/docs/en/managed-agents/overview
[CMA-REF]: https://platform.claude.com/docs/en/managed-agents/reference
[CMA-MULTI]: https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration
[PRICING]: https://platform.claude.com/docs/en/about-claude/pricing
[12F]: https://github.com/humanlayer/12-factor-agents
[VERCEL-LIMITS]: https://vercel.com/docs/functions/limitations
[VERCEL-KB]: https://vercel.com/kb/guide/what-is-workflowagent
[AISDK-AGENTS]: https://ai-sdk.dev/docs/agents/overview
[AISDK-LOOP]: https://ai-sdk.dev/docs/agents/loop-control
[AISDK-APPROVAL]: https://ai-sdk.dev/docs/agents/tool-approvals
[AISDK-TEL]: https://ai-sdk.dev/docs/ai-sdk-core/telemetry
[AISDK-MIG]: https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0
[WF-AI]: https://workflow-sdk.dev/docs/ai
[WF-FOUND]: https://workflow-sdk.dev/docs/foundations/workflows-and-steps
[WF-HOOKS]: https://workflow-sdk.dev/docs/foundations/hooks
[WF-PRICING]: https://vercel.com/docs/workflows/pricing
[WF-PG]: https://workflow-sdk.dev/docs/deploying/world/postgres-world
[LG-OVERVIEW]: https://docs.langchain.com/oss/javascript/langgraph/
[LG-GRAPH]: https://docs.langchain.com/oss/javascript/langgraph/graph-api
[LG-CKPT]: https://docs.langchain.com/oss/javascript/langgraph/checkpointers
[LG-HITL]: https://docs.langchain.com/oss/javascript/langgraph/interrupts
[LG-FAULT]: https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance
[LG-NEXT]: https://docs.langchain.com/langsmith/deploy-nextjs
[LG-PG]: https://github.com/langchain-ai/langgraphjs/tree/main/libs/checkpoint-postgres
[LS-PRICING]: https://www.langchain.com/pricing
[LS-ANTHROPIC]: https://docs.langchain.com/langsmith/trace-anthropic
[TW-RADAR]: https://www.thoughtworks.com/radar/languages-and-frameworks/langgraph
[SUPA-CONN]: https://supabase.com/docs/guides/database/connecting-to-postgres
[MASTRA-AGENTS]: https://mastra.ai/docs/agents/overview
[MASTRA-AGENT]: https://mastra.ai/reference/agents/generate
[MASTRA-WF]: https://mastra.ai/docs/workflows/control-flow
[MASTRA-HITL]: https://mastra.ai/docs/agents/human-in-the-loop
[MASTRA-MEM]: https://mastra.ai/docs/memory/overview
[MASTRA-EVALS]: https://mastra.ai/docs/evals/overview
[MASTRA-PG]: https://mastra.ai/reference/storage/postgresql
[MASTRA-VERCEL]: https://mastra.ai/docs/deployment/cloud-providers/vercel
[OAI-RUN]: https://openai.github.io/openai-agents-js/guides/running-agents/
[OAI-REL]: https://openai.github.io/openai-agents-js/guides/release/
[OAI-AISDK]: https://openai.github.io/openai-agents-js/extensions/ai-sdk/
[OAI-TRACE]: https://openai.github.io/openai-agents-js/guides/tracing/
[ADK-CLAUDE]: https://adk.dev/agents/models/anthropic/
[LLAMA-TS]: https://github.com/run-llama/workflows-ts
[CREW]: https://docs.crewai.com/en/concepts/crews
[PYD-AGENT]: https://pydantic.dev/docs/ai/core-concepts/agent/
[MAF-OVERVIEW]: https://learn.microsoft.com/en-us/agent-framework/overview/
[AUTOGEN]: https://github.com/microsoft/autogen
[INNGEST-STEPS]: https://www.inngest.com/docs/learn/inngest-steps
[INNGEST-EXEC]: https://www.inngest.com/docs/learn/how-functions-are-executed
[INNGEST-PRICING]: https://www.inngest.com/pricing
[TEMPORAL-TS]: https://docs.temporal.io/develop/typescript
[TEMPORAL-PRICING]: https://temporal.io/pricing
[LANGFUSE]: https://langfuse.com/pricing
[PHOENIX]: https://github.com/Arize-ai/phoenix
[BRAINTRUST]: https://www.braintrust.dev/pricing
[OTEL-GENAI]: https://github.com/open-telemetry/semantic-conventions-genai
