# Preguntas abiertas

> Lo que no se pudo verificar, las contradicciones entre fuentes y los temas que conviene profundizar. Complementa a `fuentes.md`.
> Fecha: **2026-11-14**.

## 1. Límites de método (aplican a toda la base)

1. **La mayoría de las páginas se leyó a través de una herramienta que resume con un modelo**, no como texto crudo. Las cifras y citas pueden tener errores de transcripción. Texto crudo solo en `platform.claude.com`, `code.claude.com`, `vercel.com/docs`, el PDF de la guía de OpenAI y los PDF de algunos papers.
2. **Nada fue instalado ni ejecutado.** Ningún fragmento de código de `A3` se corrió. Antes de programar contra cualquier API citada, releer la página fuente.
3. **Los diagramas Mermaid no se renderizaron.** Se revisó su sintaxis de forma estática; el intento de validarlos en un navegador local fue bloqueado por los permisos de la sesión. Conviene abrir `C` y `A3` en un visor de Markdown con Mermaid antes de compartirlos.
4. **Los puntajes de `D` son juicio**, no medición.
5. **Varios papers se leyeron solo desde el abstract** (ReWOO, LLMCompiler, Self-Refine, Self-Consistency, RouteLLM, FrugalGPT, CaMeL, patrones de seguridad). MAST y el estudio de escalamiento, desde los primeros 100.000 caracteres del HTML.
6. **Las cifras de 2022–2024** (ReAct, Reflexion, autocorrección, debate) se midieron con PaLM, GPT-3.5 y GPT-4. No se encontró réplica con modelos actuales.
7. **Verificación cruzada hecha por el integrador** (lectura directa el 2026-11-14): límites de funciones de Vercel; tablas de `PostgresSaver` sin `user_id`; tope por defecto de `ToolLoopAgent`; cifra de 3–10× y umbrales del post de Anthropic sobre multiagente; anillo de LangGraph en el Radar de Thoughtworks. Todas coincidieron con las notas. El resto no se contrastó contra una segunda lectura.

## 2. Fuentes que no se pudieron abrir

| Fuente | Problema | Qué queda sin confirmar |
|---|---|---|
| OpenAI, "Harness engineering" (`openai.com/index/harness-engineering/`) | HTTP 403 | Todo su contenido: cifras del proyecto, prácticas. Lo citado en `A2` viene de terceros |
| OpenAI, "Introducing AgentKit" | HTTP 403 | Detalle del cierre de Agent Builder y destinos de migración (sí verificado en la doc: deprecado, cierre 2026-11-30) |
| Octomind, "Why we no longer use LangChain" | El dominio no resuelve | Solo se leyó el hilo de Hacker News |
| Zalando Assistant (caso en openai.com y post propio) | HTTP 403 | Arquitectura y método de evaluación de un asistente de moda real |
| OWASP Top 10 LLM 2026 | La lista está en un PDF no abierto | Las diez entradas y su orden; `A2` cita la edición 2025 |
| Especificación detallada de AP2 | HTTP 404 | Contenido de cada mandato y roles |
| Mastercard Agent Pay | HTTP 403 | Si las transacciones en Latinoamérica incluyen Chile |
| OpenHands, Cline, Roo Code, Aider | Solo resultados de búsqueda | Umbrales de detección de loops (en torno a 3) |
| Anthropic y OpenAI sobre resistencia a inyección de prompt | No abiertas | Sus recomendaciones propias de defensa |

## 3. Contradicciones entre fuentes

| Tema | Fuente A | Fuente B | Estado |
|---|---|---|---|
| **Multiagente: ¿ayuda?** | Anthropic: +90,2% en su eval interna de research | Estudio Google/MIT: −0,3% promedio; hasta −70% en tareas secuenciales | Compatible si se lee por tipo de tarea (`A1` §2.1): ayuda en búsqueda amplia, empeora en secuencial |
| **Costo del multiagente** | Anthropic 2025: ~15× los tokens de un chat | Anthropic 2026: 3–10× los de un agente | Bases de comparación distintas (chat vs agente único) |
| **Número de herramientas tolerable** | Anthropic 2026: problemas sobre 20; degradación sobre ~30–50 | OpenAI: hay casos con más de 15 que funcionan; importa el solapamiento. Shopify: 20–50 difuso | Sin umbral único; depende de qué tan distinguibles sean |
| **Aprobación en `WorkflowAgent`** | Base de conocimiento de Vercel (2026-11-02): `needsApproval: true` en la herramienta | Doc de AI SDK 7: `needsApproval` deprecado en favor de `toolApproval` | Sin resolver; revisar la referencia de `@ai-sdk/workflow` |
| **Paquete Temporal + AI SDK** | Página de integración: `@temporalio/vercel-ai-sdk` | Receta del cookbook: `@temporalio/ai-sdk` | Sin resolver |
| **Node.js para LangGraph** | Guía de migración: 22+ | npm: `>= 18` | Sin resolver |
| **Paquetes supervisor y swarm de LangGraph** | npm: no deprecados | README de Python recomienda implementar el patrón con herramientas; swarm solo soporta `createReactAgent`, que la v1 depreca | En tensión |
| **Nombres en la doc de LangChain** | `piiMiddleware` / `prebuilt` | `piiRedactionMiddleware` / `prebuilts` | Revisar los exports reales |
| **Largo de `thread_id`** | Doc: bajo 255 caracteres | Migraciones JS: `TEXT` | No determinado para JS |
| **Autoalojar Agent Server** | Standalone con licencia propia | Autoalojamiento solo en plan Enterprise | No queda claro si la licencia standalone exige Enterprise |
| **Think tool de Anthropic** | Texto: 0,570 vs 0,370 | Tabla de la misma página: 0,584 vs 0,332 | No se pudo determinar cuál es correcta |
| **Atribución de casos a LangGraph** | LangChain: LinkedIn Hiring Assistant y Uber uReview "sobre LangGraph" | Los posts propios de esas empresas no lo nombran | Tratar las listas de logos con cautela |

