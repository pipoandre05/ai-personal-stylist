# DTR — AI Personal Stylist

**Documento Técnico de Requerimientos · documento maestro del proyecto**

| | |
|---|---|
| Versión | 0.1 (2026-11-14) — Inception |
| Estado | Vivo. Cambia el alcance → sube la versión y se anota en §28.4 |
| Dueño | Felipe León (decisiones) · sesión integradora (redacción) |
| Repo | `pipoandre05/ai-personal-stylist` (privado) · código en `web/` |
| Nombre provisional en la UI | **Estilo** (DP-15) |

## Cómo leer este documento

El DTR es el **índice con criterio**: contiene la estrategia, el alcance y las reglas, y delega el detalle a un único
documento dueño por tema. Nada se define dos veces.

| Tema | Dueño |
|---|---|
| Decisiones, supuestos, hipótesis, aprobaciones pendientes | [`DECISION_LOG.md`](DECISION_LOG.md) — **si algo lo contradice, gana el log** |
| Épicas, historias, criterios de aceptación, NFR como ítems | [`PRODUCT_BACKLOG.md`](PRODUCT_BACKLOG.md) |
| Specs funcionales por feature | [`FUNCTIONAL_SPECS.md`](FUNCTIONAL_SPECS.md) |
| Componentes, contratos API, seguridad, despliegue | [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md) |
| Agente: herramientas, prompt, memoria, evals | [`AGENT_ARCHITECTURE.md`](AGENT_ARCHITECTURE.md) |
| Entidades y relaciones | [`DATA_MODEL.md`](DATA_MODEL.md) + `web/supabase/migrations/` (fuente de verdad) |
| Dirección visual, sistema de diseño, pantallas | [`UX_UI_SPEC.md`](UX_UI_SPEC.md) + `DESIGN.MD` (raíz) |
| Calidad | [`QA_STRATEGY.md`](QA_STRATEGY.md) |
| Plan de hoy | [`EXECUTION_PLAN_2000.md`](EXECUTION_PLAN_2000.md) |
| Investigación de mercado | [`research/contexto_asesor_imagen_personal_shopper.md`](research/contexto_asesor_imagen_personal_shopper.md) |

`PRODUCT_VISION.md` y `MVP_SCOPE.md` no existen como archivos: su contenido es §2–§11 de este documento. Separarlos
habría duplicado visión y alcance en tres lugares.

**Convención de origen.** **[INV]** viene de la investigación de Perplexity (con su sección). **[PS]** es conclusión de
Product Strategy de esta sesión. Los IDs `DP-xx` / `DT-xx` son decisiones, `S-xx` supuestos, `H-xx` hipótesis y `A-xx`
aprobaciones pendientes, todos definidos en el `DECISION_LOG.md`.

**Trazabilidad.** Objetivo (§2) → requerimiento `RF-xx` (§10) → épica `E-x` e historia `E4-H03` (backlog) → spec
`SPEC-xx` → criterios de aceptación → casos de QA. Un RF sin historia, o una historia sin RF, es un defecto del documento.

---

## 1. Resumen ejecutivo

Construimos un **Asesor de Imagen Digital con Personal Shopper integrado**: una PWA mobile-first donde un agente de IA
conoce progresivamente el estilo, la paleta de color y el clóset real de una persona, y la acompaña a decidir **qué
ponerse** y, después, **qué vale la pena comprar**. La unidad de valor es el **outfit completo para una ocasión** (DP-02).

- **Por qué este producto** [INV §2, §8–9]: un agente de compras generalista compite contra Amazon, Google, OpenAI, Meta
  y Mercado Libre. La asesoría de imagen compite en otro terreno —confianza, criterio y clóset— donde ninguno de ellos
  integra perfil, colorimetría, clóset y compra local.
- **Cuña del MVP** [PS, DP-04]: "¿Qué me pongo?" con el clóset real. Es el caso más frecuente y el único que no depende
  de catálogos de terceros, la dependencia más riesgosa de la investigación.
- **Qué cambia respecto de la investigación**: canal PWA en vez de WhatsApp-first (DP-03, decisión de Felipe);
  colorimetría preliminar adelantada al MVP (DP-05); productos reales del Personal Shopper diferidos a V1.1 por falta
  de acceso a catálogos (DP-07).
- **Arquitectura** (DT-01…DT-08): Next.js 16 + Supabase con RLS + Claude API. Un solo agente orquestador con cuatro
  herramientas; visión de prendas y colorimetría como funciones de una llamada.
- **Hoy** (§28): un flujo vertical funcional —cuenta, onboarding, paleta preliminar, primeras prendas, primer outfit
  explicado, chat con el asesor, guardar y feedback— instalable como PWA.
