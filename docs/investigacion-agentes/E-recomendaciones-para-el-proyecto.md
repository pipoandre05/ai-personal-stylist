# E — Recomendaciones para el proyecto

> Parte de la base de conocimiento `docs/investigacion-agentes/`.
> **Todo este documento es [REC]: una primera hipótesis para discutir, no una especificación ni una decisión.** No reemplaza ni modifica `AGENT_ARCHITECTURE.md`, `TECHNICAL_ARCHITECTURE.md` ni `DECISION_LOG.md`. La evidencia que la sostiene está en `A1`, `A2`, `A3`, `B`, `C` y `D`, que es donde van las marcas [DOC] y [EXP] con sus fuentes.
> Estado de la base usado para el contraste: lectura de `web/src/lib/agent/` y de los documentos de producto el **2026-11-14**.

## 1. La hipótesis en dos frases

**Un solo asesor conversacional (un loop de herramientas) dentro de un harness explícito que controla qué puede hacer, cuándo se detiene, qué exige aprobación y qué queda registrado; los procesos de pasos conocidos (alta de prenda, paleta, evaluar una compra) salen del loop como flujos deterministas, y el único componente que se aísla como subagente es el que lee la web de tiendas.** Se construye sobre el loop propio actual, sin adoptar un framework, tomando de LangGraph sus ideas (estado tipado, checkpoint por paso, aprobación como pausa serializable) y no su librería.

Corresponde a la candidata **B** de `C` §5, alcanzada por etapas desde la candidata **A**.

## 2. Qué es cada capacidad: agente, flujo, función o código

**Criterio usado** (árbol de `C` §7, derivado de `A1` §2.3 y §4):

1. ¿Se resuelve con una regla o una consulta? → **código o herramienta**.
2. ¿Basta una llamada al modelo con salida estructurada? → **función de una llamada**.
3. ¿Los pasos son siempre los mismos? → **flujo determinista**.
4. ¿Necesita el mismo contexto que el asesor? → **parte del asesor** (herramienta o módulo de conocimiento).
5. ¿Trae mucho contenido desechable, no confiable o paralelizable? → **subagente aislado**.

| Capacidad del producto | Hipótesis | Criterio que lo decide | Hoy en la base |
|---|---|---|---|
| **Asesoría de imagen** (conversar, decidir, explicar) | **Agente**: el asesor, único loop | Es la única parte donde el camino no se puede fijar y se necesita todo el contexto | Sí: `runStylistTurn()` |
| **Asesoría de vestimenta / componer outfit** | **Decisión del asesor + validador en código** | Necesita perfil, paleta, clóset, clima y memoria a la vez (criterio 4); es secuencial y de contexto compartido, el caso donde dividir empeora (`A1` §2.2) | Sí: `propose_outfit` + `outfit-rules.ts` |
| **Criterio de estilismo, color, formalidad, compra** | **Módulos de conocimiento** (skills) que el asesor carga según el turno | Es conocimiento, no una acción; alternativa a un agente por especialidad (`B` §3.17) | Parcial: todo en un prompt único |
| **Análisis de prendas** | **Flujo determinista** con una **función de visión** adentro: recibir → describir → normalizar → guardar → revisión de la persona | Pasos siempre iguales (criterio 3) | Como herramienta del agente (`add_garment`); la tarjeta de revisión está prevista en la interfaz (UI-3) |
| **Análisis de colorimetría** | **Flujo determinista** con consentimiento explícito y una función de visión | Pasos iguales; dato sensible (rostro) | Como herramienta (`analyze_palette`); el consentimiento se registra **después** de analizar |
| **Identificación de estilo personal / perfil** | **Herramienta de escritura** del asesor + reglas de completitud en código | Guardar es una escritura simple; qué falta preguntar es una regla | Sí: `update_profile`, `profile-completeness.ts` |
| **Construcción y evolución del perfil (memoria)** | **Herramienta** en el turno + **proceso fuera de línea** de consolidación | Escribir un hecho es simple; consolidar no necesita a la persona ni al turno | Herramienta sí (`remember`); consolidación no |
| **Análisis de combinaciones** | **Código** (reglas de composición) + juicio del asesor | Lo verificable va en código | Sí |
| **Detectar la prenda faltante** | **Parte del asesor** (`missing_piece`) | Necesita el clóset y el outfit en curso | Sí |
| **Evaluar una compra** (foto o link) | **Flujo determinista** tipo plan fijo: extraer ficha (lector aislado) → duplicados (código) → looks que desbloquea → veredicto | Pasos conocidos; el contenido de la página no debe poder cambiar el plan (`A2` §9.3) | No existe |
| **Buscar productos en tiendas** | **Subagente aislado** con contrato, llamado como herramienta; una búsqueda por tienda en paralelo | Único caso que cumple el criterio 5: contenido voluminoso, no confiable y paralelizable | No existe |
| **Clima** | **Herramienta** | Consulta | Sí |
| **Respuestas sugeridas** | **Herramienta** de interfaz | Salida estructurada hacia la UI | Sí |
| **Ir a una tienda, armar carrito, pagar** | **Compuerta de aprobación**; nunca decisión del modelo | Irreversible y con dinero (DP-09) | No existe (hoy el asesor solo puede decir que no compra) |
| **Calidad de las respuestas** | **Evals** de código + **juez fuera de línea** | La autocrítica dentro del turno no ayuda sin señal externa (`B` §3.11) | No corre aún |

