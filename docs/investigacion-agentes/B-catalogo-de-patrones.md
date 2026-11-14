# B — Catálogo de patrones de razonamiento y decisión

> Parte de la base de conocimiento `docs/investigacion-agentes/`. Investigación, no especificación.
> Marcas: **[DOC]** guía o documentación oficial de un proveedor · **[EXP]** paper, experimento o tercero · **[REC]** recomendación o inferencia de esta investigación (toda la columna y el punto "aplicación al producto" lo son).
> Fecha de consulta: **2026-11-14**. Enlaces al final y en `fuentes.md`.
> Advertencia de vigencia: varias cifras vienen de papers de 2022–2024 con modelos de esa época (PaLM, GPT-3.5, GPT-4). Sirven para entender el mecanismo, no como predicción sobre modelos actuales.

## 1. Vocabulario unificado

Las taxonomías públicas nombran lo mismo de formas distintas. Esta base usa la columna izquierda.

| En esta base | Anthropic [BEA] | Google Cloud [GC-PAT] | Microsoft Azure [AZ-PAT] | OpenAI [OAI-GUIA] | LangChain [LC-MULTI] |
|---|---|---|---|---|---|
| Prompt chaining | Prompt chaining | Sequential | Sequential (pipeline) | Chaining por código | Custom workflow |
| Router | Routing | Coordinator | Handoff (routing, triage) | Triage | Router |
| Paralelización | Parallelization (sectioning, voting) | Parallel | Concurrent (fan-out/fan-in, map-reduce) | Parallel | — |
| Orchestrator-workers / Supervisor | Orchestrator-workers | Coordinator; hierarchical | Magentic | Manager (agents as tools) | Subagents (supervisor) |
| Evaluator-optimizer | Evaluator-optimizer | Review and critique; iterative refinement | Maker-checker | Loop evaluador | — |
| Handoff | — | — | Handoff | Decentralized (handoffs) | Handoffs |
| Tool loop (ReAct) | Agents | Single-agent; ReAct | Single agent with tools | Single-agent | Agent |
| Human-in-the-loop | Checkpoints | Human-in-the-loop | Human participation | Human intervention | Interrupts |
| Skills | Agent Skills | — | — | — | Skills |

Colisiones a evitar: Microsoft trata "handoff" y "routing" como sinónimos, mientras que aquí **router** clasifica sin ceder la conversación y **handoff** cede el control del turno; "swarm" en OpenAI son handoffs livianos y en Google es una malla todos con todos; "reflection" en la literatura mezcla autocrítica (sin información nueva) con crítica apoyada en una señal externa, y la evidencia las separa con fuerza (ficha 11). [DOC] [AZ-PAT], [GC-PAT]; [EXP] [SWARM]

## 2. Matriz comparativa

Costo y latencia son **relativos a una sola llamada al modelo** (＋ bajo, ＋＋ medio, ＋＋＋ alto, ＋＋＋＋ muy alto) y son estimaciones [REC] apoyadas en las fuentes de cada ficha.

