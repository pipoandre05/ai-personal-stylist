import type {
  ChatEvent,
  ChatMessageView,
  EventSummary,
  OutfitView,
  SearchOffer,
  ShoppingOptionsBlock,
  ToolStep,
} from "@/lib/domain/types";

// Del contrato v2 a ítems de presentación. Puro (sin React, sin red): el hilo real lo consume después.
// Dos entradas, una salida:
//   - mensajes ya guardados (`ChatMessageView`) → `buildThreadItemsV2(messages)`
//   - turno en vivo (eventos SSE) → `applyEventToTurn` va acumulando un `TurnState` y `buildTurnItems` lo ordena.

/** Lo que el contrato v2 agrega a un turno del asesor (un subconjunto de `ChatMessageView`). */
export type TurnSource = {
  id: string;
  tool_steps?: ToolStep[];
  event_summary?: EventSummary | null;
  outfits?: OutfitView[];
  search_offer?: SearchOffer | null;
  shopping_blocks?: ShoppingOptionsBlock[];
};

export type V2Item =
  /** `phase: "work"` = clima, clóset, look…; `"search"` = el paso de la búsqueda en tiendas (va pegado a las opciones). */
  | { kind: "steps"; key: string; phase: "work" | "search"; steps: ToolStep[]; running: boolean }
  | { kind: "event"; key: string; summary: EventSummary }
  /** `fresh`: el look recién propuesto (superficie `inverso`). */
  | { kind: "outfit"; key: string; outfit: OutfitView; fresh: boolean }
  /** Dos looks del mismo `pair_id`, con el "seguro" primero. */
  | { kind: "pair"; key: string; pairId: string; outfits: [OutfitView, OutfitView] }
  /** `pending`: solo se puede responder si es el último mensaje del hilo. */
  | { kind: "offer"; key: string; offer: SearchOffer; pending: boolean }
  | { kind: "options"; key: string; block: ShoppingOptionsBlock; outfit: OutfitView | null };

export type ItemContext = {
  /** Este turno es el último mensaje del hilo (la oferta de búsqueda solo se responde ahí). */
  isLastMessage?: boolean;
  /** Id del look "recién propuesto" del hilo entero (ver `findFreshOutfitId`). */
  freshOutfitId?: string | null;
  /** Para encontrar el look de unas opciones que llegaron en otro mensaje. */
  findOutfit?: (id: string) => OutfitView | undefined;
};

/**
 * Un paso con un `id` ya visto reemplaza al anterior y conserva su lugar (contrato §1.1). Devuelve una copia.
 */
export function normalizeSteps(steps: readonly ToolStep[] | undefined): ToolStep[] {
  const out: ToolStep[] = [];
  const at = new Map<string, number>();
  for (const s of steps ?? []) {
    const i = at.get(s.id);
    if (i === undefined) {
      at.set(s.id, out.length);
      out.push(s);
    } else {
      out[i] = s;
    }
  }
  return out;
}

/** El look que se queda con la opción elegida del bloque (el servidor ya la guarda; esto cubre el turno en vivo). */
function withSelection(outfit: OutfitView, blocks: readonly ShoppingOptionsBlock[]): OutfitView {
  if (outfit.selected_option) return outfit;
  for (const b of blocks) {
    if (b.for_outfit_id !== outfit.id || !b.selected_option_id) continue;
    const opt = b.options.find((o) => o.id === b.selected_option_id);
    if (opt) return { ...outfit, selected_option: opt };
  }
  return outfit;
}

/** Ordena los looks del turno: los dos de un mismo `pair_id` se juntan (en el lugar del primero); el resto va suelto. */
function groupOutfits(outfits: readonly OutfitView[]): ({ single: OutfitView } | { pair: [OutfitView, OutfitView]; pairId: string })[] {
  const byPair = new Map<string, OutfitView[]>();
  for (const o of outfits) {
    if (!o.pair_id) continue;
    byPair.set(o.pair_id, [...(byPair.get(o.pair_id) ?? []), o]);
  }
  const out: ({ single: OutfitView } | { pair: [OutfitView, OutfitView]; pairId: string })[] = [];
  const done = new Set<string>();
  for (const o of outfits) {
    const group = o.pair_id ? byPair.get(o.pair_id) : undefined;
    if (!o.pair_id || !group || group.length !== 2) {
      out.push({ single: o });
      continue;
    }
    if (done.has(o.pair_id)) continue;
    done.add(o.pair_id);
    const [a, b] = group;
    // El "seguro" primero, sin importar el orden de llegada.
    const pair: [OutfitView, OutfitView] = a.variant === "atrevido" && b.variant !== "atrevido" ? [b, a] : [a, b];
    out.push({ pair, pairId: o.pair_id });
  }
  return out;
}

