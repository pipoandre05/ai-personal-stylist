import type {
  ChatIntent,
  ChatMessagePart,
  GarmentCategory,
  ProductOption,
  ShoppingOptionsBlock,
  ShoppingTrigger,
} from "./types";

// Reglas de las opciones de compra (C-4, C-5). Todo puro: el servidor las aplica a lo que devuelve un `ProductSearch`,
// y el asesor no puede saltárselas porque nunca escribe una opción (BF-03).

export const MAX_OPTIONS = 3;

/** Lo que devuelve un buscador, antes de validar. Es dato no confiable (BF-09). */
export type ProductCandidate = {
  store_name: string;
  title: string;
  price_clp: number;
  seen_at: string;
  url: string;
  image_url?: string | null;
  image_cutout_url?: string | null;
  affiliate?: boolean;
  in_stock?: boolean | null;
  reason?: string;
  /** Qué tan bien calza con el pedido (0 a 1). El orden usa esto y el precio; nunca la afiliación (DP-10). */
  relevance?: number;
};

const FUTURE_SKEW_MS = 5 * 60 * 1000;
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** URL https sin credenciales y de largo razonable; devuelve la URL normalizada o null. */
export function safeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 2000) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Id estable de una opción: el mismo producto de la misma tienda conserva su id entre búsquedas. */
export function optionId(store: string, url: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${store}|${url}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `opt-${h.toString(16).padStart(8, "0")}`;
}

export type OptionRejection = "store" | "title" | "price" | "seen_at" | "url" | "budget";

/** Valida un candidato y lo convierte en opción, o dice por qué no. */
export function toProductOption(c: ProductCandidate, now: Date, budgetMaxClp: number | null): { ok: true; option: ProductOption } | { ok: false; why: OptionRejection } {
  const store_name = clean(c.store_name, 60);
  if (!store_name) return { ok: false, why: "store" };
  const title = clean(c.title, 140);
  if (!title) return { ok: false, why: "title" };
  if (!Number.isInteger(c.price_clp) || c.price_clp <= 0) return { ok: false, why: "price" };
  if (budgetMaxClp !== null && c.price_clp > budgetMaxClp) return { ok: false, why: "budget" };
  const seen = typeof c.seen_at === "string" ? new Date(c.seen_at) : null;
  if (!seen || Number.isNaN(seen.getTime()) || seen.getTime() > now.getTime() + FUTURE_SKEW_MS) return { ok: false, why: "seen_at" };
  const url = safeHttpsUrl(c.url);
  if (!url) return { ok: false, why: "url" };
  const image_url = c.image_url ? safeHttpsUrl(c.image_url) : null;
  const image_cutout_url = c.image_cutout_url ? safeHttpsUrl(c.image_cutout_url) : null;
  return {
    ok: true,
    option: {
      id: optionId(store_name, url),
      store_name,
      title,
      price_clp: c.price_clp,
      seen_at: seen.toISOString(),
      url,
      image_cutout_url,
      image_url,
      affiliate: c.affiliate === true,
      reason: clean(c.reason, 200),
      in_stock: typeof c.in_stock === "boolean" ? c.in_stock : null,
    },
  };
}

/**
 * Orden de las opciones (DP-10): relevancia, luego precio, luego tienda y título. La afiliación NO entra: esta función
 * ni siquiera la lee, y los tests cambian `affiliate` para comprobar que el orden no se mueve.
 */
export function rankCandidates<T extends Pick<ProductCandidate, "relevance" | "price_clp" | "store_name" | "title">>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (b.relevance ?? 0) - (a.relevance ?? 0) ||
      a.price_clp - b.price_clp ||
      a.store_name.localeCompare(b.store_name) ||
      a.title.localeCompare(b.title),
  );
}

export type FinalizedOptions = { options: ProductOption[]; rejected: Record<OptionRejection, number> };

