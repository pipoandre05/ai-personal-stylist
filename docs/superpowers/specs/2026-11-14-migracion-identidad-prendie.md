# Migración del código a la identidad de Prendie (con los patrones del hilo v3)

2026-11-14 · Lista de trabajo para llevar `web/` a lo decidido en DP-23: identidad visual de Prendie, estructura propia,
modelo de interacción del rediseño v3.

- **Qué construir**: `DESIGN.MD` (tokens, contraste, reglas) y `docs/producto/UX_UI_SPEC.md` v0.3 (anatomía, estados,
  clases; los choques de identidad resueltos en §1.1). Este documento no repite valores de componentes: dice **en qué
  orden** y **quién** hace cada cambio.
- **Referencias**: identidad en `prendie/design/` (`README.md`, `tokens.json`; solo valores, no su estructura ni sus
  clases `pd-`); anatomía, contenido y movimiento en la maqueta v3 `docs/superpowers/mockups/2026-11-14-conversacion-v3.html`
  (sección A) y su demo — **no** su color ni su tipografía (piel "Atelier", reemplazada).
- **Quién**: la **sesión integradora** hace §1 y §2; el **equipo de bots** (DP-21) hace §3. Frontera del equipo:
  `web/src/app/**`, `web/src/components/**`, `web/public/**`, `web/tests/ui/**`, `docs/superpowers/**`, sin
  `web/src/app/api/**` (`docs/superpowers/plans/2026-11-14-equipo-mausbot.md` §8).
- **Terminado, común a toda historia de interfaz**: `AI_MODE=mock`; viewport **390 × 844** (y un vistazo a 360);
  recorrido del asesor simulado hasta el estado descrito; captura comparada con la maqueta de **ui-1**; solo clases de
  tokens que existen en `globals.css` (Tailwind calla); táctil ≥ 44 px; foco azul visible al tabular; lima en a lo
  más un elemento visible; `prefers-reduced-motion` sin nada a medio animar; `npm run lint` y `npm test` en verde;
  `frontend-design` + `ui-ux-pro-max` al construir e `impeccable` al cerrar; revisión visual de Felipe.

---

## 0. Punto de partida (código de hoy)

| Hoy | Destino | Dónde |
|---|---|---|
| `globals.css`: paleta "Atelier" (hueso, tinta cálida, granate), radios 2/4/8/14, foco granate 2 px, sombra flotante cálida | paleta de Prendie Día, radios por rol, foco azul 3 px | §1 |
| `layout.tsx`: Bodoni Moda + Hanken Grotesk, `themeColor #f6f2ec` | Bricolage Grotesque + Manrope, `#f2f2ee` | §1 |
| `chat/styles.ts` `cardBase` = `rounded-md border border-linea`; botones `rounded-sm h-11` | `rounded-tarjeta bg-superficie p-[18px]`; botones píldora | ui-2 |
| `ui/icons.tsx` trazo 1.5 | trazo 2, extremos redondeados | ui-2 |
| `ui/app-header.tsx` + `ui/sheet.tsx`: wordmark Bodoni, hoja con 3 vínculos | wordmark Bricolage, hoja de 4 ítems | ui-3, ui-15 |
| `advisor-message.tsx` / `person-message.tsx` (`bg-acento-suave`) | asesor `text-destacado`; persona `bg-hundido` | ui-4 |
| `tool-status.tsx` efímero | `ToolTrail` que queda | ui-7, ui-21 |
| `outfit-card.tsx` collage sobre `hundido` | mesa, leyenda, faltante, evidencia, refinar, piel inverso/papel | ui-9 a ui-13, ui-22, ui-23 |
| `memory-note.tsx` sin "Deshacer"; `AdvisorItem.memories: string[]` pierde el `id` | nota en `memoria` con "Deshacer" | ui-14 |
| `photo-message.tsx` 3:4 | 4:5 `rounded-foto`, etiquetas | ui-17, ui-28 |
| Galería del clóset en 3 columnas | 2 columnas `gap-3` (Prendie) | ui-18 |
| Sin `EventSummary`, `ShoppingOptions`, `CutoutPreview` | nuevos | ui-24 a ui-29 |