/** Ítems de un turno del asesor, en el orden en que se leen. No incluye el texto del asesor (lo pinta `AdvisorMessage`). */
export function buildTurnItems(src: TurnSource, ctx: ItemContext = {}): V2Item[] {
  const items: V2Item[] = [];
  const steps = normalizeSteps(src.tool_steps);
  const work = steps.filter((s) => s.tool !== "search_products");
  const search = steps.filter((s) => s.tool === "search_products");
  const blocks = src.shopping_blocks ?? [];
  const outfits = (src.outfits ?? []).map((o) => withSelection(o, blocks));

  if (src.event_summary) items.push({ kind: "event", key: `${src.id}:event`, summary: src.event_summary });

  if (work.length > 0) {
    items.push({ kind: "steps", key: `${src.id}:steps`, phase: "work", steps: work, running: work.some((s) => s.status === "running") });
  }

  for (const g of groupOutfits(outfits)) {
    if ("pair" in g) {
      items.push({ kind: "pair", key: `${src.id}:pair:${g.pairId}`, pairId: g.pairId, outfits: g.pair });
    } else {
      items.push({
        kind: "outfit",
        key: `${src.id}:outfit:${g.single.id}`,
        outfit: g.single,
        fresh: g.single.status === "proposed" && g.single.id === ctx.freshOutfitId,
      });
    }
  }

  if (src.search_offer) {
    items.push({ kind: "offer", key: `${src.id}:offer:${src.search_offer.id}`, offer: src.search_offer, pending: Boolean(ctx.isLastMessage) });
  }

  if (search.length > 0) {
    items.push({ kind: "steps", key: `${src.id}:search-steps`, phase: "search", steps: search, running: search.some((s) => s.status === "running") });
  }

  for (const b of blocks) {
    const base = b.for_outfit_id ? (outfits.find((o) => o.id === b.for_outfit_id) ?? ctx.findOutfit?.(b.for_outfit_id)) : undefined;
    items.push({ kind: "options", key: `${src.id}:options:${b.id}`, block: b, outfit: base ? withSelection(base, [b]) : null });
  }

  return items;
}

/**
 * El look "recién propuesto" de un grupo de looks (los de un turno): el último, si no es parte de un par y sigue sin
 * guardar ni descartar. Un par no tiene look destacado (ninguno de los dos es "el" recomendado). Sirve también para un
 * turno en vivo: `buildTurnItems(state, { freshOutfitId: freshOutfitIdOf(state.outfits) })`.
 */
export function freshOutfitIdOf(outfits: readonly Pick<OutfitView, "id" | "pair_id" | "status">[]): string | null {
  const last = outfits[outfits.length - 1];
  return last && !last.pair_id && last.status === "proposed" ? last.id : null;
}

/** El look "recién propuesto" de un hilo: el del último mensaje del asesor que trae looks. */
export function findFreshOutfitId(messages: readonly Pick<ChatMessageView, "role" | "outfits">[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.outfits.length > 0) return freshOutfitIdOf(m.outfits);
  }
  return null;
}

/** Los ítems v2 de cada mensaje del asesor de un hilo ya cargado. Los mensajes anteriores a v2 dan lista vacía. */
export function buildThreadItemsV2(messages: readonly ChatMessageView[]): { messageId: string; items: V2Item[] }[] {
  const freshOutfitId = findFreshOutfitId(messages);
  const outfitIndex = new Map<string, OutfitView>();
  for (const m of messages) for (const o of m.outfits) outfitIndex.set(o.id, o);
  const lastId = messages[messages.length - 1]?.id;
  const out: { messageId: string; items: V2Item[] }[] = [];
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    out.push({
      messageId: m.id,
      items: buildTurnItems(m, { isLastMessage: m.id === lastId, freshOutfitId, findOutfit: (id) => outfitIndex.get(id) }),
    });
  }
  return out;
}

// --- Turno en vivo: eventos SSE → estado acumulado ---

export type TurnState = {
  tool_steps: ToolStep[];
  event_summary: EventSummary | null;
  outfits: OutfitView[];
  search_offer: SearchOffer | null;
  shopping_blocks: ShoppingOptionsBlock[];
};

export function emptyTurnState(): TurnState {
  return { tool_steps: [], event_summary: null, outfits: [], search_offer: null, shopping_blocks: [] };
}

function upsert<T extends { id: string }>(list: readonly T[], next: T): T[] {
  const i = list.findIndex((x) => x.id === next.id);
  return i === -1 ? [...list, next] : list.map((x, j) => (j === i ? next : x));
}

function withoutType<T extends { type: string }>(e: T): Omit<T, "type"> {
  const { type, ...rest } = e;
  void type;
  return rest;
}

/**
 * Aplica un evento SSE del contrato v2 al estado del turno. Inmutable. Lo que no es de v2 (texto, `tool` efímero,
 * prenda, paleta, memoria, `done`, `error`) lo deja pasar igual: lo manejan los reductores existentes.
 */
export function applyEventToTurn(state: TurnState, e: ChatEvent): TurnState {
  switch (e.type) {
    case "tool_step":
      return { ...state, tool_steps: upsert(state.tool_steps, withoutType(e) as ToolStep) };
    case "event_summary":
      return { ...state, event_summary: withoutType(e) as EventSummary };
    case "outfit":
      return { ...state, outfits: upsert(state.outfits, e.outfit) };
    case "search_offer":
      return { ...state, search_offer: withoutType(e) as SearchOffer };
    case "shopping_options":
      return { ...state, shopping_blocks: upsert(state.shopping_blocks, withoutType(e) as ShoppingOptionsBlock) };
    default:
      return state;
  }
}
