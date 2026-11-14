# Referentes de conversación agéntica para el hilo de Estilo

Investigación — 2026-11-14. Insumo para el hilo `/asesor` (DP-17, DP-18). **No modifica** `UX_UI_SPEC.md` ni
`DESIGN.MD`: las recomendaciones que los contradicen o ajustan están marcadas para que el integrador decida.

**Método.** Dribbble (búsquedas públicas, sin cuenta), fichas oficiales de App Store (capturas de marketing),
blogs y centros de ayuda oficiales, prensa y reseñas con imágenes, y bibliotecas públicas de patrones de IA. Parte
del trabajo se hizo con tres subagentes que solo usaron páginas públicas; las capturas clave las revisé
directamente. Criterio de lectura: skills `emil-design-eng` (¿debe animarse?, frecuencia, ease-out, < 300 ms),
`design-critique` (jerarquía, consistencia, accesibilidad) y `ui-ux-pro-max`.

**Convención.** **[VI]** = vi la pantalla (captura revisada) o leí el texto en la fuente. **[INFIERO]** = lo dice
una reseña o lo deduzco; no vi la pantalla. Las capturas de App Store son material de marketing: pueden estar
idealizadas. Los shots de Dribbble son **conceptos**, no productos (p. ej. "ALTA" de Dribbble no es la app Alta).
Capturas en `docs/producto/research/referentes/` (material interno de referencia).

---

## Resumen: los 10 patrones más valiosos para Estilo, por impacto

1. **El trabajo del asesor deja rastro, no solo un "pensando…".** Una frase del asesor en primera persona + una
   fila compacta por herramienta en pasado ("Revisé tu clóset · 14 prendas"), en gris, que queda en el hilo y se
   puede abrir. Claude Research, Perplexity, Shop. Hoy nuestro ToolStatus desaparece al llegar el texto.
2. **Refinar sobre la tarjeta, no sobre el hilo.** Chips de atributo pegados al look o al producto ("Más así",
   "Otro color", "Cambiar los zapatos", "No me interesa") que rehacen la propuesta. Daydream, ChatGPT shopping
   research, Gensmo.
3. **La asimetría de voz ya es la correcta y está validada.** Agente en texto serif sin burbuja; persona en bloque
   suave a la derecha: Claude, Pi, Daydream, Gensmo. Lo que falta: **rótulos de autor mínimos** y ritmo editorial.
4. **Memoria anunciada en el momento y editable desde el mismo aviso.** "Memory updated" de ChatGPT abre el recuerdo
   y "Manage memories". Nuestra MemoryNote ya tiene "Deshacer"; le falta el puente a "Lo que sé de ti".
5. **Foto de la persona → etiquetas sobre la foto.** Daydream nombra cada prenda reconocida encima de la imagen y
   ofrece intenciones debajo. Resuelve la foto ambigua (persona vestida) mejor que una pregunta en texto.
6. **El porqué con los datos de la persona, a demanda.** Cleo "Why 3%?", Style DNA (match por color, forma,
   estampado, tela con "?"). Nuestro "Por qué funciona" puede citar paleta, clima y clóset con chips de evidencia.
7. **Tarjeta de producto honesta.** Tienda, precio, "Ver en la tienda" (sale de la app), fuentes plegables, aviso de
   que precio y stock cambian, afiliación dicha. Zalando, ChatGPT shopping, Perplexity. Nunca "Comprar ahora".
8. **Sugerencias que hablan con la voz de la persona.** Zalando alinea las sugerencias de seguimiento a la derecha,
   como frases que la persona podría decir; Duolingo las pone sobre el teclado como inicios de frase.
9. **Arranque por intención, no por menú.** Pi abre con tarjetas de intención editoriales; ChatGPT shopping hace
   preguntas aclaratorias antes de buscar. Para la sesión de un día nuevo, intenciones con voz propia.
