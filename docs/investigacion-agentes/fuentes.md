# Fuentes

> Todas las fuentes citadas en `A1`, `A2`, `A3`, `B` y `D`, agrupadas por tema. **Fecha de consulta de todas: 2026-11-14.**
> Cada línea: enlace · por qué sirve · claves con que se cita · documentos donde aparece. Las claves son locales a cada documento (una misma URL puede tener claves distintas en dos documentos).
> Cómo se leyeron: con una herramienta que convierte la página a texto y, en la mayoría de los casos, la resume con un modelo. Las páginas de `platform.claude.com`, `code.claude.com` y `vercel.com/docs` llegaron en texto crudo. Lo que no se pudo abrir o verificar está en `preguntas-abiertas.md`, no aquí.
> Total: 272 fuentes únicas.

## 1. Anthropic: ingeniería y guías

- <https://www.anthropic.com/engineering/building-effective-agents> — Texto base: workflows vs agentes, los cinco patrones, partir simple · claves: `BEA` · en: A1, A2, A3, B, D
- <https://www.anthropic.com/engineering/multi-agent-research-system> — Arquitectura líder + subagentes, costo en tokens, cómo delegan, evals · claves: `MARS` · en: A1, A2, B
- <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents> — Qué entra al contexto, compactación, notas, subagentes · claves: `CTX-ENG` · en: A1, A2, B
- <https://www.anthropic.com/engineering/writing-tools-for-agents> — Cómo diseñar y evaluar herramientas para agentes · claves: `TOOLS-ENG` · en: A1, A2
- <https://www.anthropic.com/engineering/harness-design-long-running-apps> — Harness planner/generator/evaluator; cada componente codifica un supuesto · claves: `HARNESS-APPS` · en: A1, A2, B
- <https://www.anthropic.com/engineering/advanced-tool-use> — Tool search, llamadas programáticas y ejemplos de uso, con cifras · claves: `ADV-TOOLS` · en: A1, A2
- <https://www.anthropic.com/engineering/managed-agents> — Separación sesión / harness / sandbox en Managed Agents · claves: `MA-ENG` · en: A1, A2
- <https://www.anthropic.com/engineering/building-c-compiler> — 16 agentes sin orquestador coordinados por el repositorio · claves: `C-COMPILER` · en: A1
- <https://www.anthropic.com/engineering/components-of-agent-memory> — Jerarquía de memoria, consolidación y fallas de escritura concurrente · claves: `MEMORY-COMP` · en: A1, A2, B
- <https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them> — Cuándo conviene multiagente: 3-10x tokens y tres casos · claves: `MA-WHEN` · en: A1, A2, B
- <https://claude.com/blog/multi-agent-coordination-patterns> — Cinco patrones de coordinación y sus mecanismos anti-loop · claves: `MA-COORD` · en: A1, B
- <https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop> — Cuándo plegar subagentes en un loop único con skills · claves: `FOLD` · en: A1, A2, B
- <https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/> — Workflows dinámicos: el control de flujo en código · claves: `DYN-WF` · en: A1
- <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents> — Harness para sesiones largas: lista de criterios y archivo de progreso · claves: `HARNESS-LONG` · en: A2
- <https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents> — Vocabulario y método de evals para agentes; pass^k · claves: `EVALS` · en: A2
- <https://www.anthropic.com/engineering/claude-think-tool> — Herramienta think y su reemplazo por pensamiento extendido · claves: `THINK-TOOL` · en: B
- <https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills> — Agent Skills y carga progresiva · claves: `SKILLS` · en: B

## 2. Claude: API, Agent SDK y Managed Agents (documentación)

- <https://code.claude.com/docs/en/agent-sdk/overview> — Qué es el Agent SDK y las cuatro formas de construir sobre Claude · claves: `CAS-OVERVIEW` · en: A1, D
- <https://code.claude.com/docs/en/agent-sdk/agent-loop> — Loop del Agent SDK: topes de turnos y de gasto, resultados · claves: `CAS-LOOP` · en: A1, A2
- <https://code.claude.com/docs/en/agent-sdk/subagents> — Subagentes: contexto limpio, topes de profundidad y concurrencia · claves: `CAS-SUB` · en: A1, A2
- <https://code.claude.com/docs/en/agent-sdk/hosting> — Requisitos de runtime del Agent SDK: subproceso con estado local · claves: `CAS-HOSTING` · en: A1, D
- <https://code.claude.com/docs/en/agent-sdk/hooks> — Hooks del Agent SDK para interceptar herramientas · claves: `CAS-HOOKS` · en: A1
- <https://platform.claude.com/docs/en/managed-agents/overview> — Managed Agents: conceptos, estado beta, datos con estado en servidor · claves: `CMA-OVERVIEW` · en: A1, A2, D
- <https://platform.claude.com/docs/en/managed-agents/reference> — Managed Agents: eventos, confirmación de herramientas, presupuesto · claves: `CMA-REF` · en: A1, A2, D
- <https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration> — Managed Agents: multiagente de un nivel · claves: `CMA-MULTI` · en: A1, B, D
- <https://platform.claude.com/docs/en/about-claude/pricing> — Precios de modelos y de sesiones de Managed Agents · claves: `PRICING` · en: A1, D
- <https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner> — Tool runner beta; recomienda loop manual para aprobación · claves: `TOOL-RUNNER` · en: A1, A2, D
- <https://platform.claude.com/docs/en/build-with-claude/structured-outputs> — Salida estructurada y herramientas estrictas · claves: `API-SO` · en: A1, A2
- <https://platform.claude.com/docs/en/build-with-claude/prompt-caching> — Caché de prompt: orden del prefijo e invalidadores · claves: `API-CACHE` · en: A1, A2
- <https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool> — Memory tool del lado del cliente · claves: `API-MEM` · en: A1, A2, B
- <https://platform.claude.com/docs/en/build-with-claude/context-editing> — Edición de contexto (beta) · claves: `API-CTXEDIT` · en: A1, A2
- <https://platform.claude.com/docs/en/build-with-claude/compaction> — Compactación (beta) · claves: `API-COMPACT` · en: A1, A2
- <https://code.claude.com/docs/en/agent-sdk/permissions> — Modos de permiso y orden de evaluación · claves: `CAS-PERM` · en: A2
- <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview> — Niveles de carga de las skills · claves: `SKILLS-DOC` · en: B
- <https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works> — Cómo funciona el loop de herramientas en la API · claves: `TOOL-USE` · en: B
- <https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons> — Manejo de motivos de término, incluido el rechazo · claves: `STOP-REASONS` · en: B
- <https://code.claude.com/docs/en/agent-sdk/todo-tracking> — Seguimiento de tareas; los modelos nuevos no necesitan lista escrita · claves: `TODO` · en: B