---

## 1. Base: tokens y fuentes (sesión integradora, **cambio previo**)

`globals.css` y `layout.tsx` están dentro de la frontera del equipo, pero **conviene que los haga la sesión
integradora antes de abrir historias, no como historia cero del equipo**:

1. **Todo depende de ellos y fallan en silencio**: una clase cuyo token no existe no genera CSS ni error. Con la base
   en `main` antes de repartir, las historias arrancan en paralelo sin "pasar" sin estilos.
2. **Es un cambio de piel global**: al conservar los nombres (`fondo`, `tinta`, `linea-fuerte`, `font-display`…) y
   cambiar sus valores, toda la app cambia de identidad de una vez, incluidas pantallas que ninguna historia toca
   (`/entrar`, esqueletos, toasts). Merece una sola revisión visual de Felipe.
3. **`DESIGN.MD` está fuera de la frontera** y debe calzar con `globals.css`; solo la integradora cambia ambos en un PR.
4. Es pequeño (un PR, sin lógica) y desbloquea 19 historias.

Si aun así se le da al equipo, debe ser bloqueante: nada más se reparte hasta que esté mergeado.

### 1.1 `globals.css`

Valores de `prendie/design/tokens.json` (tema Día) y, para movimiento y sombra de prenda, de la maqueta v3.

```css
@theme {
  --color-*: initial;

  /* CAMBIAN de valor (mismo nombre) */
  --color-fondo: #f2f2ee;
  --color-superficie: #ffffff;
  --color-hundido: #e8e9e4;
  --color-linea: #d6d8d2;
  --color-linea-fuerte: #121412;
  --color-tinta: #121412;
  --color-tinta-suave: #5e625d;
  --color-exito: #0b7285;
  --color-error: #c2341f;

  /* NUEVOS */
  --color-inverso: #121412;
  --color-sobre-inverso: #ffffff;
  --color-sobre-inverso-suave: #b9bdb7;
  --color-accion: #c9f24d;       /* lima: una acción principal por pantalla; nunca texto */
  --color-memoria: #c9b8ff;      /* lavanda: lo que el asesor sabe de ti */
  --color-falta: #ff8a57;        /* naranja: lo que falta o se compra; confianza baja */
  --color-sobre-color: #121412;  /* texto sobre accion, memoria y falta (también en un futuro tema Noche) */
  --color-sobre-estado: #ffffff; /* texto sobre exito y error */
  --color-foco: #2b4bff;

  /* TRANSITORIOS: alias para que el código actual no pierda estilos; se borran en ui-20 */
  --color-acento: #121412;
  --color-acento-suave: #e8e9e4;
  --color-exito-suave: #e8e9e4;
  --color-alerta: #121412;
  --color-alerta-suave: #ff8a57;
  --color-error-suave: #ffffff;

  /* Radios por rol (NUEVOS). xs/sm/md/lg actuales quedan hasta ui-20 */
  --radius-insignia: 12px;
  --radius-campo: 20px;
  --radius-foto: 24px;
  --radius-tarjeta: 28px;

  /* Estilos de texto (NUEVOS) */
  --text-titular: 40px;      --text-titular--line-height: 1.05;  --text-titular--font-weight: 800;  --text-titular--letter-spacing: -0.03em;
  --text-titulo: 26px;       --text-titulo--line-height: 1.1;    --text-titulo--font-weight: 800;   --text-titulo--letter-spacing: -0.02em;
  --text-titulo-s: 18px;     --text-titulo-s--line-height: 1.2;  --text-titulo-s--font-weight: 800; --text-titulo-s--letter-spacing: -0.01em;
  --text-destacado: 16px;    --text-destacado--line-height: 24px; --text-destacado--font-weight: 600;
  --text-cuerpo: 15px;       --text-cuerpo--line-height: 22px;   --text-cuerpo--font-weight: 500;
  --text-nombre: 14px;       --text-nombre--line-height: 20px;   --text-nombre--font-weight: 800;
  --text-control: 14px;      --text-control--line-height: 18px;  --text-control--font-weight: 700;
  --text-meta: 12px;         --text-meta--line-height: 16px;     --text-meta--font-weight: 500;
  --text-sobretitulo: 12px;  --text-sobretitulo--line-height: 16px; --text-sobretitulo--font-weight: 700; --text-sobretitulo--letter-spacing: 0.12em;

  /* Sombra: solo lo que flota (CAMBIA de valor) */
  --shadow-flotante: 0 8px 24px rgb(18 20 18 / 0.18);

  /* Movimiento (v3) */
  --ease-estilo: cubic-bezier(0.2, 0.8, 0.2, 1);               /* sin cambio */
  --ease-salida: cubic-bezier(0.23, 1, 0.32, 1);               /* CAMBIA; hoy sin uso */
  --ease-viaje: cubic-bezier(0.45, 0, 0.1, 1);                 /* NUEVO */
  --animate-aparecer: aparecer 260ms var(--ease-salida) both;  /* CAMBIA: 320ms, 8px */
  --animate-subir: subir 280ms var(--ease-estilo) both;        /* sin cambio */
  --animate-respirar: respirar 1.2s var(--ease-viaje) infinite; /* CAMBIA: solo opacidad */
  --animate-esqueleto: respirar 1.6s var(--ease-viaje) infinite; /* NUEVO */
  @keyframes aparecer { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes respirar { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
  /* subir: sin cambio */
}
@theme inline {
  --font-display: var(--font-bricolage), "Bricolage Grotesque", system-ui, sans-serif;  /* CAMBIA */
  --font-body: var(--font-manrope), Manrope, system-ui, sans-serif;                     /* CAMBIA */
}
@utility drop-shadow-prenda {  /* NUEVO: parte de la foto recortada, no de la interfaz (PD-6) */
  filter: drop-shadow(0 1px 1px rgb(58 40 22 / 0.2)) drop-shadow(0 7px 9px rgb(58 40 22 / 0.16));
}
```