| # | Patrón | Funcionamiento | Problema que resuelve | Ventajas | Limitaciones | Costo | Latencia | Casos de uso | Aplicación al producto |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Prompt chaining | Pasos fijos en serie con compuertas de código | Tarea descomponible en subtareas conocidas | Predecible, testeable | Rígido; el error temprano se propaga | ＋＋ | ＋＋ | Extraer → validar → redactar | Alta de prenda; evaluar una compra |
| 2 | Router | Clasifica la entrada y deriva a una rama | Entradas heterogéneas | Cada rama se optimiza sola; modelo barato para lo fácil | Depende de clasificar bien | ＋ | ＋ | Triage, elección de modelo | Intención del mensaje; qué hacer con una foto |
| 3 | Paralelización | Subtareas independientes a la vez; se agregan por código | Latencia; diversidad de respuestas | Rápida; votación sube confianza | Más tokens; hay que resolver conflictos | ＋＋＋ | ＋ | Guardrail en paralelo, map-reduce | Varias tiendas a la vez; lecturas en paralelo |
| 4 | Orchestrator-workers | Un central descompone, delega y sintetiza | Subtareas no predecibles | Aísla contexto; paraleliza | 3–15× tokens; pierde contexto en traspasos | ＋＋＋＋ | ＋＋ | Investigación amplia | Búsqueda de productos |
| 5 | Supervisor | Un agente coordina especialistas como herramientas | Dominios con herramientas o instrucciones en conflicto | Un solo dueño de la respuesta | Llamada extra por delegación; "teléfono descompuesto" | ＋＋＋ | ＋＋＋ | Asistentes multidominio | No hoy; candidato si el prompt único se degrada |
| 6 | Jerárquico | Supervisores de supervisores | Problemas muy grandes | Escala organizativa | El más caro y lento; errores en cascada | ＋＋＋＋ | ＋＋＋＋ | Proyectos largos de software | No aplica |
| 7 | Handoff | Un agente cede el turno a otro | El especialista debe hablar directo con la persona | Sin intermediario | Loops de traspaso; rutas impredecibles | ＋＋＋ | ＋＋ | Atención por áreas | No recomendado: rompe "un solo asesor" (DP-18) |
| 8 | Planner / Executor | Un plan completo primero; después se ejecuta | Tareas largas; uso de modelo caro solo para planear | Plan validable antes de actuar; resistente a inyección | Plan rígido si el entorno cambia | ＋＋ | ＋＋ | Flujos multi-paso | Plan de cápsula de viaje; evaluar compra |
| 9 | Planificación dinámica | Plan + seguimiento + replan ante estancamiento | Tareas abiertas | Se recupera sola | Lenta en converger; costo impredecible | ＋＋＋＋ | ＋＋＋＋ | Agentes generalistas | No hoy |
| 10 | Tool loop (ReAct) | Razonar → actuar → observar, en loop | Tareas que requieren datos del entorno | Flexible; base de todo agente | Puede repetir pasos; error compuesto | ＋＋ | ＋＋ | Asistentes con herramientas | Es la base actual |
| 11 | Reflection | El modelo critica y reescribe su salida | Calidad de una salida | Simple | Sin señal externa no mejora o empeora | ＋＋ | ＋＋ | Redacción, código con tests | Solo con validador externo |
| 12 | Critic / Reviewer | Otro agente, con contexto limpio, revisa | Sesgo de autoevaluación | Detecta lo que el autor no ve | Falsos positivos; "victoria temprana" | ＋＋ | ＋＋ | Revisión de código | Revisor fuera de línea de tono y límites |
| 13 | Evaluator-optimizer | Generar → evaluar con criterio → corregir, con tope | Calidad con criterio claro | Mejora medible | Loop infinito si no hay salida; costo por vuelta | ＋＋＋ | ＋＋＋ | Traducción, búsqueda | Validador de outfit (ya existe, en código) |
| 14 | Recuperación ante errores | Reintento, fallback, replan, escalar | Fallas de herramientas y modelo | Robustez | Reintentar lo no transitorio gasta | ＋ | ＋ | Todo sistema en producción | Clima caído, visión fallida, rechazo del modelo |
| 15 | Human-in-the-loop | Pausa en un punto definido hasta la decisión de la persona | Acciones de alto riesgo o subjetivas | Control y confianza | Latencia humana; aprobación a ciegas | ＋ | variable | Pagos, envíos, borrados | Toda compra o salida hacia una tienda |
| 16 | Memoria | Guardar fuera del contexto y traer lo justo | Continuidad entre conversaciones | Personaliza sin inflar el contexto | Envenenamiento; memoria basura | ＋ | ＋ | Asistentes personales | Perfil, hechos, historial (ya existe) |
| 17 | Skills | Instrucciones que se cargan a demanda | Prompt único que crece sin control | Especializa sin otro agente | Acumula contexto al cargarse | ＋ | ＋ | Dominios con mucho conocimiento | Criterio de estilismo por ocasión; criterio de compra |
| 18 | Group chat / debate | Varios agentes discuten en un hilo | Respuestas con perspectivas múltiples | — | No supera a votar; caro | ＋＋＋＋ | ＋＋＋＋ | Lluvia de ideas | Descartado |

## 3. Fichas (cinco puntos por patrón)

### 3.1 Prompt chaining

1. **Cómo funciona.** La tarea se parte en una secuencia fija de llamadas; cada una procesa la salida de la anterior, y entre pasos puede haber compuertas de código que validan antes de seguir. El orden lo fija el programa. [DOC] [BEA]
2. **Qué problema resuelve.** Cambia latencia por exactitud: cada llamada es más fácil que la tarea completa. [DOC] [BEA]
3. **Cuándo conviene.** Cuando la tarea se descompone limpiamente en subtareas que no cambian. [DOC] [BEA]. Puede ser más barato y rápido que un patrón orquestado por el modelo. [DOC] [GC-PAT]
4. **Limitaciones.** Rígido; un paso innecesario suma latencia; las fallas de etapas tempranas se propagan y no hay paralelismo. [DOC] [AZ-PAT], [GC-PAT]
5. **Aplicación al producto.** [REC] El alta de una prenda ya es una cadena: foto → `describeGarment` (visión, salida estructurada) → normalización en código → guardado → tarjeta para confirmar. Hoy esa cadena se dispara como herramienta del agente (`add_garment`); el patrón sugiere tratarla como un **flujo determinista** con sus propias compuertas ("¿es una prenda?", "¿confianza baja?"). Ejemplo: la persona manda cinco fotos seguidas; el flujo procesa cada una sin que el asesor decida cada paso.

### 3.2 Router

