# DECISION_LOG — AI Personal Stylist

> Registro único de decisiones, supuestos y preguntas abiertas. Si otro documento contradice este, gana este
> (y se corrige el otro). Cada entrada dice de dónde viene: **[INV]** investigación de Perplexity
> (`docs/producto/research/contexto_asesor_imagen_personal_shopper.md`), **[PS]** conclusión de Product Strategy,
> **[FELIPE]** decisión explícita de Felipe, **[STACK]** estándar del toolkit (`project-inception`) o precedente de otro proyecto.
>
> Estados: `tomada` · `tomada-reversible` · `requiere aprobación` · `abierta`.

Versión 0.6 — 2026-11-14.

## 1. Decisiones de producto

| ID | Decisión | Origen | Estado | Razón / alternativa descartada |
|---|---|---|---|---|
| DP-01 | El producto es un **Asesor de Imagen Digital con Personal Shopper integrado**, no un buscador de moda. Promesa: "Te ayudo a verte como quieres verte, con lo que ya tienes y con lo que realmente vale la pena comprar". | [INV] §1, [FELIPE] | tomada | Un shopping agent generalista compite con Amazon/Google/Meta/Mercado Libre. |
| DP-02 | La unidad de valor es el **outfit completo para una ocasión**, nunca la prenda suelta. Toda recomendación (incluida una compra) se presenta dentro de un outfit. | [INV] §1, [FELIPE] | tomada | — |
| DP-03 | Canal del MVP: **PWA mobile-first**. WhatsApp pasa a V2 como segundo canal sobre el mismo agente (la API del agente no conoce el canal). | [FELIPE] contra [INV] §7 y §15 (WhatsApp-first) | tomada | La investigación recomienda WhatsApp-first; Felipe pidió PWA. La PWA resuelve mejor clóset, paleta y visualización de outfits, que la propia investigación reserva a "app o web como capa de profundidad". Riesgo aceptado: mayor fricción de adquisición. Se mantiene la hipótesis H-07. |
| DP-04 | Cuña del MVP: **"¿Qué me pongo?" con tu clóset real**. Activación = primer outfit útil en la primera sesión (mínimo 3 prendas para generarlo; 5 es la meta del onboarding, DP-06). | [PS] sobre [INV] §13 | tomada | Es el caso de uso de mayor frecuencia (diario) y no depende de catálogos de terceros, que es la dependencia más riesgosa. |
| DP-05 | **Colorimetría entra al MVP como "paleta preliminar"** (una selfie → estación tentativa + colores, con nivel de confianza y corrección manual). El análisis profundo y de silueta queda en V2. | [PS], diverge de [INV] §13 (la ubica en V2) | tomada-reversible | Es el gancho de onboarding más barato de construir con un modelo de visión y el que entrega valor antes de digitalizar el clóset (referente: Style DNA). Se presenta siempre como orientación, no diagnóstico. |
| DP-06 | El clóset parte con **pocas prendas**: meta de 5 en onboarding (mínimo 3 para generar un outfit). Una foto = una prenda en el MVP; el agente pide prendas faltantes a medida que las necesita. Video del clóset, foto con varias prendas e importación desde correo → V2. | [PS] sobre riesgo crítico [INV] §14 | tomada | La digitalización es la mayor barrera de entrada identificada. |
| DP-07 | Personal Shopper en tres pasos. **MVP (hoy):** el agente detecta la *prenda faltante* y la describe (categoría, color, por qué desbloquea outfits), sin productos. **V1.1:** "¿vale la pena comprar esto?" sobre un link o foto que entrega el usuario + búsqueda en vivo con citas en dominios chilenos permitidos. **V2:** catálogo propio vía feeds/afiliación. | [PS] sobre [INV] §13–14 | tomada-reversible | No existen hoy feeds ni acuerdos. No se asume ninguna API. Ver DT-09 y H-05. |
| DP-08 | Visualización del MVP: **composición del outfit con las fotos reales de las prendas** (tarjeta de look). Generación de imágenes y try-on fuera del MVP. | [INV] §13–14, [FELIPE] | tomada | El try-on poco realista es riesgo crítico; no puede ser dependencia del lanzamiento. |
| DP-09 | **Ningún pago ni compra se ejecuta sin autorización explícita.** En MVP y V2 el producto solo redirige al checkout del retailer; nunca guarda medios de pago. Compra autónoma: fuera de alcance hasta V3 y solo reposición de bajo riesgo. | [INV] §11, [FELIPE] | tomada | Regla obligatoria. |
| DP-10 | **Neutralidad comercial:** una afiliación se muestra junto al producto; el ranking por defecto no lo determina un acuerdo comercial; nunca se oculta una alternativa mejor. | [INV] §12 | tomada | — |
| DP-11 | El agente **explica siempre el porqué** de cada recomendación en lenguaje llano y admite corrección ("no me gusta", "no es mi estilo"), que se guarda como memoria. | [INV] §14, [FELIPE] | tomada | Mitiga "recomendaciones genéricas". |
| DP-12 | Tono de cuerpo: el producto habla de **preferencias de calce y proporciones**, nunca de "defectos", "corregir" ni "tipo de cuerpo ideal". No se piden medidas ni peso; no se infieren desde fotos sin que el usuario lo pida. | [PS] | tomada | Riesgo reputacional y de bienestar; además minimiza datos sensibles. |
| DP-13 | Segmento inicial: personas de 25 a 45, urbanas, Santiago, presupuesto medio. Sin segmentar por género en el modelo de datos: el usuario declara qué secciones de ropa usa. | [INV] §9–10, [PS] | tomada | — |
| DP-14 | Modelo de negocio objetivo: freemium + premium + afiliación transparente. **Nada de monetización en el MVP**; se instrumenta para medir la disposición a pagar. | [INV] §12 | tomada | No inventar precios ni conversiones sin evidencia. |
| DP-15 | Nombre de trabajo del proyecto y del repo: `ai-personal-stylist`. La marca se define después; la UI usa el nombre provisional **"Estilo"** hasta entonces. | [FELIPE] (nombre), [PS] (provisional) | abierta (marca) | — |
| DP-17 | **Conversación primero.** El producto es una conversación con el asesor, no una app con un chat. La pantalla principal es el hilo; no hay barra de pestañas. El onboarding es la primera conversación (el asesor pregunta de a una cosa y ofrece respuestas sugeridas; no hay formulario por pasos). Las fotos se envían en el chat y el asesor decide qué hacer con ellas (prenda del clóset, selfie para la paleta, algo que la persona evalúa). Looks, prendas y paleta se muestran como tarjetas dentro del hilo. Clóset, Looks y perfil son "Tu espacio": vistas secundarias de consulta, a las que se entra desde el encabezado. **Reemplaza** la navegación de 4 pestañas y la ruta `/bienvenida`. | [FELIPE] al revisar la maqueta (2026-11-14) | tomada | La primera maqueta se sentía como "interacción de app". Consecuencia técnica: el agente gana herramientas (`update_profile`, `add_garment`, `analyze_palette`, `suggest_replies`) y RF-16 (foto en el chat) pasa al corte de hoy. |
| DP-18 | **Un solo asesor, que también es personal shopper.** El Personal Shopper con productos reales deja de ser V1.1 y pasa al núcleo del MVP: evaluar una compra (foto o link) y buscar opciones en tiendas chilenas, siempre dentro de un look. Ajusta DP-07. Sigue siendo un único agente con más herramientas (DT-06). | [FELIPE] 2026-11-14 | tomada; la búsqueda en vivo espera A-01 | La investigación define el producto como asesor **y** shopper; diferir la compra dejaba medio producto. El catálogo por feeds sigue en V2. |
| DP-19 | **Caso de uso que manda:** "saber qué ponerme el fin de semana para un evento y, si en mi clóset no hay algo que me sirva, que me busque opciones". Todo se prioriza contra ese recorrido (`PLAN_GENERAL.md` §1). | [FELIPE] 2026-11-14 | tomada | Da un criterio único para decidir qué entra. Implica búsqueda de opciones de compra: A-01 queda **aprobada en principio** ("que me busque opciones"); falta la lista de tiendas. |
| DP-20 | **Bases fijas de la arquitectura del asesor** BF-01 a BF-14 (`PLAN_GENERAL.md` §3): invariantes que no dependen de cómo se decida que piense el asesor ni del framework. Cómo razona, un agente o varios, y el framework quedan abiertos hasta cerrar la investigación de `docs/investigacion-agentes/`. | [FELIPE] + [PS] 2026-11-14 | tomada | Permite construir interfaz y equipo sin esperar la definición del razonamiento. |
| DP-21 | **Equipo de bots en OpenMausBot** al estilo Prendie, con tres cambios: el Productor solo escala a Felipe dudas funcionales que no sepa resolver; los bots conversan entre ellos (Constructor ↔ QA); DevOps crea ramas y mergea por condiciones objetivas, sin aprobación humana por historia. Permisos full; el control va en mecanismos (freno y frontera de archivos). | [FELIPE] 2026-11-14 | tomada; instalación en curso | Reduce a Felipe a lo funcional. Riesgo asumido: merge automático con permisos full (ver `docs/superpowers/plans/2026-11-14-equipo-mausbot.md`). |