Resultado: **un agente, un subagente, tres flujos, dos funciones de visión y el resto código**. No hay un agente por especialidad.

## 3. Cómo se relacionan y qué estado comparten

Diagrama en `C` §6. En tabla:

| Capacidad | Necesita de | Produce | Estado que toca |
|---|---|---|---|
| Conocer a la persona | Conversación | Perfil | `profiles`, `style_profiles` |
| Colorimetría | Selfie + consentimiento | Paleta con nivel de confianza | `color_analyses` (la selfie no se conserva) |
| Análisis de prendas | Foto | Prenda estructurada | `garments` |
| Componer outfit | Perfil, paleta, clóset, memoria, clima | Outfit `proposed` + porqué | `outfits`, `outfit_items` |
| Aprender del feedback | Outfit + reacción de la persona | Hechos de memoria | `outfit_feedback`, `memory_facts` |
| Detectar prenda faltante | Clóset + outfit en curso | Descripción sin marca ni tienda | `outfits.missing_piece` |
| Buscar productos | **Solo un encargo**: categoría, color, material, presupuesto, tiendas permitidas | Fichas verificadas: título, tienda, enlace, precio, fecha | Ninguno de la persona |
| Evaluar una compra | Ficha del producto + clóset + paleta | Veredicto estructurado | Ninguno, hasta que la persona decida |

Dos observaciones que ordenan el diseño:

- **El estado compartido es la base de datos, no un mensaje entre agentes.** Como hay un solo agente, no hay que resolver paso de contexto entre agentes para el núcleo. El único contrato entre agentes es el del buscador.
- **El buscador recibe un encargo derivado, no el perfil.** Eso es lo que permite aislarlo y cumplir la regla de dos (`A2` §9.1): lee contenido no confiable y sale a la red, pero no tiene datos privados ni herramientas de escritura.

### Contrato tentativo del buscador

Para ilustrar qué significa "con contrato" (no es un diseño cerrado):

| Parte | Contenido |
|---|---|
| Entrada | Categoría, descripción (tipo, color, material), presupuesto máximo, lista de tiendas permitidas, cantidad de resultados |
| Salida | Lista corta de fichas con título, tienda, enlace, precio en CLP, fecha de lectura; y lo que no encontró |
| Herramientas | Solo búsqueda y lectura en los dominios permitidos |
| No tiene | Perfil, clóset, memoria, fotos, herramientas de escritura |
| Topes | Pasos, costo y tiempo propios; resultados por tienda |
| Validación al volver | En código: dominios dentro de la lista, precios numéricos, enlaces bien formados; el texto libre se trata como dato no confiable |

## 4. Qué lógica debería controlar el comportamiento

### 4.1 Decisiones clave y dónde vive cada una