1. **Cómo funciona.** Una clasificación inicial (un LLM con salida estructurada, o un clasificador tradicional) deriva la entrada a un prompt, conjunto de herramientas o modelo especializado. [DOC] [BEA]
2. **Qué problema resuelve.** Evita que optimizar para un tipo de entrada perjudique a los otros, y permite mandar lo fácil a un modelo barato. [DOC] [BEA]. Routers entrenados redujeron el costo más de 2× sin perder calidad en algunos casos; una cascada de modelos igualó al mejor con hasta 98% menos costo (cifras de 2023–2024). [EXP] [ROUTELLM], [FRUGALGPT]
3. **Cuándo conviene.** Categorías distinguibles que se tratan mejor por separado y una clasificación confiable. [DOC] [BEA]. Es el patrón multiagente más barato en la comparación de LangChain: 3 llamadas en un pedido simple. [DOC] [LC-MULTI]
4. **Limitaciones.** Todo depende de la exactitud de la clasificación; si el router se confunde, la rama equivocada responde con seguridad. Los pedidos mixtos ("combina este pantalón y dime si me conviene comprar esta chaqueta") no caben en una sola rama. [REC]
5. **Aplicación al producto.** [REC] Dos usos: (a) **qué hacer con una foto**: prenda propia, selfie para paleta, algo que evalúa comprar o foto ambigua. Hoy lo decide el asesor leyendo el prompt; un router con salida estructurada lo hace verificable y medible. (b) **Esfuerzo por tipo de turno**: saludo y preguntas de perfil con esfuerzo bajo, composición de outfit con esfuerzo mayor. Ojo: cambiar el esfuerzo entre turnos invalida la caché de la conversación (`AGENT_ARCHITECTURE.md` §11).

### 3.3 Paralelización (sectioning, voting, map-reduce)

1. **Cómo funciona.** Varias llamadas corren a la vez y sus salidas se agregan por código. *Sectioning*: subtareas independientes distintas. *Voting*: la misma tarea varias veces. *Map-reduce*: la misma operación sobre muchos ítems y una síntesis final. [DOC] [BEA], [AZ-PAT]
2. **Qué problema resuelve.** Latencia, y confianza por diversidad. Votar entre varias respuestas subió la exactitud entre 4 y 18 puntos en razonamiento (2022) [EXP] [SELF-CONS]; herramientas en paralelo redujeron el tiempo de investigación hasta 90% [DOC] [MARS].
3. **Cuándo conviene.** Subtareas realmente independientes; o cuando un guardrail debe correr junto a la respuesta sin retrasarla. [DOC] [BEA]
4. **Limitaciones.** Más tokens; hay que resolver resultados contradictorios; no compartir estado mutable entre ramas; un mismo endpoint puede aplicar límite de tasa. [DOC] [AZ-PAT], [GC-PAT]
5. **Aplicación al producto.** [REC] Ya se usa en pequeño (`get_closet` y `get_weather` a la vez; la base ejecuta las herramientas en serie dentro de un paso, lo que es una mejora posible). El uso grande es el shopper: **una búsqueda por tienda en paralelo**, cada una devolviendo fichas estructuradas, y una reducción en código (ordenar, deduplicar, filtrar por presupuesto). Ejemplo: "busco botines café bajo $60.000" → cinco tiendas en paralelo → una lista única.

### 3.4 Orchestrator-workers

1. **Cómo funciona.** Un LLM central descompone la tarea **dinámicamente**, delega en workers y sintetiza. La diferencia con paralelizar es que las subtareas no están predefinidas. [DOC] [BEA]
2. **Qué problema resuelve.** Tareas donde no se puede predecir qué subtareas hacen falta, y contenido voluminoso que conviene mantener fuera del contexto principal. [DOC] [BEA], [MA-WHEN]
3. **Cuándo conviene.** Búsqueda amplia y paralelizable: +90,2% sobre un agente en la eval interna de research de Anthropic. [DOC] [MARS]. Cuando una subtarea trae más de ~1.000 tokens que el principal no necesita. [DOC] [MA-WHEN]
4. **Limitaciones.** ~15× los tokens de un chat [DOC] [MARS], 3–10× los de un agente [DOC] [MA-WHEN]; no sirve cuando los workers necesitan el mismo contexto o dependen entre sí [DOC] [MARS]; en tareas secuenciales el multiagente rindió entre −39% y −70% [EXP] [SCALING].
5. **Aplicación al producto.** [REC] Es el patrón del **único subagente candidato**: el buscador de productos. El asesor entrega un encargo acotado (categoría, color, material, presupuesto, tiendas permitidas) y recibe una lista corta de fichas verificadas, no páginas. Ejemplo: el asesor detecta que falta un blazer azul marino; delega "blazer azul marino, lana o mezcla, hasta $80.000, tiendas A, B, C" y recibe tres opciones con precio, enlace y fecha.