## 2. Decisiones técnicas

| ID | Decisión | Origen | Estado | Razón / alternativa descartada |
|---|---|---|---|---|
| DT-01 | Stack: **Next.js 16 (App Router) + Tailwind v4 + Supabase (Auth, Postgres con RLS, Storage) + Vercel + Vitest**, Node 24, TypeScript ^5. Código en `web/`, git en la raíz. | [STACK] | tomada | Stack default del toolkit; mismo de Prendie, que ya es PWA con visión de prendas. |
| DT-02 | **Datos con la sesión del usuario y RLS**, no service role. Cada tabla de usuario tiene `user_id` y políticas `auth.uid() = user_id`. El service role no se usa en el MVP. | [STACK] precedente Prendie (desvío deliberado del default del toolkit) | tomada | Las fotos y el perfil son datos personales; RLS es la barrera real. Una route con service role sin guard queda abierta a internet. |
| DT-03 | Autenticación del piloto: **email + contraseña** de Supabase Auth. Magic link / OTP con SMTP propio (Resend) → V1.1. | [PS] | tomada-reversible | El SMTP por defecto de Supabase está limitado a muy pocos correos por hora; el login anónimo se pierde al instalar la PWA en iOS (almacenamiento separado de Safari). |
| DT-04 | Fotos en **bucket privado** `user-media`, ruta `{user_id}/{kind}/{uuid}.jpg`, acceso solo por URL firmada de corta duración. Compresión en cliente (≤ 1280 px, JPEG, sin EXIF) antes de subir. | [STACK] precedente Prendie | tomada | Privacidad de fotos corporales: riesgo crítico [INV] §14. |
| DT-05 | IA: **Claude API** con el SDK oficial `@anthropic-ai/sdk`, solo desde el servidor. Modelo del agente estilista: `claude-opus-5-5`. Modelo de extracción visual (prendas, selfie): `claude-haiku-5-5`. Ambos por variable de entorno (`STYLIST_MODEL`, `VISION_MODEL`). | [STACK] precedente Prendie (`claude-haiku-5-5` con visión + structured outputs) | tomada-reversible | El agente es el núcleo del producto: se parte con el modelo más capaz y se baja solo con una evaluación que lo respalde. Cambiar de modelo es una variable de entorno. Costo: ver S-04. |
| DT-06 | Arquitectura del agente: **un solo agente orquestador con herramientas**, no multiagente. Colorimetría y reconocimiento de prendas son **funciones de una llamada con salida estructurada** (no agentes). Detalle en `AGENT_ARCHITECTURE.md`. | [PS], [FELIPE] ("no agregues complejidad innecesaria") | tomada | Ningún dominio del MVP necesita contexto aislado ni paralelismo. Se separa en subagentes solo cuando una evaluación muestre que el prompt único degrada (candidato: Shopper en V2). |
| DT-07 | Memoria en tres capas: (1) **perfil estructurado** (`style_profiles`), (2) **hechos de memoria** (`memory_facts`: frases cortas con origen y fecha, que el agente agrega y el usuario puede ver y borrar), (3) **historial de conversación** reciente. Sin base vectorial en el MVP. | [PS] | tomada-reversible | Con decenas de prendas y de hechos por usuario todo cabe en contexto; un índice vectorial es complejidad sin beneficio medible todavía. |
| DT-08 | El agente responde por **streaming (SSE)** desde una route handler; los outfits llegan como **eventos estructurados** que la UI pinta como tarjetas, no como texto. | [PS] | tomada | La unidad de valor es el outfit: debe ser un objeto, guardable y medible. |
| DT-09 | Acceso a catálogos (V1.1+): orden de preferencia **(a) link o foto que trae el usuario → (b) búsqueda web en vivo con citas restringida a una lista de dominios chilenos → (c) feeds de afiliación o acuerdos directos**. **No se hace scraping masivo ni se almacena catálogo ajeno** sin acuerdo. | [PS] sobre [INV] §7 y §14 | **requiere aprobación** antes de V1.1 | Scraping: riesgo legal y de términos de uso; Mercado Libre no permite agentes externos [INV] §4. Precio/stock siempre con marca de tiempo y sin prometer disponibilidad. |
| DT-10 | PWA: `manifest` + service worker mínimo (instalable, shell cacheado). **Sin datos offline ni notificaciones push en el MVP.** | [PS] | tomada | El valor depende del agente (online). Push se evalúa en V2 para el hábito diario "¿qué me pongo hoy?". |
| DT-11 | Clima: **Open-Meteo** (sin clave) por ciudad declarada en el perfil; no se pide geolocalización del dispositivo. | [PS] | tomada-reversible | Minimización de datos; la ciudad basta para vestirse. Supuesto S-06. |
| DT-12 | Analítica del MVP: **tabla propia `analytics_events`** escrita desde el servidor. GA4/GTM se agrega al abrir a público. | [STACK] precedente Prendie | tomada-reversible | El piloto es de decenas de personas autenticadas; los eventos de producto (outfit generado, guardado, feedback) viven mejor junto a los datos. |
| DT-13 | **Modo IA simulada** (`AI_MODE=mock`): respuestas deterministas para desarrollo, tests y CI sin gastar inferencia ni necesitar clave. | [PS] | tomada | Permite verificar el flujo completo sin credenciales y hace los tests reproducibles. |
| DT-14 | Las **migraciones las aplica Felipe** en Supabase; ninguna sesión las aplica. Esquema inicial en `web/supabase/migrations/`. | [STACK] | tomada | Regla del toolkit. |
| DT-15 | Backlog: `PRODUCT_BACKLOG.md` es la fuente hasta que Felipe autorice crear la carpeta en ClickUp; entonces se migra y el archivo deja de mantenerse. | [STACK] + respuesta de Felipe (no autorizó ClickUp hoy) | tomada | Evita dos fuentes de verdad. |
| DT-16 | **La Torre** (skill `/torre` de Lo Nuestro y Prendie) **no se instala hoy**. Se instala al cumplirse su gatillo: sesiones paralelas con PRs en cola. El backlog usa IDs y campos compatibles con `.torre/plan.yaml` (id, objetivo, prioridad, área, spec) para que el paso sea directo. Hoy la coordinación es una sola sesión integradora con subagentes sobre archivos disjuntos. | [STACK] `project-inception/knowledge/repo-setup.md` ("Lo que NO se instala al arrancar") | tomada | Instalar el freno y los scripts antes de tener PRs en cola es costo sin beneficio; `permissions.deny` cubre lo irreversible mientras tanto. |
| DT-17 | Desvíos del flujo de `project-inception` por la ventana de hoy: (1) no se ejecuta `superpowers:brainstorming` pregunta a pregunta: el encargo de Felipe ya define el producto y pide autonomía; (2) la maqueta HTML se entrega para revisión visual en paralelo, no como bloqueo previo; (3) ClickUp y Vercel quedan preparados, no creados. | [FELIPE] (autonomía, plazo 20:00) | tomada | Se registran para que no parezcan olvidos. |
| DT-18 | **El lector de tiendas es un subagente aislado.** El asesor sigue siendo uno solo de cara a la persona (BF-01); lo que lee la web de tiendas corre aparte, sin acceso a datos privados de la persona, y devuelve un resultado con contrato fijo. Ajusta el matiz de DT-06. | [FELIPE] 2026-11-14, sobre la hipótesis de `docs/investigacion-agentes/E` | tomada | Seguridad (datos privados + contenido no confiable + salida a la red no deben coincidir en un mismo contexto) y contexto (contenido voluminoso y desechable). |
| DT-19 | **Excepción acotada a DT-02 para el estado de ejecución.** El estado del turno (checkpoints, aprobaciones pendientes) y las trazas pueden escribirse con un rol de servidor, en tablas propias que la persona no edita. Los datos de la persona siguen con su sesión y RLS, sin excepción. | [FELIPE] 2026-11-14 | tomada; diseño pendiente | Un turno que se pausa y se reanuda no puede depender de que el cliente no altere su estado. Requiere migración y manejo de una clave de servidor: se diseña antes de implementarla. |
| DT-20 | **Las trazas viven en Supabase** (tablas propias del proyecto), no en un servicio externo. | [FELIPE] 2026-11-14 | tomada; diseño pendiente | Un solo lugar para datos y observación en el piloto; sin enviar conversaciones a terceros. Revisar volumen y retención al abrir a público. |
| DT-21 | **Se puede reutilizar código del SDK `openair-webchat`** (OpenAir Technologies) en la interfaz conversacional, quitando todo lo de tenant, consola e incrustación. Autorización dada por Nico (OpenAir) a Felipe en persona el 2026-11-14. Nunca se porta configuración, claves ni integraciones de clientes de OpenAir. Cada pieza portada se anota con su origen en `docs/producto/research/sdk-openair-mapa-de-reutilizacion.md`. | [FELIPE] 2026-11-14 | tomada | Acelera con piezas probadas en producción. La autorización es verbal: conviene dejarla por escrito (un mensaje basta) antes de abrir el producto a terceros, porque el repo no tiene licencia. |

