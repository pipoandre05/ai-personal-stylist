# Rediseño del hilo v3: dos tratamientos

2026-11-14 · Design Lead · Insumo para el integrador. **No reemplaza** `UX_UI_SPEC.md` ni `DESIGN.MD` todavía.

- Maqueta: `docs/superpowers/mockups/2026-11-14-conversacion-v3.html` (A y B, seis momentos cada uno, anexo de imagen).
- Demo animada (tratamiento A): `docs/superpowers/mockups/2026-11-14-conversacion-v3-demo.html`.
- Capturas: `docs/superpowers/mockups/capturas/v3-*.png`.

---

## 1. Diagnóstico: por qué la maqueta v0.2 no alcanzaba

1. **La imagen no era producto.** Las prendas eran siluetas planas (un rectángulo con cuello, un pantalón de dos trazos) dentro de celdas de color. En moda la foto es lo que se compra y se recuerda; con bloques, la tarjeta del look parecía un esquema.
2. **Todo pesaba lo mismo.** Tarjeta de look, prenda, paleta y consentimiento tenían el mismo borde `linea` de 1 px, el mismo radio y el mismo fondo. El ojo no sabía dónde aterrizar; el look (el valor del producto) competía con una tarjeta de consentimiento.
3. **Tipografía tímida.** Cuerpo del asesor en Hanken 16 px, igual que la persona y los metadatos: la "voz de columnista" era solo un texto sin burbuja. Bodoni aparecía solo en títulos de 24 px.
4. **El trabajo del asesor desaparecía.** "Mirando el clima…" se borraba al llegar el texto (spec §7.7). No quedaba evidencia de que revisó el clóset.
5. **La persona en un bloque rosa** (`acento-suave`) se leía como burbuja de mensajería genérica.
6. **Faltaba el recorrido que manda (DP-19):** no había opciones de compra, ni pieza faltante dentro del look, ni refinamiento sobre la tarjeta.
7. **Sin materia.** Fondos sólidos, cero sombra, cero textura: un wireframe bonito, no un objeto que dé ganas de tocar.

## 2. Principios del rediseño

1. **La prenda es la protagonista**: recortada, con una sola luz, sobre papel. Nunca un bloque de color.
2. **Una jerarquía por pantalla**: el resultado (look, opciones) es el objeto más pesado; el resto es texto.
3. **La voz se oye distinta**: el asesor en serif de lectura; la persona en sans; la interfaz en sans pequeña.
4. **El trabajo deja rastro** en pasado, con su dato.
5. **Se refina sobre la tarjeta**, no escribiendo de nuevo.
6. **Honestidad comercial visible en la tarjeta**: tienda, precio visto, fecha, comisión, "Ver en la tienda". Nunca comprar.
7. **Movimiento que informa y se calla**: entra, se asienta, no vuelve a moverse.

---

## 3. Tratamiento A · Atelier, segunda edición (recomendado)

Evolución sobria: mismo papel, tinta y granate, con materia y una voz de lectura.

### 3.1 Color

| Token | Hex | Uso | Cambio |
|---|---|---|---|
| `fondo` | `#F6F2EC` | Papel del hilo | = |
| `superficie` | `#FFFDF9` | Tarjetas, campos | = |
| `hundido` | `#ECE6DC` | Esqueletos | = |
| `mesa` | `#EEE7DB` + grano | Fondo de prenda recortada | **nuevo** |
| `yo` | `#EAE3D7` | Mensaje de la persona | **nuevo** (reemplaza `acento-suave` en el mensaje) |
| `tinta` | `#1F1B17` | Texto, primario | = |
| `tinta-suave` | `#5C534A` | Metadatos | = |
| `linea` / `linea-fuerte` | `#DDD5C9` / `#8F8478` | Divisores / bordes de control | = |
| `acento` | `#7A2E2A` | Firma, énfasis, "Falta" | = |
| `acento-suave` | `#F3E4DF` | Etiqueta "Falta" | = |
| `exito` | `#2E5E43` | "Guardado" | = |

Contraste (WCAG 2.x, calculado):