## 3. Debate single-agent vs multi-agent y evidencia

- <https://cognition.com/blog/dont-build-multi-agents> — Postura crítica: no construir multiagentes; contexto completo · claves: `COG-1` · en: A1
- <https://cognition.com/blog/multi-agents-working> — Seguimiento 2026: qué patrones multiagente sí funcionan · claves: `COG-2` · en: A1, B
- <https://arxiv.org/abs/2503.13657> — 14 modos de falla de sistemas multiagente en 1.642 trazas · claves: `MAST` · en: A1, A2
- <https://arxiv.org/abs/2512.08296> — 260 configuraciones: cuándo el multiagente ayuda o empeora · claves: `SCALING` · en: A1, B

## 4. OpenAI

- <https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf> — Guía práctica: componentes, orquestación, guardrails, intervención humana · claves: `OAI-GUIA` · en: A1, A2, B
- <https://openai.github.io/openai-agents-js/guides/agents/> — Agents SDK TS: definición de un agente · claves: `OAI-AGENTS` · en: A1, A2
- <https://openai.github.io/openai-agents-js/guides/running-agents/> — Runner, loop, maxTurns y manejadores de error · claves: `OAI-RUN` · en: A1, A2, D
- <https://openai.github.io/openai-agents-js/guides/multi-agent/> — Orquestación por LLM vs por código · claves: `OAI-ORQ` · en: A1, B
- <https://openai.github.io/openai-agents-js/guides/handoffs/> — Handoffs y filtros de contexto · claves: `OAI-HANDOFF` · en: A1, B
- <https://openai.github.io/openai-agents-js/guides/tools/> — Herramientas y agentes como herramienta · claves: `OAI-TOOLS` · en: A1
- <https://openai.github.io/openai-agents-js/guides/guardrails/> — Guardrails de entrada, salida y herramienta; qué no cubren · claves: `OAI-GUARD` · en: A1, A2, B
- <https://openai.github.io/openai-agents-js/guides/human-in-the-loop/> — Aprobación con RunState serializable y sus reglas de seguridad · claves: `OAI-HITL` · en: A1, A2
- <https://openai.github.io/openai-agents-js/guides/sessions/> — Interfaz Session · claves: `OAI-SESS` · en: A1
- <https://openai.github.io/openai-agents-js/guides/tracing/> — Trazas y spans · claves: `OAI-TRACE` · en: A1, A2, D
- <https://openai.github.io/openai-agents-js/guides/release/> — Política de versiones 0.x · claves: `OAI-REL` · en: A1, D
- <https://openai.github.io/openai-agents-js/extensions/ai-sdk/> — Adaptador para otros modelos (beta) y sus límites · claves: `OAI-AISDK` · en: A1, D
- <https://developers.openai.com/api/docs/guides/agent-builder> — Agent Builder deprecado, cierre 2026-11-30 · claves: `OAI-BUILDER` · en: A1
- <https://developers.openai.com/api/docs/guides/reasoning-best-practices> — Buenas prácticas con modelos de razonamiento · claves: `OAI-REASONING` · en: B
- <https://github.com/openai/swarm> — Swarm: origen del patrón handoff; reemplazado por el Agents SDK · claves: `SWARM` · en: B

## 5. Google ADK