- **Lo que no sabemos** (§26): disposición a digitalizar el clóset, calidad percibida del reconocimiento y de la paleta,
  costo de inferencia por persona, y si la PWA basta sin WhatsApp.

## 2. Visión y objetivos

**Visión** [INV §10]. Ser el asesor de imagen personal de referencia en Chile y Latinoamérica: un agente que entiende
el estilo, la paleta, el presupuesto y el clóset de cada persona; le ayuda a decidir qué ponerse, qué comprar, cómo
combinarlo y dónde adquirirlo.

**Promesa** [INV §1]. "Te ayudo a verte como quieres verte, con lo que ya tienes y con lo que realmente vale la pena comprar."

**Objetivos del MVP** (cada uno se mide en §25):

| ID | Objetivo | Se responde con |
|---|---|---|
| O-1 | Demostrar que una persona obtiene un outfit que percibe útil en su **primera sesión** | Activación |
| O-2 | Demostrar que las personas **digitalizan** suficiente clóset para que el asesor sirva | H-01, prendas por persona |
| O-3 | Demostrar que la asesoría **no es genérica**: usa perfil, paleta, clima y memoria, y explica el porqué | Feedback por outfit, evals del agente |
| O-4 | Generar **hábito**: la persona vuelve a preguntar qué ponerse | North Star, retención semanal |
| O-5 | Aprender qué ocasión y qué compra generan urgencia, antes de integrar catálogos | H-02, H-03, prendas faltantes detectadas |

No son objetivos del MVP: ingresos, afiliación, crecimiento ni cobertura de retailers (DP-14).

## 3. Problema y oportunidad

**Problemas que resuelve** [INV §2]: "tengo ropa, pero no sé qué ponerme"; "no sé qué colores o cortes me favorecen";
"compro ropa que después no uso"; "repito los mismos outfits"; "quiero mejorar mi imagen, pero no puedo pagar un
estilista"; "no sé qué comprar para una boda, entrevista, viaje o cita"; "compro cosas parecidas a las que ya tengo".

**Oportunidad** [INV §5, §8]. La matriz de funcionalidades de la investigación marca como *diferenciador central* —y
sin dueño claro— cuatro capacidades: perfil de imagen y estilo, análisis de colorimetría, clóset digital y detección de
vacíos del guardarropa. Los grandes agentes de compra resuelven descubrimiento y transacción; las apps de clóset
organizan pero asesoran poco y casi no cierran compra local.

**Lectura de Product Strategy** [PS]. La defensa del producto no es "tener IA" sino **la memoria acumulada de una
persona**: su clóset digitalizado, su paleta y su historial de aciertos y rechazos. Ese activo no lo tiene un buscador y
sube el costo de cambiarse. Por eso el MVP prioriza construir ese activo (clóset + feedback) antes que el catálogo.

## 4. Investigación de mercado

Resumen; el detalle y las fuentes están en la investigación (§3, §7, §16).

- **Global** [INV §3]: el mercado evolucionó de chatbots de recomendación a *agentic commerce* (investigar, comparar,
  armar carritos y, en algunos casos, comprar con autorización).
- **Chile** [INV §7]: alta penetración digital, retailers consolidados, adopción de WhatsApp y un e-commerce relevante.
  Las estimaciones públicas difieren por metodología (US$15.800 millones según una; US$10.600 millones según la Cámara
  de Comercio de Santiago, ambas para 2026). **No se usan como base de ninguna proyección propia.**
- **Barreras locales** [INV §7]: catálogos inconsistentes, stock y precio en tiempo real, despacho y devoluciones,
  dependencia de marketplaces (Mercado Libre no permite agentes externos), confianza, tallas y calce.
- **Canal** [INV §7]: la investigación recomienda WhatsApp como canal principal y la app como capa de profundidad.
  Decisión tomada en contra para el MVP: DP-03; hipótesis abierta: H-07.

## 5. Benchmark

Detalle por competidor en [INV §4–§6]. Lo que este producto toma y lo que evita:

| Referente | Qué replicar | Qué mejorar / evitar |
|---|---|---|
| Amazon (Rufus, Buy for Me) | Continuidad, explicación de la recomendación | Ecosistema cerrado |
| Perplexity Shopping | Comparación clara con fuentes y razones | Depende de feeds; sin clóset |
| Meta Muse / Style Sketch | Español local, tareas cotidianas, aprobación explícita antes de pagar; clóset desde fotos | Neutralidad, asesoría experta, control del usuario |
| Mercado Libre | Señales de confiabilidad, logística | No abre inventario a agentes externos |
| Style DNA | Paleta desde selfie como gancho de entrada | Débil en ejecución de compra |
| Whering / Acloset / Indyx | Digitalización y outfits diarios | Poca asesoría experta, poco cierre de compra |
| Essembl | Combinar prendas nuevas con las existentes | **Competidor más cercano**: superarlo en experiencia y comercio local |
| J.Crew Style Advisor | Outfit completo por ocasión con criterio editorial | No es neutral: catálogo propio |