En `@layer base`: `body` con `font-weight: 500` (Manrope nunca < 500 en texto corrido); `h1, h2, h3` con
`font-weight: 800` y `letter-spacing: -0.02em`; `::selection` en `inverso` / `sobre-inverso`; `:focus-visible
{ outline: 3px solid var(--color-foco); outline-offset: 2px; }` (reemplaza el de 2 px granate). Borrar
`pb-con-barra` y `bottom-sobre-barra` (sin uso desde DP-17). Actualizar el comentario de cabecera (identidad de Prendie,
DP-23; "solo tema Día").

Verificar al implementar: que Tailwind v4 aplique `--text-*--font-weight` y `--letter-spacing`; si no, usar
`font-extrabold`/`tracking-*` explícitos y anotarlo en `DESIGN.MD`.

### 1.2 `layout.tsx`

Reemplazar `Bodoni_Moda` y `Hanken_Grotesk` por `Bricolage_Grotesque` (`variable: "--font-bricolage"`,
`subsets: ["latin"]`, `axes: ["opsz"]`, `display: "swap"`; la fuente trae `opsz` 12–96, `wdth` y `wght` variables) y
`Manrope` (`variable: "--font-manrope"`, `subsets: ["latin"]`, `display: "swap"`; variable 200–800). Sin cursivas
(ninguna de las dos las tiene). `viewport.themeColor` → `#f2f2ee`. Leer antes `web/node_modules/next/dist/docs/`.

### 1.3 Terminado

`DESIGN.MD` y `globals.css` coinciden token a token; una página local de prueba (no se commitea) muestra cada color,
radio, estilo de texto, `shadow-flotante`, `drop-shadow-prenda` y el foco; `/entrar`, `/asesor` y Tu espacio se ven
con la identidad nueva y sin texto ilegible a 390 px (los alias transitorios cubren lo que aún usa `acento`); Felipe
revisa.

---

## 2. Cambios del contrato de datos (sesión integradora)

