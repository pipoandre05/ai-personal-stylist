# Plan completo — dos pistas: las decisiones del asesor y el equipo de interfaz

**Estado:** propuesta v2, pendiente de tu aprobación · **Fecha:** 2026-11-14

**La idea, en una frase:** tú y yo estructuramos cómo decide el asesor (que es el producto), mientras un equipo de bots,
como el de Prendie, construye la interfaz contra un contrato fijo. Las dos pistas no se esperan entre sí.

```
PISTA A · Mesa de decisiones (Felipe + esta sesión)         PISTA B · Equipo de interfaz (bots)
  ficha de decisión → regla escrita → caso de prueba   ║      maqueta → construcción → revisión → humo → PR
  → corrida del banco de pruebas → ajustar             ║      contra el asesor simulado, sin gastar inferencia
                          └──────────── contrato compartido (tipos y eventos del chat) ────────────┘
```

---

## 1. Dónde estamos

| Hecho | Estado |
|---|---|
| Repo, CI, hooks, documentación de producto (DTR, backlog de 75 historias, specs, arquitectura) | Listo |
| Supabase: 12 tablas con RLS, bucket privado, acceso por email | Listo y comprobado |
| Base de servidor: asesor con 8 herramientas, chat con streaming y fotos, visión, asesor simulado | Construida; 85 tests en verde; **sin probar contra Claude real** |
| Interfaz base sin pestañas: portada, acceso, encabezado "Tu espacio", respuestas sugeridas, botón de foto | Construida; sin revisión visual |
| Maqueta "una sola conversación" | Lista para tu revisión |
| Clave de Anthropic | **Pendiente** (pegaste el identificador, no la clave) |
| Pantalla de la conversación, tarjetas, Tu espacio | **No existen** |
| Criterio del asesor, banco de pruebas, Personal Shopper | **No existen** |

El acceso (login) queda como está y no recibe más trabajo.

---

## 2. Pista A — Mesa de decisiones del asesor (tú y yo)

### 2.1 Por qué así

"Entrenar" al asesor no es ajustar el modelo: es **decidir, por escrito, cómo debe comportarse**, y medir si lo hace.
Lo que hoy tiene el asesor es un prompt que redactó un agente con criterio general. Lo que necesita es criterio **tuyo**:
qué hace ante cada situación, con qué prioridad y con qué límites.

### 2.2 El método: una ficha por decisión

Cada decisión del asesor se resuelve en una ficha corta. Yo llego con la ficha redactada y una recomendación; tú decides.

| Campo | Contenido |
|---|---|
| **Situación** | Cuándo el asesor enfrenta esta decisión |
| **Opciones** | 2 o 3 formas de resolverla, con lo que gana y pierde cada una |
| **Regla elegida** | Tu decisión, en una o dos frases que el asesor pueda seguir |
| **Ejemplos** | Una respuesta que queremos y una que no |
| **Casos de prueba** | 2 a 4 conversaciones que comprueban la regla |

Cada ficha aprobada produce tres cosas: una regla en el criterio del asesor (`web/src/lib/agent/knowledge/`), sus casos
en el banco de pruebas (`web/evals/`) y una entrada en `AGENT_ARCHITECTURE.md`. Nada queda solo en la conversación.

### 2.3 Las decisiones, por bloque

