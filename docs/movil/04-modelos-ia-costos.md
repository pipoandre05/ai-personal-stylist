# 04 · Modelos de IA del asesor: costo, latencia y proveedores

> 2026-11-27 · **Alcance corregido por Felipe:** se optimiza el **asesor en producción**, el agente que conversa con la
> persona y arma los looks. No se refiere a los bots de desarrollo (eso queda en el §7).
> **No se cambió ningún modelo, prompt ni credencial, y no se llamó a ningún modelo.**
> Código leído en `origin/main` @ `39916d4`. Método: guía de optimización de costos de la skill `claude-api`.
> Detalle: `investigacion/asesor-runtime.md`.
> Precios oficiales consultados el 2026-11-27 en `platform.claude.com/docs/en/about-claude/pricing.md` y
> `.../optimizing-for-cost-and-intelligence.md`.

## 1. Punto de partida

| | A · Turno de chat (bucle con herramientas) | B · Etiquetar prenda | C · Paleta desde selfie |
|---|---|---|---|
| Dónde | `lib/agent/run.ts` ← `/api/chat` | `lib/ai/vision.ts` ← `/api/garments` y herramienta `add_garment` | `analyzeColor` ← `/api/color-analysis` y `analyze_palette` |
| Modelo | `STYLIST_MODEL`, por defecto **Opus 5.5** (US$4 / 0,20 caché / 20) | `VISION_MODEL`, por defecto **Haiku 5.5** (0,10 / 0,50) | Haiku 5.5 |
| Effort | `low` por defecto (ya es el mínimo); el pensamiento de Opus 5.5 no se puede apagar | `low` | `low` |
| Llamadas | 1 a 6 por turno; un look típico hace 4 o 5, **con las herramientas en serie** | 1 | 1 |
| Prefijo fijo | ~6,5–7k tokens: system con las 40 tiendas (~3,6k) + 11 herramientas | ~350 + esquema | similar a B |
| Caché | **Un solo punto de caché, sobre el system.** Nada en la cola del bucle: cada vuelta vuelve a pagar a tarifa completa el historial, la foto y los resultados de herramientas | ninguna | ninguna |
| Latencia medida | look ~33 s · búsqueda ~24 s · respuesta simple ~20 s (revisión del 2026-11-14) | — | — |

**Lo que falta para decidir con datos:**

- **No hay eval ejecutable.** No existe `web/evals/`, y T-17, T-18 y BF-11 están pendientes. Sin un eval no se puede
  distinguir un ahorro de una regresión. Por eso todo cambio de modelo queda en "necesita eval".
- **No hay costo medido.** `ai_usage` registra tokens por llamada, pero no tiene id de turno, vuelta del bucle,
  latencia ni `stop_reason`, así que no se puede calcular el costo por turno.
- **Estimación ilustrativa, no medida:** un turno de look cuesta ≈ US$0,10–0,30 en Opus. El dinero se va en el bucle,
  donde se re-factura la entrada sin caché en cada vuelta.
- ⚠ **No leí los valores reales de `STYLIST_MODEL` y `STYLIST_EFFORT` en Vercel.** El análisis supone los valores por
  defecto.

## 2. Palancas, ordenadas por techo de ahorro

> Ordenado por techo de ahorro, **no** por orden de aplicación.

| Palanca | Tipo | Techo | Ayuda a la latencia | Necesita eval |
|---|---|---|---|---|
| **Caché de la cola del bucle** (caché automática de nivel superior además del punto actual) | Gratis, sin pérdida de calidad | **El mayor.** La guía oficial mide Opus 5.5 3,3× más caro sin caché | Sí: baja el tiempo al primer token en las vueltas 2 a 6 | No (se mide costo) |
| **Ruteo por turno:** respuestas simples y onboarding en Sonnet 5.5 o Haiku 5.5; look, evento y compra en Opus 5.5 | Tradeoff | Grande | Sí: los turnos simples bajan de ~20 s | **Sí** |
| Todo el asesor en Sonnet 5.5 | Tradeoff | Grande, con el mayor riesgo. Según la guía, Opus en `low` ≈ Sonnet en su default, por ~7 % más por tarea resuelta | Algo | **Sí** |
| Herramientas de solo lectura en paralelo (`Promise.all`) y prefetch de `get_closet(formality)` y `get_weather` | Latencia primero, ahorro medio | Medio | **Mucho**: es la palanca principal contra los 33 s | Prefetch sí; paralelo no |
| Foto en el chat: Haiku la describe y Opus recibe la ficha en texto | Tradeoff | Medio (una foto le cuesta ~50× más a Opus que a Haiku) | Algo | **Sí** |
| Caché de 1 h en el system | Gratis | Medio-bajo: solo paga si las conversaciones se separan entre 5 y 60 min | — | No |
| Recortar `get_closet` (solo prendas que califican, menos campos) | Gratis | Pequeño-medio | Algo | No |
| Corregir D-12 (texto duplicado en la respuesta) | Gratis | Pequeño | Algo | No |