Todo esto cae fuera de la frontera: `web/src/lib/domain/types.ts`, `web/src/lib/chat/sse.ts`, `web/src/lib/agent/*`
(asesor y **asesor simulado** `mock-agent.ts` / `mock-script.ts`), `web/src/lib/data/*`, `web/src/lib/actions/*`,
`web/src/app/api/**` y migraciones (las aplica Felipe, DT-14). Propuesta de forma: spec v3 §7. Cada cambio incluye
al **asesor simulado** emitiendo el dato, para que el equipo verifique a 390 px sin inferencia (DT-13). La identidad
visual no cambia el contrato.

| ID | Cambio | Dónde | Migración | Desbloquea |
|---|---|---|---|---|
| C-1 | **Pasos de trabajo persistentes**: evento `tool_step { id, tool, status, label_running, label_done, detail?, items?: { garment_id, chosen }[] }` y parte `tool_step` en `parts`; `ChatMessageView.tool_steps`. | types, sse, run, mock, mappers | no (va en `parts`) | ui-21 |
| C-2 | **Evidencia del porqué**: `OutfitView.evidence: { kind: 'palette'\|'weather'\|'closet'\|'occasion', label, swatches? }[]`, producida por `propose_outfit`. | types, tool-defs, tools, mock, mappers | sí si se guarda (o se deriva al leer) | ui-22 |
| C-3 | **Refinamiento con acción**: `refinements: { id, label, intent }[]` en `OutfitView` y en `shopping_options`; `POST /api/chat` acepta `intent` estructurado y el asesor lo interpreta. | types, api/chat, run, mock | no | ui-23, ui-26 |
| C-4 | **Opciones de compra**: evento y parte `shopping_options { for_outfit_id, slot, query, searched: { stores, results }, options: ProductOption[] }`; `ProductOption { id, store_name, title, price_clp, seen_at, url, image_cutout_url, image_url, affiliate, reason, in_stock? }`; orden sin pesar afiliación (DP-10). Búsqueda real espera A-01/DT-09 y el lector aislado (DT-18). | types, sse, agent, mock, data | probable | ui-24 |
| C-5 | **Opción elegida**: `selected_option_id` por look, persistido; Server Action `selectShoppingOption(outfitId, optionId)`; `OutfitView.selected_option`. | types, actions, data | sí | ui-25 |
| C-6 | **Etiquetas sobre la foto**: `photo_analysis { photo_id, items: { bbox: [x,y,w,h] normalizado, label, status: 'new'\|'in_closet', garment_id? }[] }` + acción para guardar una nueva. Sujeto a PD-8 (DP-06). | types, ai/vision, schemas, mock, actions | probable | ui-28 |
| C-7 | **Recorte de prenda**: `Garment.image_cutout_url` + `cutout_status: 'ok'\|'failed'` y su proceso (PD-9). | types, data, pipeline | sí | ui-29 |
| C-8 | **Resumen del evento**: `event_summary { date, place, setting, weather: { min, max, note }, missing }`; cada dato editable por Server Action; clima por ciudad **y fecha**. | types, sse, agent, mock, actions, weather | no | ui-27 |
| C-9 | (Opcional) `composer_hint` en el último turno; mientras tanto la UI deriva el placeholder (ui-5). | types, sse, mock | no | — |

**Sin cambio de contrato** (se hace ya): memoria con `id` (evento `memory.id`, `ChatMessageView.memory_notes`,
`deleteMemoryFact`); pieza faltante única (`OutfitView.missing_piece`); sobretítulo fecha · lugar · clima
(`OutfitView.weather`); datos de la hoja (`listGarments`, `listOutfits`, `listMemoryFacts`, `getActiveColorAnalysis`
en `lib/data/queries.ts`, llamables desde `app/(app)/asesor/page.tsx`). El "campo de color" por persona de la versión
anterior ya no aplica: el look recién propuesto usa `inverso`.

Orden sugerido: C-1 → C-3 → C-4 → C-5 (el recorrido que manda, DP-19) → C-2 → C-8 → C-7 → C-6.

---

## 3. Historias de interfaz (equipo de bots)