| # | Bloque | Las decisiones que contiene |
|---|---|---|
| **D1** | **Quién es el asesor** | Personalidad y voz; qué tan directo es; si tiene nombre; qué nunca dice |
| **D2** | **Cómo conversa** | Cuándo pregunta y cuándo propone; cuántas preguntas antes de dar valor; primera conversación; cuántas alternativas ofrece; largo de las respuestas |
| **D3** | **Cómo lee a la persona** | Qué pesa más cuando chocan gusto, paleta y ocasión; qué recuerda, qué no y cuándo lo dice; cómo trata el estilo al que la persona aspira |
| **D4** | **Qué hace con una foto** | Prenda propia, selfie, algo que evalúa comprar, foto ambigua, foto que no corresponde |
| **D5** | **Cómo arma un look** | Orden de decisión (ocasión → formalidad → clima → prenda ancla → color → proporción → calzado y accesorios); cuánto arriesga; cuánto repite prendas; cómo usa el clima |
| **D6** | **Cómo explica** | Estructura del porqué; cuánto tecnicismo; cómo habla de calce sin hablar del cuerpo |
| **D7** | **Cuando el clóset no alcanza** | Qué hace con 0, 2 o 5 prendas; cómo pide más; cómo describe la prenda faltante |
| **D8** | **Personal Shopper** | Cuándo sugiere comprar y cuándo dice "no compres"; cómo reparte un presupuesto; cómo compara alternativas; duplicados; en qué tiendas busca; cómo muestra precio y disponibilidad; neutralidad |
| **D9** | **Cómo aprende** | Qué hace con un "no me gusta"; cuándo generaliza un rechazo y cuándo no; cómo corrige un error suyo |
| **D10** | **Límites** | Cuerpo y autoestima; salud; menores de edad; compras y pagos; instrucciones escondidas en fotos o páginas; temas fuera de la asesoría |

D5 y D8 son las más largas y las que definen el producto: asesoría y compra.

### 2.4 El banco de pruebas

- **3 personas de prueba** con perfil, paleta y clóset descritos en datos. Corren en segundos, sin fotos ni Supabase.
- **Casos** que salen de las fichas, más los 10 pedidos de tu encargo original.
- **Medidas deterministas:** el look es válido, usa solo prendas que existen, respeta exclusiones y presupuesto, llamó a
  las herramientas esperadas, preguntó una sola cosa, no hizo nada prohibido, no inventó productos ni precios.
- **Medidas con juez** (otro modelo con una rúbrica que también apruebas tú): criterio estético, uso de la paleta,
  calidad del porqué, tono.
- **Rendimiento por caso:** tiempo al primer texto, tiempo hasta la tarjeta, tokens y costo.
- `npm run eval` entrega una tabla comparable entre corridas.

**Cada corrida gasta inferencia real.** Informo el costo de cada una antes de lanzar la siguiente.

### 2.5 Ciclo de mejora y rendimiento

1. Línea base con el criterio v1.
2. Leer fallas → cambiar una sola cosa → volver a correr → conservar o revertir.
3. Barrido de modelo y esfuerzo para elegir, con datos, la combinación más rápida y barata que mantiene la calidad.
4. Casos separados en ajuste y validación, para no sobreajustar a los ejemplos.

Rendimiento ya incorporado en la base: streaming, prompt en caché, visión con un modelo rápido, fotos comprimidas,
indicador de lo que el asesor está haciendo. Las metas en segundos se fijan con la línea base, no antes.

### 2.6 Personal Shopper

Un solo asesor con más herramientas (DP-18): `evaluate_purchase` (foto o link que tú mandas) y `search_products`
(búsqueda en vivo en una lista de tiendas chilenas, con link, precio visto y fecha). Nunca compra ni paga.
`search_products` espera tu aprobación A-01 y la lista de tiendas. El comportamiento lo define el bloque D8.

### 2.7 Orden de la Pista A

| Paso | Qué | Necesita |
|---|---|---|
| A1 | Probar la base contra Claude real: una conversación, una prenda, una paleta | Clave de Anthropic |
| A2 | Armar el banco de pruebas y las 3 personas | — |
| A3 | Fichas D1, D2 y D5 → criterio v1 → línea base | Tus decisiones |
| A4 | Fichas D8 y D4 → herramientas del shopper → casos | A-01 y lista de tiendas |
| A5 | Fichas D3, D6, D7, D9, D10 | Tus decisiones |
| A6 | Ciclo de mejora y barrido de modelo | Presupuesto de inferencia |
| A7 | Visión: reconocimiento de prendas y paleta con tus fotos | 30 a 50 fotos tuyas |
| A8 | Revisión del criterio por una asesora de imagen (supuesto S-08) | Antes de invitar testers |

---

## 3. Pista B — Equipo de interfaz, al estilo Prendie

### 3.1 Qué tomo de Prendie

Leí la nota del equipo de Prendie (`research/prendie-equipo-mausbot.md`) y sus aprendizajes. Lo que conservo:

- **Bots en OpenMausBot**, cada uno con sus instrucciones (SOUL), memoria, modelo y carpeta.
- **Modelo de autoridad v4:** el Productor decide lo operativo; tú defines objetivos y apruebas el entregable final.
- **La Torre como DevOps:** asigna la línea, entrega la rama, abre el PR y mergea solo con tu `/torre aprobado #N`, con el freno.
- **Optimización de consumo de Prendie (2026-11-09):** Sonnet 5.5 por defecto; Opus solo como validador o bajo demanda.
- **Un hilo nuevo por historia** en cada bot.

Lo que **no** replico: los dos Arquitectos con seis instancias (el contrato ya está definido), el Analista (los eventos
ya están en el contrato) y la segunda línea desde el día uno.

### 3.2 El equipo propuesto: 6 bots, una línea

| Bot | Hace | Modelo | No hace |
|---|---|---|---|
| **Productor** | Elige la historia, la refina, aprueba maqueta y plan, valida cada traspaso, zanja discrepancias, arma el paquete final | Sonnet 5.5 | Cambiar el contrato con la Pista A, tocar el asesor, aprobar el merge |
| **Diseño** | Maqueta HTML por historia con los tokens de `DESIGN.MD`; revisa la pantalla construida contra la maqueta | Sonnet 5.5 + validador Opus | Código de producción |
| **Constructor** | Construye la pantalla con subagentes; `verify` en verde | Sonnet 5.5 | Tocar `lib/agent`, `lib/ai`, el esquema o el contrato |
| **Revisor** | Revisión final de código contra spec y reglas del repo | Sonnet 5.5 | Corregir él mismo |
| **QA** | Humo en navegador a 390 px contra el asesor simulado; accesibilidad | Sonnet 5.5 | Aprobar |
| **DevOps (Torre)** | Línea, rama, PR, etiquetas, merge con tu aprobación, cierre | Sonnet 5.5 | Mergear sin `torre:aprobado` |

Un Arquitecto Opus **bajo demanda**, solo si una historia de interfaz exige cambiar el contrato o el esquema.
Segunda línea (otro Constructor) cuando la primera lleve dos historias mergeadas sin incidentes.

### 3.3 La frontera entre las dos pistas

| | Pista A (tú y yo) | Pista B (equipo) |
|---|---|---|
| **Dueña de** | `web/src/lib/agent/**`, `web/src/lib/ai/**`, `web/evals/**`, migraciones, `AGENT_ARCHITECTURE.md` | `web/src/app/**`, `web/src/components/**`, `docs/superpowers/mockups/**` |
| **Contrato compartido** | `web/src/lib/domain/types.ts` (eventos del chat, tarjetas) y `web/src/lib/client/api.ts` | Solo lectura |
| **Trabaja contra** | Claude real y el banco de pruebas | El **asesor simulado** (`AI_MODE=mock`): sin clave, sin gasto, determinista |

**Cambio de contrato:** cuando la Pista A necesita una tarjeta nueva (por ejemplo, alternativas de compra), publica el
tipo y actualiza el asesor simulado para que la emita; recién entonces el Productor abre la historia de interfaz. El
equipo nunca edita el contrato; lo pide.

Así las pistas no chocan en archivos y el equipo nunca queda bloqueado por una decisión nuestra a medias.

### 3.4 Historias del equipo, en orden

| # | Historia | Depende de |
|---|---|---|
| UI-1 | **El hilo**: mensajes del asesor y de la persona, streaming, indicador de herramienta, saludo inicial, scroll, accesibilidad | Contrato v1 (listo) |
| UI-2 | **Compositor**: texto, foto, respuestas sugeridas simples y múltiples, estados de envío y error | UI-1 |
| UI-3 | **Tarjetas del hilo**: look (guardar, "no es para mí", prenda faltante), prenda reconocida ("está bien", "corregir"), paleta, nota de memoria con "deshacer", consentimiento de selfie | UI-1 |
| UI-4 | **Tu espacio**: clóset con filtro y detalle de prenda, looks guardados, perfil y paleta, lo que el asesor sabe de ti, borrar la cuenta | UI-3 |
| UI-5 | **Tarjetas del shopper**: evaluación de una compra, alternativas con link, precio visto y fecha | Contrato del shopper (Pista A, paso A4) |
| UI-6 | **Pulido**: revisión con `impeccable`, AA, instalación como PWA, estados vacíos y de error | UI-1 a UI-4 |