- <https://adk.dev/2.0/> — ADK 2.0: paso a motor de grafo y fechas de GA · claves: `ADK-2` · en: A1
- <https://adk.dev/agents/workflow-agents/> — Agentes de workflow de plantilla, hoy deprecados · claves: `ADK-WFA` · en: A1
- <https://adk.dev/agents/workflow-agents/loop-agents/> — LoopAgent: maxIterations y escalate · claves: `ADK-LOOP` · en: A1
- <https://adk.dev/graphs/> — Grafos en ADK: nodos, rutas, paso de datos · claves: `ADK-GRAFOS` · en: A1
- <https://adk.dev/workflows/patterns/> — Patrones multiagente y paso de estado en ADK · claves: `ADK-PAT` · en: A1
- <https://adk.dev/workflows/collaboration/> — Modos chat, task y single_turn de subagentes · claves: `ADK-COLAB` · en: A1
- <https://adk.dev/callbacks/> — Callbacks que interceptan o saltan pasos · claves: `ADK-CB` · en: A1, A2
- <https://adk.dev/graphs/human-input/> — Entrada humana en grafos · claves: `ADK-HITL` · en: A1
- <https://adk.dev/sessions/session/> — Sesiones; en TS solo en memoria según la doc · claves: `ADK-SESS` · en: A1
- <https://adk.dev/runtime/resume/> — Reanudación; documentada para Python y Kotlin · claves: `ADK-RESUME` · en: A1
- <https://adk.dev/evaluate/> — Evaluación de trayectoria y respuesta · claves: `ADK-EVAL` · en: A1, A2
- <https://adk.dev/agents/models/anthropic/> — Claude en ADK: en TS solo vía Google Cloud y sin streaming · claves: `ADK-CLAUDE` · en: A1, D

## 6. Microsoft

- <https://github.com/microsoft/autogen> — AutoGen archivado · claves: `AUTOGEN` · en: A1, D
- <https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/magentic-one.html> — Orquestador con task ledger y progress ledger · claves: `MAGENTIC-ONE` · en: A1, B
- <https://learn.microsoft.com/en-us/agent-framework/overview/> — Agent Framework: alcance, lenguajes (sin TypeScript) · claves: `MAF-OVERVIEW` · en: A1, D
- <https://learn.microsoft.com/en-us/agent-framework/concepts/workflows/> — Workflows por supersteps · claves: `MAF-WF` · en: A1
- <https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints> — Checkpoint por superstep; frontera de confianza · claves: `MAF-CKPT` · en: A1, A2
- <https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop> — Request/response y aprobación de herramientas · claves: `MAF-HITL` · en: A1
- <https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/handoff> — Orquestación handoff y sincronización de contexto · claves: `MAF-HANDOFF` · en: A1
- <https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/magentic> — Orquestación Magentic: estancamiento y replanificación · claves: `MAF-MAGENTIC` · en: A1, A2, B
- <https://learn.microsoft.com/en-us/agent-framework/concepts/harness> — Definición de harness y componentes mínimos · claves: `MAF-HARNESS` · en: A1, A2
- <https://learn.microsoft.com/en-us/agent-framework/agents/observability> — Observabilidad con OpenTelemetry GenAI · claves: `MAF-OBS` · en: A2
- <https://arxiv.org/abs/2411.04468> — Paper de Magentic-One · claves: `MAGENTIC-PAPER` · en: B

## 7. LangGraph (documentación y repositorios)