Todas, salvo ui-1, dependen de §1. "Archivos" es lo que se espera tocar; si una historia necesita salir de esa lista,
lo dice en su hilo antes. Spec = sección de `UX_UI_SPEC.md`.

### 3.1 Se pueden hacer ya (contrato actual)

**ui-1 · Maqueta del hilo en la identidad nueva** (bot de Diseño)
- Objetivo: los seis momentos de J4 y la hoja "Tu espacio" con la identidad de Prendie y la anatomía v3, para
  aprobar antes de construir (flujo del proyecto; PD-1).
- Archivos: `docs/superpowers/mockups/2026-11-14-conversacion-identidad-prendie.html` y
  `docs/superpowers/mockups/capturas/prendie-*.png`.
- Terminado: seis pantallas a 390 px que usan solo los tokens de `DESIGN.MD`; incluye el look en `inverso` y en papel,
  opciones de compra, etiquetas de foto y nota de memoria; Felipe la aprueba. Resuelve PD-5 y PD-6 a la vista.
- Depende de: nada (HTML estático). Bloquea la comparación visual de ui-9 a ui-13.

**ui-2 · Primitivas**
- Objetivo: botón píldora (principal lima, inverso, contorno, texto; 52 y 44 px), chip de 36 con área de 44, campo
  `hundido`, toast, bloque de error, íconos de trazo 2 y `cardBase` nueva.
- Archivos: `components/ui/button.tsx`, `chip.tsx`, `chip-group.tsx`, `input.tsx`, `field.tsx`, `toast.tsx`,
  `icons.tsx`, `empty-state.tsx`; `components/chat/styles.ts`.
- Terminado: en `/entrar` y en el onboarding simulado, botones en píldora, un solo lima visible, chips con contorno
  1.5 que al elegir pasan a `inverso`, foco azul de 3 px al tabular. Spec §7.1, §7.18.
- Depende de: §1.

**ui-3 · Encabezado del hilo**
- Objetivo: wordmark provisional en Bricolage (`text-titulo`) y "Tu espacio" como botón contorno mediano.
- Archivos: `components/ui/app-header.tsx` (solo el encabezado).
- Terminado: a 390 px, alto 56, margen 24; botón ≥ 44 px con `aria-haspopup` y `aria-expanded`. Spec §7.2.
- Depende de: ui-2.

**ui-4 · Voces del asesor y de la persona**
- Objetivo: asesor sin contenedor en `text-destacado` con firma `text-sobretitulo`; persona en `bg-hundido
  rounded-campo` a la derecha, `text-cuerpo`.
- Archivos: `components/chat/advisor-message.tsx`, `person-message.tsx`.
- Terminado: en el saludo simulado la firma aparece solo en el primer bloque; el énfasis va en 800 sin cursiva ni
  color; asesor y persona se distinguen sin mirar la alineación (peso y contenedor). Spec §7.4, §7.5, §1.1.
- Depende de: §1.

**ui-5 · Compositor y placeholder contextual**
- Objetivo: barra `superficie`, botón de foto con contorno, campo `hundido rounded-campo` con `min-w-0`, enviar
  `inverso`, placeholder según el momento.
- Archivos: `components/chat/composer.tsx`, `use-conversation.ts` (cálculo del placeholder), `conversation.tsx`.
- Terminado: a 360 px Enviar no se sale; con sugerencias dice "O dímelo con tus palabras"; tras un look, "¿Qué le
  cambiarías?"; respondiendo muestra "Detener". Spec §7.9.
- Depende de: ui-2.

**ui-6 · Respuestas sugeridas**
- Objetivo: sugerencias a la derecha como botones contorno de 44 px; modo múltiple con chips + "Listo" inverso.
- Archivos: `components/chat/suggested-replies.tsx`, `components/ui/quick-replies.tsx` si aplica.
- Terminado: en el onboarding simulado quedan a la derecha, ≥ 44 px, ninguna en lima; desaparecen al enviar. Spec §7.8.
- Depende de: ui-2.

**ui-7 · Rastro del asesor en vivo**
- Objetivo: `ToolTrail` que acumula los pasos del turno desde los eventos `tool` actuales (en curso → hecho, sin dato)
  y colapsa a una línea al llegar `done`.
