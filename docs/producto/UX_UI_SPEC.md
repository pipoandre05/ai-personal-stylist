# UX_UI_SPEC — Estilo (ai-personal-stylist)

Versión 0.2 — 2026-11-14. Documento dueño de dirección visual, modelo de interacción, componentes y pantallas.
Resumen operativo (tokens, reglas, errores): `DESIGN.MD` en la raíz. Tokens: `web/src/app/globals.css` (sin cambios en v0.2).
Maqueta: `docs/superpowers/mockups/2026-11-14-mvp.html`.

Convención: **[OBS]** = observación propia de UX/UI (no es investigación ni dato medido). Las decisiones se citan
por ID de `DECISION_LOG.md`. **v0.2 aplica DP-17 (conversación primero)**: reemplaza las 4 pestañas, `/bienvenida`
y el onboarding por pasos de la v0.1.

---

## 1. Dirección visual: "Atelier editorial" (aprobada, sin cambios)

Una revista de moda que te conoce: papel hueso (`fondo`), tinta casi negra (`tinta`), un granate (`acento`) como
única nota de color; títulos en Bodoni Moda (`font-display`), cuerpo en Hanken Grotesk (`font-body`). Las
protagonistas son las fotos reales de las prendas.

Aplicado a la conversación: **el asesor escribe como una columnista**, no como un bot. Su texto va sin burbuja,
a ancho completo, con buen interlineado; lo que produce (looks, prendas, paleta) aparece como **piezas
editoriales dentro del hilo**: tarjetas con foto, título en Didone y un "por qué". La persona sí se distingue
con un bloque `acento-suave` alineado a la derecha.

Principios de referentes **[OBS]**: SSENSE / Net-a-Porter (tipografía como marca, producto en grilla limpia);
COS (paleta casi monocroma, fondo de foto consistente); Aesop (texto largo tratado como lujo, explica en vez de
vender); Whering / Indyx (recortes uniformes de prenda); Alta / Style DNA (el valor llega como look armado y
paleta, no como chat abierto); lifestyle premium (pocas acciones, cero urgencia).

## 2. Principios de experiencia

1. **Es una conversación, no una app con chat** (DP-17). La pantalla principal es el hilo. No hay pestañas,
   formularios por pasos ni barras de progreso. Todo lo que se hace, se hace hablando o tocando algo en el hilo.
2. **Una cosa por turno.** El asesor pregunta de a una y ofrece respuestas sugeridas; la persona siempre puede
   escribir con sus palabras o decir "ahora no".
3. **Todo resultado es una tarjeta en el hilo**: look, prenda reconocida, paleta, nota de memoria. Se puede
   actuar sobre ella ahí mismo (guardar, corregir, ajustar, deshacer).
4. **Siempre el porqué** (DP-11), en lenguaje llano, en el texto o en la tarjeta.
5. **El asesor decide qué hacer con una foto** (DP-17): prenda → clóset; selfie → paleta; algo que la persona
   evalúa comprar → criterio en texto. Si duda, pregunta.
6. **Transparente y respetuoso**: la paleta es orientativa (DP-05); la selfie no se guarda (DP-16, R-04); sobre
   el cuerpo, calce y proporción (DP-12); nada se compra (DP-09).
7. **Tu espacio es para consultar**, no para operar: clóset, looks y perfil están a un toque, pero el camino
   natural vuelve siempre a la conversación.
8. **Valor antes de esfuerzo** (DP-04, DP-06): primer look con 3 prendas en la primera conversación.

## 3. Arquitectura de información

```
/            Portada pública (promete una conversación)
/entrar      Crear cuenta / entrar
/asesor      EL HILO con el asesor (pantalla principal, start_url de la PWA)
  └─ hoja "Tu espacio" (desde el encabezado)
       ├─ /closet          Tu clóset (consulta) → /closet/[id] (detalle y edición fina)
       ├─ /looks           Tus looks (guardados)
       ├─ /yo              Tu perfil: estilo, lo que sé de ti (memoria), privacidad, borrar datos
       │   └─ /yo/paleta   Tu paleta (detalle y ajuste)
       └─ Cerrar sesión
```

- **Se eliminan** (DP-17): `BottomNav`, `/bienvenida`, `/closet/nueva` (las prendas entran por el chat).
- **Propuesta para el integrador**: mantener `/asesor` como ruta del hilo (ya es `start_url`) y las rutas de Tu
  espacio tal como están; `/` redirige a `/asesor` si hay sesión; la primera visita a `/asesor` sin perfil
  inicia la conversación de bienvenida (no hay ruta aparte).
- Una sola conversación continua (R-16).

## 4. Guion de la primera conversación

Textos reales. **A** = asesor (texto editorial). **P** = persona. `[sugerencias]` = respuestas sugeridas
(simple: un toque envía; múltiple: se marcan y "Listo" envía). Cada pregunta del perfil corresponde a un campo de
`style_profiles` (herramienta `update_profile`). Todas admiten "Ahora no" o texto libre (R-13).