## 3. Supuestos que requieren validación

| ID | Supuesto | Cómo se valida | Riesgo si es falso |
|---|---|---|---|
| S-01 | Un modelo de visión general clasifica una prenda (categoría, colores, estampado, formalidad, temporada) con calidad suficiente desde una foto casera. | Set de 50 fotos reales etiquetadas a mano; medir acuerdo por campo. | Corrección manual excesiva → abandono del clóset. |
| S-02 | Una selfie con luz natural permite una paleta *orientativa* útil. No equivale a un diagnóstico profesional. | Comparar contra el diagnóstico de 10 personas asesoradas por una profesional. | Pérdida de confianza; por eso se muestra confianza y se permite corregir. |
| S-03 | 5 prendas bastan para un primer outfit que el usuario perciba como útil. | Tasa de "me sirve" en el primer outfit según número de prendas. | Subir la meta de onboarding o apoyarse en prendas faltantes. |
| S-04 | El costo de inferencia por usuario activo es sostenible con `claude-opus-5-5` en el chat. No hay cifra medida todavía. | Registrar tokens por conversación en `analytics_events` desde el día 1. | Bajar el modelo o el esfuerzo por ruta (DT-05). |
| S-05 | Las fotos de prendas y del rostro son datos personales y la selfie podría considerarse dato sensible bajo la ley chilena de protección de datos (Ley 21.719). | **Revisión legal antes de abrir a público.** | Consentimiento, base de licitud y política de retención insuficientes. |
| S-06 | La ciudad declarada basta para la recomendación por clima. | Feedback cualitativo del piloto. | Pedir ubicación con consentimiento. |
| S-07 | El piloto es de decenas de personas (respuesta de Felipe). No se aplican patrones de escala. | — | Revisar `scale-patterns.md` antes de abrir. |