| Decisión | Quién decide | Mecanismo |
|---|---|---|
| ¿Qué quiere la persona en este turno? | Asesor | Juicio del modelo; router solo si aparecen flujos claramente distintos |
| ¿Qué es esta foto? (prenda, selfie, compra, ambigua) | Router de una llamada o el asesor | Salida de un conjunto cerrado; por defecto, preguntar |
| ¿Preguntar o proponer? | Asesor | Regla de conversación (ficha D2 del plan "agente primero") |
| ¿Qué prendas van en el look? | Asesor | Juicio estético con criterio escrito (ficha D5) |
| ¿El look es válido? | **Código** | `outfit-rules.ts` |
| ¿Se puede guardar este hecho en memoria? | Asesor propone; **código** limita | Topes, deduplicación, lista de temas vetados |
| ¿Esta acción necesita aprobación? | **Código** | Política por herramienta; nunca el prompt |
| ¿Seguir iterando o cerrar? | **Código** | Presupuestos y detector de repetición |
| ¿Sugerir comprar o decir "no compres"? | Asesor | Criterio escrito (ficha D8) |
| ¿Abrir una tienda con este producto? | **La persona** | Compuerta de aprobación |

### 4.2 Política por herramienta (propuesta inicial)

Clasificación por riesgo según `A2` §5 y §6.2. Las tres últimas filas no existen hoy.

| Herramienta | Tipo | Reversible | Política propuesta | Control adicional |
|---|---|---|---|---|
| `get_closet`, `get_weather` | Lectura | — | Permitir | — |
| `suggest_replies` | Interfaz | — | Permitir | — |
| `propose_outfit` | Escritura | Sí (queda `proposed`) | Permitir | Validador en código; tope por turno |
| `remember` | Escritura | Sí (visible y borrable) | Permitir | Tope por turno y total; deduplicación; temas vetados en código |
| `update_profile` | Escritura | Sí | Permitir, visible | Decisión abierta: ¿confirmar cambios de campos ya llenos? |
| `add_garment` | Escritura | Sí (archivar) | Permitir, con revisión de la persona | Solo fotos del turno (ya existe) |
| `analyze_palette` | Escritura + dato sensible | Sí | **Preguntar**: consentimiento antes de analizar | Borrado de la selfie (ya existe) |
| `evaluate_purchase` | Lectura externa | — | Permitir | Lector aislado; dominios permitidos |
| `search_products` | Lectura externa | — | Permitir | Subagente aislado; presupuesto propio |
| Abrir tienda / carrito | Salida hacia un tercero | **No** | **Preguntar siempre** | Tarjeta con datos verificados por el servidor |
| Pagar | Dinero | **No** | **Denegar** (no existe la herramienta) | DP-09 |

### 4.3 Validaciones

| Momento | Validación | Tipo |
|---|---|---|
| Entrada | Largo del texto, tipo y tamaño de la foto, ruta de la foto dentro de la sesión | Código (existe) |
| Antes de ejecutar una herramienta | Esquema estricto + zod; política; foto permitida en el turno | Código (existe salvo la política) |
| Después de una herramienta de escritura | Reglas de dominio | Código (existe para outfits) |
| Resultado de un flujo o subagente | Estructura, dominios, rangos; texto libre marcado como dato | Código (por construir) |
| Antes de responder | Que no haya precios, tiendas o marcas sin fuente; que todo look mencionado tenga tarjeta | Código (hoy solo en el prompt) |
| Fuera de línea | Tono, límites sobre el cuerpo, paleta como orientación | Juez calibrado sobre una muestra |

### 4.4 Puntos de aprobación humana

| Punto | Tipo | Estado |
|---|---|---|
| Prenda reconocida | Revisión: confirmar o corregir | Evento emitido; tarjeta prevista (UI-3) |
| Paleta | Revisión + consentimiento previo para analizar el rostro | Evento emitido; tarjeta prevista (UI-3); el consentimiento se registra después de analizar |
| Hecho de memoria | Visible con opción de deshacer | Evento emitido; tarjeta prevista (UI-3) |
| Guardar o descartar un look | Solo la persona | Outfit queda `proposed`; tarjeta prevista (UI-3) |
| Salir hacia una tienda con un producto | **Aprobación explícita**, como pausa serializable | No existe |
| Compartir datos de la persona con un tercero | Aprobación explícita y granular | No existe |
| Compra o pago | **Autorización explícita por transacción**: acotada, con monto máximo, con expiración y revocable (`A2` §6.4). Fuera del alcance actual | No existe ni se propone construir |

### 4.5 Criterios de salida