1. **A**: "Hola, soy Estilo, tu asesor de imagen. Te ayudo a verte como quieres verte, partiendo por la ropa que
   ya tienes. Te haré algunas preguntas cortas: toca una respuesta o escríbeme con tus palabras."
   **A**: "Para partir, ¿en qué sección sueles comprar ropa?" `[Mujer · Hombre · Las dos]` (múltiple)
2. **P**: "Mujer". **A**: "Perfecto. ¿En qué ciudad vives? La uso solo para mirar el clima antes de proponerte algo."
   `[Santiago · Valparaíso · Concepción]` (simple; otra ciudad, escribiendo)
3. **A**: "¿Para qué te vistes más en una semana normal?" `[Oficina · Día a día · Citas · Eventos · Viajes · Deporte]` (múltiple)
4. **A**: "¿Cómo describirías tu estilo hoy?" `[Clásico · Casual · Minimalista · Romántico · Urbano · Bohemio · Sofisticado · Deportivo · No sé bien]` (múltiple)
   **P**: "Clásico, Minimalista". **A**: "Clásico y minimalista: líneas limpias, pocos colores, buenas telas. Me sirve harto."
5. **A**: "¿Y cómo te gustaría verte? Puede ser igual que hoy o algo distinto." `[Igual que hoy · Con más presencia · Con más soltura · Con más color · Con más orden]` (múltiple; opciones sin género gramatical, DP-13)
6. **A**: "¿Algo de calce o comodidad que deba saber?" `[Holgado · Entallado · Tiro alto · Sin tacos · Sin lana · Nada en especial]` (múltiple)
7. **A**: "Cuando te propongo algo, ¿prefieres ir a la segura o probar cosas nuevas?" `[A la segura · Un poco distinto · Atrevido]` (simple)
8. **Selfie (opcional)** — **A**: "Ahora algo opcional. Si me mandas una selfie, te doy una paleta de colores
   orientativa: los tonos que tienden a iluminarte la cara. Es una orientación a partir de una foto, no un
   diagnóstico. **La foto se usa solo para el análisis y se borra apenas termino; guardo solo el resultado.**"
   `[Mandar selfie · Ahora no]`
   - "Mandar selfie" → **tarjeta de consentimiento** en el hilo (R-03, `face_photo`): "Autorizo analizar mi
     selfie para estimar mi paleta. Se borra al terminar." + "Aceptar y abrir cámara" / "Mejor no".
   - Pensando: "Mirando tu tono de piel…" → **tarjeta de paleta**.
   - **A**: "Te salió otoño cálido, con confianza media: la luz venía de un costado. Tómalo como punto de partida;
     si algo no te calza, toca Ajustar." (Selfie ya borrada; la tarjeta lo dice.)
9. **Prendas** — **A**: "Ahora lo más importante: tu ropa. Mándame fotos de 3 a 5 prendas que uses harto, una
   por foto. Sirve la prenda estirada en la cama o colgada en una puerta, con luz de día."
   `[Mandar foto · Cómo saco buenas fotos]`
   - **P** manda foto. Pensando: "Reconociendo la prenda…" → **tarjeta de prenda** ("Está bien" / "Corregir").
   - **A** (tras confirmar): "Van 2. Con una más ya te armo algo."
10. **Primer look** (con 3 prendas) — **A**: "Con esto ya puedo armarte algo. ¿Para qué ocasión?"
    `[Mañana en la oficina · Un fin de semana · Una cita]` (simple; vienen de las ocasiones elegidas)
    - Pensando: "Revisando tu clóset…" → "Mirando el clima…" → "Armando el look…" → **OutfitCard**.
    - **A**: "Si no te convence, dime por qué y lo ajusto. Puedes seguir mandándome prendas cuando quieras."

## 5. Journeys

### J1. Primera vez (activación: primer look útil en la primera sesión, DP-04)

Portada → "Empezar" → `/entrar` (cuenta + términos, R-03) → `/asesor` abre con el guion §4. La persona puede
saltar cualquier pregunta; si salta las prendas, el asesor no propone looks y lo dice: "Sin ver tu ropa no puedo
armarte nada que de verdad tengas. Cuando quieras, mándame una foto."

### J2. "¿Qué me pongo mañana?"

- Abre la PWA → hilo, último mensaje a la vista. Si no hay conversación hoy, el asesor saluda con sugerencias:
  **A**: "Hola, Catalina. ¿Para qué te vistes hoy?" `[Mañana en la oficina · Hoy · Fin de semana · Algo especial]`
- **P**: "Mañana en la oficina, tengo reunión con clientes."
- Pensando: "Revisando tu clóset…" → "Mirando el clima…" → "Armando el look…".
- **A**: "Mañana parte frío y termina templado, así que te propongo capas: algo que impone en la reunión y que
  puedas sacarte a la hora de almuerzo." → **OutfitCard**.
- **P** toca "No es para mí" → motivos en la tarjeta → elige "Muy formal" → **nota de memoria**: "Anotado: para la
  oficina prefieres algo menos formal." `Deshacer` → **A** propone otra opción.