### 3.5 Flujo de una historia

Productor elige y refina → Diseño hace la maqueta → Productor la aprueba → DevOps asigna línea y rama → Constructor
construye → Revisor, Diseño y QA revisan en paralelo → DevOps abre el PR con su sección de humo → **tú revisas en el
teléfono y dices `/torre aprobado #N`** → DevOps mergea y cierra.

Tu única intervención por historia es la aprobación final. Las migraciones no aplican: el equipo no toca el esquema.

### 3.6 Lo que cuesta instalarlo (honesto)

En Prendie la instalación fue una sesión propia más pasos tuyos en la app. Para este proyecto hace falta:

| Paso | Quién |
|---|---|
| Copiar la Torre de Prendie a `.claude/skills/torre/` y adaptarla (rutas, una línea, freno) | Una sesión de Claude |
| Importar al repo las skills que usan los bots (los bots no ven tus plugins ni tus skills globales) | Una sesión de Claude |
| Clon `ai-personal-stylist-torre` y carpeta de la línea 1 | Una sesión de Claude |
| Escribir los 6 SOUL y el archivo de equipo (`.mausteam.json`), versionados en `agentes/` | Una sesión de Claude |
| Importar el equipo en OpenMausBot y fijar el nivel de aprobación de cada bot | **Tú, en la app** |
| Humo del equipo con una historia pequeña (UI-1) | Equipo + tú |

No hace falta un Supabase por línea: el equipo trabaja contra el asesor simulado y el proyecto compartido, sin migraciones.

**Riesgos conocidos de Prendie que aplican:** nada corre con el Mac dormido; los bots consumen tu suscripción (el
diagnóstico del 9 de noviembre mostró que Opus en todo era el gasto principal, por eso aquí parte en Sonnet); un equipo
recién instalado necesita una o dos historias de rodaje antes de ser confiable.

---

## 4. Tu rol

| Pista | Qué haces | Cuánto |
|---|---|---|
| A | Decidir cada ficha; aprobar la rúbrica del juez; mirar los resultados del banco de pruebas | Lo central de tu tiempo |
| B | Definir el orden si quieres cambiarlo; revisar en el teléfono; `/torre aprobado #N` | Una aprobación por historia |

---

## 5. Hoy, hasta las 20:00

Instalar el equipo y usarlo el mismo día compite con el tiempo de la Pista A. Dos caminos:

| | Camino 1 — recomendado | Camino 2 |
|---|---|---|
| **Pista B hoy** | La interfaz la construyen subagentes de esta sesión, con los mismos roles y la misma frontera (cero instalación) | Se instala el equipo en OpenMausBot hoy y parte con UI-1 |
| **Equipo de bots** | Se prepara en una sesión aparte (Torre, skills, SOUL, archivo de equipo) y toma el relevo desde UI-4 o mañana | Operativo hoy, tras su rodaje |
| **Pista A hoy** | A1, A2, A3 completos y A4 empezado | A1 y A2; A3 parcial |
| **Al cierre** | Conversación usable con hilo, compositor y tarjetas; criterio v1 medido | Equipo instalado y probado; menos avance en el asesor |

En ambos el banco de pruebas no se recorta.

---

## 6. Decisiones que necesito

| # | Decisión | Mi recomendación |
|---|---|---|
| 1 | ¿Apruebas las dos pistas y su frontera? | Sí |
| 2 | Camino 1 o Camino 2 para hoy | Camino 1 |
| 3 | Composición del equipo: 6 bots, una línea, Sonnet por defecto | Sí; segunda línea tras dos historias limpias |
| 4 | A-01: ¿el asesor puede buscar en vivo en tiendas chilenas? ¿En cuáles? | Sí, con 5 a 8 tiendas que elijas |
| 5 | Presupuesto de inferencia para el banco de pruebas | Tope en la consola de Anthropic |
| 6 | Clave de Anthropic válida (`sk-ant-api03-…`) | Desbloquea A1 |
| 7 | ¿Tienes una asesora de imagen para validar el criterio? | Antes de invitar testers |
| 8 | Fotos de 30 a 50 prendas tuyas | Puede ser mañana |