- <https://docs.langchain.com/oss/javascript/langgraph/graph-api> — Graph API: nodos, aristas, recursionLimit · claves: `LG-GRAPH` · en: A2, A3, D
- <https://docs.langchain.com/oss/javascript/langgraph/checkpointers> — Checkpointers, threads, super-steps · claves: `LG-CKPT` · en: A2, A3, D
- <https://docs.langchain.com/oss/javascript/langgraph/interrupts> — interrupt() y reanudación · claves: `LG-HITL`, `LG-INT` · en: A2, A3, B, D
- <https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance> — Reintentos, timeouts, idempotencia (at-least-once) · claves: `LG-FAULT` · en: A2, A3, B, D
- <https://www.npmjs.com/package/@langchain/langgraph> — Versiones vigentes de los paquetes · claves: `LG-NPM` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/overview> — Qué es LangGraph; funciona sin LangChain ni LangSmith · claves: `LG-OVERVIEW` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/graph-api-state> — Esquemas de estado y reducers · claves: `LG-STATE` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/graph-api-control-flow> — Control de flujo y manejo de excepciones · claves: `LG-FLOW` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/graph-api-send-command> — Command y Send · claves: `LG-SENDCMD` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/graph-api-nodes> — Nodos · claves: `LG-NODES` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/functional-api> — Functional API · claves: `LG-FUNC` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/persistence> — Persistencia y durabilidad · claves: `LG-PERSIST` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/use-time-travel> — Time travel · claves: `LG-TT` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/use-subgraphs> — Subgrafos · claves: `LG-SUB` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/workflows-agents> — Workflows y agentes · claves: `LG-WF` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/streaming> — Streaming · claves: `LG-STREAM` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/event-streaming> — Streaming de eventos v3 · claves: `LG-EVENTS` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/memory> — Memoria: conceptos · claves: `LG-MEM` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/add-memory> — Memoria: cómo agregarla · claves: `LG-ADDMEM` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/stores> — Stores de largo plazo · claves: `LG-STORES` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/deploy> — Opciones de despliegue · claves: `LG-DEPLOY` · en: A3
- <https://docs.langchain.com/oss/javascript/releases/langgraph-v1> — Notas de la v1 · claves: `LG-V1` · en: A3
- <https://docs.langchain.com/oss/javascript/migrate/langgraph-v1> — Guía de migración a la v1 · claves: `LG-MIG` · en: A3
- <https://docs.langchain.com/oss/python/langgraph/graph-api-state> — Estado en Python (contraste) · claves: `LG-PY-STATE` · en: A3
- <https://docs.langchain.com/oss/python/langgraph/checkpointers> — Checkpointers en Python (contraste; cifrado) · claves: `LG-PY-CKPT` · en: A3
- <https://github.com/langchain-ai/langgraphjs/blob/main/libs/checkpoint-postgres/README.md> — README de PostgresSaver · claves: `LG-PG-README` · en: A3
- <https://github.com/langchain-ai/langgraphjs/blob/main/libs/checkpoint-postgres/src/migrations.ts> — Migraciones de PostgresSaver: tablas sin user_id (verificado) · claves: `LG-PG-MIGR` · en: A3
- <https://github.com/langchain-ai/langgraphjs/blob/main/libs/checkpoint/README.md> — README del paquete de checkpoint · claves: `LG-CKPT-README` · en: A3
- <https://github.com/langchain-ai/langgraphjs/blob/main/libs/langgraph-core/src/prebuilt/tool_node.ts> — Código de ToolNode: manejo de errores · claves: `LG-TOOLNODE-SRC` · en: A3
- <https://github.com/langchain-ai/langgraphjs/tree/main/libs/langgraph-supervisor> — Paquete supervisor en JS · claves: `LG-SUPERVISOR-JS` · en: A3
- <https://github.com/langchain-ai/langgraph-supervisor-py> — Paquete supervisor en Python: recomienda el patrón por herramientas · claves: `LG-SUPERVISOR-PY`, `LG-SUPERVISOR` · en: A3, B
- <https://github.com/langchain-ai/langgraphjs/tree/main/libs/langgraph-swarm> — Paquete swarm en JS · claves: `LG-SWARM-JS` · en: A3
- <https://github.com/langchain-ai/langgraphjs/issues/2971> — Issue sobre interrupt dentro de Send · claves: `LG-ISSUE-2971` · en: A3
- <https://github.com/langchain-ai/langgraphjs/pull/641> — PR cerrado de un checkpointer para Supabase · claves: `LG-PR-641` · en: A3
- <https://docs.langchain.com/oss/javascript/langgraph/> — Qué es LangGraph; funciona sin LangChain ni LangSmith · claves: `LG-OVERVIEW` · en: D
- <https://github.com/langchain-ai/langgraphjs/tree/main/libs/checkpoint-postgres> — Paquete checkpoint-postgres · claves: `LG-PG` · en: D

## 8. LangChain v1, Deep Agents y memoria

- <https://docs.langchain.com/oss/javascript/releases/langchain-v1> — LangChain v1: createAgent · claves: `LC-V1` · en: A3
- <https://www.langchain.com/blog/langchain-langgraph-1dot0> — Anuncio de las versiones 1.0 · claves: `LC-V1-BLOG` · en: A3
- <https://docs.langchain.com/oss/javascript/concepts/products> — Framework vs runtime vs harness según el proveedor · claves: `LC-PRODUCTS` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/overview> — Visión general de LangChain · claves: `LC-OVERVIEW` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/agents> — createAgent · claves: `LC-AGENTS` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/tools> — Herramientas · claves: `LC-TOOLS` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/human-in-the-loop> — Middleware de aprobación humana · claves: `LC-HITL` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/middleware/built-in> — Middleware incluidos · claves: `LC-MW` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/structured-output> — Salida estructurada · claves: `LC-SO` · en: A3
- <https://docs.langchain.com/oss/javascript/releases/changelog> — Registro de cambios · claves: `LC-CHANGELOG` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/multi-agent> — Patrones multiagente documentados (JS) · claves: `LC-MA` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/multi-agent/subagents> — Subagentes (supervisor por herramientas) · claves: `LC-MA-SUB` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/multi-agent/handoffs> — Handoffs · claves: `LC-MA-HANDOFF` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/multi-agent/skills> — Skills · claves: `LC-MA-SKILLS` · en: A3
- <https://docs.langchain.com/oss/javascript/langchain/long-term-memory> — Memoria de largo plazo · claves: `LC-LTM` · en: A3
- <https://docs.langchain.com/oss/javascript/deepagents/overview> — Deep Agents · claves: `LC-DEEP` · en: A3
- <https://www.langchain.com/blog/benchmarking-multi-agent-architectures> — Benchmark de arquitecturas multiagente del proveedor · claves: `LC-BENCH` · en: A3
- <https://langchain-ai.github.io/langmem/> — LangMem (solo Python) · claves: `LC-LANGMEM` · en: A3
- <https://forum.langchain.com/t/langmem-support-in-js-ts/1982> — Estado de LangMem en JS · claves: `LC-LANGMEM-FORO` · en: A3
- <https://www.langchain.com/blog/how-to-think-about-agent-frameworks> — Autocrítica del proveedor sobre sus abstracciones · claves: `LC-THINK` · en: A3
- <https://docs.langchain.com/oss/python/langchain/multi-agent> — Patrones multiagente y tabla de trade-offs (Python) · claves: `LC-MULTI` · en: B
- <https://www.langchain.com/blog/planning-agents> — Plan-and-execute, ReWOO y LLMCompiler explicados · claves: `LC-PLAN` · en: B

