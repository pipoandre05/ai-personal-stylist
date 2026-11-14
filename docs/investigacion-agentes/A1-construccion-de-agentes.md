# A1 — Cómo se construyen los agentes

> Parte de la base de conocimiento `docs/investigacion-agentes/`. Investigación, no especificación.
> Marcas: **[DOC]** documentado por el proveedor sobre su propio producto o experiencia · **[EXP]** experimental, paper o reportado por terceros · **[REC]** recomendación o inferencia de esta investigación.
> Fecha de consulta de todas las fuentes: **2026-11-14**. Los enlaces están al final del documento y en `fuentes.md`.

## 1. Qué es (y qué no es) un agente

| Término | Definición usada en toda esta base | Fuente |
|---|---|---|
| **Workflow** (flujo) | LLM y herramientas orquestados por rutas de **código** predefinidas. El orden lo decide el programa. | [DOC] [BEA] |
| **Agente** | Un LLM que **dirige dinámicamente** su propio proceso y su uso de herramientas, dentro de un loop con condición de salida. | [DOC] [BEA], [OAI-GUIA] |
| **Sistema agéntico** | Cualquiera de los dos anteriores, o su combinación. | [DOC] [BEA] |
| **Función de una llamada** | Una sola llamada al modelo con salida estructurada, sin loop ni herramientas. | Término propio del proyecto (`AGENT_ARCHITECTURE.md` §1) |
| **Harness** | Todo lo que rodea al modelo y lo convierte en agente: el loop, las herramientas, el manejo de contexto, permisos, estado y control. Ver `A2`. | [DOC] [MA-ENG], [MAF-HARNESS] |

Tres afirmaciones de base que cruzan todas las fuentes:

1. **Un agente es modelo + herramientas + instrucciones en un loop con condición de salida.** [DOC] [OAI-GUIA]. Una aplicación que usa un LLM sin dejarle controlar el flujo (clasificador, respuesta de un turno) no es un agente. [DOC] [OAI-GUIA]
2. **Se parte por lo más simple y se sube complejidad solo con evidencia.** Anthropic: para muchas aplicaciones basta optimizar una sola llamada; los sistemas agénticos cambian latencia y costo por desempeño [DOC] [BEA]. OpenAI: maximizar primero un solo agente [DOC] [OAI-GUIA]. Microsoft: si puedes escribir una función para la tarea, escribe la función y no un agente [DOC] [MAF-OVERVIEW].
3. **Workflow cuando la tarea está bien definida; agente cuando se necesita flexibilidad.** [DOC] [BEA], [MAF-OVERVIEW]. Los tres grandes proveedores ofrecen hoy ambos caminos en el mismo framework: uno dirigido por el LLM y otro determinista por código o grafo. [DOC] [OAI-ORQ], [ADK-2], [MAF-WF]

**[REC]** Consecuencia para nosotros: la pregunta de diseño no es "¿cuántos agentes?", sino "¿qué decisiones dejo al modelo y cuáles fijo en código?". Cada decisión del producto cae en una de cuatro categorías: código determinista, función de una llamada, paso de un workflow, o decisión del agente en su loop. `E` aplica ese criterio a nuestras capacidades.

## 2. Single-agent vs multi-agent

### 2.1 Cuándo cada uno, según quienes los construyen