**Conclusión** [PS]: nadie del benchmark junta, para Chile, perfil + paleta + clóset + outfit explicado + compra local
neutral. El riesgo competitivo real es Meta (Style Sketch + WhatsApp + Muse ya en México) y Essembl.

## 6. Segmentos y personas

**Segmento inicial** [INV §9–10, DP-13]: personas de 25 a 45 años, urbanas (Santiago), digitalmente activas, con vida
social y profesional activa, presupuesto medio, que compran ropa online y quieren **comprar menos, pero mejor**.

Personas de trabajo. Son **hipótesis de diseño [PS]**, no resultado de entrevistas; se validan en el piloto.

| Persona | Situación | Lo que más le duele | Primer valor |
|---|---|---|---|
| **Camila, 32** — profesional, oficina híbrida | Clóset lleno, usa siempre lo mismo | "Tengo ropa y no sé qué ponerme" | Outfit diario con lo que ya tiene |
| **Matías, 38** — cambió de rol, quiere verse más profesional | No sabe qué le favorece ni por dónde partir | "Quiero mejorar mi imagen sin pagar un estilista" | Paleta + plan de renovación gradual |
| **Fernanda, 28** — vida social intensa, presupuesto acotado | Compra por impulso para cada evento | "Compro cosas que después no uso" | Look para el evento con una sola compra justificada |

## 7. Jobs to Be Done

| ID | Cuando… | quiero… | para… | RF |
|---|---|---|---|---|
| JTBD-1 | me visto en la mañana o planifico mañana | que me propongan un look con mi ropa, según clima y ocasión | salir rápido y sentirme bien | RF-08, 09, 10, 13 |
| JTBD-2 | tengo una ocasión importante | saber qué ponerme y qué me falta | llegar con confianza sin comprar de más | RF-09, 12 |
| JTBD-3 | no sé qué me favorece | entender mis colores y mi estilo | elegir con criterio propio | RF-03, 04, 05 |
| JTBD-4 | estoy por comprar algo | saber si combina con lo que tengo y si ya tengo algo parecido | no arrepentirme | RF-17, 22 |
| JTBD-5 | quiero renovar mi clóset con presupuesto | saber qué piezas desbloquean más outfits y dónde comprarlas | gastar en lo que vale la pena | RF-12, 18, 24 |
| JTBD-6 | comparto fotos mías | controlar qué se guarda y poder borrarlo | confiar en el producto | RF-02 |

## 8. Propuesta de valor

"Dime la ocasión; te propongo un look con lo que ya tienes, te explico por qué funciona, te digo qué te falta y
—cuando haya catálogo— dónde comprarlo." [INV §10, adaptado al alcance del MVP]

| Frente a | Diferencia |
|---|---|
| Un buscador de moda con IA | Parte de la persona y su clóset, no de un catálogo [INV §2] |
| Una app de clóset | Asesora con criterio y explica; no solo organiza |
| Un estilista de retailer | Es neutral: no gana por recomendar una tienda (DP-10) |
| Un estilista humano | Disponible a diario y a un costo que no es de lujo |

## 9. Principios de producto

1. **Outfit, no prenda** (DP-02). Hasta una compra se muestra dentro de un look.
2. **Primero lo que ya tienes.** La compra es la última respuesta, no la primera.
3. **Siempre el porqué** (DP-11). Una recomendación sin explicación no se muestra.
4. **Valor antes que esfuerzo** (DP-06). Nunca se pide digitalizar "todo" para empezar.
5. **Honestidad sobre la precisión** (DP-05). La paleta es orientación; el reconocimiento se puede corregir.
6. **La persona manda.** Ve lo que el asesor sabe de ella, lo corrige y lo borra. Nunca se compra ni paga sin su autorización (DP-09).
7. **Neutralidad visible** (DP-10). Toda relación comercial se muestra.
8. **Respeto por el cuerpo** (DP-12). Calce y proporción; nunca defectos.
9. **Aprende de cada respuesta.** Un "no es para mí" vale tanto como un "me encanta".

## 10. Alcance funcional

Requerimientos funcionales por versión. El detalle (historias y criterios) está en el backlog; la spec, en `FUNCTIONAL_SPECS.md`.