## 9. LangSmith y despliegue

- <https://www.langchain.com/pricing> — Precios de LangSmith · claves: `LS-PRICING` · en: A2, A3, D
- <https://docs.langchain.com/langsmith/observability-concepts> — Conceptos de observabilidad · claves: `LS-CONCEPTS` · en: A3
- <https://docs.langchain.com/langsmith/trace-anthropic> — Trazar el SDK de Anthropic sin LangChain · claves: `LS-ANTHROPIC` · en: A3, D
- <https://docs.langchain.com/langsmith/trace-with-opentelemetry> — Trazas por OpenTelemetry · claves: `LS-OTEL` · en: A3
- <https://docs.langchain.com/langsmith/trace-with-vercel-ai-sdk> — Trazas con Vercel AI SDK · claves: `LS-AISDK` · en: A3
- <https://docs.langchain.com/langsmith/annotate-code> — Anotar código propio · claves: `LS-ANNOTATE` · en: A3
- <https://docs.langchain.com/langsmith/evaluation-concepts> — Conceptos de evaluación · claves: `LS-EVAL` · en: A3
- <https://docs.langchain.com/langsmith/online-evaluations> — Evaluaciones en línea · claves: `LS-ONLINE` · en: A3
- <https://docs.langchain.com/langsmith/trajectory-evals> — Evaluación de trayectoria · claves: `LS-TRAJ` · en: A3
- <https://docs.langchain.com/langsmith/studio> — Studio · claves: `LS-STUDIO` · en: A3
- <https://docs.langchain.com/langsmith/self-hosted> — Autoalojamiento (Enterprise) · claves: `LS-SELFHOST` · en: A3
- <https://docs.langchain.com/langsmith/usage-and-billing> — Uso y facturación · claves: `LS-USAGE` · en: A3
- <https://docs.langchain.com/langsmith/billing> — Facturación de Agent Server · claves: `LS-BILLING` · en: A3
- <https://docs.langchain.com/langsmith/cloud-platform-features> — Tipos de despliegue en la nube · claves: `LS-CLOUD-FEATURES` · en: A3
- <https://docs.langchain.com/langsmith/deployment> — Agent Server: nombre vigente y opciones · claves: `LS-DEPLOYMENT` · en: A3
- <https://docs.langchain.com/langsmith/deploy-nextjs> — Guía oficial para embeber un agente en Next.js sobre Vercel · claves: `LS-NEXTJS`, `LG-NEXT` · en: A3, D
- <https://github.com/langchain-ai/deployment-cookbook/tree/main/js-next> — Ejemplo oficial Next.js · claves: `LS-COOKBOOK` · en: A3
- <https://docs.langchain.com/langsmith/deploy-standalone-server> — Servidor standalone; no usar en serverless · claves: `LS-STANDALONE` · en: A3
- <https://platform.inference.net/content/langsmith-pricing/> — Precio por traza adicional según un tercero (no confirmado) · claves: `LS-PRICE-3RD` · en: A3

## 10. Casos de empresas y críticas a LangChain/LangGraph

- <https://www.thoughtworks.com/radar/languages-and-frameworks/langgraph> — Thoughtworks Radar: LangGraph baja a Trial en abril 2026 (verificado) · claves: `LG-RADAR`, `TW-RADAR` · en: A3, D
- <https://dev.to/deadlocker/why-i-stopped-using-langgraph-4jo2> — Crítica de un desarrollador · claves: `LG-CRIT-DEV` · en: A3
- <https://www.langchain.com/state-of-agent-engineering> — Encuesta del proveedor sobre agentes en producción · claves: `LC-STATE-AE` · en: A3
- <https://www.langchain.com/customers> — Lista de clientes del proveedor · claves: `LC-CUSTOMERS` · en: A3
- <https://www.langchain.com/built-with-langgraph> — Lista 'built with LangGraph' del proveedor · claves: `LC-BUILT` · en: A3
- <https://www.langchain.com/blog/top-5-langgraph-agents-in-production-2024> — Top 5 de agentes según el proveedor · claves: `LC-TOP5` · en: A3
- <https://news.ycombinator.com/item?id=40739982> — Hilo sobre el post de Octomind · claves: `LC-CRIT-HN` · en: A3
- <https://www.linkedin.com/blog/engineering/ai/practical-text-to-sql-for-data-analytics> — LinkedIn SQL Bot, blog propio · claves: `CASO-LI-SQL` · en: A3
- <https://www.linkedin.com/blog/engineering/generative-ai/behind-the-platform-the-journey-to-create-the-linkedin-genai-application-tech-stack> — LinkedIn: stack GenAI, blog propio · claves: `CASO-LI-STACK` · en: A3
- <https://www.linkedin.com/blog/engineering/ai/how-we-engineered-linkedins-hiring-assistant> — LinkedIn Hiring Assistant, blog propio (no nombra LangGraph) · claves: `CASO-LI-HIRING` · en: A3
- <https://www.uber.com/us/en/blog/enhanced-agentic-rag/> — Uber Genie, blog propio · claves: `CASO-UBER-RAG` · en: A3
- <https://www.uber.com/en-US/blog/ureview/> — Uber uReview, blog propio (no nombra LangGraph) · claves: `CASO-UBER-UREVIEW` · en: A3
- <https://www.langchain.com/blog/customers-klarna> — Klarna, caso publicado por LangChain · claves: `CASO-KLARNA` · en: A3
- <https://www.langchain.com/breakoutagents/replit> — Replit, caso publicado por LangChain · claves: `CASO-REPLIT` · en: A3
- <https://www.elastic.co/blog/building-automatic-import-attack-discovery-langchain> — Elastic, blog coescrito con LangChain · claves: `CASO-ELASTIC` · en: A3
- <https://www.langchain.com/blog/customers-appfolio> — AppFolio, caso publicado por LangChain · claves: `CASO-APPFOLIO` · en: A3
- <https://www.langchain.com/blog/customers-rakuten> — Rakuten, caso publicado por LangChain · claves: `CASO-RAKUTEN` · en: A3
- <https://www.langchain.com/blog/customers-vodafone> — Vodafone, caso publicado por LangChain · claves: `CASO-VODAFONE` · en: A3
- <https://blog.langchain.dev/cisco-outshift/> — Cisco Outshift, caso publicado por LangChain · claves: `CASO-CISCO` · en: A3