### 3.5 Supervisor

1. **Cómo funciona.** Un agente principal conserva la conversación y llama a agentes especialistas como si fueran herramientas; solo él responde a la persona. [DOC] [OAI-GUIA], [LC-MULTI]
2. **Qué problema resuelve.** Lógica con demasiadas ramas en un prompt, o herramientas que se solapan y confunden la selección. [DOC] [OAI-GUIA]
3. **Cuándo conviene.** Cuando un solo agente debe ser dueño de la respuesta final y aplicar guardrails en un único lugar. [DOC] [OAI-ORQ]. Solo después de agotar el agente único. [DOC] [OAI-GUIA], [AZ-PAT]
4. **Limitaciones.** Cada delegación suma llamadas; el supervisor resume el pedido y el resultado, perdiendo detalle; dividir por rol copia el organigrama y falla. [DOC] [FOLD], [MA-WHEN]. Los mantenedores de `langgraph-supervisor` recomiendan hoy implementar el patrón directamente con herramientas en vez de la librería. [DOC] [LG-SUPERVISOR]
5. **Aplicación al producto.** [REC] Es la arquitectura que el encargo original insinuaba (agente de estilo, de color, de clóset, de compras). La evidencia no la respalda para nuestro núcleo: componer un outfit necesita estilo, color, clóset y clima **a la vez**. Se mantiene como candidata C en `C` y `E` con su gatillo: degradación medida del prompt único. Ejemplo de cuándo sí: si el shopper crece a comparar, monitorear precios y armar listas, ese conjunto podría ser un especialista detrás del asesor.

### 3.6 Agentes jerárquicos

1. **Cómo funciona.** Varios niveles: un supervisor coordina supervisores que coordinan workers. [DOC] [GC-PAT]
2. **Qué problema resuelve.** Problemas que requieren planificación extensa y muchos especialistas. [DOC] [GC-PAT]
3. **Cuándo conviene.** Casi nunca en productos de consumo; aparece en desarrollo de software autónomo de larga duración. [REC]
4. **Limitaciones.** Es el patrón con más llamadas al modelo, y con latencia y costo significativamente mayores [DOC] [GC-PAT]; arquitecturas con más capas de coordinación mostraron hasta 515% de overhead [EXP] [SCALING]. Managed Agents limita el multiagente a un nivel. [DOC] [CMA-MULTI]
5. **Aplicación al producto.** [REC] No aplica. Se documenta para descartarlo con criterio: ningún flujo del producto necesita más de un nivel de delegación. Ejemplo de lo que **no** haríamos: asesor → agente de compras → agente por tienda → agente de comparación.

### 3.7 Handoff / swarm

1. **Cómo funciona.** Un agente transfiere el control a otro; el receptor pasa a ser el agente activo y ve la conversación (filtrable). Se implementa como una herramienta `transfer_to_<agente>`. [DOC] [OAI-HANDOFF]
2. **Qué problema resuelve.** Cuando el especialista debe conversar directo con la persona y necesita instrucciones o modelo distintos. [DOC] [OAI-ORQ]
3. **Cuándo conviene.** Triage hacia áreas independientes (soporte, facturación). [DOC] [OAI-GUIA]
4. **Limitaciones.** Loops de traspaso y rutas impredecibles [DOC] [AZ-PAT]; fue el patrón más caro en la comparación de LangChain (7+ llamadas, 14K+ tokens en un caso multidominio) [DOC] [LC-MULTI]; en el Agents SDK los guardrails de herramienta no cubren handoffs [DOC] [OAI-GUARD].
5. **Aplicación al producto.** [REC] No recomendado: el producto es "un solo asesor" (DP-17, DP-18) y un traspaso cambiaría la voz y fragmentaría el contexto. Ejemplo de lo que evitaríamos: que al preguntar por una compra "entre" un agente shopper con otra personalidad. Si alguna vez hubiera un canal de soporte humano, el traspaso a una persona sí sería un handoff legítimo.

### 3.8 Planner / Executor