| Fuente | Postura | Criterio para dividir |
|---|---|---|
| Anthropic, 2024 [BEA] | Partir simple; multiagente (orchestrator-workers) cuando las subtareas no se pueden predecir. | [DOC] Subtareas dinámicas e independientes. |
| Anthropic, research multiagente, 2025 [MARS] | Multiagente rinde en investigación amplia y paralelizable. | [DOC] No sirve si todos los agentes necesitan el mismo contexto, si hay muchas dependencias entre ellos, ni en la mayoría de las tareas de código. |
| Anthropic, 2026 [MA-WHEN] | "Partir con un agente". | [DOC] Tres casos: **proteger el contexto**, **paralelizar**, **especializar**. Descomponer por **contexto**, no por rol o tipo de trabajo: cada traspaso pierde contexto. |
| Anthropic, oct. 2026 [FOLD] | Muchos sistemas con orquestador + especialistas funcionan mejor **plegados** en un loop único con skills y herramientas de carga progresiva. | [DOC] Mantener un subagente solo si hay: degradación medible por contexto, tareas paralelas con contexto desechable, conflicto de herramientas o instrucciones, o necesidad de hablar directo con la persona. |
| OpenAI [OAI-GUIA] | Enfoque incremental. | [DOC] Dividir ante (a) lógica con demasiadas ramas if-then-else en el prompt, o (b) herramientas que se **solapan** y confunden la selección, cuando mejorar nombres y descripciones no lo arregla. La cantidad no es el problema: hay casos con más de 15 herramientas bien definidas que funcionan. |
| Cognition, 2025 [COG-1] | "No construyas multiagentes". | [EXP] Dos principios: compartir contexto **completo** (trazas, no mensajes sueltos), y asumir que cada acción lleva decisiones implícitas que chocan si se toman en paralelo. |
| Cognition, 2026 [COG-2] | Matiza sin retractarse. | [EXP] Las **escrituras** siguen en un solo hilo. Funcionan: revisor con contexto limpio, "smart friend" (modelo chico que consulta a uno grande pasándole su contexto) y manager con hijos tipo map-reduce. Sin resolver: escritores paralelos y comunicación entre agentes hermanos. |

**Dónde coinciden Anthropic y Cognition.** [REC] El "debate" es más angosto de lo que parece: el post de Anthropic excluye él mismo las tareas con contexto compartido [DOC] [MARS], y el de Cognition acepta subagentes que solo aportan información [EXP] [COG-1]. La regla común: **paralelizar lectura es seguro; paralelizar decisiones que deben ser coherentes entre sí no lo es.**

### 2.2 Costo real de coordinar: la evidencia

| Dato | Cifra | Fuente |
|---|---|---|
| Tokens de un agente vs un chat | ~4× | [DOC] [MARS] (autodeclarado) |
| Tokens de multiagente vs chat (sistema de research) | ~15× | [DOC] [MARS] |
| Tokens de multiagente vs un agente, tareas equivalentes | 3–10× | [DOC] [MA-WHEN] |
| Mejora del multiagente en la eval interna de research de Anthropic | +90,2% sobre un agente | [DOC] [MARS] (eval interna, tarea de búsqueda amplia) |
| Cambio medio multiagente vs un agente, 260 configuraciones y 6 benchmarks | −0,3% (IC 95%: −58,7% a +77,2%) | [EXP] [SCALING] |
| Tareas secuenciales (planificación) | −39% a −70% | [EXP] [SCALING] |
| Tareas descomponibles (razonamiento financiero) | +80,8% con arquitectura centralizada | [EXP] [SCALING] |
| Umbral | Retornos negativos cuando el agente único ya supera ~45% | [EXP] [SCALING] |
| Overhead de coordinación | 58% (independientes) a 515% (híbrido) | [EXP] [SCALING] |
| Éxitos por 1.000 tokens | 67,7 (uno) vs 13,6–42,4 (multi) | [EXP] [SCALING] |
| Tasa de falla de sistemas multiagente públicos | 41% a 86,7% | [EXP] [MAST] |
| Un cliente que plegó subagentes en un loop | ~2× más rápido | [DOC] [FOLD] (caso sin nombre) |

Las fallas de los sistemas multiagente son de **diseño de sistema**, no solo del modelo: los modos más frecuentes en 1.642 trazas son repetir pasos (15,7%), desajuste entre razonamiento y acción (13,2%), no reconocer la condición de término (12,4%), desobedecer la especificación (11,8%) y verificación ausente o incorrecta (17,3% sumadas). [EXP] [MAST]. Agregar una verificación del objetivo de alto nivel mejoró +15,6% en un sistema; aclarar roles, +9,4%. [EXP] [MAST]

**[REC]** Lectura para el producto: armar un outfit es una tarea **secuencial y de contexto compartido** (ocasión → formalidad → clima → prenda ancla → color → proporción); es exactamente el tipo donde la evidencia muestra que dividir empeora. Buscar productos en varias tiendas es **amplio, paralelizable y con contenido desechable**; es el tipo donde dividir ayuda. Esto confirma con datos la intuición de DT-06 y precisa su excepción.

### 2.3 Tabla de decisión

**[REC]** Síntesis de las fuentes anteriores. Dividir en otro agente solo si se cumple al menos una fila de la izquierda y ninguna de la derecha:

| Señal a favor de un subagente | Señal en contra |
|---|---|
| La subtarea trae más de ~1.000 tokens que el agente principal no necesita después ([DOC] [MA-WHEN]) | El resultado depende de decisiones que el principal ya tomó o tomará |
| Hay 3 o más subtareas independientes que pueden correr a la vez | Las subtareas se alimentan entre sí en secuencia |
| El contenido es **no confiable** (páginas web) y conviene aislarlo con otros permisos | El subagente tendría que escribir en el mismo estado que el principal |
| Se necesita un verificador con contexto limpio | La línea base con un agente no se ha medido |
| Más de ~30–50 herramientas degradan la selección ([DOC] [FOLD]) y ya se probó carga diferida | El problema se arregla mejorando nombres y descripciones ([DOC] [OAI-GUIA]) |

## 3. Árboles de agentes y distribución de responsabilidades

### 3.1 Las dos formas de delegar

Los tres proveedores distinguen lo mismo con nombres distintos:

| | Delegar **conservando** el control | Delegar **cediendo** el control |
|---|---|---|
| Nombre | Agente como herramienta, subagente, orchestrator-workers, manager | Handoff, transferencia, swarm |
| Quién responde a la persona | El agente principal | El especialista que recibió el traspaso |
| Contexto que recibe el especialista | Solo lo que el principal escribe en la llamada | La conversación completa (filtrable) |
| OpenAI Agents SDK | `agent.asTool()` [DOC] [OAI-TOOLS] | `handoffs`, `transfer_to_<agente>` [DOC] [OAI-HANDOFF] |
| Google ADK | `AgentTool`; modos `task` y `single_turn` [DOC] [ADK-PAT] | `transfer_to_agent`; modo `chat` [DOC] [ADK-PAT], [ADK-COLAB] |
| Microsoft Agent Framework | Agent-as-tools; Magentic | Orquestación Handoff (malla sin orquestador) [DOC] [MAF-HANDOFF] |
| Claude Agent SDK | Herramienta `Agent`: el subagente parte limpio y solo vuelve su mensaje final [DOC] [CAS-SUB] | No tiene handoff; existe `fork`, que copia la conversación [DOC] [CAS-SUB] |

Criterio de uso: agente como herramienta cuando un solo agente debe ser dueño de la respuesta final, combinar resultados o aplicar guardrails en un único lugar; handoff cuando el especialista debe hablar directo con la persona o necesita instrucciones o modelo distintos. [DOC] [OAI-ORQ]

### 3.2 Jerarquías reales

- **Research de Anthropic**: un agente líder planifica y lanza 3 a 5 subagentes de búsqueda en paralelo; un agente de citas cierra. El líder espera a cada tanda (síncrono) y no puede redirigirlos en vuelo. [DOC] [MARS]
- **Claude Agent SDK**: profundidad máxima de subagentes 3 y concurrencia 20 por defecto, configurables. [DOC] [CAS-SUB]
- **Managed Agents**: multiagente de **un solo nivel** de profundidad; cada agente en su hilo con contexto aislado, compartiendo sandbox. [DOC] [CMA-MULTI]
- **Harness de tres agentes** (planner → generator → evaluator) para construir aplicaciones largas: el evaluador separado existe por el sesgo de autoevaluación del generador. Costó US$200 y 6 h contra US$9 y 20 min del agente solo, con mejor resultado. Con un modelo más nuevo se eliminaron piezas del harness. [DOC] [HARNESS-APPS]
- **Compilador de C con 16 agentes sin orquestador**: cada agente toma una tarea con un lock por archivo; la coordinación la hace el repositorio, no un agente. [DOC] [C-COMPILER]
- **Magentic-One** (Microsoft): un orquestador con plan (*task ledger*) y seguimiento (*progress ledger*) que detecta estancamiento y replanifica. [DOC] [MAGENTIC-ONE]

### 3.3 Cómo se reparten responsabilidades

- **Por contexto, no por organigrama.** Copiar la estructura de un equipo humano (un agente "de estilo", otro "de color", otro "de compras") es el antipatrón que Anthropic llama arquitectura que copia el organigrama; produce pérdida de contexto en los traspasos, proliferación de subagentes y evals locales engañosas. [DOC] [FOLD], [MA-WHEN]
- **El conocimiento especializado no exige un agente.** Los prompts de un subagente pueden convertirse en *skills* (instrucciones que se cargan solo cuando hacen falta) y sus llamadas en herramientas con las validaciones y aprobaciones adentro. [DOC] [FOLD]
- **Cada herramienta, una responsabilidad clara.** Si una persona no sabría cuál de dos herramientas usar, el agente tampoco. [DOC] [CTX-ENG]