**Descartadas, con su razón:**

| Palanca | Por qué no |
|---|---|
| Batch | La persona espera la respuesta, y la visión ya es casi gratis |
| Bajar effort | Ya está en `low` |
| Compaction y context editing | El bucle tiene ≤ 6 vueltas y el historial un tope de 20 mensajes |
| Tool search | Los esquemas suman menos de 10k tokens |
| Advisor y orquestador | No hay una señal barata para decidir cuándo consultar, y el turno es una sola cadena dependiente (DT-06) |
| Cambiar de modelo **dentro** de un turno | Rompe la caché y el pensamiento preservado de Opus. Se cambia entre turnos, no adentro |
| Fast mode de Opus | Cuesta el doble. Solo se considera si la latencia sigue mal después de lo demás |

## 3. Proveedores alternativos (incluido DeepSeek)

| Proveedor | Chat (A) | Prenda (B) | Selfie (C) | Veredicto |
|---|---|---|---|---|
| **Anthropic** (hoy) | Opus, Sonnet o Haiku según el turno | Haiku 5.5 | Haiku 5.5 | **Se queda** |
| DeepSeek V4.1 Flash | Cuesta igual o más que Haiku 5.5 (0,15–0,30 / 0,60–1,20 contra 0,10 / 0,50), con una señal agéntica parecida y débil para este caso | No conviene | **Nunca**: es un rostro y la app promete que la foto no se guarda | **Descartar** |
| DeepSeek V4 Pro | No procesa imágenes, y el chat lleva fotos | — | — | **Descartar** |
| OpenAI · Gemini · Kimi | Ninguno es más barato que Haiku 5.5 en el tramo chico, y Kimi cuesta como Sonnet | Igual o más caro | Transferencia internacional | No compensa reescribir `run.ts` y `vision.ts` |

**Por qué DeepSeek no conviene para el asesor:**

- **Datos personales:** el asesor ve fotos del clóset, selfies, eventos y memoria de la persona. DeepSeek almacena en
  China, menciona el entrenamiento como fin y no fija plazo de retención.
- **Ley chilena:** la Ley 21.719 exige garantías para transferir datos a países sin nivel adecuado. La Ley 21.855
  (Diario Oficial, 2026-11-23) posterga su vigencia al **2027-10-15** sin cambiar las obligaciones. ⚠ Confirmar en
  LeyChile.
- **Funciones:** su endpoint compatible con Anthropic ignora `cache_control`, y la caché es justamente la palanca
  principal.
- **Estabilidad:** 19 caídas mayores en 2026.
- **Precio:** ni siquiera es más barato que Haiku 5.5.

**Costo de cambiar de proveedor:** el código usa `@anthropic-ai/sdk` directo. Cambiar exige un adaptador que mantenga
`AI_MODE=mock`, `fallbacks`, salidas estructuradas y la herramienta `strict`. Ese es trabajo nuevo que hoy no se paga solo.

## 4. Enrutamiento propuesto para el asesor

| Tipo de turno | Modelo | Por qué |
|---|---|---|
| Onboarding, preguntas cortas, aclaraciones, "gracias" | Sonnet 5.5 en `low`; Haiku 5.5 si el eval lo permite | Bajo riesgo y alto volumen. Es la mejora directa de latencia |
| Look para una ocasión, evento, "¿qué me pongo?", compra | **Opus 5.5 en `low`** (como hoy) | Es el caso que manda (DP-19). La calidad es el producto |
| Foto en el chat | Haiku describe y el turno sigue en su modelo con la ficha en texto | Ahorra visión cara sin perder contexto |
| Etiquetar prenda y paleta | Haiku 5.5 (como hoy) | Ya está en el piso de costo |
| **Respaldo** | `fallbacks: "default"` del lado del servidor (ya activo como beta) | Cubre los rechazos del modelo. Ante una caída de Anthropic, la app muestra el mensaje de reintento que ya existe |