- Archivos: `components/chat/tool-trail.tsx` (nuevo; rótulos en pasado de la tabla de spec §7.7), `tool-status.tsx`
  (se elimina), `thread.tsx`, `thread-types.ts`, `use-conversation.ts`.
- Terminado: al pedir un look simulado se ven "Revisando tu clóset" → "Revisé tu clóset" y "Armando el look" → "Armé
  el look" sin desaparecer; al terminar, el resumen con check `exito` abre y cierra (`aria-expanded`). Al recargar no hay
  rastro (limitación conocida hasta ui-21).
- Depende de: §1.

**ui-8 · Ritmo del hilo**
- Objetivo: margen 24, separaciones v3, separador de día en `text-sobretitulo`, máscara superior de 28 px, "Ir al final" `inverso`.
- Archivos: `components/chat/thread.tsx`, `conversation.tsx`, `thread-skeleton.tsx`.
- Terminado: el contenido se funde bajo el encabezado al hacer scroll; esqueleto con `animate-esqueleto`. Spec §7.3, §6.3.
- Depende de: §1.

**ui-9 · Tarjeta de look: armazón en papel**
- Objetivo: base de tarjeta, sobretítulo fecha · lugar · clima, título `text-titulo`, porqué `text-cuerpo`, acciones
  medianas y estados (guardado con "Guardado en Tus looks" en `exito`, no es para mí, compacta).
- Archivos: `components/chat/outfit-card.tsx`.
- Terminado: el look simulado calza con ui-1 salvo mesa, evidencia y piel inverso; guardar y descartar funcionan como
  hoy. Spec §7.10.
- Depende de: ui-1, ui-2.

**ui-10 · Mesa del look, leyenda y pieza faltante**
- Objetivo: reemplazar el collage por la mesa 3:2 `rounded-foto bg-hundido` con la plantilla de posiciones, índices,
  leyenda numerada y, si hay `missing_piece`, contorno punteado + insignia "Falta" en `falta`. Fotos con el respaldo
  de spec §11.4 (aún no hay recortes).
- Archivos: `components/chat/outfit-table.tsx` (nuevo), `outfit-card.tsx` (montarla), `thumb.tsx`,
  `web/public/contornos/*.svg` (al menos `shoes`, PD-12).
- Terminado: con 4 prendas + faltante simulado, el título de la tarjeta no queda cortado a 390 px; cada prenda tiene
  `alt`; "Falta" se lee como texto, no solo como color. Spec §7.10 (3, 4), §11.
- Depende de: ui-9.

**ui-11 · Look recién propuesto en `inverso`**
- Objetivo: el último look no descartado del hilo en `bg-inverso` con "Guardar look" en lima y la tabla de pieles de
  spec §7.10; vuelve a papel al llegar otro look o al descartarse.
- Archivos: `components/chat/outfit-card.tsx`, `outfit-table.tsx`, `thread.tsx` (marcar el último).
- Terminado: pidiendo dos looks seguidos al asesor simulado, solo el segundo es oscuro y solo él lleva lima; el foco
  azul se ve sobre el oscuro; Tus looks nunca muestra `inverso`. PD-7.
- Depende de: ui-10.

**ui-12 · Evidencia básica del porqué**
- Objetivo: lista de evidencia con lo que ya trae el look: clima y "N de tu clóset", en las dos pieles.
- Archivos: `components/chat/outfit-evidence.tsx` (nuevo), `outfit-card.tsx`.
- Terminado: insignias de 26 px no enfocables con `aria-label="En qué me basé"`; sin clima no aparece esa. "Tu paleta"
  llega con ui-22. Spec §7.10 (5).
- Depende de: ui-9.

**ui-13 · Esqueleto del look y prendas que caen**
- Objetivo: mientras `propose_outfit` está en curso, esqueleto en `inverso` con la geometría final; al llegar el look,
  fundido y caída escalonada.