| Nivel | Termina cuando | Si no termina |
|---|---|---|
| Turno | El asesor responde sin pedir herramientas | Tope de pasos, de costo o de tiempo → cierre honesto con lo logrado |
| Composición de outfit | El validador acepta | Tres rechazos seguidos → explicar qué falta en el clóset |
| Herramienta | Devuelve resultado | Error accionable; tres errores consecutivos de la misma herramienta → dejar de usarla en el turno |
| Flujo determinista | Último paso o compuerta que corta | Motivo explícito a la persona |
| Buscador | Devuelve fichas o "no encontré" | Topes propios; resultado parcial permitido |
| Aprobación | La persona decide | Expira; nada se ejecuta |

Ciclo completo en `C` §3.

## 5. Contraste con la base actual

### 5.1 Qué ya cubre

La base está mejor de lo que el diagnóstico "solo capacidades" sugiere. Como sistema ya tiene:

- **Loop con salidas explícitas**: maneja cada motivo de término, no ejecuta herramientas cortadas por tokens y fuerza un cierre sin herramientas en la última vuelta.
- **Contexto diseñado para caché**: prompt estático y bloque de persona separado.
- **Validación de dominio en código** con errores accionables que el modelo corrige: es el patrón evaluator-optimizer bien aplicado, con evaluador determinista.
- **Mínimo privilegio**: ninguna herramienta recibe la identidad; todo pasa por RLS; las fotos se validan contra la sesión y el turno.
- **Compensación manual** en una escritura de dos pasos (`propose_outfit`).
- **Modo simulado** que usa las herramientas y la base reales.
- **Decisión de arquitectura correcta para el núcleo**: un agente, visión como funciones (DT-06). La evidencia de `A1` §2.2 la respalda.

### 5.2 Qué le falta como sistema

| Falta | Componente (`A2` §11) | Por qué importa |
|---|---|---|
| Saber qué pasó en cada turno | 14 Trazas | Sin trazas no hay análisis de errores ni mejora dirigida |
| Medir si el asesor hace lo que se decidió | 15 Evals | Cada cambio de prompt es a ciegas |
| Clasificación de riesgo por herramienta | 3 Registro con política | Hoy "qué puede hacer" está implícito en qué herramientas existen |
| Estado del turno persistido | 10 Checkpoints | Un corte pierde el turno; sin esto no hay aprobación reanudable |
| Compuerta de aprobación | 11 | Condición para cualquier paso hacia compras |
| Topes de costo y tiempo, y por persona | 5 Presupuestos | Solo hay tope de pasos y de tokens por llamada |
| Detección de repetición y de errores consecutivos | 6 y 7 | El tope de pasos llega tarde |
| Verificación de salida en código | 9 Guardrails | Las reglas "sin precios, sin marcas" viven solo en el prompt |
| Aislamiento para contenido web | 12 | Necesario antes de la búsqueda de productos |
| Versión registrada por turno | 17 | Para comparar comportamiento entre cambios |

### 5.3 Diferencias entre los documentos y el código

Encontradas al leer; se anotan porque afectan el control. No se corrigió nada (esta sesión no modifica código ni documentos de producto).

| Documento dice | Código hace |
|---|---|
| 4 herramientas | 8 (`add_garment`, `analyze_palette`, `update_profile`, `suggest_replies` además de las 4) |
| Herramientas de un paso en paralelo con `Promise.all` | Se ejecutan en serie dentro del paso |
| `remember`: deduplica tras normalizar, máximo 2 hechos por turno y tope total de 100 | Deduplica solo por coincidencia exacta; sin tope por turno ni total |
| Al llegar al tope, una llamada final extra con `tool_choice: none` | La sexta iteración ya va con `tool_choice: none` (equivalente, un paso menos) |
| Consentimiento de rostro antes del análisis (implícito en la matriz de autonomía) | `face_photo` se registra después de analizar |

La segunda y la tercera son relevantes para el harness: latencia evitable, y memoria sin los topes que protegen contra basura o envenenamiento.

### 5.4 Qué cambiaría según el patrón elegido