### J3. Agregar prenda (en cualquier momento)

- **P** toca el botón de foto del compositor, elige o saca una foto (puede agregar texto: "esta es nueva").
- Aparece la **foto enviada** en el hilo; pensando: "Reconociendo la prenda…".
- **A**: "Es un blazer de lino crudo. Revisa si lo vi bien." → **tarjeta de prenda**.
  - "Está bien" → la tarjeta queda "En tu clóset" (check). **A**: "Con este blazer ya tienes 3 looks nuevos para la oficina."
  - "Corregir" → la tarjeta pasa a modo edición (nombre, categoría, colores) → "Guardar cambios".
  - No reconocida (R-07): tarjeta en estado "Completar datos": "No pude reconocerla bien. Complétala tú, son 3 datos."
  - No es una prenda: sin tarjeta. **A**: "No veo una prenda en la foto. ¿Me mandas la prenda sola, sobre una superficie lisa?"
- Si la foto es ambigua (persona con ropa puesta): **A** pregunta: "¿Quieres que guarde esta prenda en tu clóset
  o que te diga si te queda bien?" `[Guardar en mi clóset · Dime qué opinas]` (R-17 queda resuelta así; ver §12).

### J4. Ocasión especial con prenda faltante

- **P**: "Tengo un matrimonio de día el sábado." **A** pregunta lo mínimo si falta: "¿Al aire libre o en salón?"
  `[Al aire libre · En salón · No sé]`
- Pensando → **OutfitCard** con **"Lo que lo completaría"**: "Unos zapatos nude de taco bajo: alargan la línea del
  vestido sin competir con el estampado." Sin productos ni links (DP-07).
- Si falta una categoría base (R-11): sin tarjeta. **A**: "Para un matrimonio me falta ver tus zapatos más
  formales. ¿Me mandas una foto?" `[Mandar foto · No tengo]`. "No tengo" → **A** describe qué buscar y por qué.
- **Duda de compra** (foto de algo que evalúa): **A** responde con criterio en texto: con qué de su clóset combina,
  si se parece a algo que ya tiene, en qué ocasiones lo usaría. Nunca un link ni un "cómpralo" (DP-09; RF-17 completo en V1.1).

### J5. Control de datos y memoria

- Cada hecho nuevo aparece en el hilo como **nota de memoria** con "Deshacer" (borra el hecho).
- **P**: "¿Qué sabes de mí?" → **A** resume en texto y cierra con el enlace "Ver todo en tu perfil" (abre `/yo`).
- `/yo` → "Lo que sé de ti": cada hecho con origen y fecha y "Borrar". Al final, separado: "Borrar todos mis datos"
  → confirmación que lista lo que se borra (prendas y fotos, paleta, looks, conversación, memoria) y pide escribir
  "BORRAR". Irreversible, se dice así (R-02).

## 6. Pantallas

### 6.1 Portada `/`

- Wordmark "Estilo" (`font-display text-2xl italic`). Composición de 3 marcadores de prenda.
- Sobretítulo "Tu asesor de imagen". h1 `font-display text-4xl leading-[1.05]`:
  "Cuéntale a tu asesor *qué necesitas*." (cursiva `text-acento`).
- Muestra de conversación (estática, `aria-hidden` no: es contenido): una línea de persona en bloque
  `acento-suave` ("¿Qué me pongo mañana para la oficina?") y debajo, en texto editorial: "Te armo un look con tu
  ropa y te digo por qué funciona."
- Primario ancho completo: "Empezar la conversación". Terciario: "Ya tengo cuenta". Nota `text-xs text-tinta-suave`:
  "Tus fotos son privadas y tu selfie no se guarda."

### 6.2 Cuenta `/entrar`

Sin cambios de la v0.1: email + contraseña, casilla de términos (R-03), errores bajo el campo. Éxito → `/asesor`.

### 6.3 Hilo `/asesor`

Estructura (de arriba a abajo), contenedor `mx-auto flex min-h-dvh w-full max-w-app flex-col bg-fondo`:

1. **ChatHeader** (sticky).
2. **Thread** (`flex-1`): mensajes, tarjetas, indicador de herramienta.
3. **SuggestedReplies** (cuando el último turno del asesor las trae).
4. **Composer** (sticky abajo).

Estados de pantalla:
- Cargando historial: 3 líneas `h-4 rounded-xs bg-hundido animate-respirar` de ancho 90/75/60 %.
- Primera vez: el hilo arranca con el saludo del guion §4 (sin pantalla vacía).
- Error de carga: bloque de error (§7.15) "No pude cargar la conversación." + "Reintentar".
- Sin conexión: aviso fijo bajo el encabezado `bg-alerta-suave text-alerta text-sm px-5 py-2`: "Sin conexión. Tu mensaje se enviará cuando vuelvas." y Enviar deshabilitado.
- Límite diario (R-15): mensaje del asesor: "Por hoy llegamos al máximo de mensajes. Mañana seguimos." y compositor deshabilitado con ese texto.

### 6.4 Vistas de Tu espacio (`/closet`, `/closet/[id]`, `/looks`, `/yo`, `/yo/paleta`)

