# UX_UI_SPEC — Estilo (ai-personal-stylist)

Versión 0.3 — 2026-11-14. Documento dueño de dirección visual, modelo de interacción, componentes y pantallas.
Resumen operativo (tokens, contraste, reglas, errores): `DESIGN.MD` en la raíz. Tokens: `web/src/app/globals.css`.

- **v0.3 aplica DP-23**: Estilo adopta la **identidad visual de Prendie** (paleta del tema Día, Bricolage Grotesque +
  Manrope, estilos de texto, radios, bordes de 1.5 px, interfaz sin sombras, foco azul, botones píldora, lima como
  única acción principal), **con estructura propia** (Tailwind v4, tokens en `@theme` con nombres en español). No se
  toman de Prendie su logotipo, su voz y vocabulario ni sus componentes de dominio (Busco, etiqueta colgante,
  estados de préstamo, navegación flotante). Fuente de la identidad: `prendie/design/` (`README.md`, `tokens.json`).
- **Se conserva el modelo de interacción del rediseño v3** (`docs/superpowers/specs/2026-11-14-rediseno-hilo-v3.md`):
  rastro del asesor que queda, respuestas sugeridas en la voz de la persona, refinamiento sobre la tarjeta, porqué con
  evidencia, pieza faltante dentro del look, opciones de compra honestas, foto con etiquetas, memoria con deshacer,
  "Tu espacio", tratamiento de las fotos de prendas, movimiento y accesibilidad. Su maqueta
  (`docs/superpowers/mockups/2026-11-14-conversacion-v3.html` y `…-v3-demo.html`) sirve como referencia de
  **anatomía, contenido y movimiento**, no de color ni tipografía: está pintada en la piel "Atelier", que DP-23 reemplaza.
- **Reemplaza** la dirección "Atelier editorial" de la v0.2 (§1), la especificación de componentes (§7), el movimiento
  (§8) y la fotografía (§11). La maqueta v0.2 (`2026-11-14-mvp.html`) queda como histórico.
- Cómo llevar el código a esta versión: `docs/superpowers/specs/2026-11-14-migracion-identidad-prendie.md`.

Convención: **[OBS]** = observación propia de UX/UI. Las decisiones se citan por ID de `DECISION_LOG.md`. Las clases
son Tailwind v4 con los tokens de `DESIGN.MD`; los valores arbitrarios (`p-[18px]`) copian la fuente y no requieren token.

---

## 1. Dirección visual

**Identidad de Prendie, producto de Estilo.** Fondo gris claro neutro, tarjetas blancas sin borde ni sombra, tinta casi
negra, formas generosas (tarjetas de 28 px, fotos de 24 px, todo lo tocable en píldora), titulares en Bricolage
Grotesque 800 y texto en Manrope. El color fuerte se usa por **rol**, nunca como decoración:

| Color | Rol en Estilo | Ejemplos |
|---|---|---|
| `accion` (lima) | La acción principal de la pantalla, una sola | "Guardar look" del look recién propuesto, "Empezar la conversación", "Está bien", "Aceptar y abrir cámara" |
| `inverso` (tinta) | Énfasis: el objeto más importante y lo elegido | Look recién propuesto, chip elegido, opción elegida, enviar, etiqueta "Nuevo" sobre la foto |
| `memoria` (lavanda) | Lo que el asesor sabe de ti | Nota de memoria, "Recién" en la hoja, "Lo que sé de ti" |
| `falta` (naranja) | Lo que falta, lo que se podría comprar, lo que no es seguro | "Falta" en la mesa, celda de la pieza en la tira, confianza baja, sin conexión |
| `exito` (azul petróleo) | Hecho y guardado | "Guardado en Tus looks", "En tu clóset", check del rastro |

Lima, lavanda y naranja son **superficies** con texto `sobre-color`; nunca texto ni ícono sobre claro (`DESIGN.MD` §1).
La prenda sigue siendo la protagonista: recortada sobre `hundido`, nunca un bloque de color.

### 1.1 Choques entre la identidad de Prendie y un asesor de imagen, y cómo se resuelven

| Choque | Resolución |
|---|---|
| La voz del asesor se distinguía por una serif editorial; Prendie solo tiene dos sans | Asesor sin contenedor, ancho completo, `text-destacado` (16/24, 600); persona en bloque `bg-hundido` a la derecha, `text-cuerpo` (15/22, 500). Distinguen contenedor, alineación y peso. Énfasis del asesor en 800, sin cursiva ni color. |
| Bricolage no tiene cursiva: el énfasis granate del título del look desaparece | Títulos sin énfasis tipográfico; el peso lo da el tamaño (`text-titulo`) y el contenedor `inverso` del look recién propuesto. |
| El "campo de color" del look (DP-22) era propio de la piel anterior | Se reemplaza por la superficie de énfasis de esta identidad: el look recién propuesto va en `bg-inverso` con "Guardar look" en lima (como la tarjeta de mayor peso de Prendie); vuelve a `superficie` cuando deja de ser el último. |
| Prendie no lleva sombras; v3 aceptaba `shadow-papel` y sombra de prenda | Ninguna tarjeta, chip ni botón lleva sombra: la tarjeta es blanca sobre `fondo`. La sombra bajo la **prenda recortada** se conserva como parte de la foto (sin ella el recorte flota). `shadow-flotante` solo en lo que flota (hoja, toast, "Ir al final"), el equivalente a la navegación flotante de Prendie. |
| Chips de Prendie miden 36 px; Estilo exige 44 px táctiles | Los chips (filtros, selección múltiple) quedan en 36 visibles con área de 44 (`after:-inset-1`). Sugerencias y refinamientos son acciones, no filtros: van como **botones de contorno de 44 px**. |
| "Lima nunca como texto en claro" y "un solo CTA por pantalla" en un hilo con muchas tarjetas | Lima solo en la acción principal del resultado vigente; enviar va en `inverso`; los looks anteriores bajan "Guardar look" a `inverso`. "Ver en la tienda" **nunca** en lima (DP-09: no se empuja la compra). |
| Lavanda y naranja identifican círculos y préstamos en Prendie | Se reasignan por rol (tabla de arriba). Sus significados de Prendie no existen en Estilo. |
| Prendie "no muestra precios, carrito ni estrellas" | Es regla de producto de Prendie, no de identidad. Estilo muestra precio **visto, con fecha y tienda** (DP-10, DP-19); sigue sin carrito ni estrellas. |
| La etiqueta colgante es el recurso de marca de Prendie | No se usa. Las etiquetas sobre la foto de la persona usan la forma de **insignia** (`rounded-insignia`) de Prendie. |
| Campos en `hundido` sin borde: el campo del compositor tiene poco contraste de borde sobre `fondo` | El compositor va sobre una barra `superficie`; verificar con `accessibility-review` (§14). |
| Prendie define tema Noche | Estilo parte solo con Día (razones en `DESIGN.MD` §1); tokens listos para sumarlo. |
| El logotipo de Prendie es la marca de otro producto | Wordmark provisional "Estilo" en Bricolage 800 hasta definir marca (A-05, §14). |
| Voz de Prendie (chilenismos, "apañe", "círculo") | No se adopta: Estilo mantiene su voz (`CLAUDE.md`, §13). |

## 2. Principios de experiencia

1. **Es una conversación, no una app con chat** (DP-17). Sin pestañas, formularios por pasos ni barras de progreso.
2. **Una cosa por turno.** El asesor pregunta de a una y ofrece respuestas sugeridas en la voz de la persona. Si ya
   entendió algo, lo muestra ("Lo que entendí") y pregunta solo lo que falta.