## 4. Árboles de decisión y rutas de razonamiento

Hay tres lugares donde puede vivir una decisión, de más a menos controlable:

| Dónde vive | Cómo se construye | Ejemplo de framework |
|---|---|---|
| **En el código** | `if`, `switch`, arista condicional de un grafo, router con salida estructurada | Conditional edges de LangGraph (`A3`); nodo router de ADK que emite una ruta [DOC] [ADK-GRAFOS]; `Promise.all` y `while` en el Agents SDK [DOC] [OAI-ORQ] |
| **En el esquema** | Enums, `strict: true`, salida estructurada, argumentos imposibles de equivocar (poka-yoke) | Anthropic exigió rutas absolutas en una herramienta y eliminó una clase de error [DOC] [BEA] |
| **En el prompt** | Instrucciones, heurísticas, ejemplos | Reglas de esfuerzo en el prompt del líder de research: dato simple = 1 agente con 3–10 llamadas; comparación = 2–4 subagentes [DOC] [MARS] |

Reglas de diseño documentadas:

- Prompt a la "altitud correcta": ni lógica if-else frágil ni guía vaga; pocos ejemplos canónicos en vez de una lista de casos borde. [DOC] [CTX-ENG]
- Cuando el prompt acumula ramas condicionales, es señal de mover la decisión a código (router o grafo) o de dividir. [DOC] [OAI-GUIA]
- Antes de multiagente: un prompt base con variables de política en vez de muchos prompts. [DOC] [OAI-GUIA]

**[REC]** Regla práctica: una decisión que **siempre** debe resolverse igual (¿este outfit es válido?, ¿esta acción necesita aprobación?) va en código; una que requiere juicio estético (¿qué prenda ancla?) va en el modelo; una que tiene pocas salidas conocidas pero requiere leer lenguaje (¿la persona quiere un look, evaluar una compra o agregar una prenda?) va en un router con salida estructurada.

## 5. Cómo un agente decide qué ejecutar y cuándo delegar

- **El modelo elige por nombre, descripción y esquema.** La selección de herramienta y la delegación a un subagente usan el mismo mecanismo: el subagente se expone como herramienta y se elige por su `description`. [DOC] [CAS-SUB], [ADK-PAT], [OAI-HANDOFF]
- **Las descripciones son la palanca principal.** Un agente que reescribió descripciones de herramientas bajó 40% el tiempo de tarea [DOC] [MARS]. Ejemplos de uso en la definición subieron la exactitud de parámetros complejos de 72% a 90% [DOC] [ADV-TOOLS].
- **La delegación necesita un contrato.** Cada subagente recibe objetivo, formato de salida, guía de herramientas y fuentes, y límites. Las instrucciones vagas produjeron trabajo duplicado y huecos; versiones tempranas lanzaban 50 subagentes para consultas simples. [DOC] [MARS]
- **Los modelos recientes delegan con más facilidad**, al punto que el preset de Claude Code agrega una instrucción para no delegar salvo que se pida. [DOC] [CAS-SUB]
- **El código puede quitarle la decisión al modelo**: `toolChoice` forzado, `toolUseBehavior`, `stopAtToolNames` [DOC] [OAI-AGENTS]; `isEnabled` para ocultar una herramienta según el contexto [DOC] [OAI-HANDOFF].

## 6. Coordinación entre agentes que dependen de otros

| Mecanismo | Cómo funciona | Riesgo | Quién lo usa |
|---|---|---|---|
| **Mensaje (prompt de la llamada)** | El padre escribe todo lo que el hijo necesita en un string | El padre resume mal; "teléfono descompuesto" | Claude Agent SDK [DOC] [CAS-SUB]; `asTool` [DOC] [OAI-TOOLS] |
| **Historia completa** | El receptor ve toda la conversación | Costo, y contexto irrelevante | Handoffs de OpenAI, filtrables con `inputFilter` [DOC] [OAI-HANDOFF] |
| **Estado compartido tipado** | Los agentes leen y escriben claves de un estado común | Sobrescrituras concurrentes | `output_key` de ADK [DOC] [ADK-PAT]; estado de LangGraph con reducers (`A3`) |
| **Artefactos externos** | El hijo escribe a un archivo o tabla y devuelve una referencia liviana | Requiere almacenamiento y convención | Research de Anthropic [DOC] [MARS]; harness planner/generator/evaluator [DOC] [HARNESS-APPS] |
| **Salida → entrada** | El valor de retorno de un nodo es la entrada del siguiente | Rigidez | Grafos de ADK 2.0 [DOC] [ADK-GRAFOS]; executors de Agent Framework [DOC] [MAF-WF] |
| **Difusión** | Cada agente transmite sus respuestas a todos; no se difunde el contenido de herramientas | Contexto incompleto sobre lo que otro hizo | Handoff de Agent Framework [DOC] [MAF-HANDOFF] |