Todas con **SpaceHeader** ("Volver a la conversación") y un h1 editorial. Sin barra inferior. Sin botones para
crear: el CTA de cada vista vacía devuelve a la conversación con una sugerencia precargada.

- **Tu clóset** `/closet`: h1 "Tu clóset" + "18 prendas"; filtro por categoría (Chips en fila con scroll horizontal:
  Todo · Partes de arriba · Partes de abajo · Vestidos · Abrigos · Calzado · Carteras · Accesorios); galería
  `grid grid-cols-3 gap-x-2 gap-y-4` de GarmentTile. Vacío: "Tu clóset está vacío" + "Mandar una foto al asesor"
  (vuelve a `/asesor` con el selector de foto abierto).
- **Detalle** `/closet/[id]`: foto 3:4, nombre `font-display text-2xl`, datos (categoría, colores, ocasiones,
  formalidad en texto), favorita (`aria-pressed`). Edición fina: "Editar prenda" (formulario simple con Input y
  Chips) y "Archivar prenda" (R-10; confirmación inline "¿Archivar? Dejará de aparecer en tus looks.").
- **Tus looks** `/looks`: lista `space-y-6` de OutfitCard compacta (sin acciones, con "Guardado el 14 nov").
  Vacío: "Aún no guardas looks" + "Pedirle un look al asesor".
- **Tu perfil** `/yo`: tarjeta de perfil (monograma + ciudad + conteos); secciones con h2 `font-display text-2xl`
  y `border-t border-linea pt-8`: Tu paleta (compacta + "Ver tu paleta"), Tu estilo (chips de solo lectura +
  "Cambiar en la conversación" → `/asesor` con "Quiero cambiar mi estilo"), Lo que sé de ti (memoria con "Borrar"),
  Privacidad ("Tus fotos están en un espacio privado. Tu selfie se borró después del análisis."), zona de borrado.
- **Tu paleta** `/yo/paleta`: PaletteCard en variante completa + `rationale` + "Ajustar" + "Mandar otra selfie"
  (vuelve al hilo). Si fue elegida a mano: "Elegida por ti" (R-08).

## 7. Componentes

Ubicación sugerida: `web/src/components/chat/` (hilo) y `web/src/components/espacio/` (Tu espacio); se reutilizan
`Button`, `Chip`, `Input`, `Sheet`, `Toast`, `icons` de `components/ui/`. Íconos SVG inline 24×24, trazo 1.5.

### 7.1 Button, Chip, Input

Sin cambios respecto de la v0.1 (clases en `DESIGN.MD` §3). Recordatorio:
- Button base `inline-flex h-12 min-w-11 items-center justify-center gap-2 rounded-sm px-5 font-body text-base font-semibold transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`;
  primario `bg-tinta text-superficie hover:opacity-90`; secundario `border border-tinta bg-transparent text-tinta hover:bg-hundido`;
  terciario `h-11 px-2 font-medium text-acento underline decoration-1 underline-offset-4`; destructivo `bg-error text-superficie`.
  Tamaño compacto dentro de tarjetas: `h-11 px-4 text-sm`.
- Chip base `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.97]`;
  off `border-transparent bg-hundido text-tinta`; on `border-acento bg-acento-suave text-acento` + check.
- Input `h-12 w-full rounded-sm border border-linea-fuerte bg-superficie px-4 text-base text-tinta placeholder:text-tinta-suave focus-visible:border-acento`.

### 7.2 ChatHeader — `chat-header.tsx`

`sticky top-0 z-20 border-b border-linea bg-fondo/90 backdrop-blur-md pt-seguro` → `flex h-14 items-center justify-between px-5`.
- Izquierda: wordmark `<h1 class="font-display text-2xl italic">Estilo</h1>`.
- Derecha: botón "Tu espacio": `inline-flex min-h-11 items-center gap-2 rounded-full border border-linea-fuerte px-4 text-sm font-medium text-tinta`
  con ícono de cuadrícula 2×2 `size-4`; `aria-haspopup="dialog"`, `aria-expanded`.
- Nada más (sin clima, sin campana, sin avatar).

### 7.3 Thread y ritmo — `thread.tsx`

- `<section aria-label="Conversación con tu asesor" class="flex flex-1 flex-col gap-6 px-5 pt-6 pb-4">`.
- Un **turno del asesor** es un grupo `flex flex-col gap-4` con: texto(s), tarjeta(s), nota(s) de memoria.
- Entre turnos de distinto autor: `gap-6`. Separador de día (si cambia la fecha):
  `flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave` con `h-px flex-1 bg-linea` a los lados ("Hoy", "Ayer", "12 nov").
- Ancla final `<div aria-hidden class="h-px">` para el scroll.
- Botón "Ir al último mensaje" (si la persona subió más de una pantalla): `sticky bottom-3 mx-auto flex size-11 items-center justify-center rounded-full bg-tinta text-superficie shadow-flotante`, `aria-label="Ir al último mensaje"`.

### 7.4 AdvisorMessage — `advisor-message.tsx`