3. **Todo resultado es una tarjeta en el hilo** (look, opciones de compra, prenda, paleta, nota de memoria) y se actúa
   sobre ella ahí mismo.
4. **Siempre el porqué** (DP-11), con evidencia de la persona: su paleta, el clima, sus prendas.
5. **El trabajo del asesor queda en el hilo**, en pasado y con su dato.
6. **El asesor decide qué hacer con una foto** (DP-17); si duda, pregunta.
7. **Transparente y respetuoso**: paleta orientativa (DP-05); la selfie no se guarda (DP-16); cuerpo = calce y
   proporción (DP-12); nada se compra (DP-09); la afiliación se muestra (DP-10).
8. **Tu espacio es para consultar**, no para operar.
9. **Valor antes de esfuerzo** (DP-04, DP-06): primer look con 3 prendas en la primera conversación.
10. **Movimiento que informa y se calla**: entra, se asienta y no vuelve a moverse.

## 3. Arquitectura de información

```
/            Portada pública (promete una conversación)
/entrar      Crear cuenta / entrar
/asesor      EL HILO con el asesor (pantalla principal, start_url de la PWA)
  └─ hoja "Tu espacio" (desde el encabezado)
       ├─ Tu clóset        → /closet → /closet/[id]
       ├─ Tus looks        → /looks
       ├─ Lo que sé de ti  → /yo#memoria   (en /yo viven también perfil, privacidad y borrado)
       ├─ Tu paleta        → /yo/paleta
       └─ Cerrar sesión
```

- Sin `BottomNav`, `/bienvenida` ni `/closet/nueva` (DP-17). `/` redirige a `/asesor` si hay sesión. Una sola
  conversación continua (R-16).
- **Cambio v0.3:** la hoja lista "Lo que sé de ti" y "Tu paleta" por separado (antes "Tu perfil y paleta"); `/yo`
  necesita `id="memoria"` en su sección "Lo que sé de ti".

## 4. Guion de la primera conversación

Textos reales. **A** = asesor. **P** = persona. `[sugerencias]` = respuestas sugeridas (simple: un toque envía;
múltiple: se marcan y "Listo" envía). Cada pregunta del perfil corresponde a un campo de `style_profiles`
(herramienta `update_profile`). Todas admiten "Ahora no" o texto libre (R-13).

1. **A**: "Hola, soy Estilo, tu asesor de imagen. Te ayudo a verte como quieres verte, partiendo por la ropa que
   ya tienes. Te haré algunas preguntas cortas: toca una respuesta o escríbeme con tus palabras."
   **A**: "Para partir, ¿en qué sección sueles comprar ropa?" `[Mujer · Hombre · Las dos]` (múltiple)
2. **P**: "Mujer". **A**: "Perfecto. ¿En qué ciudad vives? La uso solo para mirar el clima antes de proponerte algo."
   `[Santiago · Valparaíso · Concepción]` (simple; otra ciudad, escribiendo)
3. **A**: "¿Para qué te vistes más en una semana normal?" `[Oficina · Día a día · Citas · Eventos · Viajes · Deporte]` (múltiple)
4. **A**: "¿Cómo describirías tu estilo hoy?" `[Clásico · Casual · Minimalista · Romántico · Urbano · Bohemio · Sofisticado · Deportivo · No sé bien]` (múltiple)
   **P**: "Clásico, Minimalista". **A**: "Clásico y minimalista: líneas limpias, pocos colores, buenas telas. Me sirve harto."
5. **A**: "¿Y cómo te gustaría verte? Puede ser igual que hoy o algo distinto." `[Igual que hoy · Con más presencia · Con más soltura · Con más color · Con más orden]` (múltiple; sin género gramatical, DP-13)
6. **A**: "¿Algo de calce o comodidad que deba saber?" `[Holgado · Entallado · Tiro alto · Sin tacos · Sin lana · Nada en especial]` (múltiple)
7. **A**: "Cuando te propongo algo, ¿prefieres ir a la segura o probar cosas nuevas?" `[A la segura · Un poco distinto · Atrevido]` (simple)
8. **Selfie (opcional)** — **A**: "Ahora algo opcional. Si me mandas una selfie, te doy una paleta de colores
   orientativa: los tonos que tienden a iluminarte la cara. Es una orientación a partir de una foto, no un
   diagnóstico. **La foto se usa solo para el análisis y se borra apenas termino; guardo solo el resultado.**"
   `[Mandar selfie · Ahora no]` → **ConsentCard** (R-03) → rastro "Mirando tu tono de piel" → **PaletteCard**.
   **A**: "Te salió otoño cálido, con confianza media: la luz venía de un costado. Tómalo como punto de partida;
   si algo no te calza, toca Ajustar."
9. **Prendas** — **A**: "Ahora lo más importante: tu ropa. Mándame fotos de 3 a 5 prendas que uses harto, una
   por foto. Sirve la prenda estirada en la cama o colgada en una puerta, con luz de día."
   `[Mandar foto · Cómo saco buenas fotos]` → por cada foto, rastro "Reconociendo la prenda" → **GarmentCard**.
   **A** (tras confirmar): "Van 2. Con una más ya te armo algo."
10. **Primer look** (con 3 prendas) — **A**: "Con esto ya puedo armarte algo. ¿Para qué ocasión?"
    `[Mañana en la oficina · Un fin de semana · Una cita]` → rastro (clima, clóset, look) → **OutfitCard** en `inverso`.
    **A**: "Si no te convence, dime por qué y lo ajusto. Puedes seguir mandándome prendas cuando quieras."

## 5. Journeys

### J1. Primera vez (activación: primer look útil en la primera sesión, DP-04)

Portada → "Empezar la conversación" → `/entrar` (cuenta + términos, R-03) → `/asesor` con el guion §4. Si la persona
salta las prendas, el asesor no propone looks y lo dice: "Sin ver tu ropa no puedo armarte nada que de verdad tengas.
Cuando quieras, mándame una foto."

### J2. "¿Qué me pongo mañana?"

- Abre la PWA → hilo, último mensaje a la vista. Si no hay conversación hoy: **A**: "Hola, Catalina. ¿Para qué te
  vistes hoy?" `[Mañana en la oficina · Hoy · Fin de semana · Algo especial]`
- **P**: "Mañana en la oficina, tengo reunión con clientes." → rastro "Miré el clima", "Revisé tu clóset", "Armé el
  look" → **A** explica → **OutfitCard** en `inverso`.
- **P** refina con un botón de la tarjeta ("Más formal") o toca "No es para mí" → motivo → **MemoryNote** "Anotado:
  para la oficina prefieres algo menos formal." con "Deshacer" → **A** propone otra opción; el look anterior vuelve a `superficie`.

### J3. Agregar prenda (en cualquier momento)