| Si se elige… | Cambia | Se conserva |
|---|---|---|
| **A — Agente único + harness** | Se agregan los componentes de 5.2 alrededor del loop. Las herramientas del shopper entran al mismo agente | Todo el código actual |
| **B — A + flujos + buscador aislado** (hipótesis) | Además: `add_garment`, `analyze_palette` y `evaluate_purchase` pasan a ser flujos con compuertas propias; `search_products` invoca un subagente con su contrato; el criterio se modulariza | El loop, el contrato SSE, las tarjetas, la base de datos |
| **C — Supervisor + especialistas** | Reescritura: seis prompts, contratos entre agentes, estado compartido del turno, evals por agente y de punta a punta | La base de datos y las funciones de visión |
| **Adoptar LangGraph.js** (ortogonal a A/B/C) | Reescritura del loop, del streaming y del modo simulado; tablas de checkpoint fuera de RLS (`D` §5.5) | Herramientas y reglas de dominio |

## 6. Componentes de harness que deberíamos tener, en orden

Prioridad pensada para no bloquear el plan "agente primero" y para que cada etapa sea útil sola.

| Etapa | Componentes | Qué habilita | Depende de |
|---|---|---|---|
| **0. Ver** | Trazas por paso con motivo de término (14); versión por turno (17) | Leer qué hace el asesor de verdad | Decisión 3 |
| **1. Medir** | Banco de pruebas con evaluadores de código y un juez por dimensión (15) | Cambiar el prompt con datos; coincide con la Pista A | Etapa 0 |
| **2. Acotar** | Política por herramienta (3); presupuestos de costo y tiempo (5); detector de repetición (6); contador de errores (7); topes de memoria que el documento ya define | Que el sistema tenga límites explícitos | — |
| **3. Verificar** | Guardrails de salida en código (9) | Que las reglas de producto no dependan solo del prompt | — |
| **4. Pausar** | Estado del turno persistido (10) y compuerta de aprobación (11) | Cualquier acción con aprobación | Decisión 2 |
| **5. Aislar** | Flujos deterministas y buscador aislado (12) | Personal shopper con web | Decisión 1 y aprobación A-01 |
| **6. Consolidar** | Proceso fuera de línea de memoria (13) | Perfil que evoluciona | Decisión 4 |

Las etapas 0 a 3 no cambian la arquitectura y valen con cualquiera de las candidatas.

## 7. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Sobre-ingeniería**: construir el harness completo antes de tener personas usando el producto | Alta | Medio | Etapas; las 0–1 primero porque también sirven al criterio del asesor |
| **Reinventar un runtime**: el estado propio crece hasta ser un LangGraph peor | Media | Medio | Gatillos explícitos de reevaluación (`D` §10) |
| **Inyección desde páginas de tiendas** al incorporar búsqueda | Alta si no se aísla | Alto | Etapa 5 antes de abrir la búsqueda; regla de dos |
| **Aprobación a ciegas**: la persona confirma sin leer | Media | Alto | Pocas compuertas, solo en lo irreversible; tarjeta con datos del servidor |
| **Privacidad de las trazas**: conversaciones y referencias a fotos en un servicio de terceros | Media | Alto | Decisión 3; redacción de datos; trazas en Supabase como opción |
| **El prompt único se degrada** al sumar el shopper | Media | Medio | Módulos de conocimiento; medir con el banco de pruebas; gatillo hacia C |
| **Evals que no representan el uso real** | Alta al inicio | Medio | Partir de trazas reales en cuanto existan; no afirmar tasas no medidas |
| **Memoria envenenada o basura** | Media | Medio | Topes y temas vetados en código; consolidación con confirmación de la persona |
| **Dependencia de funciones beta** de la API (fallback del lado servidor) | Media | Bajo | Aislar su uso; prueba de humo con modelo real |
| **Esta investigación envejece**: versiones y nombres cambian en meses | Alta | Bajo | Fechas y versiones anotadas; `preguntas-abiertas.md` |
| **Fuentes leídas a través de resúmenes automáticos** | — | Medio | Antes de programar contra una API, releer la página; ver `preguntas-abiertas.md` |

## 8. Decisiones que quedan para Felipe

Ordenadas por cuánto condicionan lo demás. Cada una con la recomendación de esta investigación y lo que desbloquea.