- Archivos: `components/chat/outfit-skeleton.tsx` (nuevo), `thread.tsx`, `outfit-table.tsx`.
- Terminado: grabación a 390 px comparable con el momento 3 de la demo v3 en tiempos; con movimiento reducido, sin
  desplazamientos y fantasmas al 60 %. Spec §7.10, §8.
- Depende de: ui-11.

**ui-14 · Nota de memoria con Deshacer**
- Objetivo: conservar el `id` de cada nota (en vivo y desde `memory_notes`), marcador en `memoria`, "Deshacer" y "Lo
  que sé de ti"; ancla `id="memoria"` en `/yo`.
- Archivos: `components/chat/memory-note.tsx`, `thread-types.ts`, `use-conversation.ts`, `thread.tsx`,
  `components/espacio/memory-list.tsx` o `app/(app)/yo/page.tsx`.
- Terminado: tras una respuesta simulada que anota algo, "Deshacer" borra el hecho y deja "Lo borré."; "Lo que sé de
  ti" lleva a `/yo#memoria`; al recargar la nota conserva su botón. Spec §7.16.
- Depende de: ui-2.

**ui-15 · Hoja "Tu espacio"**
- Objetivo: hoja con cuatro ítems (clóset, looks, lo que sé de ti, paleta), conteos, bajadas, miniaturas y muestras.
- Archivos: `components/ui/app-header.tsx`, `components/ui/sheet.tsx`, `app/(app)/asesor/page.tsx` (lecturas con las
  consultas existentes), `components/chat/conversation.tsx` (props).
- Terminado: calza con ui-1; sin las marcas "Nuevo"/"Recién" hasta PD-14; foco al título al abrir y de vuelta al
  botón al cerrar; Escape y velo cierran. Spec §3, §7.17.
- Depende de: ui-3.

**ui-16 · Prenda, paleta y consentimiento**
- Objetivo: base de tarjeta, prenda 4:5 `rounded-foto` sobre `hundido`, confianza con insignias (`exito` / `hundido`
  / `falta`), muestras circulares; sin cambiar comportamiento.
- Archivos: `components/chat/garment-card.tsx`, `palette-card.tsx` (incluye el consentimiento si vive ahí).
- Terminado: en el onboarding simulado "Está bien" es el único lima; "Corregir" y "Ajustar" siguen funcionando. Spec §7.14–7.16.
- Depende de: ui-2.

**ui-17 · Foto enviada 4:5**
- Objetivo: foto de la persona en 4:5, 72 % de ancho, `rounded-foto`; selfie borrada con el mismo marco.
- Archivos: `components/chat/photo-message.tsx`, `thumb.tsx`.
- Terminado: al mandar una foto al asesor simulado, la foto y el texto quedan a la derecha sin saltos al subir. Spec §7.12.
- Depende de: §1.

**ui-18 · Tu espacio: clóset, looks y perfil**
- Objetivo: galería en 2 columnas con la tarjeta de prenda (foto 4:5 `rounded-foto`, nombre `text-nombre`, meta),
  detalle, looks compactos en papel, secciones de `/yo` y `/yo/paleta` con la tipografía nueva.
- Archivos: `components/espacio/*.tsx`, `app/(app)/closet/**`, `app/(app)/looks/**`, `app/(app)/yo/**`.
- Terminado: `/closet`, `/closet/[id]`, `/looks`, `/yo` y `/yo/paleta` a 390 px sin `acento`, sin bordes de tarjeta y
  con un solo lima por vista (si hay). Spec §6.4, §7.17.
- Depende de: ui-2, ui-9.

**ui-19 · Portada y cuenta**
- Objetivo: `/` con `text-titular`, muestra de conversación con las voces nuevas y "Empezar la conversación" en lima;
  `/entrar` con campos y botones nuevos.
- Archivos: `app/page.tsx`, `app/entrar/**`, `app/not-found.tsx`.
- Terminado: a 390 px un solo lima por pantalla; errores de formulario en `text-error` bajo el campo. Spec §6.1, §6.2.
- Depende de: ui-2.