10. **Movimiento que informa y se calla.** Etiqueta de estado que cambia con crossfade, pasos que aparecen uno tras
    otro, tarjetas escalonadas. Sin orbes, gradientes ni brillos "IA" (Iris, Zalando, SoraAI muestran el exceso).

---

## Hallazgos por tema

### 1. Voz del agente vs. voz de la persona, sin burbujas

- **Claude (app)** — [VI] el asistente escribe en serif corrido sin contenedor; la persona en bloque gris cálido a
  la derecha; los resultados (mapa, carrusel de lugares, archivo) salen del texto como tarjetas.
  `claude-hilo-sin-burbuja-tarjeta-mapa.jpg` · https://apps.apple.com/us/app/claude-by-anthropic/id6473753684
  - Bien: es nuestra dirección exacta, probada a escala. No copiar: la fila de íconos genéricos bajo cada respuesta.
- **Pi** — [VI] serif grande sin burbuja; persona en bloque beige. `pi-tarjetas-de-inicio.jpg` ·
  https://apps.apple.com/us/app/pi-your-personal-ai/id6445815935
  - Bien: tono cálido y literario. No copiar: ilustración pintada (compite con las fotos de prenda, que son nuestras protagonistas).
- **Daydream / Gensmo** (moda) — [VI] persona en cápsula rellena (Daydream negra, Gensmo gris con lápiz para editar
  el mensaje); el agente en párrafo sin burbuja. `daydream-chat-chips-y-refinar.jpg`,
  `gensmo-chat-look-y-sugerencias.jpg` · https://daydream.ing · https://gensmo.com
  - Bien: el lápiz de Gensmo para corregir lo que dijiste. No copiar: el destello y el emoji de Gensmo.
- **Dribbble, conceptos** — [VI] "Monochrome Precision" usa rótulos de autor en versalitas pequeñas ("JAMES",
  "SYSTEM") sobre cada intervención; "Research workspace" rotula "You" / "Answer" sin burbujas.
  `dribbble-monochrome-assistant-rotulos-de-autor.jpg` · https://dribbble.com/shots/27613521 ·
  `dribbble-research-workspace-etiquetas-tu-respuesta.jpg` · https://dribbble.com/shots/27512477
  - Bien: confirma nuestra firma "Estilo" en versalitas granate. No copiar: rotular cada mensaje (ruido); basta con el primero del turno.

### 2. Respuestas sugeridas y entradas estructuradas

- **Zalando Assistant** — [VI] sugerencias de seguimiento como píldoras de contorno **alineadas a la derecha** (lado
  de la persona), al final del turno. [VI texto] según su blog, ~40 % de las conversaciones parte de una sugerencia.
  `zalando-assistant-estado-tarjetas-fuentes.jpg`, `zalando-assistant-chat-sugerencias.jpg` ·
  https://corporate.zalando.com (artículo "conversational tool / lifestyle agent")
  - Bien: la posición dice "esto lo dirías tú". No copiar: emoji, el pulgar "¿Te sirvió?" en cada turno.
- **Duolingo Max (Roleplay)** — [VI] sugerencias de inicio de frase sobre el teclado; se completan escribiendo.
  `duolingo-roleplay-feedback-sugerencias.jpg` · https://blog.duolingo.com/duolingo-max
  - Bien: precargar para editar, no solo enviar. Útil en preguntas abiertas ("¿Algo de calce…?").
- **Cleo** — [VI] pregunta con voz propia y tres opciones en píldora. `cleo-pregunta-con-opciones.jpg` ·
  https://apps.apple.com (ficha Cleo)
  - No copiar: "Round 3/5" y temporizador: es el "paso X de Y" que DP-17 prohíbe.
- **The Shape of AI — Suggestions** — [VI] 3 a 6 opciones, contextuales, ejecutar o precargar; contraejemplo:
  sugerencias antes de tener contexto. https://www.shapeof.ai