/** Valida, respeta el presupuesto, ordena sin pesar afiliación, quita repetidos y deja como máximo 3. */
export function finalizeOptions(candidates: ProductCandidate[], opts: { now?: Date; budgetMaxClp?: number | null } = {}): FinalizedOptions {
  const now = opts.now ?? new Date();
  const budget = opts.budgetMaxClp ?? null;
  const rejected: Record<OptionRejection, number> = { store: 0, title: 0, price: 0, seen_at: 0, url: 0, budget: 0 };
  const valid: (ProductCandidate & { _option: ProductOption })[] = [];
  for (const c of Array.isArray(candidates) ? candidates : []) {
    const r = c && typeof c === "object" ? toProductOption(c, now, budget) : ({ ok: false, why: "store" } as const);
    if (r.ok) valid.push({ ...c, _option: r.option });
    else rejected[r.why] += 1;
  }
  const seen = new Set<string>();
  const options: ProductOption[] = [];
  for (const c of rankCandidates(valid)) {
    if (seen.has(c._option.id)) continue;
    seen.add(c._option.id);
    options.push(c._option);
    if (options.length === MAX_OPTIONS) break;
  }
  return { options, rejected };
}

/** Tope de precio efectivo: lo que dijo la persona en la conversación manda sobre el del perfil. */
export function effectiveBudget(input: { toolMaxClp?: number | null; profileBudgetClp?: number | null }): number | null {
  const pos = (n: number | null | undefined) => (typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null);
  return pos(input.toolMaxClp) ?? pos(input.profileBudgetClp);
}

// --- Autorización: la búsqueda solo ocurre si la persona la aceptó o la pidió ---

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
/** Palabras con las que una persona pide que se busque o se compre algo. */
export const SEARCH_REQUEST_WORDS = /(busc|opcion|compr|conseguir|encontrar|look nuevo|algo nuevo|nuev[oa]s?\b)/;

/** Frase de los mensajes de la persona que pide buscar o comprar, o null. La usa el asesor simulado para citarla. */
export function findSearchQuote(texts: string[]): string | null {
  for (const raw of texts) {
    const m = normalize(raw).match(/(busc[a-z]*|opciones|compr[a-z]*|conseguir|encontrar|look nuevo|algo nuevo|nuev[oa]s?)(?: [a-z]+){0,2}/);
    if (m && SEARCH_REQUEST_WORDS.test(m[0])) return m[0].trim().slice(0, 60);
  }
  return null;
}

export type SearchAuthorization = "accepted_offer" | "person_request" | "refinement";

export type SearchAuthInput = {
  authorization: SearchAuthorization;
  quote?: string;
  outfitId: string | null;
  slot: GarmentCategory;
  /** Intents de la persona en esta conversación (el actual y los recientes). */
  intents: ChatIntent[];
  /** Mensajes recientes de la persona (los más nuevos primero). */
  recentUserTexts: string[];
  /** Para `refinement`: el bloque que se está refinando (verificado antes). */
  refining?: { block_id: string; for_outfit_id: string | null; slot: GarmentCategory } | null;
};

/**
 * Regla del servidor: no se busca sin un sí. `accepted_offer` exige un `accept_search` de la persona para ese look y
 * pieza; `refinement` exige un `refine_search` sobre un bloque real; `person_request` exige citar palabras de la persona
 * que pidan buscar, y la cita debe estar de verdad en sus mensajes.
 */
export function authorizeSearch(i: SearchAuthInput): { ok: true; trigger: ShoppingTrigger } | { ok: false; reason: string } {
  switch (i.authorization) {
    case "accepted_offer": {
      const okIntent = i.intents.some((x) => x.kind === "accept_search" && x.slot === i.slot && x.outfit_id === i.outfitId);
      return okIntent
        ? { ok: true, trigger: "offer_accepted" }
        : { ok: false, reason: "La persona no aceptó esta búsqueda. Ofrécela con offer_search y espera su respuesta." };
    }
    case "refinement": {
      const intent = i.intents.find((x) => x.kind === "refine_search");
      if (!intent || !i.refining) return { ok: false, reason: "No hay un botón de ajuste de búsqueda de la persona en este turno." };
      if (i.refining.slot !== i.slot || i.refining.for_outfit_id !== i.outfitId) {
        return { ok: false, reason: "El ajuste es sobre otra búsqueda: usa el mismo look y la misma pieza del bloque que se está refinando." };
      }
      return { ok: true, trigger: "refinement" };
    }
    case "person_request": {
      const quote = normalize(i.quote ?? "");
      if (quote.length < 4) return { ok: false, reason: "Cita en quote las palabras de la persona que piden buscar." };
      if (!SEARCH_REQUEST_WORDS.test(quote)) return { ok: false, reason: "Esa frase no es un pedido de buscar o comprar. Ofrece la búsqueda con offer_search." };
      const said = i.recentUserTexts.some((t) => normalize(t).includes(quote));
      return said ? { ok: true, trigger: "person_request" } : { ok: false, reason: "La cita no aparece en lo que dijo la persona. Ofrece la búsqueda con offer_search." };
    }
  }
}