**ui-20 · Limpieza de tokens transitorios**
- Objetivo: borrar de `globals.css` los alias `acento`, `acento-suave`, `exito-suave`, `alerta`, `alerta-suave`,
  `error-suave` y los radios `xs/sm/md/lg`, una vez que nada los usa.
- Archivos: `web/src/app/globals.css` y lo que aún los use dentro de la frontera.
- Terminado: `grep -rE "(acento|alerta|exito-suave|error-suave)|rounded-(xs|sm|md|lg)\b" web/src` sin resultados; build
  en verde; `globals.css` coincide con `DESIGN.MD`.
- Depende de: ui-2 a ui-19.

### 3.2 Esperan un cambio de contrato (§2)

| ID | Objetivo | Archivos | Terminado (390 px, asesor simulado) | Depende de |
|---|---|---|---|---|
| ui-21 | Rastro con dato, miniaturas del clóset (elegidas marcadas) y rehidratación | `tool-trail.tsx`, `thread-types.ts`, `use-conversation.ts` | "Revisé tu clóset · 32 prendas · 9 sirven · elegí 4" con miniaturas; al recargar el rastro colapsado sigue | C-1, ui-7 |
| ui-22 | Evidencia "Tu paleta" con muestras | `outfit-evidence.tsx` | Insignia con 3 muestras, legible en papel y en `inverso` | C-2, ui-12 |
| ui-23 | Botones para refinar el look | `outfit-card.tsx`, `use-conversation.ts` | "Más formal" envía la intención; llega un look nuevo en `inverso` y el anterior pasa a papel | C-3, ui-11 |
| ui-24 | Opciones de compra: tira, tres opciones y ficha honesta | `shopping-options.tsx` (nuevo), `thread.tsx`, `thread-types.ts`, `use-conversation.ts` | Celda faltante en `falta`; "Enlace con comisión" solo si `affiliate`; "Ver en la tienda ↗" en contorno, sale de la app; nunca "Comprar" ni lima | C-4, ui-1, ui-2 |
| ui-25 | Elegir opción: vuelo a la tira, cambio de ficha, persistencia, Tus looks con la pieza | `shopping-options.tsx`, `components/espacio/look-list.tsx` | Elegir y cambiar como en la demo v3; al recargar la elegida sigue marcada | C-5, ui-24 |
| ui-26 | Botones para refinar la búsqueda | `shopping-options.tsx` | "Más baratos" pide otra búsqueda y aparece un nuevo bloque de opciones | C-3, ui-24 |
| ui-27 | "Lo que entendí" | `event-summary.tsx` (nuevo), `thread.tsx` | Cuatro datos 2×2; tocar uno permite corregirlo | C-8 |
| ui-28 | Foto con etiquetas | `photo-message.tsx` | Etiquetas en forma de insignia con área de 44, la nueva en `inverso` y guardable | C-6, ui-17, PD-8 |
| ui-29 | Recortes en mesa, clóset y tarjeta de prenda + "Así queda en tu clóset" | `outfit-table.tsx`, `garment-tile.tsx`, `garment-card.tsx`, `cutout-preview.tsx` (nuevo) | Con `cutout_status: 'ok'` la prenda va sin fondo al 78 % con `drop-shadow-prenda`; con `failed`, el respaldo | C-7, ui-10, ui-18 |

---

## 4. Resumen

- **Antes de todo**: §1 (tokens, Bricolage Grotesque y Manrope), por la integradora.
- **Ya, con el contrato actual: 20 historias** (ui-1 a ui-20). Arranque en paralelo: ui-1 (maqueta, sin depender de
  §1), ui-2, ui-4, ui-7, ui-8, ui-17. Cadenas: ui-2 → ui-3 → ui-15; ui-1 + ui-2 → ui-9 → ui-10 → ui-11 → ui-13;
  ui-9 → ui-12, ui-18; ui-20 al final.
- **Esperan contrato: 9 historias** (ui-21 a ui-29), atadas a C-1…C-8.
- **Por definir**: `UX_UI_SPEC.md` §14 (PD-1 a PD-15). Bloquean solo lo indicado: PD-1 la comparación visual del look,
  PD-8 las etiquetas de foto, PD-9 los recortes.