| Texto / fondo | Ratio |
|---|---|
| tinta / fondo | 15.34 |
| tinta / yo | 13.42 |
| tinta-suave / yo | 5.90 |
| tinta-suave / mesa | 6.12 |
| tinta-suave / superficie | 7.41 |
| acento / superficie | 9.18 |
| acento / mesa | 7.59 |
| acento / acento-suave | 7.54 |
| exito / fondo | 6.73 |
| superficie / tinta (botón primario) | 16.84 |
| `#D9CFC2` / tinta (bajada de etiqueta "Nuevo") | 11.12 |
| tinta / etiqueta de foto (superficie 94 %) | ≈ 16 |
| linea-fuerte / superficie (borde de control) | 3.60 (≥ 3 no-texto) |

### 3.2 Tipografía

**Cambio propuesto:** se agrega **Newsreader** (Google Fonts, óptica 6–72) como voz del asesor. Bodoni Moda es de display: bajo 20 px sus trazos finos se rompen y Hanken no distingue al asesor de la interfaz. Newsreader da la "columnista" de Claude y Pi con lectura cómoda a 17,5 px.

| Rol | Familia | Tamaño / interlínea | Peso |
|---|---|---|---|
| Título de look | Bodoni Moda | 30 / 1.04, `-0.015em` | 500 (énfasis en cursiva granate) |
| Título de hoja "Tu espacio" | Bodoni Moda | 32 / 1.1 | 500 |
| Ítems de Tu espacio | Bodoni Moda | 24 / 1.15 | 400, conteo en superíndice Hanken 11 |
| Wordmark | Bodoni Moda cursiva | 27 | 500 |
| Voz del asesor | Newsreader | 17.5 / 1.52 | 400, `em` cursiva granate |
| Porqué del look | Newsreader | 16 / 1.5 | 400 |
| Persona | Hanken Grotesk | 16 / 1.45 | 400 |
| UI (chips, botones) | Hanken Grotesk | 14–15 | 500–600 |
| Metadatos | Hanken Grotesk | 12.5–13.5 / 1.35 | 400 |
| Sobretítulos | Hanken Grotesk | 11, caps, `0.14em` | 600 |
| Precios | Hanken Grotesk | 14–15, `tabular-nums` | 600 |

### 3.3 Forma, sombra, espacio

- Radios: tarjeta `14px` (antes 8), control `10px` (botón), mesa `10px`, chips y campo `999px`, mensaje de la persona `20 20 6 20`.
- **Sombras (cambio):** DESIGN.MD prohíbe sombra en tarjetas. Propongo dos sombras con función:
  - `--sombra-papel: 0 0 0 1px rgb(31 27 23/.05), 0 1px 2px rgb(31 27 23/.06), 0 10px 24px -14px rgb(31 27 23/.22)`: tarjetas de resultado (look, compra, "Lo que entendí"). Reemplaza el borde `linea`: la tarjeta es una hoja sobre el papel.
  - `--sombra-prenda: drop-shadow(0 1px 1px rgb(58 40 22/.2)) drop-shadow(0 7px 9px rgb(58 40 22/.16))`: toda prenda recortada. Una sola luz, cenital y cálida.
  - `--sombra-flotante` sigue para la hoja y toasts.
- Espaciado (base 4): hilo `padding 8 20 14`, entre turnos `22`, dentro del turno `14`, tarjeta `16`, entre controles `8`, rastro `14`.

### 3.4 Movimiento

| Qué | Duración | Curva |
|---|---|---|
| Cambio de etiqueta de estado (crossfade) | 150 ms | `ease` |
| Aparición de fila, mensaje o turno (opacity + 6 px) | 260 ms | `--ease-salida` `cubic-bezier(.23,1,.32,1)` |
| Miniaturas del clóset (escalonado) | 200 ms, 40 ms entre cada una | `--ease-salida` |
| Prendas que caen en la mesa (opacity, −12 px, +5° → giro final) | 360–420 ms, 80 ms entre cada una | `--ease-salida` |
| Esqueleto → contenido | 200–260 ms | `ease` |
| Cámara del hilo (seguir lo nuevo) | 720 ms | `--ease-viaje` `cubic-bezier(.45,0,.1,1)` |
| Zapato que vuela de la opción al look | 560 ms con arco | `--ease-viaje` |
| Cambio de opción en el look (crossfade + blur 2 px) | 200 ms | `ease` |
| Presión de botón/chip | 140 ms, `scale(.96–.97)` | `--ease-salida` |
| Puntos de "pensando" | 1.2 s en bucle, opacity | `--ease-viaje` |