- **P** toca el botón de foto del compositor (puede agregar texto). Aparece la **foto enviada**; rastro "Reconociendo la prenda".
- Una prenda sola (DP-06): **A**: "Es un blazer de lino crudo. Revisa si lo vi bien." → **GarmentCard** ("Está
  bien" / "Corregir"; "Completar datos" si no se reconoce, R-07). Con recorte: **CutoutPreview** "Así queda en tu clóset".
- Foto con la persona vestida o varias prendas: **PhotoMessage con etiquetas** — sujeto a DP-06 (§14).
- No es una prenda: **A**: "No veo una prenda en la foto. ¿Me mandas la prenda sola, sobre una superficie lisa?"
- Ambigua: **A** pregunta `[Guardar en mi clóset · Dime qué opinas]` (R-17).

### J4. Evento con pieza faltante y opciones de compra (el recorrido que manda, DP-19 y DP-18)

Los seis momentos de la maqueta v3:
1. **P**: "Este sábado tengo un matrimonio en Casablanca, de día, en una viña. ¿Qué me pongo? Si no tengo nada,
   búscame opciones." → **A**: "Esto es lo que entendí; toca cualquier dato si me equivoqué." → **EventSummary**
   → **A** pregunta solo la vestimenta: `[Dice «formal de día» · Semiformal · No dice nada · Te mando la invitación]`.
2. **ToolTrail** en vivo ("Miré el clima en Casablanca", "Revisé tu clóset" con miniaturas, "Armando el look") y
   esqueleto del look en su lugar.
3. **OutfitCard** en `inverso`: pieza faltante con "Falta", "Por qué funciona" con evidencia, botones para refinar.
4. **ShoppingOptions**: rastro "Busqué en 3 tiendas · 41 resultados · elegí 3", tira del look, 3 opciones, ficha
   honesta; al elegir, la pieza entra a la tira. Nunca se compra: "Ver en la tienda ↗".
5. (Opcional) foto de un vestido propio → etiquetas → recorte.
6. "Me quedo con las de Tienda A. Guárdame el look." → "Guardado en Tus looks" + **MemoryNote** con "Deshacer" y
   "Lo que sé de ti"; la hoja muestra "Nuevo" y "Recién".

- Si falta una categoría base (R-11) y la persona no quiere opciones, **A** describe qué buscar y por qué.
- La búsqueda real espera A-01 (DT-09, DT-18); hasta entonces la entrega el asesor simulado.
- **Duda de compra** (foto o link de algo que evalúa): criterio en texto y, si aplica, una ficha honesta; nunca "cómpralo".

### J5. Control de datos y memoria

- Cada hecho nuevo aparece como **MemoryNote** con "Deshacer" y "Lo que sé de ti" (`/yo#memoria`).
- **P**: "¿Qué sabes de mí?" → **A** resume y cierra con "Ver todo en tu perfil" (`/yo`).
- `/yo` → "Lo que sé de ti": cada hecho con origen, fecha y "Borrar". Al final, separado: "Borrar todos mis datos"
  → confirmación que lista lo que se borra y pide escribir "BORRAR". Irreversible, se dice así (R-02).

## 6. Pantallas

### 6.1 Portada `/`

Margen `px-6`. Wordmark provisional (§7.2). Sobretítulo `text-sobretitulo uppercase text-tinta-suave` "Tu asesor de
imagen". h1 `font-display text-titular` "Cuéntale a tu asesor qué necesitas." Muestra de conversación: la persona en
bloque `bg-hundido` ("¿Qué me pongo mañana para la oficina?") y el asesor en `text-destacado` ("Te armo un look con tu
ropa y te digo por qué funciona."). Principal (lima, ancho completo) "Empezar la conversación"; botón de texto "Ya
tengo cuenta"; nota `text-meta text-tinta-suave` "Tus fotos son privadas y tu selfie no se guarda."

### 6.2 Cuenta `/entrar`

Email + contraseña (campos §7.1), casilla de términos (R-03), errores bajo el campo en `text-error`. Principal
"Crear cuenta" / "Entrar". Éxito → `/asesor`.

### 6.3 Hilo `/asesor`

Contenedor `mx-auto flex min-h-dvh w-full max-w-app flex-col bg-fondo`: **ChatHeader** → **Thread** (`flex-1`) →
**SuggestedReplies** → **Composer**.
- Cargando historial: barras `rounded-full bg-hundido animate-esqueleto` (90/75/60 %).
- Primera vez: el hilo arranca con el saludo del guion §4.
- Error de carga: bloque de error (§7.18) "No pude cargar la conversación." + "Reintentar".
- Sin conexión: aviso bajo el encabezado `bg-falta px-6 py-2 text-cuerpo text-sobre-color`: "Sin conexión. Vuelve a
  conectarte para escribirle a tu asesor."; Enviar deshabilitado.
- Límite diario (R-15): mensaje del asesor "Por hoy llegamos al máximo de mensajes. Mañana seguimos." y compositor deshabilitado.

### 6.4 Vistas de Tu espacio (`/closet`, `/closet/[id]`, `/looks`, `/yo`, `/yo/paleta`)

Todas con **SpaceHeader** y h1 `font-display text-titulo`. Sin botones de crear: el CTA de cada vista vacía vuelve a `/asesor`.
- **Tu clóset**: h1 + conteo `text-meta`; filtro por categoría (Chips §7.1 con scroll horizontal); galería
  **`grid grid-cols-2 gap-3`** de GarmentTile (Prendie: dos columnas en móvil; antes tres). Vacío: `font-display
  text-titular` "Tu clóset está vacío" + principal "Mandar una foto al asesor".
- **Detalle** `/closet/[id]`: prenda 4:5 (§11), nombre `font-display text-titulo`, datos `text-cuerpo`, favorita
  (`aria-pressed`), "Editar prenda" (contorno), "Archivar prenda" (texto) con confirmación inline (R-10).
- **Tus looks**: lista `space-y-6` de OutfitCard **compacta** (`superficie`, sin acciones ni botones de refinar, con la
  opción elegida en la mesa si existe y "Guardado el 14 nov"). Vacío: "Aún no guardas looks" + "Pedirle un look al asesor".
- **Tu perfil** `/yo`: secciones h2 `font-display text-titulo-s` con `border-t border-linea pt-8`: Tu paleta, Tu estilo
  (chips de solo lectura), **Lo que sé de ti** (`id="memoria"`, cada hecho con "Borrar"), Privacidad, zona de borrado
  (botón `bg-error text-sobre-estado`).
- **Tu paleta** `/yo/paleta`: PaletteCard completa + `rationale` + "Ajustar" + "Mandar otra selfie". "Elegida por ti" si es manual (R-08).

## 7. Componentes

Ubicación: `web/src/components/chat/` (hilo), `components/espacio/` (Tu espacio), `components/ui/` (base). Íconos SVG
inline 24×24 (20 en botones), **trazo 2**, extremos redondeados, `currentColor`; botón solo con ícono lleva `aria-label`.
Foco en todo lo interactivo: `outline-3 outline-offset-2 outline-foco` (regla base de `globals.css`).
**Base de tarjeta de resultado:** `rounded-tarjeta bg-superficie p-[18px]` — sin borde ni sombra.

### 7.1 Button, Chip, Field

- **Button** base `inline-flex h-[52px] items-center justify-center gap-2 rounded-full border-[1.5px]
  border-transparent px-6 font-body text-base font-extrabold leading-none transition-[transform,opacity] duration-150
  ease-salida active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45`; ícono `size-5` antes del texto.
  - Mediano (dentro de tarjetas, hilo): `h-11 px-[18px] text-sm`.
  - **Principal** `bg-accion text-sobre-color` — uno por pantalla (§1). **Inverso** `bg-inverso text-sobre-inverso`.
    **Contorno** `bg-transparent text-tinta border-linea-fuerte`; sobre `inverso`: `border-sobre-inverso
    text-sobre-inverso`. **Texto** `h-11 px-2 text-sm text-tinta underline underline-offset-4`.
    **Destructivo** `bg-error text-sobre-estado`.
- **Chip** (filtro, selección múltiple, solo lectura): `relative inline-flex h-9 items-center gap-1.5 rounded-full
  border-[1.5px] border-linea-fuerte bg-transparent px-4 text-control text-tinta after:absolute after:-inset-1`
  (área de 44); `aria-pressed="true"` → `bg-inverso border-inverso text-sobre-inverso`. Nunca lima.
- **Field** `min-h-12 w-full rounded-campo bg-hundido px-4 text-base font-medium text-tinta
  placeholder:text-tinta-suave` (sin borde; foco con el anillo azul). Etiqueta `text-control`; error `text-meta text-error`.

### 7.2 ChatHeader — `components/ui/app-header.tsx`

`sticky top-0 z-20 bg-fondo/90 pt-seguro backdrop-blur-md` → `flex h-14 items-center justify-between px-6`.
- Wordmark provisional: `<span class="font-display text-titulo">Estilo</span>` (sin la etiqueta de Prendie; §14).
- "Tu espacio": botón contorno mediano con ícono cuadrícula `size-5`; `aria-haspopup="dialog"`, `aria-expanded`.
- Nada más (sin clima, campana ni avatar).

### 7.3 Thread y ritmo — `thread.tsx`

- `<section aria-label="Conversación con tu asesor" class="flex flex-1 flex-col gap-6 px-6 pt-2 pb-4">`; máscara
  superior de 28 px en el contenedor con scroll: `[mask-image:linear-gradient(to_bottom,transparent_0,#000_28px)]`.
- **Turno del asesor**: `flex flex-col gap-3.5` (texto, rastro, tarjetas, notas).
- Separador de día: `flex items-center gap-3 text-sobretitulo uppercase text-tinta-suave` con `h-px flex-1 bg-linea`
  a los lados ("Hoy", "Ayer", "12 nov").
- "Ir al final": `size-11 rounded-full bg-inverso text-sobre-inverso shadow-flotante`, centrado sobre el compositor,
  `aria-label="Ir al final"`.

### 7.4 AdvisorMessage — `advisor-message.tsx`

- Sin burbuja ni avatar, ancho completo: `text-destacado text-tinta [&_p+p]:mt-3` (Manrope 16/24, 600).
- Firma solo en el primer bloque del turno: `mb-1 block text-sobretitulo uppercase text-tinta-suave` "Estilo".
- `<em>` y `<strong>` → `font-extrabold` (sin cursiva ni color). Enlaces internos: `font-extrabold underline underline-offset-4`.
- Streaming: cursor `inline-block h-4 w-0.5 translate-y-0.5 bg-tinta animate-respirar` al final.
- Error del turno: `border-l-[3px] border-error pl-3` + "Se cortó mi respuesta. Tu mensaje quedó guardado." + botón de texto "Reintentar".

### 7.5 PersonMessage — `person-message.tsx`

`self-end w-fit max-w-[82%] whitespace-pre-wrap rounded-campo bg-hundido px-4 py-3 text-cuerpo text-tinta`.
Enviando: `opacity-70`; fallido: `text-meta text-error` "No se envió." + botón de texto "Reintentar".

### 7.6 EventSummary "Lo que entendí" — nuevo, `event-summary.tsx`

`<div role="group" aria-label="Lo que entendí del evento" class="grid grid-cols-2 gap-2">`; cada dato
`<button class="flex min-h-[58px] items-start gap-2.5 rounded-campo bg-superficie p-3 text-left">`: ícono
`size-5 text-tinta-suave`, dato `block text-nombre`, bajada `block text-meta text-tinta-suave`. Ejemplo: "Sábado 21 nov
/ Matrimonio", "Casablanca / En una viña", "11° a 27° / Viento en la tarde", "De día / Al aire libre". Estado corregido: §14.

### 7.7 ToolTrail (rastro del trabajo) — reemplaza `tool-status.tsx`

Queda en el hilo; no se borra al llegar el texto.
- Abierto: `<ol aria-label="Lo que hice" class="ml-2.5 flex flex-col gap-3.5 border-l-[1.5px] border-linea py-0.5 pl-[22px]">`.
- Paso `<li class="relative">`: ícono en círculo `absolute -left-[34px] -top-px grid size-[22px] place-items-center
  rounded-full bg-fondo text-tinta-suave ring-[1.5px] ring-inset ring-linea` (ícono `size-3.5`); rótulo `block
  text-control text-tinta`; dato `mt-0.5 block text-meta text-tinta-suave`.
- **En curso** (`role="status"`): ícono `text-tinta ring-linea-fuerte`, rótulo `text-tinta-suave` en gerundio + tres
  puntos `ml-1.5 inline-flex gap-[3px]`, cada uno `size-1 rounded-full bg-tinta animate-respirar` (2.º y 3.º con
  `[animation-delay:150ms]` / `300ms`). **Hecho**: rótulo en pasado + dato; ícono check `text-exito`. Crossfade 150 ms.
- Miniaturas del clóset: `mt-2 flex gap-1.5`; cada una `grid size-[34px] place-items-center rounded-insignia
  bg-hundido opacity-50` (Prendie usa `campo` 20 en miniaturas; a 34 px eso es un círculo, por eso `insignia`), prenda
  al 76 %; **elegida** `opacity-100 ring-[1.5px] ring-inset ring-linea-fuerte`.
- **Colapsado** (al terminar el turno): `<button aria-expanded="false" class="-my-2.5 inline-flex min-h-11
  items-center gap-2 self-start text-meta font-bold text-tinta-suave">` + check `size-4 text-exito` + resumen + chevron.

| Herramienta | En curso | Hecho | Dato (ejemplo) |
|---|---|---|---|
| (antes de la primera) | "Pensando" | — | — |
| `get_weather` | "Mirando el clima" | "Miré el clima en {ciudad}" | "11° a 27°, despejado · viento desde las 17:00" |
| `get_closet` | "Revisando tu clóset" | "Revisé tu clóset" | "32 prendas · 9 sirven para el día · elegí 4" + miniaturas |
| `propose_outfit` | "Armando el look" | "Armé el look" | "Te falta una sola pieza" |
| búsqueda de opciones | "Buscando en {n} tiendas" | "Busqué en {n} tiendas" | "41 resultados · elegí 3" |
| `add_garment`, `analyze_palette`, `remember`, `update_profile` | rótulo actual de `TOOL_STATUS_LABELS` sin "…" | §14 | — |

Resumen colapsado: rótulos hechos unidos por " · " ("Miré el clima · revisé 32 prendas · armé el look"). Con el
contrato actual (`tool` start/end, efímero) solo hay rastro en vivo sin dato; dato, miniaturas y rehidratación
requieren `tool_step` (migración §2).

### 7.8 SuggestedReplies — `suggested-replies.tsx`

Sobre el compositor, **a la derecha y en la voz de la persona** ("Dice «formal de día»", "Te mando la invitación").
- `<div role="group" aria-label="Respuestas sugeridas" class="flex flex-wrap justify-end gap-2 px-6 pb-3">`.
- **Simple**: botón contorno mediano (§7.1); "Mandar foto" con ícono cámara `size-5`. Presión `scale-[0.96]` 140 ms.
- **Múltiple**: Chips con `aria-pressed` + "Listo" (botón inverso mediano; deshabilitado sin selección).
- Al enviar cualquier mensaje desaparecen (opacidad 150 ms); la elegida queda como PersonMessage.

### 7.9 Composer — `composer.tsx`

`sticky bottom-0 z-20 flex items-end gap-2 border-t border-linea bg-superficie px-4 pt-2.5 pb-seguro`.
- Foto: `grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-linea-fuerte text-tinta`,
  `<input type="file" accept="image/*" class="sr-only">`, `aria-label="Mandar una foto"`.
- Campo: `textarea#mensaje rows=1 min-h-11 max-h-32 min-w-0 flex-1 resize-none rounded-campo bg-hundido px-4 py-2.5
  text-base font-medium text-tinta placeholder:text-tinta-suave`, label `sr-only` "Escríbele a tu asesor",
  `enterkeyhint="send"`. `min-w-0` obligatorio (a 360 px empujaba Enviar fuera).
- Enviar: `grid size-11 shrink-0 place-items-center rounded-full bg-inverso text-sobre-inverso disabled:opacity-45`,
  `aria-label="Enviar"`. **Detener** (respondiendo): cuadrado `size-3 rounded-[2px] bg-sobre-inverso`, `aria-label="Detener respuesta"`.
- Vista previa de foto antes de enviar: miniatura `w-20 aspect-[4/5] rounded-insignia object-cover` + quitar
  (`size-11` de área, círculo visual `size-6 rounded-full bg-inverso text-sobre-inverso`, `aria-label="Quitar foto"`).
- **Placeholder contextual** (corto; el campo hace `text-ellipsis`):

| Momento | Placeholder |
|---|---|
| Hay respuestas sugeridas | "O dímelo con tus palabras" |
| Último resultado es un look | "¿Qué le cambiarías?" |
| Último resultado son opciones de compra | "Pregunta por una opción…" |
| Última entrada es una foto de la persona | "Pregúntame por la foto…" |
| Resto | "Escríbele a tu asesor…" |

### 7.10 OutfitCard (tarjeta de look) — `outfit-card.tsx`

`<article aria-labelledby class="relative rounded-tarjeta p-[18px]">` con dos pieles:
- **Recién propuesto** (el último look del hilo, no descartado): `bg-inverso text-sobre-inverso`.
- **En papel** (looks anteriores, descartados, Tus looks): `bg-superficie text-tinta`.

| Parte | En papel | Recién propuesto |
|---|---|---|
| Sobretítulo `text-sobretitulo uppercase` (fecha · lugar · clima) | `text-tinta-suave` | `text-sobre-inverso-suave` |
| Título `<h3 class="mt-1 font-display text-titulo">` | `text-tinta` | `text-sobre-inverso` |
| Leyenda `text-meta` / número `font-display font-extrabold` | `text-tinta-suave` / `text-tinta` | `text-sobre-inverso-suave` / `text-sobre-inverso` |
| Divisor del porqué `border-t` | `border-linea` | `border-sobre-inverso/20` |
| Rótulo "Por qué funciona" `text-sobretitulo uppercase` | `text-tinta-suave` | `text-sobre-inverso-suave` |
| Evidencia | `bg-hundido text-tinta` | `bg-sobre-inverso/10 text-sobre-inverso` |
| Botones para refinar (contorno mediano) | `border-linea-fuerte text-tinta` | `border-sobre-inverso text-sobre-inverso` |
| "Guardar look" | inverso | **principal (lima)** |
| "No es para mí" | contorno | contorno sobre inverso |

1. Sobretítulo: "Sábado 21 · Casablanca · 11° a 27°".
2. Título corto (dos líneas a 390 px), sin énfasis tipográfico: "Lino y salvia de día".
3. **Mesa** `relative -mx-1 mt-3 aspect-[3/2] overflow-hidden rounded-foto bg-hundido` (igual en ambas pieles).
   - Prenda `absolute h-auto rotate-[var(--r)] drop-shadow-prenda` con `left`, `top`, `width` y `--r` en línea.
     Rotación −7° a 7°, solapes leves, la principal más grande. Plantilla de la maqueta v3 (5 piezas; left, top,
     width, rotación): abrigo `2% 3% 37% −6°` · arriba `31% 1% 33% 5°` · abajo `63% 8% 34% 7°` · bolso
     `9% 57% 24% −5°` · zapatos `50% 58% 33% −3°`.
   - Índice `absolute z-[2] font-display text-[13px] font-extrabold text-tinta-suave`.
   - **Pieza faltante**: contorno punteado de su categoría (`text-tinta-suave`, sin sombra) + insignia `absolute z-[2]
     rounded-insignia bg-falta px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sobre-color`
     "Falta"; su índice dentro de un círculo `size-5 rounded-full bg-falta text-sobre-color`.
4. Leyenda `mt-2.5 flex flex-wrap gap-x-3 gap-y-1`: "1 Blazer de lino", …; la faltante con punto `size-2 rounded-full
   bg-falta` y texto "5 Zapatos: no tienes". Cada nombre enlaza a `/closet/[id]`.
5. **Por qué funciona** `mt-3 border-t pt-3`: rótulo + texto `mt-1.5 text-cuerpo`. **Evidencia** `<ul aria-label="En
   qué me basé" class="mt-2.5 flex flex-wrap gap-1">`; cada dato (no es botón) `inline-flex h-[26px] items-center
   gap-1.5 rounded-insignia px-2 text-meta font-bold`, ícono `size-3.5`; muestras de paleta `size-3 -mr-1
   rounded-full ring-[1.5px]` (anillo del color de la pastilla; hex en línea). Ejemplo: "Tu paleta", "27° y viento",
   "4 de tu clóset".
6. **Refinar** `<div role="group" aria-label="Ajustar el look" class="-mx-[18px] mt-3.5 flex gap-2 overflow-x-auto
   px-[18px] [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_85%,transparent)]">` de botones contorno
   medianos; tocar envía la intención. Ejemplo: "Más formal", "Otro color", "Cambiar el blazer", "Sin cartera".
7. Acciones `mt-3 grid grid-cols-2 gap-2` (botones medianos): "Guardar look" (ícono marcador) · "No es para mí".

Estados:
- **Cargando**: esqueleto en piel "recién propuesto" (`bg-inverso`): barras `w-[46%] h-2.5` y `mt-2.5 w-[72%] h-[26px]`
  `rounded-full bg-sobre-inverso/12 animate-esqueleto`; mesa `aspect-video bg-hundido` con cuatro fantasmas `absolute
  rounded-campo bg-tinta/6 animate-esqueleto` escalonados 120 ms (posiciones: `.f1`–`.f4` de la maqueta v3).
- **Listo**: esqueleto se funde (200 ms); prendas caen (§8); luego leyenda, porqué, botones (300 ms).
- **Guardado**: "Guardar look" pasa a contorno con check "Guardado"; en el turno, línea `inline-flex items-center
  gap-2 text-sm font-bold text-exito` + check `size-4` "Guardado en Tus looks". Fila "¿Qué tanto te gustó?" con Chips
  "Me encanta" (`love`) / "Me sirve" (`ok`).
- **No es para mí**: Chips de motivo (simple) "No es mi estilo" · "Muy formal" · "Muy casual" · "No me acomoda" ·
  "Otro motivo" → `rating: 'no'` → "Anotado. Lo tendré en cuenta.", `opacity-70`, **pasa a papel**.
- **Foto caída**: celda con ícono y nombre `text-meta text-tinta-suave` sobre `bg-hundido`.
- **Compacta** (Tus looks): papel, sin botones de refinar ni acciones.

### 7.11 ShoppingOptions (opciones de compra) — nuevo, `shopping-options.tsx`

Dentro del turno, después del rastro "Busqué en…". `<section aria-label="Opciones para completar el look"
class="rounded-tarjeta bg-superficie p-[18px]">`:
1. **Tira del look** `<div aria-label="Así queda tu look con la opción elegida" class="grid grid-cols-5 gap-1
   rounded-foto bg-hundido p-1.5">`: una celda por pieza `grid aspect-square place-items-center rounded-insignia`,
   prenda al 80 % con `drop-shadow-prenda`; la celda de la pieza que falta en **`bg-falta`** (contorno punteado `text-sobre-color` sin
   elegir; la opción elegida, después). Nota `col-span-full px-1 pt-1 text-right text-meta font-bold text-tinta`:
   "Falta: zapatos" / "Así queda con la 1".
2. **Opciones** `<ol class="mt-3 grid grid-cols-3 gap-2">` (tres a la vista, sin carrusel); cada una
   `<button aria-pressed class="flex w-full flex-col text-left">`: foto `relative grid aspect-square place-items-center
   rounded-foto bg-hundido` (prenda al 88 %, `drop-shadow-prenda`); tienda `mt-2 text-[11px] font-extrabold uppercase
   tracking-[0.12em] text-tinta-suave`; nombre `text-meta text-tinta`; precio `text-nombre tabular-nums`.
   **Elegida**: foto `ring-2 ring-inset ring-linea-fuerte` + check `absolute right-2 top-2 grid size-6 place-items-center
   rounded-full bg-inverso text-sobre-inverso` (ícono `size-3.5`). Orden sin pesar la afiliación (DP-10).
3. **Ficha honesta** de la elegida `mt-4 border-t border-linea pt-3`:
   - Cabecera `flex min-h-7 items-center justify-between gap-2` (alto fijo): tienda `text-sobretitulo uppercase` +
     si aplica insignia `rounded-insignia border-[1.5px] border-linea px-2 py-0.5 text-meta font-bold
     text-tinta-suave` "Enlace con comisión".
   - Nombre y precio `mt-1.5 flex justify-between gap-3 text-nombre`, precio `tabular-nums whitespace-nowrap` (CLP entero, `$54.990`).
   - Porqué en una línea `mt-1 text-cuerpo`.
   - Meta `mt-1.5 text-meta text-tinta-suave`: "Visto hoy, 14 nov, 10:40 · Precio y stock pueden cambiar".
   - Acciones `mt-3 flex flex-col gap-2.5`: "Ver en la tienda" + ícono ↗ (`<a>` contorno mediano, **nunca lima**;
     con comisión `rel="sponsored noopener"`) y botones para refinar la búsqueda ("Más baratos", "Taco más bajo",
     "No me interesan"). **Nunca "Comprar".**

Estados: **sin elegir** (sin ficha) · **elegida** (la prenda vuela de la opción a su celda, 560 ms, y aparece la
ficha) · **cambiando** (crossfade 200 ms con desenfoque 2 px) · **sin stock** (§14). Requiere `shopping_options` y opción elegida (migración §2).

### 7.12 PhotoMessage con etiquetas — `photo-message.tsx`

`<div class="flex w-[72%] flex-col items-end gap-1.5 self-end">` → foto `relative aspect-[4/5] w-full overflow-hidden
rounded-foto bg-hundido`; texto adjunto como PersonMessage debajo.
- **Etiqueta** por prenda (forma de insignia de Prendie, sin sombra), `<button>` posicionada por `bbox`: `absolute
  inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-insignia bg-superficie px-2.5 py-1 text-left
  after:absolute after:-inset-0.5` (área 44); nombre `block text-[12px] font-extrabold leading-tight text-tinta`;
  estado `block text-meta text-tinta-suave` ("En tu clóset").
- **Nueva**: `bg-inverso`, nombre `text-sobre-inverso`, estado `text-sobre-inverso-suave` ("Nuevo · guardar"), ícono "+" `size-4`.
- Estados: subiendo (capa `bg-tinta/30` + spinner `text-sobre-inverso`, `sr-only` "Subiendo foto") · analizando (§14)
  · etiquetada · sin prendas (sin etiquetas).
- Selfie: tras el análisis, marcador `aspect-[4/5] rounded-foto bg-hundido text-meta text-tinta-suave` "Selfie borrada
  después del análisis" (R-04).
- Sin contrato `photo_analysis`: foto 4:5 sin etiquetas (migración §2).

### 7.13 CutoutPreview "Así queda en tu clóset" — nuevo

`<div aria-label="Así quedará en tu clóset" class="grid grid-cols-[52px_16px_52px_1fr] items-center gap-2
rounded-tarjeta bg-superficie p-3">`: antes (foto `aspect-[4/5] rounded-insignia overflow-hidden`), flecha `size-4
text-tinta-suave`, después (`aspect-[4/5] rounded-insignia bg-hundido`, prenda al 74 %, `drop-shadow-prenda`), texto
`text-nombre` "Así queda en tu clóset" + `text-meta text-tinta-suave` "Recortado y enderezado". Requiere recorte (migración §2).

### 7.14 GarmentCard (tarjeta de prenda) — `garment-card.tsx`

Base de tarjeta. Fila `flex gap-4`: prenda `w-24 shrink-0 aspect-[4/5] overflow-hidden rounded-foto bg-hundido` (§11)
+ datos: sobretítulo "Prenda reconocida"; nombre `font-display text-titulo-s`; lista `mt-2 space-y-1 text-meta`
(categoría, colores con muestra `size-3 rounded-full ring-1 ring-tinta/10`, ocasiones). Confianza baja:
`rounded-insignia bg-falta px-3 py-2 text-cuerpo text-sobre-color` "No estoy seguro de la categoría. Revísala."
Acciones `mt-4 grid grid-cols-2 gap-2` (medianos): "Está bien" (principal) · "Corregir" (contorno).
- **Corregir** (en la tarjeta): Field "Nombre"; categoría como Chips `role="radio"`; colores como Chips con muestra;
  "Guardar cambios" (principal) + "Cancelar" (texto).
- **Confirmada**: `flex items-center gap-2 text-sm font-bold text-exito` + check "En tu clóset" y botón de texto "Ver".
- **No reconocida** (R-06/R-07): "No pude reconocerla bien. Complétala tú, son 3 datos." y Corregir abierto.

### 7.15 PaletteCard (tarjeta de paleta) — `palette-card.tsx`

Base de tarjeta. Los hex vienen de datos (único estilo en línea, con las muestras de evidencia). Sobretítulo "Tu
paleta · orientativa"; título `font-display text-titulo` "Otoño cálido"; `text-meta text-tinta-suave` "Subtono cálido ·
contraste medio"; insignia de confianza `rounded-insignia px-2.5 py-1 text-meta font-extrabold`: alta `bg-exito
text-sobre-estado`, media `bg-hundido text-tinta`, baja `bg-falta text-sobre-color`, siempre con texto ("Confianza media").
Grupos (`text-sobretitulo uppercase text-tinta-suave`): "Te favorecen", "Tus neutros", "Mejor lejos del rostro" en
`grid grid-cols-4 gap-3`; muestra `aspect-square rounded-full ring-1 ring-tinta/10` (`role="img" aria-label`) + nombre
`mt-1 text-meta`; "Evitar" con diagonal y rótulo explícito. Aviso de luz (`lighting_ok = false`): `rounded-insignia
bg-falta px-3 py-2 text-cuerpo text-sobre-color` "La luz de la foto no era pareja. Tómalo como punto de partida."
Transparencia fija `text-meta text-tinta-suave`: "Es una orientación a partir de una foto, no un diagnóstico. Tu selfie
ya se borró." Acciones: "Ajustar" (contorno; inline, Chips de estación y subtono → `source: 'manual'`, R-08) · "Ver tu paleta" (texto).

### 7.16 ConsentCard y MemoryNote

- **ConsentCard** (R-03): base de tarjeta; título `text-nombre` "Antes de tu selfie"; texto `text-cuerpo
  text-tinta-suave` "Autorizo analizar mi selfie para estimar mi paleta. La foto se borra apenas termina el análisis.";
  "Aceptar y abrir cámara" (principal) · "Mejor no" (texto). Aceptada: `text-sm font-bold text-exito` "Autorizado el 14 nov".
- **MemoryNote** (`memory-note.tsx`), sin tarjeta: `grid grid-cols-[28px_1fr] items-start gap-x-2.5`; marcador
  `grid size-7 place-items-center rounded-full bg-memoria text-sobre-color` (ícono marcador `size-4`); texto
  `text-cuerpo text-tinta-suave` con `<span class="font-extrabold text-tinta">Anotado:</span>` + hecho; acciones
  `col-start-2 flex gap-4`: botones de texto "Deshacer" (`deleteMemoryFact(id)`) y "Lo que sé de ti" (`/yo#memoria`).
  Deshecho: "Lo borré." sin botones.

### 7.17 Tu espacio: SpaceSheet, SpaceHeader, GarmentTile

- **SpaceSheet** (dentro de `app-header.tsx`, reutiliza `Sheet`): `<dialog aria-labelledby>` modal. Velo `fixed
  inset-0 z-40 bg-tinta/40`. Hoja `fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-app flex-col rounded-t-tarjeta
  bg-superficie px-6 pt-2 pb-seguro shadow-flotante animate-subir`; asa `mx-auto block h-[5px] w-9 rounded-full
  bg-linea`. Cabecera `mt-2 flex items-center justify-between`: `font-display text-titulo` "Tu espacio" + cerrar
  `-mr-2.5 grid size-11 place-items-center rounded-full` `aria-label="Cerrar"`.
  Lista con `border-t border-linea` entre ítems; ítem `<a class="grid grid-cols-[1fr_auto] items-center gap-x-3
  py-3.5">`: título `font-display text-titulo-s` con conteo `<sup class="ml-1 font-body text-meta font-bold
  text-tinta-suave">`; bajada `mt-1 text-meta text-tinta-suave` con marca `mr-1 rounded-insignia px-1.5 py-0.5
  text-[11px] font-extrabold` cuando aplica ("Nuevo" `bg-inverso text-sobre-inverso`; "Recién" `bg-memoria
  text-sobre-color`); a la derecha (`col-start-2 row-span-2 flex gap-1`) miniaturas `h-10 w-[34px] rounded-insignia
  bg-hundido p-[3px]` o muestras `size-3.5 -ml-[5px] rounded-full ring-2 ring-superficie`.

  | Ítem | Conteo | Bajada (maqueta v3) | Derecha |
  |---|---|---|---|
  | Tu clóset | prendas | "Última: blazer de lino" | miniaturas |
  | Tus looks | guardados | "Nuevo" + "Lino y salvia de día" | miniatura del look |
  | Lo que sé de ti | hechos | "Recién" + "Taco ancho en eventos de día" | — |
  | Tu paleta | — | "Otoño cálido · orientativa" | 5 muestras |

  "Cerrar sesión" botón de texto al final. Cierra con botón, velo, Escape o deslizar; el foco vuelve a "Tu espacio".
- **SpaceHeader**: `sticky top-0 z-20 bg-fondo/90 pt-seguro backdrop-blur-md` → `flex h-14 items-center px-4` + botón
  de texto con chevron "Volver a la conversación".
- **GarmentTile** (`components/espacio/garment-tile.tsx`, anatomía de la tarjeta de prenda de Prendie): enlace
  `flex min-w-0 flex-col gap-2`; foto `relative aspect-[4/5] overflow-hidden rounded-foto bg-hundido` (recorte al 78 %
  con `drop-shadow-prenda`, o respaldo §11); a lo más una insignia sobre la foto (`absolute left-2.5 top-2.5
  rounded-insignia bg-superficie px-2.5 py-1 text-[11px] font-extrabold`, p. ej. "Favorita"); nombre `text-nombre
  truncate`; meta `mt-0.5 text-meta text-tinta-suave` (categoría). Estados procesando / "Completar datos" / esqueleto.

### 7.18 Toast y error

- Región `aria-live="polite"` `pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto flex max-w-app justify-center px-6`.
- Toast `pointer-events-auto flex min-h-12 w-full items-center gap-3 rounded-campo bg-inverso px-4 py-3 text-cuerpo
  text-sobre-inverso shadow-flotante animate-subir`; 5 s (7 s con acción).
- Error en bloque: `flex gap-3 rounded-campo border-[1.5px] border-error bg-superficie p-4 text-cuerpo text-tinta`
  `role="alert"`, ícono y título `text-error`, + qué pasó + qué hacer + "Reintentar". En el hilo, los errores del asesor
  van como AdvisorMessage de error (§7.4).

## 8. Movimiento

Del rediseño v3 (Prendie no define movimiento). Solo `transform`, `opacity` y `filter`; nada se mueve después de asentarse.

| Qué | Duración | Curva |
|---|---|---|
| Cambio de rótulo de estado (crossfade) | 150 ms | `ease` |
| Aparición de fila, mensaje o turno (opacidad + 6 px) | 260 ms | `ease-salida` |
| Miniaturas del clóset (escalonado, desde `scale(.92)`) | 200 ms, 40 ms entre cada una | `ease-salida` |
| Prendas que caen en la mesa (opacidad, −12 px, +5° → giro final) | 360–420 ms, 80 ms entre cada una (+120 ms) | `ease-salida` |
| Esqueleto → contenido | 200–260 ms | `ease` |
| Opciones de compra (opacidad + 8 px, escalonado) | 240 ms, 70 ms entre cada una | `ease-salida` |
| Cámara del hilo (seguir lo nuevo) | 720 ms | `ease-viaje` |
| Prenda que vuela de la opción a la tira | 560 ms con arco | `ease-viaje` |
| Cambio de opción (crossfade + desenfoque 2 px) | 200 ms | `ease` |
| Presión de botón o chip | 140 ms, `scale(.96–.97)` | `ease-salida` |
| Puntos de "pensando" | 1.2 s en bucle, opacidad | `ease-viaje` |
| Esqueletos | 1.6 s en bucle, opacidad | `ease-viaje` |

- El cambio de piel del look (inverso → papel) es instantáneo: no se anima el color de fondo.
- Scroll al último mensaje: `scrollIntoView({ behavior: 'smooth', block: 'end' })`; reducido: `'auto'`.
- **`prefers-reduced-motion`**: sin desplazamientos ni vuelos; solo opacidad. Puntos y esqueletos fijos al 60 %
  (`motion-reduce:animate-none motion-reduce:opacity-60`).

## 9. Accesibilidad del hilo

- **Lectura**: el hilo es una `section` con `aria-label`, **sin** `aria-live`. Una región `sr-only aria-live="polite"`
  anuncia: el mensaje completo del asesor al recibir `done`; "Te propuse un look: <título>"; "Reconocí: <nombre>";
  "Tu paleta: <estación>, confianza <nivel>"; "Anotado: <hecho>"; y cuántas opciones de compra hay. El paso en curso
  del rastro es `role="status"`; el hilo lleva `aria-busy="true"` mientras transmite.
- **Estructura**: rastro `<ol aria-label="Lo que hice">`, su resumen es un botón con `aria-expanded` y `aria-controls`;
  look y opciones son `article`/`section` con nombre; opciones con `aria-pressed`; la evidencia es una lista (no son
  botones); los botones de refinar van en `role="group"` con nombre; las etiquetas de foto son botones con nombre
  completo ("Vestido midi estampado, nuevo: guardar").
- **Foco**: anillo azul de 3 px con 2 px de separación en todo lo interactivo (`foco` ≥ 3:1 sobre `fondo`, `superficie`
  e `inverso`). Se queda en el compositor al enviar; al tocar una sugerencia vuelve al compositor. Al abrir la hoja,
  foco al título; al cerrar, al disparador.
- **Color**: lima, lavanda y naranja nunca son el único portador de información (siempre texto: "Falta", "Recién",
  "Confianza baja"); nunca texto en esos colores sobre claro.
- **Teclado en móvil**: compositor `sticky` en el flujo; `interactiveWidget: "resizes-content"` en `viewport`.
- **Scroll**: auto-scroll solo si la persona está a menos de 120 px del final; si no, "Ir al final". `/asesor` parte abajo.
- **Fotos**: `alt` = nombre de la prenda; foto enviada "Foto que enviaste"; selfie "Selfie (se borra después del
  análisis)"; contornos de pieza faltante `aria-hidden`.
- Objetivos táctiles ≥ 44 px (chips de 36 con área extendida, etiquetas de foto, resumen del rastro); separación ≥ 8 px;
  contraste según `DESIGN.MD` §1.

## 10. Responsive

Móvil primero: verificar a **390 px y 360 px**; margen lateral 24 px (`px-6`). ≥ 768 px: `body` en `hundido`, la app
es una columna `mx-auto max-w-app bg-fondo min-h-dvh`; encabezado, compositor, hoja y toasts comparten `max-w-app
mx-auto`. Filas con scroll horizontal: solo los botones de refinar (con máscara a la derecha) y el filtro del clóset.
Las opciones de compra son tres columnas a la vista, nunca carrusel.

## 11. Tratamiento de imágenes de prenda

1. **Foto que llega** (cama, luz tibia, prenda en ángulo): sirve para reconocer; nunca se muestra como prenda del clóset.
2. **Recorte**: fondo eliminado, prenda enderezada a 0°, centrada (BF-07: percepción separada).
3. **En Estilo**: sobre `bg-hundido` (fondo neutro de Prendie), `rounded-foto`, `drop-shadow-prenda`, prenda al 78 % del
   alto. Marco 4:5 (clóset, tarjeta de prenda) o 1:1 (opciones, miniaturas, tira).
4. **Si el recorte falla o aún no existe**: foto entera 4:5, `object-cover`, sobre `bg-hundido` mientras carga. Nunca un
   bloque de color.
5. **Composición del look**: mesa 3:2, rotaciones −7° a 7°, solapes leves, la principal más grande, índice numerado;
   la faltante punteada en su lugar con "Falta".
6. **Foto enviada en el hilo**: 4:5, `rounded-foto`, etiquetas encima.
7. Compresión en cliente (≤ 1280 px, JPEG, sin EXIF) antes de subir; `aspect-*` siempre declarado; `loading="lazy"`
   fuera de pantalla. Selfie: nunca se muestra después del análisis (R-04).

## 12. Lo que la UI necesita del backend

Reemplazado: la lista de cambios del contrato de datos (tipos, eventos SSE, asesor simulado, persistencia) vive en
`docs/superpowers/specs/2026-11-14-migracion-identidad-prendie.md` §2. Ya existen: `quick_replies`, `garment`,
`palette`, `memory` (con `id`).

## 13. Copy

Voz propia de Estilo (no la de Prendie): cercana, precisa, segura; tuteo chileno neutro, sin chilenismos de marca,
sin emoji, sin "Ups". Vocabulario: prenda, look, clóset, paleta, asesor, persona (nunca "círculo", "apañe", "usuario").
Mayúscula solo al inicio. Botones verbo + objeto; sugerencias en primera persona ("Te mando la invitación"); botones de
refinar como intención corta ("Más formal"). Rastro en pasado y con dato. El asesor nunca dice "defecto", "disimular",
"cuerpo ideal", "diagnóstico" (de color), "cómpralo". Frases fijas: "Es una orientación a partir de una foto, no un
diagnóstico." · "La foto se usa solo para el análisis y se borra apenas termino; guardo solo el resultado." · "Precio y
stock pueden cambiar." · "Enlace con comisión".

## 14. Por definir

| # | Tema | Qué falta | Quién |
|---|---|---|---|
| PD-1 | **Maqueta en la identidad nueva** | No hay maqueta del hilo con la identidad de Prendie; la v3 está en piel "Atelier". El flujo del proyecto pide maqueta aprobada antes de construir. Hacerla (`stageshow`) con los seis momentos de J4 antes de las historias del look y de compra. Existe un borrador sin versionar, `docs/superpowers/mockups/2026-11-14-conversacion-v4.html`, con **otros nombres de token** (`ti`, `atencion`, `peligro`, `sobre-accion`) y tema Noche: unificar con `DESIGN.MD` antes de aprobarlo. | Diseño + Felipe |
| PD-2 | Sombra del velo y toasts | `shadow-flotante` se extiende de la navegación flotante de Prendie (que Estilo no tiene) a hoja, toast e "Ir al final"; confirmar con la maqueta. | Diseño |
| PD-3 | Logotipo de Estilo | Wordmark provisional en Bricolage 800 (A-05). | Felipe |
| PD-4 | Tema Noche | Cuándo se suma; los valores existen en `prendie/design/tokens.json`. | Felipe |
| PD-5 | Borde del campo | `hundido` sin borde sobre barra `superficie` (1.22:1): validar con `accessibility-review`; alternativa: `border-[1.5px] border-linea-fuerte`. | Diseño |
| PD-6 | Sombra de la prenda | `drop-shadow-prenda` tiene tono cálido (v3) sobre `hundido` frío: verificar en la maqueta y ajustar si ensucia. | Diseño |
| PD-7 | "Look recién propuesto" | Regla adoptada: último look no descartado. Confirmar si un look **guardado** conserva el `inverso` mientras sea el último. | Felipe |
| PD-8 | Foto con varias prendas | El momento 5 choca con DP-06 (foto con varias prendas → V2). Decidir si entra al MVP. | Felipe |
| PD-9 | Recorte de prenda | Cómo se recorta (servicio o modelo), costo y dónde corre. Sin él, todo usa el respaldo §11.4. | Integrador |
| PD-10 | Rótulos en pasado | Para `add_garment`, `analyze_palette`, `remember`, `update_profile`, y su dato. | Diseño (`ux-copy`) |
| PD-11 | Estados sin maqueta | Dato de "Lo que entendí" corregido; foto "analizando"; opción "sin stock"; toque en una etiqueta "En tu clóset". | Diseño |
| PD-12 | Contorno de pieza faltante | Un SVG punteado por categoría (`web/public/`); la maqueta solo dibuja zapatos. | Diseño |
| PD-13 | Composición automática | Plantillas por cantidad y categoría de prendas (2 a 7); la maqueta solo da la de 5. | Diseño |
| PD-14 | "Nuevo" / "Recién" | Cuánto dura la marca en la hoja. | Felipe |
| PD-15 | Tienda real | Lista de tiendas y búsqueda (A-01, DT-09). | Felipe |