## 11. Vercel: AI SDK, Workflows y plataforma

- <https://ai-sdk.dev/docs/agents/loop-control> — Control del loop: stopWhen, prepareStep, tope de 20 (verificado) · claves: `AISDK-LOOP` · en: A2, D
- <https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling> — Herramientas y reparación de llamadas · claves: `AISDK-TOOLS` · en: A2
- <https://ai-sdk.dev/docs/agents/tool-approvals> — Aprobación de herramientas sin pausa; firma HMAC · claves: `AISDK-APPROVAL` · en: A2, D
- <https://ai-sdk.dev/docs/ai-sdk-core/telemetry> — Telemetría OpenTelemetry · claves: `AISDK-TEL` · en: A2, D
- <https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools> — Caso: quitar 80% de las herramientas mejoró el agente · claves: `VERCEL-80` · en: A2
- <https://vercel.com/docs/ai-gateway> — AI Gateway: presupuestos y registros · claves: `VERCEL-GW` · en: A2
- <https://workflow-sdk.dev/docs/foundations/workflows-and-steps> — Workflows y steps; determinismo · claves: `WF-FOUND` · en: A2, D
- <https://workflow-sdk.dev/docs/foundations/errors-and-retries> — Errores y reintentos · claves: `WF-ERR` · en: A2
- <https://workflow-sdk.dev/docs/foundations/hooks> — Hooks para aprobación humana y su seguridad · claves: `WF-HOOKS` · en: A2, D
- <https://vercel.com/docs/functions/limitations> — Límites de duración y tamaño de funciones (verificado) · claves: `LG-VERCEL-LIM`, `VERCEL-LIMITS` · en: A3, D
- <https://vercel.com/kb/guide/what-is-workflowagent> — WorkflowAgent y guía de elección · claves: `VERCEL-KB` · en: D
- <https://ai-sdk.dev/docs/agents/overview> — AI SDK 7: ToolLoopAgent · claves: `AISDK-AGENTS` · en: D
- <https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0> — Renombres de la versión 6 a la 7 · claves: `AISDK-MIG` · en: D
- <https://workflow-sdk.dev/docs/ai> — Agentes durables · claves: `WF-AI` · en: D
- <https://vercel.com/docs/workflows/pricing> — Precios y límites de Vercel Workflows · claves: `WF-PRICING` · en: D
- <https://workflow-sdk.dev/docs/deploying/world/postgres-world> — Adaptador Postgres: no corre en serverless · claves: `WF-PG` · en: D

## 12. Otros frameworks y ejecución durable

