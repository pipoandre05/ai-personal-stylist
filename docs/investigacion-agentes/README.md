# Investigación: arquitectura, lógica y diseño de agentes de IA

> Base de conocimiento para dejar de pensar los agentes como "prompts con herramientas" y diseñarlos como sistemas de software: con arquitectura, responsabilidades, estados, árboles de decisión, mecanismos de control, evaluación y colaboración.
>
> **Es investigación, no especificación.** No modifica ningún documento de producto ni código. Nada aquí está decidido hasta que Felipe lo revise. Fecha de consulta de las fuentes: **2026-11-14**.

## Resumen ejecutivo

**Lo que encontramos**

1. **Los proveedores convergen en "un agente primero".** Anthropic, OpenAI y Microsoft recomiendan agotar un solo agente antes de dividir. En 2026 Anthropic publicó cuándo *plegar* subagentes de vuelta a un loop único. El multiagente cuesta 3 a 10 veces más tokens y, medido en 260 configuraciones, en promedio no mejora (−0,3%): ayuda en búsqueda amplia y paralelizable (+81%) y empeora en tareas secuenciales de contexto compartido (−39% a −70%). Componer un outfit es del segundo tipo; buscar productos en tiendas, del primero.
2. **La arquitectura que nos falta es de control, no de agentes.** Un *harness* es todo lo que rodea al modelo. De 17 componentes identificados, la base actual resuelve bien el loop, el contexto con caché, la validación de dominio y el mínimo privilegio. Le faltan: política por herramienta, estado persistido del turno, compuerta de aprobación, presupuestos y detección de repetición, trazas y evals.
3. **La autocrítica dentro del turno no sirve; la verificación externa sí.** Un modelo que se revisa a sí mismo sin información nueva empeora. Un validador en código lo mejora. Nuestro `propose_outfit` ya es ese patrón.
4. **La aprobación humana es una pausa serializable, no una pregunta en el chat.** Todos los frameworks convergen en lo mismo: no ejecutar, guardar el estado, esperar, reanudar. En serverless eso significa terminar la función y reanudar en otro request, sin motor especial.
5. **El personal shopper cambia el perfil de riesgo.** Con búsqueda web, el agente pasa a tener datos privados, contenido no confiable y salida a la red a la vez: la combinación que permite exfiltrar datos. Es la razón de seguridad, además de la de contexto, para aislar lo que lee la web.

**Hipótesis de arquitectura** (primera, para discutir): un solo asesor conversacional dentro de un harness explícito; los procesos de pasos conocidos (alta de prenda, paleta, evaluar una compra) como flujos deterministas; y un único subagente aislado para leer tiendas. Sobre el loop propio actual, sin adoptar un framework, tomando de LangGraph sus ideas y no su librería.

**Decisiones principales para Felipe** (`E` §8): si el lector de la web se aísla como subagente (ajusta el matiz de DT-06 y DP-18); si se acepta una excepción a DT-02 para estado de ejecución; y dónde viven las trazas.

## Cómo leer la base

| Si tienes… | Lee |
|---|---|
| 10 minutos | Este README y `E` §1, §5 y §8 |
| 30 minutos | Además `C` (diagramas) y `A2` §11 (componentes del harness) |
| Una tarde | Todo, en el orden de la tabla siguiente |
| Una pregunta puntual | El glosario de abajo y el documento que corresponda |

| Documento | Qué responde | Tamaño |
|---|---|---|
| [`A1-construccion-de-agentes.md`](A1-construccion-de-agentes.md) | Qué es un agente; uno o varios y con qué evidencia; cómo se delega, se coordina y se controla; qué enseñan Anthropic, OpenAI, Google y Microsoft | Medio |
| [`A2-harness-engineering.md`](A2-harness-engineering.md) | Qué es un harness; loop, salidas, errores, checkpoints, aprobación, contexto, herramientas, seguridad, evals. **Termina con la lista de componentes de nuestro harness** | Largo |
| [`A3-langgraph-y-langchain.md`](A3-langgraph-y-langchain.md) | LangGraph.js concepto por concepto, con fragmentos TypeScript; LangChain v1, Deep Agents, LangSmith; despliegue en nuestro stack; casos reales y críticas | Muy largo (referencia) |
| [`B-catalogo-de-patrones.md`](B-catalogo-de-patrones.md) | 18 patrones: matriz comparativa y ficha de cinco puntos, con ejemplo del dominio | Largo |
| [`C-arquitecturas-de-referencia.md`](C-arquitecturas-de-referencia.md) | Diagramas: patrones, anatomía del harness, ciclo de ejecución, aprobación con checkpoint, **tres arquitecturas candidatas** | Medio |
| [`D-evaluacion-tecnologica.md`](D-evaluacion-tecnologica.md) | LangGraph frente a las alternativas, con criterios, pesos y puntajes; ejecución durable; observabilidad | Largo |
| [`E-recomendaciones-para-el-proyecto.md`](E-recomendaciones-para-el-proyecto.md) | **La hipótesis**: qué es agente y qué no, lógica de control, contraste con la base actual, riesgos y decisiones | Medio |
| [`fuentes.md`](fuentes.md) | 272 fuentes con enlace, agrupadas por tema | Referencia |
| [`preguntas-abiertas.md`](preguntas-abiertas.md) | Lo no verificado, contradicciones entre fuentes y temas para profundizar | Corto |

La parte A del encargo ("investigación técnica") está dividida en `A1`, `A2` y `A3`.

## Convención de marcas

Toda afirmación técnica lleva una de tres marcas:

| Marca | Significa | Cómo tratarla |
|---|---|---|
| **[DOC]** | Documentado por el proveedor o autor sobre su **propio** producto, sistema o código | Hecho, a la fecha de consulta. Las cifras de un proveedor sobre sus sistemas internos son autodeclaradas |
| **[EXP]** | Experimental, paper, o reportado por **terceros**; incluye casos de cliente publicados por un proveedor | Evidencia a ponderar, no hecho |
| **[REC]** | Recomendación o inferencia de **esta investigación** | Opinión razonada; discutible |

Las fuentes se citan con una clave entre corchetes, por ejemplo `[DOC] [BEA]`; la clave enlaza a la URL definida al final de cada documento y listada en `fuentes.md`. Las claves son locales a cada documento. `C` y `E` son síntesis [REC] completas y remiten a los documentos con evidencia. Dentro de una tabla, la marca puede estar en el encabezado o en una nota al pie de la tabla.

## Glosario

Un solo vocabulario para toda la base. El término en inglés se conserva donde es el de uso común.

| Término | Significado |
|---|---|
| **Agente** | Un modelo que dirige dinámicamente su proceso y su uso de herramientas, en un loop con condición de salida |
| **Workflow / flujo determinista** | Pasos orquestados por código en un orden fijo, aunque algunos pasos llamen al modelo |
| **Función de una llamada** | Una sola llamada al modelo con salida estructurada, sin loop ni herramientas (hoy: reconocer prenda, analizar color) |
| **Herramienta** (*tool*) | Código del servidor que el modelo puede pedir ejecutar, con entrada validada |
| **Subagente** | Un agente invocado por otro como si fuera una herramienta, con contexto propio; solo devuelve un resultado |
| **Handoff** | Traspaso del control del turno a otro agente, que pasa a responder a la persona |
| **Harness** | Todo lo que rodea al modelo y lo vuelve agente: loop, herramientas, contexto, permisos, estado, control, trazas |
| **Loop / turno / paso** | Loop: el ciclo modelo → herramientas. Turno: todo lo que ocurre entre un mensaje de la persona y la respuesta. Paso (o iteración): una vuelta del loop |
| **Estado** | Los datos que el sistema mantiene: de negocio (perfil, clóset, outfits) y de ejecución (en qué va el turno) |
| **Checkpoint** | Foto del estado de ejecución desde la que se puede reanudar |
| **Ejecución durable** | Ejecución cuyo avance se guarda paso a paso y sobrevive a fallas, esperas y reinicios |
| **Guardrail** | Verificación que bloquea o corrige una entrada, una acción o una salida |
| **Validador de dominio** | Guardrail determinista sobre reglas del negocio (por ejemplo, composición del outfit) |
| **Política de herramienta** | Regla en código que decide si una herramienta se permite, se pregunta o se niega (*allow / ask / deny*) |
| **Human-in-the-loop** | Punto donde el flujo se detiene hasta que una persona revisa, confirma o aprueba |
| **Aprobación explícita** | Human-in-the-loop obligatorio antes de una acción irreversible, implementado como pausa serializable |
| **Contexto** | Todo lo que entra a la ventana del modelo en una llamada |
| **Context engineering** | Decidir qué entra al contexto, en qué orden y cuándo sale |
| **Compactación** | Reemplazar historial por un resumen para liberar ventana |
| **Memoria** | Lo que se guarda fuera del contexto para usar en conversaciones futuras |
| **Skill / módulo de conocimiento** | Instrucciones especializadas que se cargan solo cuando la tarea las necesita |
| **Eval** | Prueba repetible del comportamiento del agente, con casos y evaluadores |
| **Juez** (*LLM-as-judge*) | Un modelo que evalúa una salida contra una rúbrica; debe calibrarse contra una persona experta |
| **Traza** | Registro de un turno paso a paso: llamadas al modelo, herramientas, decisiones, costo, motivo de término |
| **Inyección de prompt** | Contenido no confiable (texto, imagen, página) que el modelo toma por instrucción |
| **Trifecta letal / regla de dos** | Datos privados + contenido no confiable + salida al exterior permiten exfiltrar; un agente autónomo no debería tener las tres |
| **Idempotencia** | Que repetir una operación no la aplique dos veces |
| **Super-step** | En LangGraph, una ronda de ejecución tras la cual se guarda un checkpoint |
| **Router** | Clasificación de la entrada que deriva a una rama |
| **Orchestrator-workers / supervisor** | Un agente central que delega en otros y sintetiza; "supervisor" cuando los especialistas son fijos |

## Cómo se hizo

- Siete líneas de lectura en paralelo (Anthropic y el debate multiagente; OpenAI, Google y Microsoft; frameworks TypeScript y ejecución durable; núcleo de LangGraph; ecosistema LangChain y casos; harness, evals y seguridad; patrones), integradas después en un solo vocabulario.
- Prioridad a documentación oficial, blogs de ingeniería de los propios proveedores, repositorios y papers.
- Punto de partida leído: `AGENT_ARCHITECTURE.md`, `TECHNICAL_ARCHITECTURE.md`, `DECISION_LOG.md`, el plan "agente primero", el contexto estratégico y el código de `web/src/lib/agent/`.
- Límites del método, lo que no se pudo abrir y lo que se verificó dos veces: `preguntas-abiertas.md` §1 y §2.

## Qué no es esta base

- No define la arquitectura definitiva ni reemplaza `AGENT_ARCHITECTURE.md`.
- No propone construir nada que ejecute compras o pagos.
- No contiene código del producto. Los fragmentos de `A3` son ejemplos de documentación ajena, no ejecutados.