Lecciones documentadas:

- **Estado compartido sin dueño se corrompe.** Agentes escribiendo a una tabla común se sobrescribieron (41 de 57 hechos conservados); con una página por agente, 57 de 57. [DOC] [MEMORY-COMP]
- **Contratos explícitos antes de ejecutar.** Generador y evaluador acuerdan qué significa "terminado" antes de empezar (*sprint contracts*). [DOC] [HARNESS-APPS]
- **El hijo devuelve poco.** Un subagente puede gastar decenas de miles de tokens y devolver 1.000–2.000 [DOC] [CTX-ENG]; la recomendación más reciente es un resumen de 50–100 tokens para el principal [DOC] [MA-WHEN].
- **El reporte de un subagente es dato no confiable.** El Agent SDK lo escanea buscando texto con forma de instrucción antes de que el padre lo lea. [DOC] [CAS-SUB]

## 7. Ciclos de ejecución, validaciones y reintentos

El loop es el mismo en todos los frameworks: llamar al modelo → si hay salida final, terminar → si hay llamadas a herramienta, ejecutarlas, agregar resultados y repetir → cortar al llegar a un tope. [DOC] [OAI-RUN], [CAS-LOOP]

| Control | OpenAI Agents SDK (TS 0.22) | Claude Agent SDK | Google ADK | Microsoft Agent Framework |
|---|---|---|---|---|
| Tope de vueltas | `maxTurns` = 10 por defecto; lanza `MaxTurnsExceededError` [OAI-RUN] | `maxTurns` (sin límite por defecto); resultado `error_max_turns` [CAS-LOOP] | `maxIterations` o un subagente que pone `escalate` [ADK-LOOP] | `max_round_count`, tope de 50 turnos autónomos por agente [MAF-HANDOFF] |
| Tope de gasto | No documentado como opción del run | `maxBudgetUsd`; resultado `error_max_budget_usd` [CAS-LOOP] | — | — |
| Estancamiento | — | — | — | `max_stall_count`, `max_reset_count`: replanifica [MAF-MAGENTIC] |
| Error de herramienta | `errorFunction` lo convierte en resultado visible al modelo; `timeoutMs` [OAI-TOOLS] | Hook `PostToolUseFailure` [CAS-HOOKS] | `after_tool_callback` [ADK-CB] | middleware |
| Degradación controlada | `errorHandlers` devuelven una salida final en vez de excepción [OAI-RUN] | Subtipos de resultado [CAS-LOOP] | — | — |
| Validación | Guardrails de input, output y herramienta con *tripwire* [OAI-GUARD] | Hooks `PreToolUse` / `PostToolUse` [CAS-HOOKS] | Callbacks que sobrescriben o saltan el paso; plugins [ADK-CB] | Validación de tipos al construir el grafo [MAF-WF] |

(Todas las celdas son [DOC] de la fuente indicada.)

Dos patrones de validación con reintento:

- **El error vuelve al modelo como dato accionable** y el modelo corrige. Es lo que ya hace `propose_outfit` en nuestra base. [DOC] [TOOLS-ENG] recomienda errores accionables, no códigos opacos.
- **Generador + verificador con tope.** Un agente genera, otro evalúa; con máximo de iteraciones y un fallback definido (escalar a una persona o devolver el mejor intento). El riesgo del verificador es la "victoria temprana": aprobar sin comprobar. [DOC] [MA-COORD], [MA-WHEN]

## 8. Cómo se evita que un agente se desvíe de su responsabilidad