- <https://www.inngest.com/docs/learn/inngest-steps> — Inngest: pasos y reintentos · claves: `INNGEST-STEPS` · en: A2, D
- <https://www.inngest.com/docs/learn/how-functions-are-executed> — Inngest: modelo de ejecución · claves: `INNGEST-EXEC` · en: A2, D
- <https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event> — Inngest: espera de eventos para aprobación · claves: `INNGEST-WAIT` · en: A2
- <https://docs.temporal.io/workflows> — Temporal: workflows e historial de eventos · claves: `TEMPORAL-WF` · en: A2
- <https://mastra.ai/reference/agents/generate> — Mastra: generate y maxSteps · claves: `MASTRA-AGENT` · en: A2, D
- <https://mastra.ai/docs/workflows/suspend-and-resume> — Mastra: suspend y resume · claves: `MASTRA-SUSPEND` · en: A2
- <https://mastra.ai/docs/memory/overview> — Mastra: memoria · claves: `MASTRA-MEM` · en: A2, D
- <https://mastra.ai/docs/evals/overview> — Mastra: evaluadores · claves: `MASTRA-EVALS` · en: A2, D
- <https://pydantic.dev/docs/ai/core-concepts/agent/> — Pydantic AI: agente y límites de uso · claves: `PYD-AGENT` · en: A2, D
- <https://pydantic.dev/docs/ai/core-concepts/output/> — Pydantic AI: salida validada con reintento · claves: `PYD-OUTPUT` · en: A2
- <https://docs.crewai.com/en/concepts/tasks> — CrewAI: guardrails de tarea con reintentos · claves: `CREW-TASKS` · en: A2
- <https://supabase.com/docs/guides/database/connecting-to-postgres> — Modos de conexión de Supabase y poolers · claves: `LG-SUPA-CONN`, `SUPA-CONN` · en: A3, D
- <https://mastra.ai/docs/agents/overview> — Mastra: agentes · claves: `MASTRA-AGENTS` · en: D
- <https://mastra.ai/docs/workflows/control-flow> — Mastra: control de flujo de workflows · claves: `MASTRA-WF` · en: D
- <https://mastra.ai/docs/agents/human-in-the-loop> — Mastra: aprobación de herramientas · claves: `MASTRA-HITL` · en: D
- <https://mastra.ai/reference/storage/postgresql> — Mastra: storage Postgres con tablas y migración propias · claves: `MASTRA-PG` · en: D
- <https://mastra.ai/docs/deployment/cloud-providers/vercel> — Mastra: despliegue en Vercel · claves: `MASTRA-VERCEL` · en: D
- <https://github.com/run-llama/workflows-ts> — LlamaIndex workflows-ts: archivado · claves: `LLAMA-TS` · en: D
- <https://docs.crewai.com/en/concepts/crews> — CrewAI: crews y procesos · claves: `CREW` · en: D
- <https://www.inngest.com/pricing> — Inngest: precios · claves: `INNGEST-PRICING` · en: D
- <https://docs.temporal.io/develop/typescript> — Temporal: SDK TypeScript · claves: `TEMPORAL-TS` · en: D
- <https://temporal.io/pricing> — Temporal: precios · claves: `TEMPORAL-PRICING` · en: D

## 13. Harness y context engineering (terceros)

- <https://www.langchain.com/blog/the-anatomy-of-an-agent-harness> — Agent = Model + Harness; componentes del harness · claves: `LC-ANATOMY` · en: A2
- <https://www.langchain.com/blog/agent-frameworks-runtimes-and-harnesses-oh-my> — Diferencia entre framework, runtime y harness · claves: `LC-FRH` · en: A2, A3
- <https://www.langchain.com/blog/context-engineering-for-agents> — Write, select, compress, isolate · claves: `LC-CTX` · en: A2
- <https://www.philschmid.de/agent-harness-2026> — El harness como sistema operativo; build to delete · claves: `SCHMID` · en: A2
- <https://mitchellh.com/writing/my-ai-adoption-journey> — Origen práctico del término harness engineering · claves: `HASHIMOTO` · en: A2
- <https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html> — Guides vs sensors; controles computacionales vs inferenciales · claves: `BOCKELER` · en: A2
- <https://simonwillison.net/2025/Sep/18/agents/> — Definición de agente con condición de término · claves: `WILLISON-AG` · en: A2
- <https://github.com/humanlayer/12-factor-agents> — 12-factor agents: estado, control de flujo, pausar y reanudar · claves: `12F` · en: A2, D
- <https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-09-compact-errors.md> — Errores al contexto y contador de consecutivos · claves: `12F-9` · en: A2
- <https://huyenchip.com/2025/01/07/agents.html> — Error compuesto, planificación y modos de falla · claves: `HUYEN` · en: A2, B
- <https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/services/loopDetectionService.ts> — Código real de detección de loops con umbrales · claves: `GEMINI-LOOP` · en: A2
- <https://dev.opencode.ai/docs/permissions> — Modelo de permisos allow / ask / deny · claves: `OPENCODE-PERM` · en: A2
- <https://learn.chatgpt.com/docs/agent-approvals-security> — Sandbox y aprobación como controles separados · claves: `CODEX-SEC` · en: A2
- <https://docs.cline.bot/features/checkpoints> — Checkpoints tras cada uso de herramienta · claves: `CLINE-CKPT` · en: A2
- <https://microservices.io/patterns/data/saga.html> — Patrón saga y compensaciones · claves: `SAGA` · en: A2
- <https://arxiv.org/abs/2506.12469> — Cinco niveles de autonomía por rol de la persona · claves: `AUTONOMY` · en: A2
- <https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus> — Caché, contexto de solo anexado, enmascarar herramientas · claves: `MANUS` · en: A2
- <https://www.trychroma.com/research/context-rot> — Context rot medido en 18 modelos · claves: `CHROMA` · en: A2
- <https://shopify.engineering/building-production-ready-agentic-systems> — Sidekick: límites de herramientas, instrucciones just-in-time, calibración del juez · claves: `SHOPIFY` · en: A2
- <https://docs.letta.com/guides/agents/memory-blocks> — Bloques de memoria editables por el agente · claves: `LETTA` · en: B

## 14. Evaluación y observabilidad