- Sin burbuja, sin avatar, ancho completo: `text-base leading-relaxed text-tinta [&_p+p]:mt-3`.
- Firma solo en el primer bloque del turno: `mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-acento` "Estilo".
- `<em>` → `font-display text-lg italic`. `<strong>` → `font-semibold`. Listas con guion largo `pl-4`.
- Enlaces internos (p. ej. "Ver todo en tu perfil"): terciario inline `text-acento underline underline-offset-4`.
- Streaming: el texto crece en su contenedor; un cursor `inline-block h-4 w-px translate-y-0.5 bg-acento animate-respirar` al final mientras llega.
- Error del turno: `border-l-2 border-error pl-3` + "Se cortó mi respuesta. Tu mensaje quedó guardado." + Button terciario "Reintentar".

### 7.5 PersonMessage — `person-message.tsx`

`ml-auto w-fit max-w-[85%] rounded-lg rounded-br-xs bg-acento-suave px-4 py-3 text-base text-tinta whitespace-pre-wrap`.
Estado enviando: `opacity-70`; fallido: debajo `text-sm text-error` "No se envió." + terciario "Reintentar".

### 7.6 PhotoMessage — `photo-message.tsx`

Foto enviada por la persona, alineada a la derecha:
`ml-auto w-3/5 overflow-hidden rounded-lg rounded-br-xs bg-hundido` → `img aspect-[3/4] size-full object-cover`.
Texto adjunto (si hay) como PersonMessage justo debajo (`mt-1.5`). Subiendo: capa `absolute inset-0 bg-tinta/30` +
spinner `text-superficie` y `sr-only` "Subiendo foto". Si es una selfie, tras el análisis la imagen se reemplaza por
un marcador `aspect-[3/4] bg-hundido` con `text-xs text-tinta-suave` "Selfie borrada después del análisis" (R-04).

### 7.7 ToolStatus (pensando) — `tool-status.tsx`

`<div role="status" class="flex items-center gap-3 text-sm text-tinta-suave">` + tres puntos
`size-1.5 rounded-full bg-acento animate-respirar` (el 2.º y 3.º con `[animation-delay:150ms]` y `[animation-delay:300ms]`) + etiqueta:

| Herramienta / evento | Texto |
|---|---|
| (antes de la primera herramienta) | "Pensando…" |
| `get_closet` | "Revisando tu clóset…" |
| `get_weather` | "Mirando el clima…" |
| `propose_outfit` | "Armando el look…" |
| `add_garment` | "Reconociendo la prenda…" |
| `analyze_palette` | "Mirando tu tono de piel…" |
| `update_profile` | "Anotando en tu perfil…" |
| `remember` | "Anotando lo que me contaste…" |

Cambio de etiqueta con crossfade de opacidad (150ms). Desaparece al primer `text_delta` posterior a la última herramienta.

### 7.8 SuggestedReplies — `suggested-replies.tsx`

Respuestas de un toque que trae el último turno del asesor. Viven **sobre el compositor**, no dentro del hilo.

- Contenedor: `<div role="group" aria-label="Respuestas sugeridas" class="flex flex-wrap gap-2 px-5 pb-3 animate-aparecer">`.
  Si son más de 6 o largas: una fila `flex gap-2 overflow-x-auto` con `scroll-px-5`.
- **Simple**: Chip atajo `border-linea-fuerte bg-superficie text-tinta`; tocar = enviar ese texto como mensaje de la persona.
- **Múltiple**: Chips con `aria-pressed` (off/on como Chip); al final, Button primario compacto
  `h-11 rounded-full px-5 text-sm` "Listo" (deshabilitado sin selección) que envía "Clásico, Minimalista".
- Opción de salida siempre que el asesor la ofrezca ("Ahora no", "No sé bien") como Chip atajo al final.
- Acción especial "Mandar foto" / "Mandar selfie": Chip atajo con ícono de cámara que abre el selector (no envía texto).
- Al escribir en el compositor, las sugerencias siguen visibles; al enviar cualquier mensaje desaparecen
  (`opacity` 150ms). En el hilo, la respuesta elegida queda como PersonMessage normal.

### 7.9 Composer — `composer.tsx`

`sticky bottom-0 z-20 border-t border-linea bg-fondo/90 backdrop-blur-md pb-seguro` → interior `flex items-end gap-2 px-5 pt-3 pb-3`.

- **Foto**: `<label class="flex size-11 shrink-0 items-center justify-center rounded-full border border-linea-fuerte text-tinta">`
  con ícono cámara y `<input type="file" accept="image/*" class="sr-only">`; `aria-label="Mandar una foto"`.
  (Para selfie, el asesor abre el selector con `capture="user"`.)
- **Campo**: `<label class="sr-only" for="mensaje">Escríbele a tu asesor</label>` +
  `textarea#mensaje rows=1 max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-linea-fuerte bg-superficie px-4 py-2.5 text-base text-tinta placeholder:text-tinta-suave`,
  `enterkeyhint="send"`, placeholder "Escríbele a tu asesor…". Crece hasta 5 líneas.