| Mecanismo | Qué hace | Evidencia |
|---|---|---|
| **Superficie mínima de herramientas** | Lo que el agente no tiene, no puede usarlo mal | [DOC] [CAS-SUB]: `tools` y `disallowedTools` por subagente |
| **Guardrail de relevancia** | Un clasificador barato decide si la entrada es del dominio | [DOC] [OAI-GUIA] |
| **Guardrails en capas** | Relevancia, seguridad, PII, moderación, reglas, validación de salida; ninguno basta solo | [DOC] [OAI-GUIA] |
| **Clasificar herramientas por riesgo** | Bajo, medio o alto según lectura/escritura, reversibilidad e impacto financiero; el nivel decide si pausa o escala | [DOC] [OAI-GUIA] |
| **Aprobación como pausa serializable** | El run se detiene, el estado se guarda y se reanuda con la decisión | [DOC] [OAI-HITL], [MAF-HITL], [ADK-HITL] |
| **Verificación del objetivo** | Un paso final comprueba el resultado contra el pedido original | [EXP] [MAST]: +15,6% |
| **Re-anclaje tras compactar** | Las reglas persistentes van fuera del historial, porque la compactación puede perder instrucciones tempranas | [DOC] [CAS-LOOP] |
| **Control de flujo en código** | El orden lo fija un script o grafo; el modelo solo ejecuta cada paso | [DOC] [DYN-WF]: ataca "pereza agéntica" y deriva de objetivo |

Advertencias sobre guardrails: en el Agents SDK los guardrails de entrada corren por defecto **en paralelo** al agente (ejecución optimista), así que el modelo puede haber gastado tokens o llamado herramientas antes de que salte; y los guardrails de herramienta **no** cubren handoffs ni agentes usados como herramienta. [DOC] [OAI-GUARD]. Los guardrails no reemplazan autenticación, autorización ni control de acceso. [DOC] [OAI-GUIA]

## 9. Los frameworks de los proveedores, en una ficha

Detalle de comparación y puntajes en `D`. Aquí solo lo que enseña cada uno sobre diseño.

### 9.1 Anthropic: tres niveles de control

La documentación contrasta cuatro opciones: el SDK cliente (uno escribe el loop o usa el *tool runner*), el Agent SDK (un proceso que uno opera), la CLI, y Managed Agents (Anthropic aloja el loop). [DOC] [CAS-OVERVIEW]

- **API de Mensajes + loop propio o tool runner.** `client.beta.messages.toolRunner` (beta) corre hasta un mensaje sin llamadas a herramienta o hasta `max_iterations`; una excepción en una herramienta vuelve como `tool_result` con `is_error`. Para aprobación humana dentro del loop, la propia página recomienda el loop manual. [DOC] [TOOL-RUNNER]. Piezas disponibles: salida estructurada y `strict` en herramientas, caché de prompt, memory tool del lado del cliente (`memory_20250818`), edición de contexto y compactación (beta). [DOC] [API-SO], [API-CACHE], [API-MEM], [API-CTXEDIT], [API-COMPACT]
- **Claude Agent SDK.** Ejecuta el binario de Claude Code: mismo loop, herramientas y manejo de contexto. `query()` lanza un **subproceso** que es dueño del shell, del directorio y de los transcripts en disco local; la doc dice que alojarlo no es como alojar un wrapper sin estado. Punto de partida: 1 GiB de RAM, 5 GiB de disco y 1 CPU por agente. [DOC] [CAS-OVERVIEW], [CAS-HOSTING]. Ofrece hooks, modos de permiso, subagentes, sesiones reanudables y compactación automática. [DOC] [CAS-LOOP], [CAS-HOOKS], [CAS-SUB]
- **Claude Managed Agents.** Harness alojado, en **beta** (`managed-agents-2026-04-01`): agente versionado, entorno (sandbox), sesión y eventos por SSE. Las herramientas propias se resuelven con un evento que la aplicación responde; hay confirmación de herramienta y presupuesto por sesión. Cobra tokens más US$0,08 por hora de sesión en ejecución. No disponibles dentro: structured outputs ni programmatic tool calling. [DOC] [CMA-OVERVIEW], [CMA-REF], [PRICING]. Su arquitectura separa tres abstracciones intercambiables: **sesión** (log solo de anexado), **harness** (el loop) y **sandbox** (donde se ejecuta). [DOC] [MA-ENG]

### 9.2 OpenAI Agents SDK (TypeScript `@openai/agents` 0.22.0)