`prefers-reduced-motion`: sin desplazamientos ni vuelos; solo opacidad. Los puntos y esqueletos quedan fijos al 60 %.

### 3.5 Componentes del hilo (anatomía, estados, reglas CSS de la maqueta)

| Componente | Anatomía | Estados | Reglas clave |
|---|---|---|---|
| `AdvisorMessage` | Firma "Estilo" (solo primer bloque del turno) + párrafos | streaming, error | `.asesor` Newsreader 17.5/1.52; `.firma` 11 caps granate |
| `PersonMessage` | Bloque a la derecha | enviando, fallido | `.yo` fondo `yo`, radio `20 20 6 20`, máx. 82 % |
| `EventSummary` "Lo que entendí" (**nuevo**) | 2×2 datos tocables: ícono + dato + bajada | normal, corregido | `.entendi` grid 2 col, `.dato` superficie + sombra-papel, min-h 58 |
| `SuggestedReplies` | Píldoras a la derecha, en la voz de la persona | — | `.sug` min-h 44, borde `linea-fuerte`, alineado a la derecha |
| `ToolTrail` (**reemplaza ToolStatus**) | Línea vertical, una fila por herramienta: ícono en círculo, verbo en pasado, dato; miniaturas del clóset con las elegidas marcadas | en curso (ícono granate + puntos), hecho, colapsado | `.rastro`, `.paso`, `.paso.en-curso`, `.thumbs .th.elegida`; colapsado `.rastro-res` (check verde + resumen + chevron) |
| `OutfitCard` | Sobretítulo (fecha · lugar · clima) → título Bodoni → **mesa** con prendas numeradas → leyenda → "Por qué funciona" + evidencia → refinar → acciones | cargando (esqueleto en su lugar), listo, con pieza faltante, guardado | `.look`, `.mesa` 3:2, `.pz` absolutas con `--r`, `.idx`, `.falta-tag`, `.evidencia li` (datos, no botones, alto 26), `.refinar .chip` (botones, alto 44), `.acciones` 2 col |
| `ShoppingOptions` (**nuevo**) | **Tira del look** (5 celdas, la pieza elegida enmarcada en granate) → 3 opciones (foto 1:1 sobre mesa, tienda, nombre, precio) → ficha de la elegida → refinar búsqueda | sin elegir, elegida, cambiando, sin stock | `.compra`, `.tira`, `.tira-c.nueva`, `.ops` 3 col, `.op.sel` (anillo tinta + check), `.ficha` |
| `ProductCard` honesta (ficha) | Tienda en caps · "Enlace con comisión" si aplica · nombre + precio · porqué en una línea · "Visto hoy, 14 nov, 10:40 · Precio y stock pueden cambiar" · "Ver en la tienda ↗" (secundario, sale de la app) | con/sin comisión | `.ficha-cab`, `.comision`, `.ficha-meta`. Nunca "Comprar". |
| `PhotoMessage` con etiquetas | Foto 4:5 de la persona; encima, etiquetas por prenda (punto + nombre + estado); lo nuevo en tinta con "+" | analizando, etiquetada, sin prendas | `.foto`, `.etq` (min-h 40 + área táctil 44), `.etq.nueva` |
| `CutoutPreview` (**nuevo**) | Antes → después: "Así queda en tu clóset" | — | `.recorte` |
| `MemoryNote` | Ícono marcador granate + "Anotado: …" + Deshacer · Lo que sé de ti | anotado, deshecho | `.memoria`, `.ter` (min-h 44) |
| `SpaceSheet` | Asa, "Tu espacio" Bodoni 32, ítems editoriales con conteo en superíndice, miniaturas o muestras a la derecha, "Nuevo"/"Recién" en granate | abierta | `.hoja` 53 %, `.velo` 26 % |
| `Composer` | Cámara · campo con placeholder contextual · enviar/detener | vacío, escribiendo, respondiendo (detener) | `.compositor`, `.campo` (min-width 0), `.enviar.detener` |