- **Enviar**: `flex size-11 shrink-0 items-center justify-center rounded-full bg-tinta text-superficie disabled:opacity-40`, `aria-label="Enviar"`. Deshabilitado si no hay texto ni foto.
- **Vista previa de foto** (antes de enviar): sobre el campo, `relative mb-2 w-20` con `img aspect-[3/4] rounded-md object-cover` y botón quitar `absolute -top-2 -right-2 size-11` (área táctil) con círculo visual `size-6 rounded-full bg-tinta text-superficie`, `aria-label="Quitar foto"`.
- Estados: **respondiendo** (stream abierto) → Enviar se vuelve "Detener" (ícono cuadrado, `aria-label="Detener respuesta"`), foto deshabilitada; **sin conexión / límite** → campo `disabled` con placeholder explicativo.
- Teclado: Enter envía en desktop; en móvil Enter hace salto de línea y se envía con el botón (`enterkeyhint="send"` igual).

### 7.10 OutfitCard (tarjeta de look) — `outfit-card.tsx`

Igual que v0.1 en anatomía, dentro del turno del asesor:
`<article aria-labelledby class="animate-aparecer rounded-md border border-linea bg-superficie p-4">`

1. Sobretítulo `text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave`: ocasión + clima si existe (R-01).
2. Título `mt-1 font-display text-2xl`.
3. Composición de 2–7 fotos (R-05), contenedor `mt-4 grid gap-1.5`, celdas `relative overflow-hidden rounded-sm bg-hundido`, `img size-full object-cover`:

   | Prendas | Contenedor | Celdas |
   |---|---|---|
   | 2 | `grid-cols-2 aspect-[3/2]` | iguales |
   | 3 | `grid-cols-2 grid-rows-2 aspect-[4/5]` | héroe `row-span-2` |
   | 4 | `grid-cols-2 grid-rows-3 aspect-[4/5]` | héroe `row-span-3` |
   | 5 | `grid-cols-6 grid-rows-[3fr_2fr] aspect-[4/5]` | 2 arriba `col-span-3`, 3 abajo `col-span-2` |
   | 6–7 | `grid-cols-3 grid-rows-[3fr_2fr_2fr] aspect-[4/5]` | héroe `col-span-2 row-span-2`, resto 1×1 |

4. Prendas: `mt-3 text-sm text-tinta-suave`, nombres separados por " · ", enlaces a `/closet/[id]`.
5. "Por qué funciona": rótulo `mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-acento` + `mt-1.5 text-base text-tinta`.
6. "Lo que lo completaría" (opcional): `mt-4 flex gap-3 rounded-sm border border-dashed border-linea-fuerte p-3` + marcador `size-14 shrink-0 rounded-xs border border-dashed border-linea-fuerte bg-fondo` + `text-sm font-semibold` / `text-sm text-tinta-suave`. Sin compra.
7. Acciones `mt-5 grid grid-cols-2 gap-2`: "Guardar look" (primario compacto) · "No es para mí" (secundario compacto).

Estados: **guardado** → secundario con check "Guardado" + fila "¿Qué tanto te gustó?" con Chips "Me encanta" (`love`) / "Me sirve" (`ok`);
**no es para mí** → Chips de motivo (simple): "No es mi estilo" · "Muy formal" · "Muy casual" · "No me acomoda" · "Otro motivo" → `rating: 'no'`
→ texto `text-sm text-tinta-suave` "Anotado. Lo tendré en cuenta." y `opacity-70`; el asesor continúa con otra opción;
**foto caída** → celda con ícono y nombre `text-xs text-tinta-suave`; **compacta** (Looks) → sin acciones.

### 7.11 GarmentCard (tarjeta de prenda) — `garment-card.tsx`

Resultado de `add_garment`. `<article class="animate-aparecer rounded-md border border-linea bg-superficie p-4">`

- Fila `flex gap-4`: foto `w-24 shrink-0 aspect-[3/4] overflow-hidden rounded-sm bg-hundido` + datos:
  sobretítulo `text-xs uppercase tracking-[0.14em] text-tinta-suave` "Prenda reconocida"; nombre `font-display text-xl`;
  lista `mt-2 space-y-1 text-sm`: "Parte de arriba · Blazer", colores (muestra `size-3 rounded-full border border-tinta/10` + nombre), "Oficina, Día a día".
- Confianza baja: `mt-3 rounded-sm bg-alerta-suave px-3 py-2 text-sm text-alerta` "No estoy seguro de la categoría. Revísala."
- Acciones `mt-4 grid grid-cols-2 gap-2`: "Está bien" (primario compacto) · "Corregir" (secundario compacto).
- **Corregir** (en la misma tarjeta): Input "Nombre"; categoría como Chips `role="radio"`; colores como Chips con muestra; "Guardar cambios" (primario) + "Cancelar" (terciario).
- **Confirmada**: acciones reemplazadas por `flex items-center gap-2 text-sm text-exito` + check "En tu clóset" y terciario "Ver" (`/closet/[id]`).
- **No reconocida** (`failed`, R-06/R-07): sin datos, texto "No pude reconocerla bien. Complétala tú, son 3 datos." y el modo Corregir abierto.