1. **Cómo funciona.** Un planificador produce el plan completo; ejecutores realizan cada paso; opcionalmente se replanifica al final. Variantes: ReWOO (plan con variables, sin observar entre pasos) y LLMCompiler (plan como grafo de dependencias ejecutado en paralelo). [DOC] [LC-PLAN]; [EXP] [REWOO], [LLMCOMPILER]
2. **Qué problema resuelve.** Evita consultar al modelo caro tras cada acción y obliga a pensar todos los pasos; ReWOO reportó 5× eficiencia en tokens y LLMCompiler hasta 3,7× en latencia frente a ReAct (cifras de 2023; los modelos actuales ya paralelizan herramientas). [EXP] [REWOO], [LLMCOMPILER]
3. **Cuándo conviene.** Tareas multi-paso donde el plan puede validarse antes de ejecutar (acciones inválidas, demasiados pasos) [EXP] [HUYEN]; y como defensa: fijar la secuencia de herramientas **antes** de leer contenido no confiable impide que ese contenido cambie el flujo [EXP] [SEC-PATTERNS].
4. **Limitaciones.** El plan queda obsoleto si el entorno sorprende; planificar es la capacidad menos madura y menos predecible [EXP] [NG-PLAN]; los modelos recientes llevan el seguimiento de tareas sin lista escrita [DOC] [TODO].
5. **Aplicación al producto.** [REC] Dos usos: (a) **evaluar una compra** como plan fijo: extraer ficha del link → buscar duplicados en el clóset (código) → contar looks que desbloquea → veredicto; la página solo aporta datos. (b) **cápsula de viaje**: primero el plan (días, ocasiones, prendas base) y después un outfit por día, validando que el plan cabe en el clóset antes de generar cinco tarjetas. Ejemplo: "cinco outfits para Buenos Aires" → plan de 8 prendas → 5 looks que las reutilizan.

### 3.9 Planificación dinámica

1. **Cómo funciona.** Un orquestador mantiene un plan (*task ledger*) y un seguimiento (*progress ledger*); en cada ronda revisa si el pedido está satisfecho, si hay progreso o loop, y replanifica si se estanca. [DOC] [MAGENTIC-ONE], [MAF-MAGENTIC]
2. **Qué problema resuelve.** Tareas abiertas donde no se conoce el camino y hay que recuperarse de errores sin intervención. [DOC] [AZ-PAT]
3. **Cuándo conviene.** Tareas largas de varias herramientas y resultado incierto (navegación web, investigación). [EXP] [MAGENTIC-PAPER]
4. **Limitaciones.** Lento para converger, se estanca con metas ambiguas y su costo es difícil de predecir [DOC] [AZ-PAT]; la propia doc advierte que no está probado fuera de su diseño original [DOC] [MAF-MAGENTIC].
5. **Aplicación al producto.** [REC] No como arquitectura. Sí su **mecanismo de control**: la pregunta "¿hay progreso o estamos en loop?" es un detector de estancamiento reutilizable en nuestro harness (`A2` §3.3). Ejemplo: tres `propose_outfit` rechazados seguidos por el validador → cortar y explicar qué falta en el clóset, en vez de seguir intentando.

### 3.10 Tool loop (ReAct)

1. **Cómo funciona.** El modelo alterna razonamiento, acción y observación. En la forma moderna es un `while` sobre el motivo de término: mientras pida herramientas, la aplicación las ejecuta y devuelve resultados; el razonamiento va en bloques de pensamiento nativos entre llamadas. [EXP] [REACT]; [DOC] [TOOL-USE]
2. **Qué problema resuelve.** Da al modelo datos reales del entorno en cada paso, en vez de razonar de memoria; en el paper original redujo a 0% los fallos por alucinación frente a 56% del razonamiento sin acciones. [EXP] [REACT]
3. **Cuándo conviene.** Siempre que la respuesta dependa de datos o acciones externas y no se pueda fijar el camino. Es la opción por defecto. [DOC] [AZ-PAT]
4. **Limitaciones.** 47% de sus fallos en el paper fueron de razonamiento, incluido repetir pasos [EXP] [REACT]; ~4× los tokens de un chat [DOC] [MARS]; cada herramienta es al menos un viaje extra [DOC] [TOOL-USE]; el error se compone con los pasos [EXP] [HUYEN].
5. **Aplicación al producto.** [REC] Es exactamente `runStylistTurn()`. No se reemplaza: se **rodea** de control (topes, detección de repetición, política de herramientas, estado persistido). Ejemplo: "¿qué me pongo mañana?" → clóset + clima → `propose_outfit` → respuesta: tres pasos típicos, tope en seis.

### 3.11 Reflection

1. **Cómo funciona.** El modelo critica su propia salida y la reescribe, una o más veces. Reflexion agrega memoria: las reflexiones de intentos fallidos condicionan el siguiente. [EXP] [NG-REFL], [REFLEXION]
2. **Qué problema resuelve.** Mejorar una salida sin intervención humana.
3. **Cuándo conviene.** **Solo cuando hay una señal externa confiable** (tests, validador, herramienta, persona). Con esa señal, Reflexion subió resultados de forma importante. [EXP] [REFLEXION]
4. **Limitaciones.** Sin señal externa empeora: GPT-4 bajó de 95,5 a 89,0 en un benchmark de aritmética tras dos rondas de autocorrección, y cambia más respuestas correctas a incorrectas que al revés [EXP] [HUANG]; un LLM criticando a otro bajó el acierto de 5% a 3% en un problema donde un verificador sólido lo llevó a 36% [EXP] [STECHLY]. Reintentar simple igualó a Reflexion a menor costo (92,0% por US$2,51 vs 87,8% por US$3,90) [EXP] [AGENTS-MATTER]. Los modelos con razonamiento nativo reducen el valor del "piensa de nuevo" explícito [DOC] [THINK-TOOL], [OAI-REASONING].
5. **Aplicación al producto.** [REC] No agregar un paso "revisa tu outfit". La "reflexión" útil ya existe y es externa: el validador de `propose_outfit` devuelve un error accionable y el modelo corrige. Ejemplo: el modelo propone vestido + pantalón → el validador responde "combina vestido con parte inferior" → el modelo rearma.