### 3.6 Tratamiento de imágenes

1. **Foto que llega** (cama, luz tibia, prenda en ángulo): se usa para reconocer, nunca se muestra como prenda del clóset.
2. **Recorte**: fondo eliminado, prenda enderezada a 0°, centrada (BF-07: percepción separada).
3. **En Estilo**: sobre `mesa` con grano, `--sombra-prenda`, prenda al 78 % del alto. Marco 1:1 (opciones, miniaturas) o 4:5 (clóset).
4. **Si el recorte falla**: foto entera en 4:5, saturación −10 %, velo de papel en los bordes (`box-shadow: inset 0 0 40px 10px` del color `mesa`). Nunca bloque de color.
5. **Composición del look**: mesa 3:2, rotaciones −7° a 7°, solapes leves, prenda principal más grande, índice en cursiva Bodoni. La pieza faltante se dibuja punteada en su lugar con "Falta".
6. **Foto enviada en el hilo**: 4:5, radio `18 18 6 18` (lado de la persona), etiquetas encima.

---

## 4. Tratamiento B · Revista

Más audaz: el hilo se compone como una revista. Mismo DOM que A, otra hoja de estilo (`.t-b`).

### 4.1 Diferencias

- **El look a sangre** sobre un **campo de color** sacado de la paleta (`campo` salvia `#DCE1D2`), sin tarjeta; número de look "01" en Bodoni cursiva; título 37 px.
- **Sin radios** en tarjetas, chips y botones; filetes de tinta de 1 px en vez de cajas.
- **La persona sin burbuja**: texto a la derecha con un filete granate de 1 px encima.
- **El asesor** en Hanken 16 con una entrada (lede) en Bodoni cursiva 25 px.
- **Rastro numerado** 01, 02, 03 en Bodoni cursiva, sin íconos.
- **Opciones como columna de compras**: filas con miniatura 52 px y precio en Bodoni 21 px.
- **Etiquetas de foto** en tinta (lo nuevo en granate), rectas.
- **Tu espacio en tinta**: hoja oscura, Bodoni cursiva 38 px.

### 4.2 Tokens B

| Token | Hex |
|---|---|
| `fondo` | `#F3EEE5` |
| `superficie` | `#FBF8F2` |
| `tinta` | `#16120F` |
| `tinta-suave` | `#5A5047` |
| `campo` (salvia, por look) | `#DCE1D2` |
| `campo-suave` (texto sobre campo) | `#4E5246` |
| `acento` | `#7A2E2A` |
| Texto secundario sobre tinta | `#B9AFA3` |

| Texto / fondo | Ratio |
|---|---|
| tinta / fondo | 16.12 |
| tinta-suave / fondo | 6.80 |
| tinta / campo | 13.96 |
| campo-suave / campo | 6.01 |
| acento / campo | 6.99 |
| fondo / tinta | 16.12 |
| `#B9AFA3` / tinta | 8.62 |
| `#E9C9C2` / tinta ("Nuevo" en la hoja) | 12.06 |
| `#F0DCD6` / acento (etiqueta nueva) | 7.07 |
| linea-fuerte `#8A8178` / fondo | 3.31 |

Si el campo cambia por look (p. ej. arcilla `#ECDCCB`), se verifica: tinta 13.89, tinta-suave 5.86.

Tipografía B: Bodoni Moda (títulos 37–38, lede 25, precios 21, numeración 22) + Hanken Grotesk (cuerpo 16, UI 12–15). Radios 0 (salvo chips de la persona = 0 también). Sombras: ninguna en el hilo; la jerarquía la dan el campo de color y los filetes. Movimiento: igual que A.