// --- Elegir una opción (C-5): se resuelve contra lo que de verdad se mostró en el hilo ---

type RowParts = { id: string; parts: ChatMessagePart[] | null };

type ShoppingPart = Extract<ChatMessagePart, { type: "shopping_options" }>;
const isShopping = (p: ChatMessagePart): p is ShoppingPart => p.type === "shopping_options";

/** Busca en los mensajes del hilo la opción `optionId` mostrada para el look `outfitId`. */
export function findOptionInThread(rows: RowParts[], outfitId: string, optionId: string): { option: ProductOption; blockId: string } | null {
  for (const row of [...rows].reverse()) {
    for (const p of [...(row.parts ?? [])].reverse()) {
      if (!isShopping(p) || p.for_outfit_id !== outfitId) continue;
      const option = p.options.find((o) => o.id === optionId);
      if (option) return { option, blockId: p.id };
    }
  }
  return null;
}

/**
 * Marca (o desmarca con `null`) la opción elegida: en el bloque que la contiene y quita la marca de los demás bloques del
 * mismo look. Devuelve solo los mensajes que cambiaron, con sus partes nuevas. Pura.
 */
export function applySelection(rows: RowParts[], outfitId: string, optionId: string | null, blockId: string | null): { id: string; parts: ChatMessagePart[] }[] {
  const changed: { id: string; parts: ChatMessagePart[] }[] = [];
  for (const row of rows) {
    let touched = false;
    const parts = (row.parts ?? []).map((p) => {
      if (!isShopping(p) || p.for_outfit_id !== outfitId) return p;
      const next = optionId !== null && p.id === blockId ? optionId : null;
      if (p.selected_option_id === next) return p;
      touched = true;
      return { ...p, selected_option_id: next } satisfies ShoppingPart;
    });
    if (touched) changed.push({ id: row.id, parts });
  }
  return changed;
}

/** Busca la opción `optionId` dentro del bloque `blockId` (búsqueda pedida sin look: `for_outfit_id` nulo). */
export function findOptionInBlock(rows: RowParts[], blockId: string, optionId: string): ProductOption | null {
  for (const row of rows) {
    for (const p of row.parts ?? []) {
      if (!isShopping(p) || p.id !== blockId || p.for_outfit_id !== null) continue;
      return p.options.find((o) => o.id === optionId) ?? null;
    }
  }
  return null;
}

/**
 * Marca (o desmarca con `null`) la opción elegida en un bloque sin look. Solo toca ese bloque: una búsqueda suelta no
 * comparte elección con otras. Devuelve los mensajes que cambiaron. Pura.
 */
export function applyBlockSelection(rows: RowParts[], blockId: string, optionId: string | null): { id: string; parts: ChatMessagePart[] }[] {
  const changed: { id: string; parts: ChatMessagePart[] }[] = [];
  for (const row of rows) {
    let touched = false;
    const parts = (row.parts ?? []).map((p) => {
      if (!isShopping(p) || p.id !== blockId || p.for_outfit_id !== null || p.selected_option_id === optionId) return p;
      touched = true;
      return { ...p, selected_option_id: optionId } satisfies ShoppingPart;
    });
    if (touched) changed.push({ id: row.id, parts });
  }
  return changed;
}

/** Opción elegida para un look según los bloques del hilo, o null. */
export function selectedOptionFor(blocks: ShoppingOptionsBlock[], outfitId: string): ProductOption | null {
  for (const b of [...blocks].reverse()) {
    if (b.for_outfit_id !== outfitId || !b.selected_option_id) continue;
    const o = b.options.find((x) => x.id === b.selected_option_id);
    if (o) return o;
  }
  return null;
}