## 4. Lo no verificado que afecta decisiones de `E`

### Sobre nuestro stack

1. **`PostgresSaver` con el pooler de Supabase en modo transacción** (sin sentencias preparadas). No hay documentación, ejemplo ni issue. Requiere una prueba real.
2. **LangGraph.js + `PostgresSaver` + Supabase + Vercel de punta a punta.** La evidencia es por partes.
3. **Si las tablas de checkpoint pueden protegerse con RLS** y qué rol necesita `PostgresSaver`.
4. **Cifrado de checkpoints en LangGraph.js** (solo documentado en Python).
5. **Claude Agent SDK en funciones de Vercel.** Ninguna página lo afirma ni lo niega; lo documentado es el modelo de subproceso con estado en disco.
6. **Si el AI SDK 7 expone todo lo que usamos del SDK de Anthropic**, en particular el fallback del lado servidor (beta) y el control fino de caché.
7. **Mastra con Supabase y RLS**; su integración dentro de una app Next.js existente.
8. **Estado GA o beta de Vercel Workflows** como servicio, y su retención de datos por plan.
9. **Comportamiento del tool runner de Claude al alcanzar `max_iterations`** (error o parada silenciosa).
10. **Soporte real en TypeScript de varias funciones de Google ADK** (colaboración, reanudación, evals, A2A, sesiones persistentes): que la doc no las liste no prueba que el paquete no las tenga.
11. **DBOS, Trigger.dev, Restate, Cloudflare Agents**: solo leídos en una línea; no evaluados contra el stack.
12. **Precio por traza adicional de LangSmith**: no figura en la página leída; dos terceros dan cifras distintas.

### Sobre el dominio

13. **No se encontró ningún caso de moda o de asistente de compra al consumidor con arquitectura descrita por la propia empresa** en el ecosistema LangGraph. Stitch Fix (2023) y Amazon Rufus (2024) describen sus sistemas, pero no son agentes con herramientas como el nuestro.
14. **Daydream, Mercado Libre, Falabella**: solo prensa; sin fuente de arquitectura.
15. **Protocolos de comercio agéntico en Chile**: los tokens de pago de Stripe no listan a Chile; no se confirmó la cobertura de Visa ni de Mastercard.

### Sobre los patrones

16. **No se encontró una comparación controlada** entre un loop ReAct o Reflexion explícito y el mismo agente con razonamiento nativo, en benchmarks de agentes con modelos de 2026.
17. **No se encontraron cifras** del efecto de la aprobación humana, los circuit breakers, las listas de tareas o la memoria sobre tasa de éxito o costo (salvo la eval de memoria de Anthropic).
18. **No hay una recomendación numérica oficial de un proveedor de modelos** sobre el máximo de herramientas.
19. **Parámetros concretos de reintento** (base, jitter, máximo): ninguna fuente leída los da.

## 5. Preguntas que solo se responden midiendo en el proyecto

Listadas en `E` §9. Las tres primeras condicionan el resto:

1. ¿Cuántos pasos, tokens y segundos usa hoy un turno real?
2. ¿El asesor se degrada al sumar las herramientas y el criterio del shopper?
3. ¿Qué tiendas chilenas se pueden leer y por qué vía?

## 6. Temas para profundizar

| Tema | Por qué | Punto de partida |
|---|---|---|
| **Diseño de la tarjeta de aprobación** | La aprobación a ciegas anula el control (`A2` §6.3) | OWASP ASI09; regla de dos de Meta; documentación de consentimiento de los protocolos de comercio |
| **Evals para un agente conversacional de estilo** | El juicio estético no tiene regla; hay que calibrar un juez con una experta | `A2` §10; método de Hamel Husain; caso Shopify |
| **Simulación de personas** | Probar conversaciones de varios turnos sin gastar tiempo humano | τ-Bench; "N−1 turnos" |
| **Prueba adversarial con imágenes** | Fotos con texto visible e invisible son el vector más propio del producto | `A2` §9.2 |
| **Consolidación de memoria fuera de línea** | Evolución del perfil sin inflar el contexto | Post de Anthropic sobre componentes de memoria |
| **Módulos de conocimiento (skills) sobre la API directa** | Alternativa a un agente por especialidad sin adoptar el Agent SDK | Documentación de Agent Skills; cómo cargarlos sin romper la caché |
| **Lectura de catálogos chilenos** | Define cuánto contenido no confiable entra y con qué herramienta | DT-09; herramientas de búsqueda y lectura web del proveedor |
| **Estado del turno en Supabase con RLS** | Es el componente que habilita la aprobación sin excepción a DT-02 | `A3` §6; 12-factor agents (estado unificado, reductor sin estado) |
| **Observabilidad con datos personales** | Qué se registra, cuánto tiempo, dónde | `D` §9; opciones de redacción de cada herramienta |
| **Carga diferida de herramientas** | Si el set crece sobre ~15–20 | Tool search de la API |

## 7. Vigencia

Este campo cambia en meses. Señales de que una sección envejeció: cambio de versión mayor de un paquete citado (AI SDK, LangGraph, Agents SDK), salida de beta de Managed Agents o del tool runner, o un modelo nuevo que vuelva innecesario un componente del harness (`A2` §1.3). Las versiones exactas leídas están en `A3` (LangChain) y `D` §2.