---

## 5. Patrón del informe de referentes → cómo quedó aplicado

| # | Patrón | Aplicación en v3 | Momento |
|---|---|---|---|
| 1 | Rastro del trabajo que queda | `ToolTrail`: filas en pasado con dato ("32 prendas · 9 sirven · elegí 4") y miniaturas; colapsa a una línea con check | 2, 3, 4 |
| 2 | Refinar sobre la tarjeta | Chips "Más formal", "Otro color", "Cambiar el blazer" en el look; "Más baratos", "Taco más bajo", "No me interesan" en la compra; tocar otra opción cambia el zapato dentro del look | 3, 4, demo |
| 3 | Voz sin burbuja + rótulo mínimo | Asesor en serif sin contenedor; firma solo en el primer bloque; persona distinta (bloque cálido en A, filete en B) | todos |
| 4 | Memoria anunciada y editable | "Anotado: …" con Deshacer y Lo que sé de ti; la hoja muestra "Recién" | 6 |
| 5 | Foto con etiquetas encima | Etiquetas por prenda; lo nuevo destacado y guardable; vista previa del recorte | 5 |
| 6 | Porqué con evidencia de la persona | "Por qué funciona" + datos: muestras de la paleta, "27° y viento", "4 de tu clóset" | 3 |
| 7 | Tarjeta de producto honesta | Tienda, precio visto, fecha y hora, "Precio y stock pueden cambiar", "Enlace con comisión" en la tarjeta, "Ver en la tienda ↗" | 4 |
| 8 | Sugerencias en la voz de la persona | Alineadas a la derecha, en primera persona ("Dice «formal de día»", "Te mando la invitación") | 1, 5 |
| 9 | Placeholder contextual | "O dímelo con tus palabras", "¿Qué le cambiarías?", "Pregunta por una opción…", "Pregúntame por la foto…" | todos |
| 10 | Movimiento que informa y se calla | Crossfade de estado, filas una tras otra, prendas que se asientan, cámara que sigue lo nuevo; nada se mueve después | demo |
| — | Arranque por intención / preguntar lo justo | "Lo que entendí" muestra lo inferido (fecha, lugar, clima, de día) y pregunta solo la vestimenta | 1 |
| — | Marcador en su lugar (Vercel) | Esqueleto del look con la geometría de la mesa antes del contenido | 2 |
| — | Tu espacio editorial | Títulos Bodoni con conteo en superíndice | 6 |

**Anti-patrones evitados:** sin orbes, degradados morados, brillos ni destellos; sin avatar del asesor; sin emoji; sin "paso X de Y"; sin pulgares ni copiar bajo cada respuesta; sin carrusel con la segunda tarjeta cortada (las opciones son tres a la vista); sin "Comprar ahora"; sin dashboard.

---

## 6. Autocrítica (`design-critique` + `impeccable`) y lo que corregí

| Hallazgo | Corrección |
|---|---|
| En el momento 3 el título del look quedaba bajo el encabezado (la tarjeta no cabía) | Mesa 5:4 → 3:2, porqué en dos líneas, evidencia en una fila, título más corto ("Lino y salvia *de día*") |
| Los teléfonos de una fila no quedaban alineados (bajadas de 1 y 2 líneas) | Pie de cada momento con alto mínimo común |
| El campo del compositor empujaba el botón Enviar fuera de la pantalla a 360 px | `min-width:0` en el campo; placeholders acortados |
| B usaba un filete lateral de 2 px en el mensaje de la persona (patrón vetado por `impeccable`) | Filete de 1 px **encima**, a todo el ancho del texto |
| Objetivos táctiles bajo 44 px: resumen del rastro (36), Deshacer (40), etiquetas de foto (40) | 44 px (las etiquetas con área táctil extendida) |
| La sábana de la foto parecía agua (textura gris y ondulada) | Iluminación difusa más suave, base cálida, grano fino |
| Etiqueta "Zapatillas blancas" se cortaba a 390 px | Reubicada |
| En el momento 6 la hoja tapaba la nota de memoria | Hoja al 53 %, velo más liviano y la nota visible encima |
| La ficha de compra dejaba un hueco al cambiar a una opción sin comisión | Cabecera con alto fijo; nombres más cortos |
| Póster de la demo con movimiento reducido quedaba a medio animar | Las animaciones se completan antes de pausar |
| Raya larga en títulos y `#fff` en el anexo | Reemplazados |