| RF | Requerimiento | Épica | Versión |
|---|---|---|---|
| RF-01 | Registro e inicio de sesión con email y contraseña; sesión persistente | E1 | MVP · hoy |
| RF-02 | Consentimiento granular y control de datos: ver memoria, borrar todo | E1 | MVP · hoy parcial |
| RF-03 | Onboarding conversacional progresivo (≤ 6 pasos, saltables) | E2 | MVP · hoy |
| RF-04 | Perfil de imagen visible y editable | E2 | MVP · hoy básico |
| RF-05 | Paleta preliminar desde selfie, con confianza, aviso de iluminación y corrección | E3 | MVP · hoy |
| RF-06 | Alta de prenda por foto con reconocimiento automático y corrección manual | E4 | MVP · hoy |
| RF-07 | Galería del clóset con filtro por categoría, favoritos y archivado | E4 | MVP · hoy |
| RF-08 | Chat con el agente: streaming, memoria del perfil, historial | E5 | MVP · hoy |
| RF-09 | Generación de outfit para una ocasión con explicación | E6 | MVP · hoy |
| RF-10 | Tarjeta visual del outfit con las fotos reales de las prendas | E6 | MVP · hoy |
| RF-11 | Guardar, descartar y dar feedback; el feedback alimenta la memoria | E6 | MVP · hoy |
| RF-12 | Detección de la prenda faltante | E7 | MVP · hoy |
| RF-13 | Clima de la ciudad del perfil en la recomendación | E5 | MVP |
| RF-14 | PWA instalable, mobile-first | E8 | MVP · hoy |
| RF-15 | Eventos de producto para activación y North Star | E8 | MVP · hoy básico |
| RF-16 | Foto dentro del chat ("combina este pantalón", "¿este color me favorece?") | E5 | MVP |
| RF-17 | "¿Vale la pena comprar esto?" sobre un link o foto | E7 | V1.1 |
| RF-18 | Búsqueda de productos en vivo con citas en dominios chilenos | E7 | V1.1 (A-01) |
| RF-19 | Magic link / OTP con SMTP propio | E1 | V1.1 |
| RF-20 | Planificación semanal y de viajes | E9 | V2 |
| RF-21 | Registro de uso, prendas sin uso, costo por uso | E9 | V2 |
| RF-22 | Detección de duplicados en el clóset y antes de comprar | E4/E7 | V2 |
| RF-23 | Colorimetría profunda y proporciones, con consentimiento específico | E3 | V2 |
| RF-24 | Catálogo multi-retailer; precio final, despacho, devoluciones | E7 | V2 |
| RF-25 | Canal WhatsApp sobre el mismo agente | E10 | V2 |
| RF-26 | Try-on básico / imagen generada del look | E6 | V2 |
| RF-27 | Suscripción premium | E8 | V2 |
| RF-28 | Compra asistida dentro del chat, siempre con autorización explícita | E7 | V3 |
| RF-29 | Avatar y try-on avanzado | E6 | V3 |
| RF-30 | Expansión LatAm | E10 | V3 |
| RF-31 | Plataforma B2B2C para retailers | E10 | V3 |

**Cobertura de los dominios del encargo:**

| Dominio | MVP | V1.1 | V2+ |
|---|---|---|---|
| A. Onboarding y perfil | Conversacional con chips; perfil editable; aprende por feedback | — | Referencias visuales e inspiración; fotos aspiracionales |
| B. Colorimetría | Paleta preliminar con confianza y corrección | Se aplica a la evaluación de compras | Análisis profundo (RF-23) |
| C. Asesoría de imagen | Looks por ocasión con porqué; profesional, casual, citas, eventos | Renovación de estilo con presupuesto | Viajes, plan semanal |
| D. Clóset digital | Foto por prenda, reconocimiento, corrección, favoritos, archivado | — | Uso, sin uso, duplicados, video, importación |
| E. Agente conversacional | Texto, memoria, clima, herramientas; foto en chat (RF-16) | Evaluar compra | WhatsApp, anticipación |
| F. Personal Shopper | Prenda faltante descrita | Link/foto del usuario + búsqueda con citas | Catálogo, precio final, alertas |
| G. Visualización | Tarjeta con fotos reales | Comparar alternativas | Imagen generada, try-on |

## 11. Fuera de alcance

Fuera del MVP, con la razón:

| Qué | Por qué | Vuelve en |
|---|---|---|
| Productos reales, links de compra, afiliación | No hay acceso a catálogos; requiere A-01 | V1.1 / V2 |
| Try-on fotorrealista y generación de imágenes | Riesgo crítico de calidad [INV §14]; no puede ser dependencia | V2 / V3 |
| Compra o pago dentro del producto | DP-09 | V3, solo con autorización explícita |
| Canal WhatsApp | DP-03 | V2 |
| Notificaciones push y modo offline | DT-10: el valor depende del agente | V2 (hábito) |
| Video del clóset, varias prendas por foto, importar compras del correo | DP-06: primero validar una foto por prenda | V2 |
| Medidas corporales, análisis de silueta desde fotos | DP-12, minimización de datos | V2 con consentimiento específico |
| Maquillaje, cabello, skincare | [INV §13] | No planificado |
| Monetización, planes, pagos | DP-14 | V2 |
| Asesoría humana, comercio social, marketplace propio | [INV §13] | V2+ / no planificado |
| GA4/GTM, SEO de captación | DT-12: piloto cerrado | Al abrir a público |