### 3.12 Critic / Reviewer

1. **Cómo funciona.** Un segundo agente, con contexto distinto del autor, revisa el resultado. [EXP] [COG-2]; [DOC] [HARNESS-APPS]
2. **Qué problema resuelve.** El sesgo de autoevaluación: un agente tiende a elogiar su propio trabajo, y es más fácil calibrar un evaluador escéptico que volver autocrítico al generador. [DOC] [HARNESS-APPS]
3. **Cuándo conviene.** Cuando el revisor tiene contexto **limpio** y el autor filtra los hallazgos con su contexto más amplio: el revisor de Cognition encuentra ~2 bugs por PR, ~58% severos. [EXP] [COG-2]
4. **Limitaciones.** "Victoria temprana" (aprobar sin comprobar): se mitiga con criterios concretos y casos negativos [DOC] [MA-WHEN]; un verificador LLM tiene falsos positivos y negativos altos en tareas formales [EXP] [STECHLY]; suma latencia si corre en línea.
5. **Aplicación al producto.** [REC] Como **revisor fuera de línea**, no dentro del turno: un juez que lee una muestra de conversaciones y marca violaciones de límites (comentó el cuerpo, presentó la paleta como certeza, mencionó precios sin fuente). Ejemplo: cada noche, 30 turnos muestreados pasan por el juez de "lenguaje sobre el cuerpo"; los que fallan van al banco de pruebas.

### 3.13 Evaluator-optimizer

1. **Cómo funciona.** Una llamada genera y otra evalúa contra criterios y da feedback, en loop, hasta aprobar o llegar al tope. [DOC] [BEA]
2. **Qué problema resuelve.** Calidad cuando hay criterios claros y la iteración mejora de forma medible. [DOC] [BEA]
3. **Cuándo conviene.** Dos señales: la salida mejora cuando una persona articula feedback, y el LLM puede darlo. [DOC] [BEA]. Exige criterios de aceptación, tope de iteraciones y comportamiento de respaldo al llegar al tope (escalar o entregar lo mejor con advertencia). [DOC] [AZ-PAT], [MA-COORD]
4. **Limitaciones.** Al menos una llamada extra por vuelta; loop infinito si la salida está mal definida. [DOC] [GC-PAT]. Un juez LLM como guardrail síncrono rara vez es apropiado. [EXP] [HAMEL-FAQ]
5. **Aplicación al producto.** [REC] El evaluador debe ser **código** donde haya regla: composición válida, prendas propias, sin precios inventados, presupuesto respetado. Un evaluador LLM en línea solo se justificaría para algo que el código no ve y que importe mucho (por ejemplo, que tres alternativas sean realmente distintas), y con tope de una vuelta. Ejemplo: tres looks pedidos → chequeo en código de que difieren en al menos dos prendas → si no, un reintento.

### 3.14 Recuperación ante errores

1. **Cómo funciona.** Capas: devolver el error al modelo; reintentar con espera creciente; cambiar de modelo; replanificar; cortar el circuito cuando un servicio falla repetidamente; escalar a una persona. [DOC] [AZ-PAT], [CIRCUIT]
2. **Qué problema resuelve.** Los fallos de herramientas y de modelo son la norma, no la excepción.
3. **Cuándo conviene.** Siempre. Dos disparadores para escalar: superar umbrales de falla y acciones de alto riesgo. [DOC] [OAI-GUIA]
4. **Limitaciones.** Reintentar una falla no transitoria gasta y demora: el cortacircuitos existe para eso [DOC] [CIRCUIT]; los reintentos son *at-least-once* y exigen idempotencia [DOC] [LG-FAULT]; un rechazo del modelo suele recuperarse en otro modelo, pero no se reintenta una respuesta vacía sin modificar la solicitud [DOC] [STOP-REASONS].
5. **Aplicación al producto.** [REC] Tabla de degradación por dependencia: clima caído → recomendar sin clima y decirlo (ya existe); visión fallida → pedir otra foto (ya existe); rechazo del modelo → fallback del lado servidor (ya existe); tienda que no responde → seguir con las demás y decirlo; tres errores seguidos de la misma herramienta → cortar y explicar. Ejemplo: Open-Meteo no responde → el outfit sale igual con una frase honesta.

### 3.15 Human-in-the-loop