### 7.12 PaletteCard (tarjeta de paleta) — `palette-card.tsx`

Resultado de `analyze_palette`. Los hex vienen de datos: único lugar con `style={{ backgroundColor }}`.

- Contenedor como GarmentCard. Encabezado: sobretítulo "Tu paleta · orientativa"; título `font-display text-2xl` "Otoño *cálido*";
  `text-sm text-tinta-suave` "Subtono cálido · contraste medio"; insignia de confianza
  `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium` (alta `bg-exito-suave text-exito`, media `bg-hundido text-tinta`, baja `bg-alerta-suave text-alerta`) con texto "Confianza media".
- Grupos (rótulo `text-xs font-semibold uppercase tracking-[0.14em] text-tinta-suave`): "Te favorecen", "Tus neutros", "Mejor lejos del rostro".
  Grilla `grid grid-cols-4 gap-3`; muestra `aspect-square rounded-sm border border-tinta/10` (`role="img" aria-label="Terracota"`) + nombre `mt-1 text-xs`.
  "Evitar": diagonal SVG `text-superficie` encima + rótulo explícito.
- Aviso de luz (`lighting_ok = false`): `rounded-sm bg-alerta-suave px-3 py-2 text-sm text-alerta` "La luz de la foto no era pareja. Tómalo como punto de partida."
- Transparencia fija: `text-xs text-tinta-suave` "Es una orientación a partir de una foto, no un diagnóstico. Tu selfie ya se borró."
- Acciones: "Ajustar" (secundario compacto: inline, Chips de estación y subtono → `source: 'manual'`, R-08) · "Ver tu paleta" (terciario → `/yo/paleta`).

### 7.13 ConsentCard — `consent-card.tsx`

Antes de la primera selfie (R-03). `rounded-md border border-linea bg-superficie p-4`: título `text-base font-semibold` "Antes de tu selfie";
texto `text-sm text-tinta-suave` "Autorizo analizar mi selfie para estimar mi paleta. La foto se borra apenas termina el análisis.";
acciones "Aceptar y abrir cámara" (primario compacto) · "Mejor no" (terciario). Aceptada: `text-sm text-exito` "Autorizado el 14 nov".

### 7.14 MemoryNote — `memory-note.tsx`

Discreta, dentro del turno: `flex items-center gap-2 text-sm text-tinta-suave` + ícono marcador `size-4` +
"Anotado: prefieres tiro alto." + Button terciario `h-11 px-2 text-sm` "Deshacer" (borra el hecho).
Tras deshacer: "Lo borré." (sin botón). No lleva fondo ni borde.

### 7.15 Toast y error

- Región `aria-live="polite"` `pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto flex max-w-app justify-center px-5` (sobre el compositor).
- Toast `pointer-events-auto flex min-h-12 w-full items-center gap-3 rounded-md bg-tinta px-4 py-3 text-sm text-superficie shadow-flotante animate-subir`; 5 s (7 s con acción).
- Error en bloque: `flex gap-3 rounded-sm bg-error-suave p-4 text-sm text-error` `role="alert"` + qué pasó + qué hacer + "Reintentar".
- En el hilo, los errores del asesor van como AdvisorMessage de error (7.4), no como toast.

### 7.16 SpaceSheet (hoja "Tu espacio") — `space-sheet.tsx`

Reutiliza `Sheet` de `components/ui`. `<dialog aria-labelledby>` modal:
- Velo `fixed inset-0 z-40 bg-tinta/40` (opacity 200ms).
- Hoja `fixed inset-x-0 bottom-0 z-50 mx-auto max-w-app rounded-t-lg bg-superficie pb-seguro shadow-flotante animate-subir`;
  asa `mx-auto mt-2 h-1 w-10 rounded-full bg-linea`.
- Título `px-5 pt-4 font-display text-2xl` "Tu espacio" + cerrar `size-11` `aria-label="Cerrar"`.
- Lista `divide-y divide-linea px-5`: cada ítem `<a class="flex min-h-16 items-center gap-4 py-3">` con ícono `size-6 text-tinta-suave`,
  título `text-base font-medium text-tinta` y bajada `text-sm text-tinta-suave`, chevron a la derecha:
  - Tu clóset — "18 prendas"
  - Tus looks — "6 guardados"
  - Tu perfil y paleta — "Otoño cálido · lo que sé de ti"
- Separado `mt-2 border-t border-linea px-5 py-3`: "Cerrar sesión" (terciario `text-tinta`).
- Cierra con: botón, toque en el velo, Escape, deslizar hacia abajo. El foco vuelve al botón "Tu espacio".

### 7.17 SpaceHeader — `space-header.tsx` (vistas de Tu espacio)

`sticky top-0 z-20 bg-fondo/90 backdrop-blur-md pt-seguro` → `flex h-14 items-center px-3`:
`<a href="/asesor" class="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-tinta">` + chevron izquierdo + "Volver a la conversación".
Debajo, en el contenido: sobretítulo "Tu espacio" + h1 `font-display text-3xl`.

