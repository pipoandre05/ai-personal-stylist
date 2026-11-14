# Componentes del hilo, contrato v2

Presentación pura (datos y callbacks por props, sin red). Contrato: `docs/superpowers/specs/2026-11-14-contrato-v2.md`.
Maqueta: `docs/superpowers/mockups/2026-11-14-conversacion-v4.html`. Vista previa: `npm run dev` y abrir `/dev/hilo-v2`
(404 en producción). Todo se importa de `@/components/chat/v2`.

Los componentes importan `cn`, `Button`/`buttonStyles` e íconos de `@/components/ui/{cn,button,icons}` (no del índice, que
arrastra `app-header` y la Server Action de sesión). Si el equipo mueve o renombra esos archivos, ajustar los 8 imports.

## Props

| Componente | Props principales | Callbacks |
|---|---|---|
| `ToolSteps` | `steps: ToolStep[]`, `garments?: GarmentLookup` (`id → {name, photo_url, category}`), `defaultOpen?`, `animate?` | ninguno |
| `EventSummaryCard` | `summary: EventSummary`, `busy?` | `onEdit(field: EventField)` |
| `OutfitCardV2` | `outfit: OutfitView`, `fresh?` (inverso), `tag?`, `compact?`, `busy?`, `animate?`, `closetHref?(id)` | `onSave(outfit)`, `onDiscard(outfit)`, `onRefine(intent, label)` |
| `OutfitPair` | `outfits: [OutfitView, OutfitView]` (mismo `pair_id`) + las de `OutfitCardV2` | `onSave`, `onDiscard`, `onRefine` |
| `SearchOffer` | `offer: SearchOffer`, `pending?`, `busy?` | `onAction(action: Refinement)` |
| `ShoppingOptions` | `block`, `outfit?` (para "así queda"), `now?`, `busy?`, `animate?` | `onSelect(optionId \| null)`, `onRefine(intent, label)` |
| `CardBoundary` | `label`, `resetKey?`, `onError?` | — |
| `ThreadItemV2View` | `item: V2Item`, `handlers`, `garments?`, `closetHref?`, `busy?`, `animate?`, `now?` | los de `ThreadV2Handlers` |

`fresh` lo decide quien arma el hilo (`findFreshOutfitId` / `freshOutfitIdOf`): el último look sin par, sin guardar ni
descartar. Un look guardado vuelve a papel aunque siga siendo el último (PD-7, resuelto provisoriamente).

## Función pura: `thread-items-v2.ts`

- `buildThreadItemsV2(messages)` → `[{ messageId, items }]` para los mensajes del asesor de un hilo cargado.
- `buildTurnItems(source, ctx)` → `V2Item[]` de un turno (guardado o en vivo). Orden: evento, pasos, looks (un par queda
  junto), oferta, paso de búsqueda, opciones. El texto del asesor no va aquí.
- `emptyTurnState()` + `applyEventToTurn(state, event)`: acumula los eventos SSE v2 de un turno en vivo (un `tool_step`
  con `id` repetido reemplaza al anterior; `event_summary` último gana; `outfit` y `shopping_options` por `id`).

`V2Item.kind`: `steps` · `event` · `outfit` · `pair` · `offer` · `options`.

## Integración (cuando el equipo termine con `thread.tsx` y `use-conversation.ts`)

1. **Estado del turno** en `use-conversation.ts`: junto a lo que ya acumula del `AdvisorItem` en vivo, agregar
   `turn: TurnState` (`emptyTurnState()` al empezar el turno). En el `switch` de eventos agregar
   `case "tool_step" | "event_summary" | "outfit" | "search_offer" | "shopping_options": turn = applyEventToTurn(turn, e)`.
   `outfit` ya se maneja hoy (se queda con el existente y además llama a `applyEventToTurn`). `tool` (efímero) se puede
   seguir ignorando: el rastro nuevo lo reemplaza.
2. **Historial**: en `toItems` (`thread-types.ts`), copiar de `ChatMessageView` a `AdvisorItem` los campos `tool_steps`,
   `event_summary`, `shopping_blocks`, `search_offer` (hoy no pasan). Al recargar, `buildThreadItemsV2(messages)` da los
   ítems; en vivo, `buildTurnItems({ id, ...turn }, { isLastMessage: true, freshOutfitId: freshOutfitIdOf(turn.outfits) })`.
3. **`thread.tsx`**: dentro del turno del asesor (`flex flex-col gap-3.5`), entre el texto y las notas de memoria, renderizar
   `items.map(it => <ThreadItemV2View key={it.key} item={it} handlers={...} garments={...} animate={fresh} />)` y dejar de
   renderizar por separado los `outfits` (los pinta `outfit`/`pair`) y `tool-status.tsx` (lo reemplaza `steps`).
   `garments`: `Record<id, {name, photo_url, category}>` armado con las prendas del clóset ya cargadas.
4. **Callbacks** (`ThreadV2Handlers`), todos con `conversation_id` de la conversación actual:
   - `onRefine(intent, label)` y `onSearchOfferAction(a)` → `streamChat({ conversation_id, text: label | a.label, intent })`
     con el `intent` **tal cual vino** (`refine_outfit`, `refine_search`, `accept_search`, `decline_search`).
   - `onSaveOutfit(o)` → `setOutfitStatus(o.id, "saved")`; `onDiscardOutfit(o)` → `setOutfitStatus(o.id, "discarded")`
     (+ motivo con `rateOutfit` si se conserva el paso de motivos del `outfit-card.tsx` actual).
   - `onSelectOption(block, outfitId, optionId)` → `selectShoppingOption(outfitId, optionId)`; solo si `outfitId` no es
     `null`. Actualizar `selected_option_id` del bloque en el estado local (optimista) y revertir si falla.
   - `onEditEvent(field)` → abrir el editor del campo y `updateEventSummary({ [campo]: valor }, conversationId)`.
     Ojo: la celda "fecha / tipo" corrige `kind` cuando ya hay fecha (es lo que dice `eventCells`).
5. **Compositor**: placeholder "Pregunta por una opción…" cuando el último ítem es `options`, "¿Qué le cambiarías?" si es `outfit`.
6. **Respuestas sugeridas**: `quick_replies` sigue como hoy; la oferta de búsqueda usa sus propios botones.
7. **Anuncios sr-only**: "Te propuse un look: título" y "Hay N opciones de compra" (UX_UI_SPEC §9) quedan en `thread.tsx`.

Cada tarjeta ya va envuelta en `CardBoundary` dentro de `ThreadItemV2View`; si se usan los componentes sueltos, envolverlos.

## Notas de diseño

- **Par de looks: apilados con rótulo, no carrusel** (justificación en `outfit-pair.tsx`). Ninguno va en `inverso`.
- Las "fotos" de la vista previa son recortes de la maqueta en `public/dev/prendas/` (solo desarrollo).
- Composición del look: `outfit-layout.ts` reparte 1 a 7 piezas en dos franjas (cierra PD-13); la pieza faltante es el
  contorno punteado de su categoría (cierra PD-12 con siluetas en código, sin archivos).