Enseña el vocabulario más limpio de control: `Agent`, `Runner`, handoffs, guardrails en tres familias, `needsApproval` con `RunState` serializable, `Session` como interfaz de cinco métodos y trazas con spans por agente, turno, generación, función, guardrail y handoff. [DOC] [OAI-AGENTS], [OAI-RUN], [OAI-HITL], [OAI-SESS], [OAI-TRACE]. Límites para nosotros: sigue en 0.x (cambios incompatibles en versiones menores) [DOC] [OAI-REL]; Claude solo mediante un adaptador del AI SDK que la doc declara en beta y con funciones recortadas [DOC] [OAI-AISDK]; no trae sesión para Postgres [DOC] [OAI-SESS]. El constructor visual Agent Builder está deprecado con cierre el 2026-11-30 [DOC] [OAI-BUILDER].

### 9.3 Google ADK (`@google/adk` 2.5.0)

ADK 2.0 cambió de un ejecutor jerárquico de agentes a un **motor de grafo**: agentes, herramientas y funciones son nodos; las plantillas `SequentialAgent`, `ParallelAgent` y `LoopAgent` quedaron deprecadas [DOC] [ADK-2], [ADK-WFA]. Es la señal más clara de hacia dónde converge la industria: grafo explícito + agentes como nodos. Límites para nosotros: en TypeScript, Claude solo vía Google Cloud y sin streaming [DOC] [ADK-CLAUDE]; sesiones persistentes, reanudación, evaluación y A2A no aparecen documentados para TypeScript [DOC] [ADK-SESS], [ADK-RESUME], [ADK-EVAL] (que la página no lo liste no prueba que el paquete no lo traiga; ver `preguntas-abiertas.md`).

### 9.4 Microsoft: AutoGen archivado, Agent Framework sin TypeScript

AutoGen está archivado y Microsoft desaconseja su uso en producción [DOC] [AUTOGEN]. Su sucesor, Agent Framework (Python 1.26.0 estable, .NET, Go en preview), **no tiene SDK TypeScript** [DOC] [MAF-OVERVIEW], así que queda fuera como opción; sirve como referencia de diseño:

- Ejecución por **supersteps** (modelo Pregel): recoge mensajes, ejecuta en paralelo, espera a todos, y crea un **checkpoint al final de cada superstep**. [DOC] [MAF-WF], [MAF-CKPT]
- "El almacenamiento de checkpoints es una frontera de confianza": nunca cargar checkpoints de origen no confiable. [DOC] [MAF-CKPT]
- Las solicitudes de aprobación pendientes se guardan en el checkpoint y se vuelven a emitir al restaurar. [DOC] [MAF-HITL]
- Orquestación **Magentic**: en cada ronda el manager responde si la solicitud está satisfecha, si el equipo está en loop y si hay progreso; rondas sin progreso suben un contador y al superar el máximo replanifica. [DOC] [MAF-MAGENTIC]
- Trae un "Harness Agent" con lo que considera el mínimo: tope de iteraciones, persistencia del historial por llamada, lista de tareas, memoria en archivos, reglas de aprobación y OpenTelemetry. [DOC] [MAF-HARNESS]

### 9.5 Convergencias entre los tres

[REC] Hechos observados en las tres documentaciones:

1. Las tres separan "delegar cediendo el control" de "usar otro agente como herramienta acotada".
2. Las tres ofrecen un camino determinista (código o grafo) junto al dirigido por el LLM.
3. Las tres tratan la aprobación humana como una **pausa serializable** del run, no como una pregunta en el chat.
4. Dos de tres (Google, Microsoft) migraron su motor a un grafo con checkpoints; el tercero (OpenAI) dejó la orquestación en código del lenguaje.

Los frameworks TypeScript independientes (Vercel AI SDK, Mastra, LlamaIndex Workflows), CrewAI, Pydantic AI y los motores de ejecución durable se describen en `D`; LangGraph, en `A3`.

## Enlaces