## 12. Arquitectura de información

Cuatro pestañas: **Asesor · Clóset · Looks · Yo**. El encargo proponía ocho secciones; se pliegan así [PS]:

| Sección del encargo | Dónde vive | Razón |
|---|---|---|
| Home / Mi asesor | **Asesor** (`/asesor`) | El inicio *es* la conversación: saludo, clima, atajos de ocasión |
| Mi perfil de imagen | **Yo** (`/yo`) | Se consulta poco; lo mantiene el asesor |
| Mi colorimetría | **Yo** → `/yo/paleta` | Es parte de la identidad, no una herramienta diaria |
| Mi clóset | **Clóset** (`/closet`) | Activo central, entrada directa |
| Mis outfits · Historial y favoritos | **Looks** (`/looks`) | Un solo lugar para lo guardado y lo propuesto |
| Personal Shopper | Dentro del chat y de cada look | Decisión DP-02: la compra existe en función de un outfit |
| Configuración y privacidad | **Yo** | Junto a "lo que el asesor sabe de mí" |

Rutas, acceso y protección: `TECHNICAL_ARCHITECTURE.md`. Pantallas y componentes: `UX_UI_SPEC.md`.

## 13. Journeys

Paso a paso y estados en `UX_UI_SPEC.md`. Resumen:

| ID | Journey | Momento de valor | RF |
|---|---|---|---|
| J1 | **Primera vez**: portada → cuenta → onboarding → paleta → primeras prendas → primer outfit | Primer look explicado, en la primera sesión | 01, 03, 05, 06, 09, 10 |
| J2 | **Diario**: "¿Qué me pongo mañana?" → look con clima → guardar o pedir otro | Decisión en menos de un minuto | 08, 09, 11, 13 |
| J3 | **Agregar prenda**: foto → reconocimiento → confirmar o corregir | La prenda queda disponible para el asesor de inmediato | 06, 07 |
| J4 | **Ocasión especial**: "Tengo una boda el sábado" → look con lo propio + prenda faltante | Saber exactamente qué falta y por qué | 09, 12 (→ 17, 18) |
| J5 | **Control**: ver lo que el asesor sabe → borrar un hecho → borrar todo | Confianza | 02 |

## 14. Especificaciones funcionales

→ [`FUNCTIONAL_SPECS.md`](FUNCTIONAL_SPECS.md). Una spec por feature del MVP y V1.1, con objetivo, contexto, problema,
flujos, reglas de negocio, estados, validaciones, errores, criterios de aceptación, dependencias y consideraciones de
UX y técnicas.

Reglas de negocio transversales (valen para toda spec):

| ID | Regla |
|---|---|
| RN-G1 | Un outfit se compone de al menos [parte de arriba + parte de abajo] o [vestido/enterito]; máximo un calzado y un abrigo; entre 2 y 6 prendas; todas de la persona. Se valida en el servidor. |
| RN-G2 | Con menos de 3 prendas listas el asesor no inventa un outfit: lo dice y pide la prenda que falta. |
| RN-G3 | Toda recomendación lleva su porqué en lenguaje llano (DP-11). |
| RN-G4 | La paleta siempre muestra su nivel de confianza y cómo corregirla (DP-05). |
| RN-G5 | Ninguna acción de compra o pago se ejecuta desde el producto (DP-09). |
| RN-G6 | El asesor no comenta el cuerpo salvo que la persona lo pida; entonces habla de calce y proporción (DP-12). |
| RN-G7 | Un feedback negativo con motivo se convierte en un hecho de memoria visible y borrable. |
| RN-G8 | Toda foto es privada: solo la ve su dueña, por URL firmada temporal. |

## 15. Especificaciones técnicas

→ [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md). Stack: Next.js 16 (App Router) + Tailwind v4 + Supabase
(Auth, Postgres con RLS, Storage) + Claude API + Open-Meteo + Vercel (DT-01). Lecturas en Server Components, mutaciones
simples en Server Actions, operaciones de IA en Route Handlers; el chat responde por SSE con eventos estructurados (DT-08).

## 16. Arquitectura de agentes

→ [`AGENT_ARCHITECTURE.md`](AGENT_ARCHITECTURE.md). Resumen de la decisión DT-06:

| Candidato del encargo | Decisión | Razón |
|---|---|---|
| Orquestador | **Agente** (único) | Conversa, decide qué herramienta usar, redacta el porqué |
| Especialista en imagen y estilo | Criterio dentro del prompt del orquestador | Es conocimiento, no una tarea aislable |
| Especialista en colorimetría | **Función** `analyzeColor` (una llamada, salida estructurada) | Entrada y salida fijas; no necesita conversar |
| Especialista en clóset | **Función** `describeGarment` + herramienta `get_closet` | Extracción y consulta, no razonamiento abierto |
| Generación de outfits | Herramienta `propose_outfit` con validación en servidor | El modelo elige; el servidor garantiza la regla RN-G1 |
| Personal Shopper | Herramientas en V1.1; **candidato a subagente en V2** | Recién con búsqueda web y catálogo hay contexto que aislar |
| Productos y comparación | V2, parte del Shopper | Depende de catálogo |
| Memoria y perfil | Herramienta `remember` + contexto inyectado | DT-07: tres capas, sin base vectorial |

Regla obligatoria: **ningún pago ni compra sin autorización explícita** (DP-09). La matriz de autonomía completa parte de [INV §11].

## 17. Modelo de datos

→ [`DATA_MODEL.md`](DATA_MODEL.md) y `web/supabase/migrations/20261114000000_esquema_inicial.sql`. Entidades del MVP:
`profiles`, `style_profiles`, `color_analyses`, `garments`, `conversations`, `messages`, `outfits`, `outfit_items`,
`outfit_feedback`, `memory_facts`, `consents`, `analytics_events`. Diferidas: uso de prendas, productos, recomendaciones
de compra, alertas de precio.

## 18. Integraciones

| Integración | Para qué | Estado | Modo de falla |
|---|---|---|---|
| Supabase Auth / Postgres / Storage | Cuenta, datos, fotos | MVP | Sin Supabase no hay producto: error visible y reintento |
| Claude API | Agente, visión de prendas, paleta | MVP | Reconocimiento falla → la persona completa a mano; chat falla → mensaje y reintento |
| Open-Meteo | Clima por ciudad (DT-11) | MVP | Sin clima el asesor sigue y lo dice |
| Búsqueda web con citas (herramienta de servidor de Claude) | Productos en dominios chilenos | V1.1, requiere A-01 | Sin resultados fiables → no recomienda producto |
| Feeds de afiliación / acuerdos con marcas | Catálogo | V2, H-05 | — |
| WhatsApp Business | Segundo canal | V2 | — |
| Resend (SMTP) | Magic link | V1.1 | — |
| GA4 / GTM | Analítica de captación | Al abrir a público | — |

**Estrategia gradual de retailers** (DT-09): (a) lo que trae la persona —link o foto— → (b) búsqueda en vivo con citas
sobre una lista de dominios → (c) feeds y acuerdos. No se asume ninguna API ni feed existente. Sin scraping masivo ni
almacenamiento de catálogo ajeno sin acuerdo.

## 19. Seguridad y privacidad

Detalle técnico en `TECHNICAL_ARCHITECTURE.md`. Compromisos de producto:

- **Aislamiento por persona**: RLS en todas las tablas; sin service role (DT-02). Prueba de dos usuarios en QA.
- **Fotos privadas**: bucket privado, URL firmada temporal, sin EXIF (DT-04).
- **Minimización**: no se piden medidas, peso ni ubicación del dispositivo (DP-12, DT-11).
- **Consentimiento granular y versionado**: términos, procesamiento de fotos, foto de rostro (RF-02).
- **Transparencia y borrado**: la persona ve la memoria del asesor, borra hechos y borra todos sus datos.
- **Secretos solo en servidor**; nada sensible en HTML, metadatos ni JSON embebido.
- **Agente**: mínimo privilegio (cuatro herramientas acotadas a la sesión), contenido externo tratado como dato,
  tope de iteraciones y de tokens.
- **Legal**: S-05 y A-02 — revisión legal de la ley chilena de protección de datos **antes de invitar testers
  externos**. Este documento no es asesoría legal.

## 20. Requerimientos no funcionales

Como ítems verificables en el backlog (`NFR-xx`). Los umbrales numéricos son **propuestas iniciales a calibrar** con
mediciones del piloto, no compromisos.

| Categoría | Requerimiento |
|---|---|
| Rendimiento | Primera carga rápida en móvil con red 4G; el chat muestra el primer texto en streaming sin esperar la respuesta completa; las fotos se comprimen antes de subir |
| Disponibilidad | La falla de un tercero (clima, IA) degrada una función, no la app |
| Accesibilidad | WCAG 2.1 AA: contraste, foco visible, objetivos táctiles ≥ 44 px, streaming anunciado a lectores de pantalla, `prefers-reduced-motion` |
| Seguridad | RLS probado; rutas de Storage validadas en servidor; entradas validadas con esquema |
| Privacidad | Borrado efectivo de datos y fotos; consentimiento registrado |
| Costo | Tokens por llamada registrados desde el día 1 (S-04) |
| Mantenibilidad | `npm run verify` (lint + tipos + tests) en pre-push y CI; IA simulada para tests (DT-13) |
| Compatibilidad | iOS Safari y Android Chrome recientes; instalable en ambos |
| Idioma | Español de Chile en la UI; base de datos y eventos en inglés |