### 7.18 GarmentTile (galería del clóset) — `garment-tile.tsx`

Sin cambios de v0.1: foto `aspect-[3/4] rounded-md bg-hundido`, `object-cover`, nombre `mt-1.5 truncate text-sm`; favorita;
estados procesando / "Completar datos" / esqueleto.

## 8. Movimiento

- Solo `transform` + `opacity`; 150–320ms; curva `ease-estilo`; salida `ease-salida` (60–70 % de la entrada).
- Mensaje nuevo y tarjeta: `animate-aparecer`. Fotos de un look: escalonado 40ms. Hoja: `animate-subir`.
- Sugerencias: entran con `animate-aparecer` después del texto (no a la vez).
- Scroll al último mensaje: `scrollIntoView({ behavior: 'smooth', block: 'end' })`; con reduced motion, `'auto'`.
- `prefers-reduced-motion`: reglas globales de `globals.css`.

## 9. Accesibilidad del hilo

- **Lectura**: el hilo es una `section` con `aria-label`; **no** lleva `aria-live` (si no, el lector lee token a token).
  Una región `sr-only aria-live="polite"` anuncia: el mensaje completo del asesor al recibir `done`; "Te propuse un
  look: <título>" con `outfit`; "Reconocí: <nombre>" con la prenda; "Tu paleta: <estación>, confianza <nivel>";
  "Anotado: <hecho>" con memoria. ToolStatus es `role="status"`. El hilo lleva `aria-busy="true"` mientras transmite.
- **Foco**: el foco se queda en el compositor al enviar. Al tocar una sugerencia, vuelve al compositor. Las acciones
  de las tarjetas son botones reales y se alcanzan en orden de lectura. Al abrir la hoja, foco al título; al cerrar, al disparador.
- **Teclado en móvil**: el compositor es `sticky` dentro del flujo (no `fixed`), así sube con el teclado. Con el
  teclado abierto, el último mensaje debe quedar visible: al enfocar el campo, scroll al ancla final. Se recomienda
  `interactiveWidget: "resizes-content"` en `viewport` (ver §12).
- **Scroll**: auto-scroll al último mensaje solo si la persona está a menos de 120px del final; si no, aparece
  "Ir al último mensaje". Al abrir `/asesor`, el hilo parte abajo.
- **Fotos**: `alt` = nombre de la prenda; foto enviada: "Foto que enviaste"; selfie: "Selfie (se borra después del análisis)".
- Objetivos táctiles ≥ 44px; separación ≥ 8px; contraste según `DESIGN.MD` §1; estados nunca solo por color.

## 10. Responsive

Móvil primero (390px; probar 360px). ≥ 768px: `body` en `hundido`, la app es una columna `mx-auto max-w-app bg-fondo min-h-dvh`;
encabezados, compositor, hoja y toasts comparten `max-w-app mx-auto`. Las filas con scroll horizontal son solo:
sugerencias largas y el filtro del clóset.

## 11. Fotografía

- Prendas: guía en el texto del asesor ("estirada en la cama o colgada en una puerta, con luz de día, entera y con margen").
- Proporción 3:4 vertical en tiles, tarjetas y fotos enviadas; `object-cover object-center`; contenedor `bg-hundido`.
- Compresión en cliente (≤ 1280 px, JPEG, sin EXIF) antes de subir; `aspect-*` siempre declarado; `loading="lazy"` fuera de pantalla.
- Selfie: nunca se muestra después del análisis (R-04); en el hilo queda el marcador "Selfie borrada después del análisis".

## 12. Lo que la UI necesita del backend (propuesta para el integrador)

| Necesidad | Propuesta |
|---|---|
| Respuestas sugeridas | Evento SSE `suggestions { options: string[], mode: 'single' \| 'multiple', action?: 'photo' \| 'selfie' }` (herramienta `suggest_replies`); se persiste en `parts` para rehidratar el último turno. |
| Tarjeta de prenda | Evento `garment { garment }` emitido por `add_garment`; confirmación y corrección por Server Action. |
| Tarjeta de paleta | Evento `palette { analysis }` emitido por `analyze_palette`. |
| Consentimiento de selfie | Evento `suggestions` con `action: 'selfie'` muestra ConsentCard si no hay `face_photo`. |
| Foto ambigua (R-17) | El asesor pregunta con sugerencias antes de guardar; no se crea prenda sin intención clara. |

## 13. Copy

Tono: cercano, preciso, seguro. Tuteo chileno neutro, sin emoji, sin "Ups". Botones verbo + objeto o respuesta
corta en primera persona ("Está bien", "Ahora no", "Mandar foto"). El asesor nunca dice "defecto", "disimular",
"cuerpo ideal", "diagnóstico" (de color), "cómpralo". Frases fijas de transparencia: "Es una orientación a partir
de una foto, no un diagnóstico." · "La foto se usa solo para el análisis y se borra apenas termino; guardo solo el resultado."