- **Lupi (Dribbble)** — [VI] onboarding en chat con selector de fecha y campo de contraseña dentro de la burbuja.
  `dribbble-lupi-chat-onboarding.jpg` · https://dribbble.com/shots/5986014
  - Bien: la entrada estructurada vive en el turno. No copiar: mascota, emoji, botón "NEXT" (vuelve a ser formulario).

### 3. Onboarding conversacional que no se siente interrogatorio

- **ChatGPT shopping research** — [INFIERO] pregunta presupuesto y uso antes de buscar, como cuestionario corto.
  https://www.cnbc.com/2025/11/24/openai-announces-shopping-research-tool-in-latest-e-commerce-push.html
- **Lemonade (Maya)** — [INFIERO] una pregunta por vez, tipografía grande, el correo se pide al final. No vi el chat
  (las capturas de App Store no lo muestran). https://uxstudioteam.com/ux-blog/chatbot-ui
- **Pi** — [VI] el arranque es elegir una intención ("Just vent", "Help with a decision"), no responder preguntas.
- **Daydream** — [VI] el resultado del perfil es un "Style DNA" con frase-resumen y un deslizador de audacia
  ("Boldness") editable. https://daydream.ing/faqs
  - Bien: devuelve algo a cambio de las respuestas. Para Estilo: tras 3-4 respuestas, el asesor resume ("Clásico y
    minimalista: líneas limpias…") — ya está en el guion §4; reforzarlo como pequeña pieza editorial.
- **Google PAIR** — [VI] "Explain the benefit, not the technology", "Set the right expectations".
  https://pair.withgoogle.com/guidebook-v2/patterns
  - Para Estilo: cada pregunta dice para qué sirve (el guion ya lo hace con la ciudad y el clima: mantenerlo en todas).

### 4. Cómo se muestra que el agente trabaja

- **Claude Research** — [VI] narración en primera persona ("Ahora voy a buscar…") + fila de herramienta con ícono y
  verbo en pasado ("Searched Google Drive"); en curso, la etiqueta aparece a medio escribir y en gris. Las filas
  **quedan** en el hilo. `claude-research-narracion-y-pasos-de-herramienta.jpg`,
  `claude-research-paso-en-curso.jpg` · https://www.anthropic.com/news/research
- **Perplexity** — [VI] pestaña "Steps" separada de la respuesta: línea de tiempo vertical con una frase de plan,
  "Searching" con las consultas en chips, "Reviewing sources · 20" con lista de fuentes y "Finished". El detalle vive
  aparte; la respuesta queda limpia. `perplexity-pasos-del-agente.jpg` (vía https://www.shapeof.ai) · en la app
  móvil, [VI según subagente] pasos en gris pequeño con ">" para expandir:
  https://apps.apple.com/us/app/perplexity-ask-anything/id1668000334
- **Shop (Shopify) y Gensmo** — [VI] plegable "Assistant steps >" con una frase de plan (Shop); chips "Agent mode
  details >" y "Shopping list >" bajo la pregunta (Gensmo). El proceso se ofrece, no se impone.
  `shop-ai-pasos-y-carrusel.jpg` · https://shop.app
- **Iris (Dribbble)** — [VI] pasos con sub-detalle y chips de fuente ("Memory Base", "CRM"), y "Waiting the agent to
  write response". `dribbble-iris-razonamiento-transparente.jpg` · https://dribbble.com/shots/27545489
  - No copiar: orbe luminoso y tema oscuro.
- **Linear — Agent Interaction Guidelines** — [VI texto] acuse inmediato y discreto, estado visible (pensando,
  esperando, ejecutando, terminado), razonamiento inspeccionable. https://linear.app/developers/aig
- **Vercel AI SDK — Generative UI** — [VI texto] cada herramienta se dibuja según su estado (`input-available` →
  marcador; `output-available` → tarjeta; `output-error`). https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces
  - Para Estilo: el marcador de la tarjeta (esqueleto del look) puede aparecer **antes** del texto, en el lugar donde quedará.

### 5. Tarjetas ricas en el hilo

- **ChatGPT shopping research** — [VI, capturas de terceros] tarjeta por producto con "Not interested", "More like
  this" y "Skip"; resumen acumulado ("2 liked · 8 not interested"); detalle con tienda, precio y "Visit".
  `chatgpt-shopping-research-feedback.jpg` · https://www.seo.com (reseña con capturas)
- **Daydream** — [VI] chips de atributo bajo la respuesta (Navy, A-Line) y chips flotantes en el detalle ("More
  Like This", "Darker Colors"). `daydream-chat-chips-y-refinar.jpg`
- **Alta** — [VI] look con nombre de ocasión, prendas en flat-lay, guardar, editar, me gusta/no me gusta.
  `alta-outfit-por-ocasion.jpg` · https://apps.apple.com/us/app/alta/id6481705400
- **Gensmo** — [VI] looks en carrusel horizontal con guardar y "Try on"; debajo, preguntas siguientes en filas.
  `gensmo-chat-look-y-sugerencias.jpg`
- **Zalando** — [VI] tarjetas con bolsa, búsqueda visual de similares y "preguntar sobre esto"; precio, oferta y
  precio mediano. [VI texto] tarjetas con 92 % de interacción vs 65 % del texto solo.
- **Duolingo "Explain my answer"** — [VI] tarjeta de explicación corta con ejemplos subrayados y "Continue lesson".
  `duolingo-explain-my-answer.jpg`
  - No copiar en general: carruseles donde la segunda tarjeta queda cortada sin contexto (Aurora y Flights de
    Dribbble, `dribbble-aurora-moda-chat-carrusel.jpg`, `dribbble-flights-agente-viajes-tarjetas.jpg`). Para looks,
    **una** propuesta a la vez (nuestro DP-11: siempre con su porqué) y "Otra opción" como acción.

### 6. Fotos enviadas por la persona

- **Daydream "Image search"** — [VI] etiquetas sobre cada prenda reconocida en la foto (Crewneck Sweater, Wide Leg
  Pants), chips de intención debajo ("Style for Work") y "Chat to refine". `daydream-foto-prendas-reconocidas.jpg`
- **Style DNA** — [VI] tras subir una prenda, chip "Check if it matches me" → tarjeta "It's a Match" desglosada en
  Color, Shape, Print, Fabric con "?" y "Matches items from My Wardrobe". `styledna-chequeo-match-y-closet.jpg` ·
  https://styledna.ai
- **ChatGPT / Claude** — [VI] la foto queda como miniatura sobre el mensaje de la persona, a la derecha.
  `chatgpt-foto-de-la-persona-y-resultado.jpg`
- **Gemini Live con cámara** — [VI] pregunta hablada sobre la imagen en vivo. `gemini-camara-en-vivo.jpg` ·
  https://apps.apple.com/us/app/google-gemini/id6477489729
  - No para el MVP (costo y privacidad); referencia de futuro.

### 7. Memoria visible y control

- **ChatGPT** — [VI] rótulo "Memory updated" sobre la respuesta; al abrirlo muestra el recuerdo y "Manage memories".
  `chatgpt-memoria-actualizada-inline.jpg` · https://openai.com/index/memory-and-new-controls-for-chatgpt
- **Gemini** — [VI] lista de recuerdos con interruptor, "Add" y "Delete all". `gemini-memoria-editable.jpg`
- **Claude** — [VI texto] memoria por temas editable, "Pause memory", "Reset memory" (irreversible), chat incógnito.
  https://support.claude.com/en/articles/11817273 · [INFIERO] no hay aviso en el hilo: la memoria vive en Configuración.
- **Notion AI** — [VI texto] página editable de instrucciones que el agente actualiza; "memorias" aprendidas aparte.
  https://www.notion.com/help/notion-agent
- **Shape of AI — Memory** — [VI] nunca ocultarla, avisar cada guardado de forma liviana, editar, "borrar todo".
  - Para Estilo: lo que ya tenemos (MemoryNote + "Deshacer" + "Lo que sé de ti") es lo mejor del mercado; le falta el
    puente directo desde la nota a la lista.

### 8. Compositor

- **Claude** — [VI] "+", micrófono y enviar; chips de verbo y sugerencias por fuente **bajo** el compositor en la
  pantalla vacía. `claude-sugerencias-bajo-compositor.jpg`
- **Zalando** — [VI] cámara a la izquierda del campo en una versión, micrófono en otra; chip "Show me similar items".
- **Daydream** — [VI] "Chat to refine" como placeholder contextual tras una búsqueda por foto.
- **Perplexity** — [VI] placeholder "Ask a follow up…" una vez que hay respuesta.
  - Para Estilo: placeholder que cambia con el contexto ("Dime qué cambiarías del look…"); cámara sí, voz después.
    No vi comportamiento real con teclado móvil en ningún producto (son capturas fijas).

### 9. Acceso a lo acumulado sin romper la conversación

- **Menú editorial (Dribbble)** — [VI] "Chats", "Collections", "Flows" en tipografía grande con conteos
  superíndice. `dribbble-menu-editorial-colecciones.jpg` · https://dribbble.com/shots/27265967
  - Bien: la hoja "Tu espacio" puede ser así de editorial (títulos Bodoni con conteo) en vez de lista con íconos.
- **Alta** — [VI] clóset en grilla, calendario de looks, maleta por viaje (todo fuera del chat).
- **Concepto "ALTA" de Dribbble** — [VI] home tipo dashboard con "Ask Alta", look del día, clóset y estilos en
  bloques. `dribbble-alta-concepto-dashboard.jpg` · https://dribbble.com/shots/27784364
  - Es exactamente lo que DP-17 descartó ("interacción de app"). Sirve como contraejemplo.
- **Indyx** — [VI] la estilista firma el texto bajo el look en "The Feed": referencia de cómo se firma una
  explicación. https://apps.apple.com/us/app/indyx/id1599179405

### 10. Confianza y transparencia

- **Perplexity / Arc Search** — [VI] fuentes agrupadas por tipo con logo y conteo; Arc enlaza cada afirmación.
  `perplexity-fuentes-agrupadas.jpg`, `arc-search-browse-for-me.jpg` · https://www.macstories.net/reviews/arc-search-for-iphone/
- **Perplexity Shopping** — [VI texto] dice que las tarjetas no son patrocinadas, pero tiene un programa de comercios
  que aumenta la probabilidad de aparecer. https://www.perplexity.ai/hub/blog/shop-like-a-pro
  - Lección para DP-10: decir la afiliación **en la tarjeta**, no solo en la letra chica.
- **Cleo "Why 3%?"** — [VI] hoja que muestra el cálculo con los datos de la persona. `cleo-why-explicacion-recomendacion.jpg`
- **ChatGPT shopping** — [INFIERO] advierte que precio y stock pueden estar desactualizados. Instant Checkout se
  retiró (mar. 2026); hoy se compra en el comercio. **Gensmo** [VI] tiene "Buy Now" en la app: anti-patrón para DP-09.
- **Smashing Magazine (2026-02)** — [VI texto] "Explainable rationale", "Confidence signal", "Action audit & undo" y
  el anti-patrón "agentic sludge". https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/
  (`smashing-intent-preview.jpg` es imagen generada: vale como diagrama, no como producto).
- **Crosscheck (Dribbble)** — [VI] editorial serif + metadatos en versalitas y una señal de credibilidad numérica.
  `dribbble-crosscheck-fuentes-editorial.jpg` · https://dribbble.com/shots/27574835

### 11. Movimiento y micro-interacciones

- **Claude Research** — [VI en fotogramas] la etiqueta en curso se escribe; las filas aparecen una tras otra.
- **Zalando** — [VI, GIF] "Getting ready to show you items…" con tres puntos y una mancha naranja difusa.
- **Iris (Dribbble)** — [VI] "Thinking…" con texto en degradado y orbe. `dribbble-iris-estado-pensando.jpg`
- Lectura con `emil-design-eng`: el estado del asesor se ve decenas de veces al día → **mínimo**: crossfade de
  etiqueta (150 ms) y aparición de fila (opacity + translateY 4 px, ease-out, ≤ 200 ms). La tarjeta del look es
  ocasional → puede tener escalonado de fotos (ya está: 40 ms). Nada de orbes, brillo ni degradados (DESIGN.MD).
- No vi movimiento real en el resto (capturas fijas).

### 12. Anti-patrones

- **Glass y degradado violeta "IA"** — SoraAI, Aoura (Dribbble). `dribbble-soraai-antipatron-glass.jpg`,
  `dribbble-aoura-shopping-lujo.jpg` · https://dribbble.com/shots/27507074 · https://dribbble.com/shots/27551027
- **Robot/mascota como avatar del agente** y "AI is thinking…" en burbuja — e-commerce genérico.
  `dribbble-ai-stylist-ecommerce-antipatron.jpg` · https://dribbble.com/shots/27838332
- **Emoji en sugerencias** (Gensmo, Zalando) y **destello ✨ como marca de IA**.
- **Contador de rondas / "paso X de Y"** (Cleo "Round 3/5").
- **Home dashboard con chat como un módulo más** (concepto "ALTA").
- **"Buy Now" dentro del asistente** (Gensmo; Instant Checkout de ChatGPT, retirado).
- **Pulgares y "copiar/compartir" bajo cada respuesta**: ruido de herramienta que rompe la voz de columnista.
- **Tono sarcástico por defecto**: Cleo deja el modo "Roast" como opción que la persona activa, con frases vetadas
  (https://sifted.eu/articles/want-to-make-your-ai-chatbot-funny-hiring-comedians-is-a-start). Estilo no tiene ese modo.

---

## Recomendaciones para Estilo

Componentes en `web/src/components/chat/` según la propuesta de `UX_UI_SPEC.md` §7 (aún no existen en el repo).
**Spec:** = contradice o ajusta `UX_UI_SPEC.md` (no editado).

| # | Patrón (evidencia) | Cómo se traduce al hilo, con Atelier editorial | Componente | Esf. | Prio | Spec |
|---|---|---|---|---|---|---|
| 1 | Rastro de herramientas (Claude Research, Perplexity, Shop) | Mientras trabaja: etiqueta en gris con tres puntos granate (como hoy). Al terminar, **no desaparece**: se colapsa en una línea `text-sm text-tinta-suave` "Revisé tu clóset · miré el clima · armé el look" con chevron; abierta, una fila por paso con verbo en pasado y dato ("14 prendas", "9° a 21°"). | `tool-status.tsx` → `tool-trail.tsx` | M | Alta | **Ajusta §7.7** ("desaparece al primer text_delta") |
| 2 | Refinar sobre la tarjeta (Daydream, ChatGPT shopping, Gensmo) | Bajo las acciones del look, fila de Chips de un toque: "Más relajado", "Otro color", "Cambiar zapatos", "Más así". Envían un mensaje de la persona y el asesor responde con un look nuevo. "No es para mí" sigue con sus motivos. | `outfit-card.tsx` | M | Alta | **Ajusta §7.10** (hoy solo Guardar / No es para mí) |
| 3 | Tarjeta de producto honesta (Zalando, ChatGPT shopping, Perplexity) | Para DP-18: `ProductCard` con foto 3:4, tienda en versalitas, nombre, precio CLP, "Por qué te sirve" (1 línea, con qué de tu clóset combina), "Ver en la tienda" (terciario, sale de la app), nota fija "Precio y stock pueden cambiar" y, si aplica, "Enlace con comisión" visible. Acciones "Más así" / "No me interesa". Fuentes plegables al final del turno. | nuevo `product-card.tsx`, `sources.tsx` | L | Alta (sujeta a A-01) | **Contradice J4 y §7.10.6** ("sin productos ni links", DP-07; superado por DP-18) |
| 4 | Foto con prendas etiquetadas (Daydream) | Si la foto trae varias prendas (persona vestida), el asesor devuelve la foto con rótulos `bg-superficie/90 text-xs` sobre cada prenda; cada rótulo es un botón "Guardar en mi clóset". Debajo, sugerencias "Guárdalas todas" · "Dime qué opinas". | `photo-message.tsx` + `garment-tags.tsx` | L | Media | **Ajusta J3 / §7.6** (hoy solo pregunta en texto) |
| 5 | Memoria con puente a la lista (ChatGPT) | MemoryNote igual (sin fondo), con dos terciarios: "Deshacer" y "Lo que sé de ti" (abre `/yo#memoria`). | `memory-note.tsx` | S | Alta | Ajusta §7.14 (agrega enlace) |
| 6 | Porqué con evidencia (Cleo, Style DNA) | En "Por qué funciona", tras el párrafo, chips de solo lectura con la evidencia: muestra de color de la paleta, "9° a 21°", "Oficina". Son datos, no botones. | `outfit-card.tsx` | S | Media | Complementa §7.10.5 |
| 7 | Marcador en su lugar (Vercel generative UI) | Al empezar `propose_outfit`, aparece el esqueleto de la OutfitCard (`bg-hundido animate-respirar`, mismo aspect-ratio) donde quedará; el texto llega después. Evita saltos de layout. | `outfit-card.tsx` (estado `cargando`) | S | Media | Complementa §7.7 |
| 8 | Sugerencias en la voz de la persona (Zalando, Duolingo) | En el onboarding se quedan sobre el compositor (spec actual). Las de seguimiento después de un resultado van **al final del turno, alineadas a la derecha**, contorno `border-linea-fuerte`, como frases que la persona diría. Opción "Escribir otra cosa" precarga el campo. | `suggested-replies.tsx` | M | Media | **Ajusta §7.8** ("viven sobre el compositor, no dentro del hilo") |
| 9 | Placeholder contextual (Daydream, Perplexity) | El placeholder del compositor cambia según el último turno: "Escríbele a tu asesor…" → "Dime qué cambiarías del look…" → "Cuéntame para qué ocasión…". | `composer.tsx` | S | Baja | Complementa §7.9 |
| 10 | Editar mi último mensaje (Gensmo) | Toque largo / ícono lápiz en el último PersonMessage → vuelve al compositor y el asesor rehace. | `person-message.tsx` | M | Baja | Nuevo |
| 11 | Arranque por intención (Pi, ChatGPT shopping) | En un día nuevo, el saludo trae 3 intenciones con voz propia como Chips: "Qué me pongo hoy", "Tengo algo especial", "Mira esta prenda". Sin tarjetas ilustradas: el papel y la tipografía bastan. | `suggested-replies.tsx` | S | Baja | Coincide con J2 |
| 12 | Rótulo de autor mínimo (Monochrome, Research workspace) | Mantener "Estilo" en versalitas granate solo en el primer bloque del turno (spec actual). No rotular a la persona. | `advisor-message.tsx` | — | — | Confirma §7.4 |
| 13 | Tu espacio editorial (menú Dribbble) | Hoja con títulos `font-display text-2xl` y conteo en superíndice ("Tu clóset ¹⁸") en vez de ícono + bajada. | `space-sheet.tsx` | S | Baja | Ajusta §7.16 (opcional) |
| 14 | Movimiento mínimo (emil-design-eng) | Estado: crossfade 150 ms. Fila nueva del rastro: opacity + translateY(4px), 180 ms `ease-salida`. Chips de refinamiento: entran después de la tarjeta (no a la vez). Nada de orbes ni degradados. | `tool-trail.tsx`, `outfit-card.tsx` | S | Media | Coherente con §8 |

**No recomiendo:** voz en vivo y cámara en vivo en el MVP; pulgares en cada respuesta (ya tenemos Guardar / No es
para mí); carrusel de varios looks por turno; avatar o mascota del asesor; "Buy Now" de cualquier tipo.

---

## Tablero de referencias

**Voz y tarjetas en el hilo**
- https://apps.apple.com/us/app/claude-by-anthropic/id6473753684
- https://apps.apple.com/us/app/pi-your-personal-ai/id6445815935
- https://apps.apple.com/us/app/chatgpt/id6448311069
- https://dribbble.com/shots/27613521 (rótulos de autor)
- https://dribbble.com/shots/27512477 (You / Answer sin burbujas)

**Trabajo visible y estados**
- https://www.anthropic.com/news/research
- https://apps.apple.com/us/app/perplexity-ask-anything/id1668000334
- https://linear.app/developers/aig
- https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces
- https://dribbble.com/shots/27545489 (Iris)

**Moda y compras**
- https://daydream.ing · https://daydream.ing/faqs
- https://apps.apple.com/us/app/alta/id6481705400
- https://gensmo.com
- https://styledna.ai
- https://corporate.zalando.com (Zalando Assistant)
- https://shop.app
- https://www.perplexity.ai/hub/blog/shop-like-a-pro
- https://www.cnbc.com/2025/11/24/openai-announces-shopping-research-tool-in-latest-e-commerce-push.html

**Memoria y control**
- https://openai.com/index/memory-and-new-controls-for-chatgpt
- https://support.claude.com/en/articles/11817273
- https://www.notion.com/help/notion-agent

**Explicar y dar confianza**
- https://blog.duolingo.com/duolingo-max
- https://sifted.eu/articles/want-to-make-your-ai-chatbot-funny-hiring-comedians-is-a-start (Cleo)
- https://www.macstories.net/reviews/arc-search-for-iphone/

**Bibliotecas de patrones**
- https://www.shapeof.ai
- https://pair.withgoogle.com/guidebook-v2/patterns
- https://www.microsoft.com/en-us/haxtoolkit/
- https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/

**Contraejemplos**
- https://dribbble.com/shots/27784364 (dashboard "ALTA", concepto)
- https://dribbble.com/shots/27507074 (glass violeta)
- https://dribbble.com/shots/27838332 (e-commerce con robot)

---

## Lo que no pude ver y por qué

- **Pinterest**: la búsqueda muestra un modal de inicio de sesión sobre los resultados. No lo salté ni creé cuenta.
  Lo que se alcanzaba a ver detrás parecían reposts de Dribbble.
- **Behance**: público, pero los resultados para "ai stylist chat app" fueron fintech y cripto genéricos; sin valor.
- **Mobbin**: no lo intenté (las pantallas completas requieren cuenta).
- **Interfaz real con sesión**: no vi onboarding, historial, memoria ni perfil dentro de ninguna app; todo viene de
  capturas oficiales de marketing, blogs y reseñas.
- **ChatGPT**: openai.com y help.openai.com respondieron 403; shopping research y "Memory updated" se vieron en
  capturas de terceros (seo.com, shapeof.ai).
- **Lemonade (Maya), Cleo (hilo), Airbnb, Klarna, Linear, Notion**: sus capturas públicas no muestran el chat o el
  agente; lo que se dice de ellos está marcado [INFIERO] o viene de texto oficial.
- **Movimiento real**: solo en el GIF de Zalando y fotogramas del video de Claude Research. El resto, capturas fijas.
- **Comportamiento del teclado móvil**: ninguna fuente pública lo muestra.
- **Duplicado**: dos subagentes guardaron `perplexity-pasos-del-agente.jpg`; quedó la versión web (pestaña
  "Steps", tomada de shapeof.ai). La captura de la app móvil con pasos expandibles se perdió al sobrescribirse.