## 21. Backlog priorizado

→ [`PRODUCT_BACKLOG.md`](PRODUCT_BACKLOG.md) (fuente hasta migrar a ClickUp: DT-15, A-04). Épicas:

| Épica | Nombre | Versión principal |
|---|---|---|
| E1 | Cuenta y privacidad | MVP |
| E2 | Onboarding y perfil de imagen | MVP |
| E3 | Colorimetría | MVP (preliminar) · V2 (profunda) |
| E4 | Clóset digital | MVP |
| E5 | Agente asesor | MVP |
| E6 | Outfits | MVP |
| E7 | Personal Shopper | MVP (prenda faltante) · V1.1 · V2 |
| E8 | PWA y plataforma | MVP |
| E9 | Hábito y planificación | V2 |
| E10 | Canales y expansión | V2 · V3 |

Priorización: valor para la persona, viabilidad técnica, riesgo y dependencias. Sin estimaciones de duración.

## 22. Roadmap

Por resultado que valida, no por fecha. Pasar de versión exige el criterio de salida.

| Versión | Objetivo | Alcance | Criterio de salida |
|---|---|---|---|
| **MVP** | Validar que el asesor con clóset real entrega un outfit útil y genera regreso | RF-01 a RF-16 | O-1 a O-4 medidos con el piloto; S-01 y S-02 evaluados; A-02 resuelta antes de testers externos |
| **V1.1** | Validar la intención de compra asistida sin catálogo propio | RF-17, 18, 19 | A-01 aprobada; personas usan "¿vale la pena?"; H-04 explorada |
| **V2** | Convertir utilidad en hábito y abrir el comercio | RF-20 a RF-27 | H-05 con al menos un acuerdo; retención sostenida; costo por persona conocido (S-04) |
| **V3** | Escalar a LatAm con autonomía controlada | RF-28 a RF-31 | Operación y regulación por país resueltas |

Diferencias con el roadmap de la investigación [INV §13]: se adelanta la colorimetría preliminar (DP-05); se atrasan los
productos reales y la afiliación a V1.1/V2 (DP-07); WhatsApp queda en V2 (DP-03).

## 23. Dependencias y riesgos

**Dependencias críticas**: proyecto Supabase y claves (Felipe); clave de Claude API (Felipe); revisión legal (A-02);
aprobación de la estrategia de catálogos (A-01); acuerdos con marcas (H-05).

| Riesgo | Criticidad | Mitigación | Origen |
|---|---|---|---|
| Digitalizar el clóset es tedioso | Crítica | Meta de 5 prendas, una foto por prenda, el asesor pide lo que falta (DP-06) | [INV §14] |
| Recomendaciones genéricas | Crítica | Perfil, paleta, clima, memoria y porqué obligatorio; evals del agente | [INV §14] |
| Reconocimiento de prendas impreciso | Alta | Corrección manual en un paso; medición S-01 | [PS] |
| Paleta percibida como arbitraria | Alta | Confianza visible, aviso de iluminación, corrección manual (DP-05) | [PS] |
| Privacidad de fotos | Crítica | RLS, bucket privado, borrado, consentimiento; A-02 | [INV §14] |
| Acceso a catálogos | Crítica | Estrategia gradual DT-09; el MVP no depende de ellos | [INV §14] |
| Alucinaciones (prendas que no existen) | Crítica | El outfit solo se arma con IDs reales validados en servidor (RN-G1) | [INV §14], [PS] |
| Sesgo comercial | Crítica | DP-10; sin monetización en el MVP | [INV §14] |
| Costo de inferencia | Media | Medición desde el día 1; modelo y esfuerzo por variable de entorno (DT-05) | [INV §14] |
| La PWA no genera regreso sin WhatsApp | Alta | H-07; push y WhatsApp en V2 | [PS] |
| Entrada de Meta (Style Sketch) en Chile | Alta | Velocidad, criterio local y neutralidad; el activo es el clóset y la memoria | [INV §4], [PS] |
| Dependencia de un proveedor de IA | Media | Capa `lib/ai` aislada; contratos de herramientas propios | [PS] |

## 24. Estrategia de QA

→ [`QA_STRATEGY.md`](QA_STRATEGY.md). Tests de reglas de dominio y endpoints con IA simulada; pruebas de RLS con dos
usuarios; set dorado para visión y casos del agente; humo manual del flujo vertical; accesibilidad AA.