1. **Cómo funciona.** El flujo se detiene en un punto definido, guarda su estado y espera a que una persona apruebe, corrija o aporte; después se reanuda. [DOC] [GC-PAT], [LG-HITL]
2. **Qué problema resuelve.** Decisiones de alto riesgo, irreversibles o subjetivas. [DOC] [GC-PAT], [OAI-GUIA]
3. **Cuándo conviene.** Acotado a herramientas específicas, para que lo de bajo riesgo siga autónomo; con estado persistido en las compuertas obligatorias. [DOC] [AZ-PAT]
4. **Limitaciones.** Requiere un sistema de interacción y la latencia depende de la persona [DOC] [GC-PAT]; pedir aprobación para todo lleva a aprobar a ciegas [EXP] [RULE-OF-TWO]; un agente persuasivo puede inducir una aprobación dañina [DOC] [OWASP-AGENTIC].
5. **Aplicación al producto.** [REC] Tres niveles: (a) **revisión** (ya existe): la persona confirma o corrige una prenda reconocida y una paleta; (b) **confirmación** para escrituras sensibles del perfil; (c) **aprobación explícita** como pausa serializable antes de cualquier salida hacia una tienda con datos de la persona, carrito o pago (DP-09). Ejemplo: "ir a comprar" muestra una tarjeta con tienda, producto, precio y fecha **leídos por el servidor**, y solo la acción de la persona abre el enlace.

### 3.16 Memoria

1. **Cómo funciona.** El agente escribe fuera del contexto (hechos, notas, perfiles) y en cada turno se inyecta o recupera lo relevante. Variantes: bloques siempre visibles que el agente edita [DOC] [LETTA]; archivos bajo control de la aplicación [DOC] [API-MEM]; observación → reflexión → recuperación [EXP] [GEN-AGENTS].
2. **Qué problema resuelve.** Continuidad y personalización sin inflar la ventana (context rot). [DOC] [CTX-ENG]
3. **Cuándo conviene.** Asistentes personales de uso recurrente. Con memoria, una eval de aprendizaje continuo subió de 0,655 a 0,838. [DOC] [MEMORY-COMP]
4. **Limitaciones.** Memoria basura o sensible; envenenamiento persistente [DOC] [OWASP-AGENTIC]; escrituras concurrentes que se pisan [DOC] [MEMORY-COMP]; lo inyectado debe ser pequeño.
5. **Aplicación al producto.** [REC] Las tres capas de DT-07 ya son este patrón. Lo que agrega la investigación: **consolidación fuera de línea** (fusionar hechos redundantes, detectar contradicciones) y tratar el **feedback de outfits** como memoria episódica. Ejemplo: tras tres "no es para mí" a looks con blazer, un proceso nocturno propone el hecho "evita blazers estructurados" y la persona lo confirma.

### 3.17 Skills (carga progresiva)

1. **Cómo funciona.** Carpetas de instrucciones y recursos que el agente descubre y carga según la tarea: siempre visibles solo nombre y descripción (~100 tokens); el cuerpo entra cuando se activa. [DOC] [SKILLS], [SKILLS-DOC]
2. **Qué problema resuelve.** El prompt único que crece con cada dominio, sin pagar el costo de otro agente. [DOC] [FOLD]
3. **Cuándo conviene.** Mucho conocimiento especializado que solo a veces hace falta. En la comparación de LangChain: 3 llamadas tanto en el caso simple como en el multidominio. [DOC] [LC-MULTI]
4. **Limitaciones.** Lo cargado se acumula en el contexto (15K tokens en el caso multidominio, más que subagentes o router) [DOC] [LC-MULTI]; una skill de origen no confiable puede dirigir al agente a exfiltrar datos [DOC] [SKILLS].
5. **Aplicación al producto.** [REC] Es la alternativa directa a "un agente por especialidad": el criterio de **colorimetría**, de **formalidad por ocasión**, de **compra** y de **cápsula de viaje** como módulos de conocimiento que se cargan cuando el turno los necesita, manteniendo un solo asesor. Coincide con la carpeta `web/src/lib/agent/knowledge/` que prevé el plan "agente primero". Ejemplo: solo cuando la persona pregunta por una compra entra el módulo "cuándo decir no compres".

### 3.18 Group chat y debate

1. **Cómo funciona.** Varios agentes comparten un hilo y un moderador decide quién habla; en el debate proponen y discuten en rondas hasta converger. [DOC] [AZ-PAT]; [EXP] [DEBATE]
2. **Qué problema resuelve.** Pretende mejorar razonamiento y factualidad con perspectivas múltiples.
3. **Cuándo conviene.** Con tres agentes o menos y para decisiones que se benefician de contraste explícito. [DOC] [AZ-PAT]
4. **Limitaciones.** A igual número de respuestas, votar gana al debate (83,0 vs 88,2) [EXP] [HUANG]; no supera de forma confiable a estrategias más simples [EXP] [MAD]; un agente con buen prompt logra casi lo mismo [EXP] [RETHINK].
5. **Aplicación al producto.** [REC] Descartado. Ejemplo de lo que no haríamos: un "comité" de agente de estilo, de color y de presupuesto debatiendo un outfit; el mismo criterio cabe en un prompt con prioridades explícitas, que es lo que definen las fichas de decisión D3 y D5 del plan "agente primero".