- <https://hamel.dev/blog/posts/evals-faq/> — Método de evals: análisis de errores primero · claves: `HAMEL-FAQ` · en: A2, B
- <https://hamel.dev/blog/posts/llm-judge/> — Cómo construir y calibrar un juez LLM · claves: `HAMEL-JUDGE` · en: A2
- <https://github.com/open-telemetry/semantic-conventions-genai> — Convenciones OpenTelemetry GenAI, aún no estables · claves: `OTEL-GENAI` · en: A2, D
- <https://langfuse.com/pricing> — Langfuse: licencia y precios · claves: `LANGFUSE` · en: A2, D
- <https://github.com/Arize-ai/phoenix> — Arize Phoenix: licencia · claves: `PHOENIX` · en: A2, D
- <https://www.braintrust.dev/pricing> — Braintrust: precios · claves: `BRAINTRUST` · en: A2, D

## 15. Seguridad

- <https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/> — La trifecta letal · claves: `TRIFECTA` · en: A2
- <https://ai.meta.com/blog/practical-ai-agent-security/> — Regla de dos de Meta · claves: `RULE-OF-TWO` · en: A2, B
- <https://arxiv.org/abs/2503.18813> — CaMeL: defensa por diseño y su costo en utilidad · claves: `CAMEL` · en: A2
- <https://arxiv.org/abs/2506.08837> — Seis patrones de diseño contra inyección · claves: `SEC-PATTERNS` · en: A2, B
- <https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/> — Resumen de los seis patrones · claves: `WILLISON-PATTERNS` · en: A2
- <https://simonwillison.net/2023/Oct/14/multi-modal-prompt-injection/> — Inyección por texto en imágenes · claves: `WILLISON-IMG` · en: A2
- <https://simonwillison.net/tags/exfiltration-attacks/> — Casos reales de exfiltración por imagen y enlace · claves: `WILLISON-EXFIL` · en: A2
- <https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/> — OWASP Top 10 para aplicaciones agénticas · claves: `OWASP-AGENTIC` · en: A2, B
- <https://genai.owasp.org/llm-top-10/> — OWASP Top 10 para aplicaciones LLM (edición 2025) · claves: `OWASP-LLM` · en: A2

## 16. Comercio agéntico e idempotencia

- <https://developers.openai.com/commerce/llms-full.txt> — Reglas de consentimiento en comercio agéntico de OpenAI · claves: `OAI-COMMERCE` · en: A2
- <https://docs.stripe.com/api/idempotent_requests> — Claves de idempotencia · claves: `STRIPE-IDEM` · en: A2
- <https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens.md?agent-seller=agent> — Tokens de pago acotados; sin Chile en la lista leída · claves: `STRIPE-SPT` · en: A2
- <https://github.com/agentic-commerce-protocol/agentic-commerce-protocol> — Agentic Commerce Protocol · claves: `ACP` · en: A2
- <https://ap2-protocol.org/> — Agent Payments Protocol: mandatos verificables · claves: `AP2` · en: A2

## 17. Patrones: taxonomías de referencia

- <https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system> — 12 patrones de Google Cloud y sus costos relativos · claves: `GC-PAT` · en: B
- <https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns> — Patrones de orquestación de Azure y sus riesgos · claves: `AZ-PAT` · en: B
- <https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker> — Patrón circuit breaker · claves: `CIRCUIT` · en: B
- <https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection> — Andrew Ng: reflection · claves: `NG-REFL` · en: B
- <https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-4-planning> — Andrew Ng: planning, menos predecible · claves: `NG-PLAN` · en: B

## 18. Patrones: papers

- <https://arxiv.org/abs/2210.03629> — ReAct: paper original y sus modos de falla · claves: `REACT` · en: B
- <https://arxiv.org/abs/2305.18323> — Planificar sin observar entre pasos · claves: `REWOO` · en: B
- <https://arxiv.org/abs/2312.04511> — Plan como grafo ejecutado en paralelo · claves: `LLMCOMPILER` · en: B
- <https://arxiv.org/abs/2303.11366> — Reflexión con memoria y señal externa · claves: `REFLEXION` · en: B
- <https://arxiv.org/abs/2310.01798> — La autocorrección sin señal externa empeora · claves: `HUANG` · en: B
- <https://arxiv.org/abs/2402.08115> — Límites de la autoverificación; verificador externo · claves: `STECHLY` · en: B
- <https://arxiv.org/abs/2407.01502> — Baselines simples igualan a agentes complejos · claves: `AGENTS-MATTER` · en: B
- <https://arxiv.org/abs/2203.11171> — Votación entre varias respuestas · claves: `SELF-CONS` · en: B
- <https://arxiv.org/abs/2406.18665> — Enrutar entre modelo fuerte y débil · claves: `ROUTELLM` · en: B
- <https://arxiv.org/abs/2305.05176> — Cascada de modelos · claves: `FRUGALGPT` · en: B
- <https://arxiv.org/abs/2305.14325> — Debate multiagente · claves: `DEBATE` · en: B
- <https://arxiv.org/abs/2311.17371> — El debate no supera a estrategias simples · claves: `MAD` · en: B
- <https://arxiv.org/abs/2402.18272> — Un agente con buen prompt iguala la discusión · claves: `RETHINK` · en: B
- <https://arxiv.org/abs/2304.03442> — Memoria: observación, reflexión, recuperación · claves: `GEN-AGENTS` · en: B