| # | Decisión | Opciones | Recomendación | Desbloquea |
|---|---|---|---|---|
| **1** | **¿El personal shopper es herramientas del mismo asesor (DP-18 tal como está) o el lector de la web se aísla como subagente?** | (a) Todo en el asesor · (b) Asesor único de cara a la persona + buscador aislado detrás | (b). Mantiene "un solo asesor" para la persona y cumple la regla de dos. Ajusta el matiz de DT-06 y DP-18, que hoy dicen "único agente con más herramientas" | El diseño de `search_products` y `evaluate_purchase` |
| **2** | **¿Se acepta una excepción a DT-02 para tablas técnicas de estado de ejecución?** | (a) No: estado del turno en tablas propias con `user_id` y RLS · (b) Sí: abre la puerta a `PostgresSaver`, Mastra o un motor externo | (a) para el piloto | Etapa 4 y la reevaluación futura de LangGraph |
| **3** | **¿Dónde viven las trazas?** | (a) Tablas propias en Supabase · (b) Langfuse (nube o autoalojado) · (c) LangSmith | Decidir con criterio de privacidad antes que de comodidad; (a) o (b) autoalojado si las conversaciones no deben salir | Etapas 0 y 1 |
| 4 | ¿Se adopta un motor de ejecución durable, y cuál? | No por ahora · Vercel Workflows · Inngest | No por ahora; elegir cuando exista el primer proceso en segundo plano | Etapa 6, monitoreo de precios |
| 5 | ¿Framework de agentes? | Loop propio · AI SDK 7 · LangGraph.js · Mastra | Loop propio, con gatillos de reevaluación (`D` §10) | Nada inmediato; evita una reescritura |
| 6 | ¿El harness se construye antes, durante o después de las fichas de decisión del asesor? | Antes · En paralelo · Después | Etapas 0–1 en paralelo con la Pista A (son su banco de pruebas); 2–3 después de la línea base | El orden de trabajo |
| 7 | ¿Qué acciones exigen aprobación explícita además de compra y pago? | Solo salida a tienda · También cambios de perfil · También análisis de rostro | Salida a tienda y análisis de rostro (consentimiento previo) | La política de 4.2 |
| 8 | ¿Presupuesto por turno y por persona? | Valores a fijar | Fijarlos con la primera semana de trazas, no antes | Etapa 2 |
| 9 | ¿Se corrigen ahora las diferencias de 5.3? | Sí · Con la etapa 2 | Topes de memoria y consentimiento de rostro, pronto; el resto con la etapa 2 | — |
| 10 | ¿Quién calibra al juez? | Felipe · Una asesora de imagen (supuesto S-08) | Una sola persona experta de dominio, con crítica escrita (`A2` §10.3) | Etapa 1 |

## 9. Preguntas para cerrar la hipótesis

Lo que habría que responder, con datos o con una prueba, antes de convertir esto en arquitectura:

1. **¿Cuántos pasos, tokens y segundos usa hoy un turno real?** Sin la línea base no se puede fijar ningún presupuesto ni saber si el prompt único ya está tenso.
2. **¿El asesor degrada al sumar las herramientas y el criterio del shopper?** Se responde con el banco de pruebas antes y después. Es el gatillo entre A/B y C.
3. **¿Qué tiendas chilenas se pueden leer, y cómo?** (A-01, DT-09). Define si el buscador usa búsqueda web del proveedor, lectura directa de dominios permitidos o feeds; y cuánto contenido no confiable entra.
4. **¿La búsqueda cabe en un request?** Si cinco tiendas en paralelo exceden la duración de la función, aparece el primer caso real para un motor durable.
5. **¿Un router para las fotos mejora algo medible** frente a dejar que el asesor decida?
6. **¿Cuánto del criterio se puede modularizar sin perder coherencia?** Probar con un módulo (compra) antes de partir todo el prompt.
7. **¿Qué debe ver la persona en una tarjeta de aprobación** para que la aprobación no sea a ciegas? Es una pregunta de diseño de interfaz, no solo técnica.
8. **¿Qué retención y qué redacción necesitan las trazas** dado que hay fotos y datos personales?
9. **¿La consolidación de memoria debe proponer y esperar confirmación, o aplicar sola?**
10. **¿Existe una prueba adversarial mínima** (texto en una foto, nombre de prenda malicioso, página con instrucciones) que el sistema deba pasar antes de abrir la búsqueda?

## 10. Lo que esta investigación **no** recomienda

- No dividir el asesor en agentes por especialidad (estilo, color, clóset, compras).
- No agregar un paso de autocrítica dentro del turno.
- No adoptar un framework para ganar "arquitectura": la arquitectura que falta es de control, no de librería.
- No construir nada que ejecute compras o pagos.
- No fijar presupuestos, metas de latencia ni tasas de calidad antes de medir.