## 4. Cómo se combinan

[REC] Los patrones no compiten: se anidan. Una lectura por capas para el producto:

| Capa | Patrón | Dónde |
|---|---|---|
| Entrada | Router (determinista o de una llamada) | Tipo de foto; intención cuando haya flujos distintos |
| Núcleo | Tool loop con skills | El asesor |
| Procesos fijos | Prompt chaining / planner-executor | Alta de prenda, paleta, evaluar compra, cápsula |
| Contenido externo | Orchestrator-workers + paralelización, aislado | Búsqueda de productos |
| Calidad | Evaluator en código; critic fuera de línea | Validador de outfit; juez de límites |
| Control | Recuperación ante errores; human-in-the-loop | Todo; compras |
| Continuidad | Memoria | Perfil, hechos, feedback |

## Enlaces

[BEA]: https://www.anthropic.com/engineering/building-effective-agents
[MARS]: https://www.anthropic.com/engineering/multi-agent-research-system
[CTX-ENG]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[HARNESS-APPS]: https://www.anthropic.com/engineering/harness-design-long-running-apps
[MEMORY-COMP]: https://www.anthropic.com/engineering/components-of-agent-memory
[THINK-TOOL]: https://www.anthropic.com/engineering/claude-think-tool
[SKILLS]: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
[SKILLS-DOC]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
[TOOL-USE]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
[STOP-REASONS]: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
[API-MEM]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
[TODO]: https://code.claude.com/docs/en/agent-sdk/todo-tracking
[CMA-MULTI]: https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration
[MA-WHEN]: https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them
[MA-COORD]: https://claude.com/blog/multi-agent-coordination-patterns
[FOLD]: https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop
[COG-2]: https://cognition.com/blog/multi-agents-working
[GC-PAT]: https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system
[AZ-PAT]: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns
[CIRCUIT]: https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
[MAGENTIC-ONE]: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/magentic-one.html
[MAGENTIC-PAPER]: https://arxiv.org/abs/2411.04468
[MAF-MAGENTIC]: https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/magentic
[OAI-GUIA]: https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
[OAI-ORQ]: https://openai.github.io/openai-agents-js/guides/multi-agent/
[OAI-HANDOFF]: https://openai.github.io/openai-agents-js/guides/handoffs/
[OAI-GUARD]: https://openai.github.io/openai-agents-js/guides/guardrails/
[OAI-REASONING]: https://developers.openai.com/api/docs/guides/reasoning-best-practices
[SWARM]: https://github.com/openai/swarm
[LC-MULTI]: https://docs.langchain.com/oss/python/langchain/multi-agent
[LC-PLAN]: https://www.langchain.com/blog/planning-agents
[LG-SUPERVISOR]: https://github.com/langchain-ai/langgraph-supervisor-py
[LG-HITL]: https://docs.langchain.com/oss/javascript/langgraph/interrupts
[LG-FAULT]: https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance
[LETTA]: https://docs.letta.com/guides/agents/memory-blocks
[NG-REFL]: https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection
[NG-PLAN]: https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-4-planning
[REACT]: https://arxiv.org/abs/2210.03629
[REWOO]: https://arxiv.org/abs/2305.18323
[LLMCOMPILER]: https://arxiv.org/abs/2312.04511
[REFLEXION]: https://arxiv.org/abs/2303.11366
[HUANG]: https://arxiv.org/abs/2310.01798
[STECHLY]: https://arxiv.org/abs/2402.08115
[AGENTS-MATTER]: https://arxiv.org/abs/2407.01502
[SELF-CONS]: https://arxiv.org/abs/2203.11171
[ROUTELLM]: https://arxiv.org/abs/2406.18665
[FRUGALGPT]: https://arxiv.org/abs/2305.05176
[DEBATE]: https://arxiv.org/abs/2305.14325
[MAD]: https://arxiv.org/abs/2311.17371
[RETHINK]: https://arxiv.org/abs/2402.18272
[GEN-AGENTS]: https://arxiv.org/abs/2304.03442
[SCALING]: https://arxiv.org/abs/2512.08296
[SEC-PATTERNS]: https://arxiv.org/abs/2506.08837
[HUYEN]: https://huyenchip.com/2025/01/07/agents.html
[HAMEL-FAQ]: https://hamel.dev/blog/posts/evals-faq/
[RULE-OF-TWO]: https://ai.meta.com/blog/practical-ai-agent-security/
[OWASP-AGENTIC]: https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/