**Cómo se decide el tipo de turno:** por la `intent` que ya manda la interfaz (chips, sugerencias) y por el estado de
la conversación (onboarding, evento en curso). **No** con un clasificador LLM adicional, que costaría y sumaría latencia.
El modelo se fija **al inicio del turno** y no cambia dentro de él.

**Control de costos:**
- Tope diario por persona (`chatDailyLimit`, ya existe).
- `ai_usage` con costo calculado por turno.
- Alerta si el costo por persona activa al día supera un umbral que Felipe fija (A-03).
- Un workspace o key de Anthropic solo para producción, con tope de gasto mensual.

## 5. Plan de trabajo, en orden de aplicación (un diff por palanca)

| # | Paso | Tipo | Gasta inferencia | Aprobación |
|---|---|---|---|---|
| 1 | `ai_usage` con `turn_id`, vuelta, latencia, `stop_reason` y costo calculado | Medición | No | Rama `feat/`, revisión normal |
| 2 | Caché de la cola del bucle | Gratis | Sí, para verificar la caché (centavos) | Sí |
| 3 | Herramientas de solo lectura en paralelo | Latencia | No | Revisión normal |
| 4 | Caché de 1 h · recorte de `get_closet` · D-12 | Gratis | Centavos | Sí |
| 5 | **Eval mínimo** (abajo) | Medición | **≈ US$35–65** (+ ≈ US$20 para confirmar las finalistas) | **Sí: presupuesto** |
| 6 | Prefetch · Haiku para fotos en el chat | Tradeoff | Dentro del presupuesto del eval | Según el eval |
| 7 | Ruteo por turno (Sonnet o Haiku en turnos simples) | Tradeoff | Dentro del presupuesto del eval | Según el eval |

**Eval mínimo, armado con tareas reales del proyecto:**

- **30 entradas congeladas:**
  - 6 del caso que manda: alcanza, falta una pieza, sin base de gala, "sí, búscame", con presupuesto.
  - 6 de uso diario.
  - 6 adversariales: DP-09, DP-12, inyección en un link, salud, clima caído, clóset mínimo.
  - 8 fotos de prenda (incluida una que no es prenda y una con texto inyectado).
  - 4 selfies (luz buena, luz mala, sin rostro).
- **Juicio automático sobre la traza:**
  - prendas solo de la persona;
  - composición [top+bottom] o [dress];
  - `get_closet` con formalidad en los eventos;
  - nunca `search_products` sin autorización;
  - sin precios ni URLs inventados, sin lenguaje de cuerpo fuera de calce y proporción, sin emoji;
  - porqué presente (DP-11).
- **Felipe** califica estilismo y voz de 1 a 3, a ciegas.
- **Corridas:** 3 por configuración: actual, actual + caché, Opus `medium`, Sonnet, Haiku.
- **Regla para adoptar:** tasa de aprobación igual o mejor que la actual, cero violaciones de DP-09 o DP-12, y costo
  por turno resuelto **menor**. Se informa también el p50 y el p90 de latencia.
- Es la misma base que BF-11 y T-17: no es trabajo perdido.

**Riesgo detectado:** el timeout del cliente Claude (50 s × 2 reintentos) choca con `maxDuration = 60` de Vercel. Un
turno lento puede cortarse sin reintentar. Lo baja el paso 3.

## 6. Decisiones pendientes de Felipe

| # | Decisión | Recomendación |
|---|---|---|
| IA-1 | Compartir una semana de `ai_usage` de producción (dashboard de Supabase) y los valores de `STYLIST_MODEL` y `STYLIST_EFFORT` en Vercel | Sí: es la línea base |
| IA-2 | Pasos 1 a 4 (medición, caché, paralelo y gratis) | Sí. No cambian la calidad y bajan costo y latencia |
| IA-3 | Presupuesto del eval: ≈ US$35–85 | Sí. Habilita todo cambio de modelo |
| IA-4 | Descartar DeepSeek, Kimi y otros proveedores para el asesor | Sí, por datos personales, ley y precio |
| IA-5 | Ruteo por turno | Decidir con el resultado del eval |

## 7. Bots de desarrollo (secundario)

El análisis de los bots de OpenMausBot se conserva en `investigacion/modelos-ia-bots.md`. En resumen:

- Pasar QA, DevOps y lo rutinario del Productor a Haiku 5.5 ahorraría 36–47 % si se pagan por token.
- Si los bots corren con la cuota del plan Max, el ahorro es en cuota, no en dólares.
- Queda fuera del alcance prioritario por decisión de Felipe.