[BEA]: https://www.anthropic.com/engineering/building-effective-agents
[MARS]: https://www.anthropic.com/engineering/multi-agent-research-system
[CTX-ENG]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[TOOLS-ENG]: https://www.anthropic.com/engineering/writing-tools-for-agents
[HARNESS-APPS]: https://www.anthropic.com/engineering/harness-design-long-running-apps
[ADV-TOOLS]: https://www.anthropic.com/engineering/advanced-tool-use
[MA-ENG]: https://www.anthropic.com/engineering/managed-agents
[C-COMPILER]: https://www.anthropic.com/engineering/building-c-compiler
[MEMORY-COMP]: https://www.anthropic.com/engineering/components-of-agent-memory
[MA-WHEN]: https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them
[MA-COORD]: https://claude.com/blog/multi-agent-coordination-patterns
[FOLD]: https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop
[DYN-WF]: https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/
[CAS-OVERVIEW]: https://code.claude.com/docs/en/agent-sdk/overview
[CAS-LOOP]: https://code.claude.com/docs/en/agent-sdk/agent-loop
[CAS-SUB]: https://code.claude.com/docs/en/agent-sdk/subagents
[CAS-HOSTING]: https://code.claude.com/docs/en/agent-sdk/hosting
[CAS-HOOKS]: https://code.claude.com/docs/en/agent-sdk/hooks
[CMA-OVERVIEW]: https://platform.claude.com/docs/en/managed-agents/overview
[CMA-REF]: https://platform.claude.com/docs/en/managed-agents/reference
[CMA-MULTI]: https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration
[PRICING]: https://platform.claude.com/docs/en/about-claude/pricing
[TOOL-RUNNER]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
[API-SO]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
[API-CACHE]: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[API-MEM]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
[API-CTXEDIT]: https://platform.claude.com/docs/en/build-with-claude/context-editing
[API-COMPACT]: https://platform.claude.com/docs/en/build-with-claude/compaction
[COG-1]: https://cognition.com/blog/dont-build-multi-agents
[COG-2]: https://cognition.com/blog/multi-agents-working
[MAST]: https://arxiv.org/abs/2503.13657
[SCALING]: https://arxiv.org/abs/2512.08296
[OAI-GUIA]: https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
[OAI-AGENTS]: https://openai.github.io/openai-agents-js/guides/agents/
[OAI-RUN]: https://openai.github.io/openai-agents-js/guides/running-agents/
[OAI-ORQ]: https://openai.github.io/openai-agents-js/guides/multi-agent/
[OAI-HANDOFF]: https://openai.github.io/openai-agents-js/guides/handoffs/
[OAI-TOOLS]: https://openai.github.io/openai-agents-js/guides/tools/
[OAI-GUARD]: https://openai.github.io/openai-agents-js/guides/guardrails/
[OAI-HITL]: https://openai.github.io/openai-agents-js/guides/human-in-the-loop/
[OAI-SESS]: https://openai.github.io/openai-agents-js/guides/sessions/
[OAI-TRACE]: https://openai.github.io/openai-agents-js/guides/tracing/
[OAI-REL]: https://openai.github.io/openai-agents-js/guides/release/
[OAI-AISDK]: https://openai.github.io/openai-agents-js/extensions/ai-sdk/
[OAI-BUILDER]: https://developers.openai.com/api/docs/guides/agent-builder
[ADK-2]: https://adk.dev/2.0/
[ADK-WFA]: https://adk.dev/agents/workflow-agents/
[ADK-LOOP]: https://adk.dev/agents/workflow-agents/loop-agents/
[ADK-GRAFOS]: https://adk.dev/graphs/
[ADK-PAT]: https://adk.dev/workflows/patterns/
[ADK-COLAB]: https://adk.dev/workflows/collaboration/
[ADK-CB]: https://adk.dev/callbacks/
[ADK-HITL]: https://adk.dev/graphs/human-input/
[ADK-SESS]: https://adk.dev/sessions/session/
[ADK-RESUME]: https://adk.dev/runtime/resume/
[ADK-EVAL]: https://adk.dev/evaluate/
[ADK-CLAUDE]: https://adk.dev/agents/models/anthropic/
[AUTOGEN]: https://github.com/microsoft/autogen
[MAGENTIC-ONE]: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/magentic-one.html
[MAF-OVERVIEW]: https://learn.microsoft.com/en-us/agent-framework/overview/
[MAF-WF]: https://learn.microsoft.com/en-us/agent-framework/concepts/workflows/
[MAF-CKPT]: https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints
[MAF-HITL]: https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop
[MAF-HANDOFF]: https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/handoff
[MAF-MAGENTIC]: https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/magentic
[MAF-HARNESS]: https://learn.microsoft.com/en-us/agent-framework/concepts/harness