Queda abierto: el granate se usa en varios puntos chicos por pantalla (firma, énfasis, "Falta"); DESIGN.MD pide "un uso fuerte". Lo considero cumplido (solo el énfasis del título es fuerte), pero conviene revisarlo en producto real.

---

## 7. Lo que el contrato de datos necesita (para que el integrador evalúe)

Hoy `lib/domain/types.ts` tiene texto, estado de herramienta, look, prenda, paleta, sugerencias, memoria y error. El diseño pide:

| Necesidad | Propuesta |
|---|---|
| **Pasos de trabajo persistentes** | Evento `tool_step { id, tool, status: 'running'\|'done'\|'error', label_running, label_done, detail?, items?: { garment_id, chosen }[] }` guardado en `parts` del turno para rehidratar el rastro (hoy `tool_status` es efímero). |
| **Resumen del evento entendido** | Evento `event_summary { date, place, setting, weather: { min, max, note }, missing: 'dress_code'\|… }`; cada dato editable por Server Action. Requiere clima por ciudad y fecha (PLAN_GENERAL §4). |
| **Look con pieza faltante y composición** | `outfit` gana `missing: { slot: 'shoes'\|…, reason }[]`, `evidence: { kind: 'palette'\|'weather'\|'closet'\|'occasion', label, swatches? }[]`, `layout?` (posición/rotación por prenda, opcional; si no, la UI compone por categoría). |
| **Chips de refinamiento** | `refinements: { id, label, intent }[]` en `outfit` y en `shopping_options`; tocar envía `intent` como mensaje estructurado, no texto libre. |
| **Opciones de compra** | Evento `shopping_options { for_outfit_id, slot, query, searched: { stores: n, results: n }, options: ProductOption[] }`, con `ProductOption { id, store_name, title, price_clp, seen_at, url, image_cutout_url, image_url, affiliate: boolean, reason, in_stock? }`. Orden sin pesar afiliación (DP-10). |
| **Opción elegida dentro del look** | Estado `selected_option_id` por look (persistido) para que la tira y Tus looks muestren la pieza. |
| **Etiquetas sobre la foto** | Resultado de percepción `photo_analysis { photo_id, items: { bbox: [x,y,w,h] normalizado, label, status: 'new'\|'in_closet', garment_id? }[] }`. |
| **Recorte de prenda** | `garment.image_cutout_url` + `cutout_status: 'ok'\|'failed'` (si falla, se usa la foto con el tratamiento de respaldo). |
| **Memoria con enlace** | `memory { fact_id, text, created_at }` ya existe; agregar `fact_id` para "Deshacer" y el ancla a `/yo#memoria`. |
| **Placeholder contextual** | `composer_hint` opcional en el último turno. |

---

## 8. Recomendación: A, con una idea de B

**A.** Es un producto para usar varias veces por semana: el serif de lectura cansa menos que una revista entera, las tarjetas son objetos claros que se tocan, la jerarquía funciona con el granate como nota y no como decorado, y es más fácil de construir y mantener con los tokens actuales (cambian pocos: `mesa`, `yo`, dos sombras, radios, Newsreader).

**B** es más memorable en una captura y tiene la mejor idea de la entrega: **el campo de color del look**. Lo tomaría como variante del look recién propuesto (campo con un color de la paleta de la persona), no como sistema completo: los filetes a sangre, la tipografía grande y la hoja en tinta exigen mucha disciplina en cada componente nuevo y pierden calidez en la décima conversación.

**Para decidir con Felipe:** (1) ¿Newsreader entra al sistema? (2) ¿Se aceptan las dos sombras con función? (3) ¿El campo de color de B entra como variante del look?