## 4. Hipótesis de negocio pendientes (heredadas de [INV] §17)

| ID | Hipótesis | Métrica que la responde |
|---|---|---|
| H-01 | Los usuarios están dispuestos a digitalizar al menos 20 prendas. | Distribución de prendas por usuario a 7 y 30 días. |
| H-02 | La ocasión con mayor urgencia de asesoría es el día a día laboral (vs. citas, eventos, viajes, renovación). | Ocasión declarada por outfit generado. |
| H-03 | El usuario valora más la seguridad estética que el ahorro o la conveniencia. | Encuesta in-app tras el 3.er outfit. |
| H-04 | Existe disposición a pagar una suscripción mensual. | Prueba de puerta falsa en V1.1; entrevistas. |
| H-05 | Retailers y marcas chilenas entregarán feeds, afiliación o APIs. | Conversaciones comerciales; 3 a 5 marcas objetivo. |
| H-06 | El try-on aumenta la intención de compra y no solo la curiosidad. | Experimento en V2. |
| H-07 | Una PWA basta como interfaz principal sin WhatsApp. | Retención semanal del piloto y vía de regreso a la app. |

## 5. Decisiones que requieren aprobación de Felipe

| ID | Qué | Por qué es tuya | Recomendación |
|---|---|---|---|
| A-01 | Estrategia de acceso a catálogos (DT-09), en particular la búsqueda web en vivo sobre retailers. | Exposición legal y relación futura con retailers. | Aprobar (a) y (b); iniciar conversaciones para (c). |
| A-02 | Revisión legal de privacidad (S-05) antes de invitar a testers externos. | Exposición de datos personales de terceros. | Hacerla antes de cualquier tester que no seas tú. |
| A-03 | Modelo del agente y tope de gasto mensual de inferencia (DT-05, S-04). | Costo recurrente. | Partir con `claude-opus-5-5`, medir una semana, decidir con datos. |
| A-04 | Crear carpeta y listas en ClickUp, y proyecto en Vercel. | Acciones externas no autorizadas hoy. | Autorizar al cierre de hoy. |
| A-05 | Marca y nombre definitivo (DP-15). | Identidad. | Sesión de marca con `ckm-brand` antes de abrir a público. |