## 25. Métricas de éxito

**North Star**: **outfits útiles por persona activa por semana**. Un outfit es *útil* si la persona lo guarda o lo
califica con "me encanta" o "me sirve". Mide el valor central (una decisión de vestuario resuelta), no la actividad.

**Activación**: primer outfit útil dentro de la primera sesión.

| Métrica | Definición | Evento | Objetivo |
|---|---|---|---|
| Finalización del onboarding | Personas que completan / que crean cuenta | `onboarding_completed` / `signup_completed` | O-1 |
| Perfil de imagen completo | Con estilo, ocasiones y calce declarados | `onboarding_step_completed` | O-3 |
| Paleta obtenida | Personas con una paleta activa; distribución de confianza | `color_analysis_completed` | O-3 |
| Prendas por persona | Distribución a 1, 7 y 30 días | `garment_added` | O-2, H-01 |
| Corrección del reconocimiento | Prendas editadas / prendas agregadas | `garment_edited` | S-01 |
| Outfits generados | Por persona y por ocasión | `outfit_proposed` | O-3, H-02 |
| Outfits guardados | Guardados / generados | `outfit_saved` | O-1 |
| Recomendaciones aceptadas | `love` + `ok` / calificados | `outfit_feedback` | O-3 |
| Frecuencia de uso | Días activos por semana | `chat_message_sent` | O-4 |
| Retención | Personas que vuelven en la semana 1, 2 y 4 | — | O-4, H-07 |
| Satisfacción y utilidad percibida | Encuesta breve tras el tercer outfit | (V1.1) | H-03 |
| Prendas faltantes detectadas | Por categoría | `outfit_proposed.missing_piece` | O-5 |
| Compras referidas | Clics a retailer | (V1.1) | — |
| Conversión a premium | — | (V2) | H-04 |
| Costo de IA por persona activa | Tokens por ruta y modelo | `ai_usage` | S-04 |

**No se fijan metas numéricas todavía.** No hay línea base propia y la investigación no entrega benchmarks verificables
[INV §17]. Las metas se fijan con los datos de las dos primeras semanas del piloto.

## 26. Hipótesis pendientes de validar

→ `DECISION_LOG.md` §3 (supuestos S-01…S-07) y §4 (hipótesis H-01…H-07). Las tres que más cambian el producto:

1. **H-01 / S-03** — ¿la gente digitaliza suficiente clóset y bastan 5 prendas para un primer look útil?
2. **S-01 / S-02** — ¿la visión reconoce prendas y propone una paleta que la persona considera creíble?
3. **H-07** — ¿una PWA genera regreso sin WhatsApp?

## 27. Decisiones de arquitectura y producto

→ [`DECISION_LOG.md`](DECISION_LOG.md): 15 decisiones de producto (DP), 17 técnicas (DT) y 5 aprobaciones pendientes (A).

## 28. Plan de ejecución

### 28.1 Hoy

→ [`EXECUTION_PLAN_2000.md`](EXECUTION_PLAN_2000.md).

### 28.2 Después de hoy

| Paso | Qué | Bloqueo |
|---|---|---|
| 1 | Revisión visual de Felipe y ajustes; merge del PR del flujo vertical | Felipe |
| 2 | Completar el MVP: RF-13 clima visible, RF-16 foto en chat, RF-02 consentimiento versionado, edición completa de perfil y prenda | — |
| 3 | Evaluaciones: set dorado de prendas (S-01), paletas (S-02), casos del agente | Fotos reales |
| 4 | Revisión legal (A-02) y textos de consentimiento | Felipe |
| 5 | Despliegue en Vercel y piloto con 5 a 10 personas cercanas | A-04, paso 4 |
| 6 | Dos semanas de medición → fijar metas (§25) y decidir V1.1 | Datos |

### 28.3 Gobernanza

- **Fuente única de verdad**: este DTR + los documentos dueños. Una decisión nueva entra primero al `DECISION_LOG.md`.
- **Decisiones reversibles** las toma la sesión integradora y las registra. **Irreversibles o de alto impacto**
  (arquitectura difícil de cambiar, costos, exposición de datos, compromisos externos) van a `DECISION_LOG.md` §5 y
  esperan a Felipe.
- **Coordinación**: una sesión integradora con subagentes sobre archivos disjuntos. **La Torre** se instala cuando
  haya sesiones paralelas con PRs en cola (DT-16); el backlog ya usa IDs compatibles con `.torre/plan.yaml`.
- **Calidad**: nada se declara terminado sin `npm run verify` en verde y, si tiene interfaz, sin revisión visual de Felipe.

### 28.4 Historial del documento

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-11-14 | Inception: estrategia, alcance por versión, RF-01…RF-31, arquitectura, métricas, plan |