## 6. Resoluciones de inception (observaciones de los agentes)

Cada observación levantada por los agentes de backlog/specs se resolvió así. Las que cambian código quedan como tarea del integrador.

| ID | Tema | Resolución | Estado |
|---|---|---|---|
| R-01 | Clima (RF-13) | `get_weather` entra hoy; mostrarlo en la UI de Asesor es MVP posterior. Si el agente consultó el clima en el turno, el servidor lo adjunta al outfit (el modelo no lo envía). | tomada |
| R-02 | Borrado | `delete_my_data()` borra también `analytics_events` de la persona. Se agrega `delete_my_account()` (`security definer`, borra la fila propia de `auth.users` y todo por cascada) para eliminar la cuenta sin service role. | tomada |
| R-03 | Consentimiento | El onboarding registra `terms` y `photo_processing` en `consents`; la selfie registra `face_photo`. Textos legales definitivos: A-02. | tomada |
| R-04 | **Selfie no se conserva** (DP-16) | La foto del rostro se borra de Storage apenas termina el análisis; `color_analyses.photo_path` queda nulo. Minimización: solo se guarda el resultado. | tomada |
| R-05 | Composición de outfit (RN-G1) | Solo prendas `ready` y no archivadas. [1–2 top + 1 bottom] o [1 dress, con 0–1 top como capa, sin bottom]; máx. 1 outerwear, 1 shoes, 1 bag, 2 accessory; 2 a 7 prendas. | tomada |
| R-06 | Prenda `failed` | Si la persona completa los datos a mano pasa a `ready` y cuenta para outfits. | tomada |
| R-07 | Foto sin rostro / sin prenda | `422` con mensaje amable; no se crea paleta; la prenda no reconocible se guarda como `failed` para completarla a mano (si no es una prenda, la persona la descarta). | tomada |
| R-08 | Paleta manual | Paletas predefinidas por estación en `lib/domain/palettes.ts`; `source: 'manual'`, `confidence: 'media'`, mostrada como "elegida por ti". | tomada |
| R-09 | Ciudad | Texto libre, geocodificado en Open-Meteo con país CL; si no resuelve, sin clima. Lista de ciudades: V1.1. | tomada-reversible |
| R-10 | Borrar prenda | En la UI las prendas se **archivan**, no se borran, para no romper looks guardados. Borrado físico solo al borrar todos los datos. | tomada |
| R-11 | Falta una categoría base | No hay tarjeta de look: el asesor lo dice en texto, describe la prenda faltante y pide agregarla (RN-G2). | tomada |
| R-12 | Feedback → memoria | Lo hace la acción `rateOutfit` en el servidor (un `no` con motivo crea un `memory_fact` de origen `feedback`). | tomada |
| R-13 | Onboarding "≤ 6 pasos" | Son las preguntas de perfil. Selfie y primeras prendas son etapas aparte, ambas saltables. | tomada |
| R-14 | Eventos faltantes | Se agregan `onboarding_step_skipped`, `outfit_discarded`, `color_palette_corrected`, `data_deleted`, `pwa_installed`. | tomada |
| R-15 | Tope de uso antes de A-03 | Límite diario de mensajes de chat por persona (`CHAT_DAILY_LIMIT`, default 60), contado en `messages`. | tomada-reversible |
| R-16 | Historial de conversaciones | El MVP muestra una sola conversación continua. "Nueva conversación" y lista: V1.1. | tomada |
| R-17 | Foto del chat como prenda | Abierta; se define con RF-16. | abierta |
| R-18 | Carga masiva de prendas | Evolución de RF-06 en V2; no necesita RF propio todavía. | tomada |
| R-19 | Referencias cruzadas entre personas (hallazgo de arquitectura) | FK compuestas `(id, user_id)` en `outfit_items`, `outfit_feedback`, `messages` y `outfits.conversation_id`. Migración `20261114010000_integridad_y_borrado.sql`. | tomada |
| R-20 | Medir S-01 | `garments.ai_recognition` guarda lo que propuso la IA para compararlo con la corrección. | tomada |
| R-21 | `outfits.saved_at` | Se registra cuándo se guardó un look. | tomada |
| R-22 | Eventos falseables desde el cliente y paleta activa no atómica | Aceptado en el piloto (los eventos son para aprender, no para cobrar). Se revisa antes de abrir a público. | tomada-reversible |
| R-23 | Preview de Vercel "solo lectura" sin service role | Los Preview corren con `AI_MODE=mock` y, antes de testers externos, contra un proyecto Supabase separado. Se define al crear el proyecto en Vercel (A-04). | requiere aprobación |
| R-24 | `runbook.md` y `estrategia-git-deploy.md` | Siguen siendo plantillas del toolkit con supuestos de service role; se adaptan al desplegar (A-04). | abierta |
| R-25 | Consentimiento para revisión humana de conversaciones (evaluaciones) | Se incluye en los textos legales de A-02; hasta entonces solo se revisan conversaciones de Felipe. | requiere aprobación |

## 7. Historial

| Fecha | Cambio |
|---|---|
| 2026-11-14 | v0.6 — DT-18 lector de tiendas aislado; DT-19 excepción acotada a DT-02 para estado de ejecución; DT-20 trazas en Supabase. |
| 2026-11-14 | v0.5 — DP-19 caso de uso que manda; DP-20 bases fijas BF-01…14; DP-21 equipo de bots con merge propio. |
| 2026-11-14 | v0.4 — DP-18: un solo asesor que también es personal shopper; RF-17 y RF-18 pasan al MVP (RF-18 sujeto a A-01). |
| 2026-11-14 | v0.3 — DP-17 Conversación primero (feedback de Felipe a la maqueta): sin pestañas, onboarding conversacional real, fotos en el chat, nuevas herramientas del agente. |
| 2026-11-14 | v0.2 — Resoluciones R-01…R-18; DP-16 (la selfie no se conserva); activación precisada en DP-04. |
| 2026-11-14 | v0.1 — Inception. Decisiones DP-01…15, DT-01…17, supuestos e hipótesis iniciales. |
