import type {
  ChatMessagePart,
  ChatMessageView,
  ColorAnalysis,
  EventSummary,
  GarmentView,
  OutfitView,
  SearchOffer,
  ShoppingOptionsBlock,
  ToolStep,
} from "@/lib/domain/types";
import { selectedOptionFor } from "@/lib/domain/shopping";

// Reconstruye el hilo a partir de `messages.parts` y de lo ya resuelto en la base. Puro: sin Supabase, testeable.

export type ThreadRow = {
  id: string;
  role: "user" | "assistant";
  text: string;
  parts: ChatMessagePart[] | null;
  created_at: string;
};

export type ThreadLookups = {
  outfits: Map<string, OutfitView>;
  garments: Map<string, GarmentView>;
  palettes: Map<string, ColorAnalysis>;
  imageUrls: Map<string, string>;
  /** Notas de memoria que siguen existiendo (las borradas no reaparecen). */
  liveMemoryIds: Set<string>;
};

type Of<T extends ChatMessagePart["type"]> = Extract<ChatMessagePart, { type: T }>;

const stripType = <T extends { type: string }>(p: T): Omit<T, "type"> => {
  const { type: _type, ...rest } = p;
  void _type;
  return rest;
};

/** Todos los bloques de compra del hilo, para resolver la opción elegida de cada look. */
export function shoppingBlocksOf(rows: ThreadRow[]): ShoppingOptionsBlock[] {
  return rows.flatMap((r) =>
    (r.parts ?? []).flatMap((p) => (p.type === "shopping_options" ? [stripType(p) as ShoppingOptionsBlock] : [])),
  );
}

export function assembleThread(ordered: ThreadRow[], lookups: ThreadLookups): ChatMessageView[] {
  const blocks = shoppingBlocksOf(ordered);
  const lastIndex = ordered.length - 1;

  return ordered.map((m, index) => {
    const mp = m.parts ?? [];
    const image = mp.find((p): p is Of<"image"> => p.type === "image");
    const quick = mp.find((p): p is Of<"quick_replies"> => p.type === "quick_replies");
    const paletteId = mp.find((p): p is Of<"palette"> => p.type === "palette")?.analysis_id;
    const eventPart = [...mp].reverse().find((p): p is Of<"event_summary"> => p.type === "event_summary");
    const offerPart = mp.find((p): p is Of<"search_offer"> => p.type === "search_offer");
    const steps = mp.flatMap((p) => (p.type === "tool_step" ? [stripType(p) as ToolStep] : []));

    return {
      id: m.id,
      role: m.role,
      text: m.text,
      created_at: m.created_at,
      outfits: mp.flatMap((p) => {
        if (p.type !== "outfit") return [];
        const base = lookups.outfits.get(p.outfit_id);
        if (!base) return [];
        const selected = selectedOptionFor(blocks, base.id) ?? base.selected_option ?? null;
        const evidence = p.evidence ?? base.evidence;
        return [
          {
            ...base,
            ...(evidence ? { evidence } : {}),
            ...(p.refinements ? { refinements: p.refinements } : {}),
            variant: p.variant ?? base.variant ?? null,
            pair_id: p.pair_id ?? base.pair_id ?? null,
            selected_option: selected,
          } satisfies OutfitView,
        ];
      }),
      garments: mp.flatMap((p) => {
        const g = p.type === "garment" ? lookups.garments.get(p.garment_id) : undefined;
        return g ? [g] : [];
      }),
      palette: paletteId ? (lookups.palettes.get(paletteId) ?? null) : null,
      image_url: image ? (lookups.imageUrls.get(image.path) ?? null) : null,
      memory_notes: mp.flatMap((p) =>
        p.type === "memory" && lookups.liveMemoryIds.has(p.memory_id) ? [{ id: p.memory_id, fact: p.fact }] : [],
      ),
      quick_replies:
        index === lastIndex && m.role === "assistant" && quick ? { options: quick.options, multiple: quick.multiple } : null,
      tool_steps: steps,
      event_summary: eventPart ? (stripType(eventPart) as EventSummary) : null,
      shopping_blocks: mp.flatMap((p) => (p.type === "shopping_options" ? [stripType(p) as ShoppingOptionsBlock] : [])),
      // La oferta solo está pendiente si es del último mensaje: después de responderla deja de ofrecerse.
      search_offer: offerPart && index === lastIndex ? (stripType(offerPart) as SearchOffer) : null,
    } satisfies ChatMessageView;
  });
}

type PartsRow = { id: string; parts: ChatMessagePart[] | null };

/** Último resumen del evento de la conversación y el mensaje que lo contiene (rows: los más nuevos primero). */
export function latestEventPart(rows: PartsRow[]): { rowId: string; summary: EventSummary } | null {
  for (const row of rows) {
    const part = [...(row.parts ?? [])].reverse().find((p): p is Of<"event_summary"> => p.type === "event_summary");
    if (part) return { rowId: row.id, summary: stripType(part) as EventSummary };
  }
  return null;
}

/** Reemplaza el resumen del evento dentro de las partes de un mensaje (el último, si hubiera varios). */
export function withEventSummary(parts: ChatMessagePart[], summary: EventSummary): ChatMessagePart[] {
  const idx = parts.map((p) => p.type).lastIndexOf("event_summary");
  if (idx === -1) return parts;
  return parts.map((p, i) => (i === idx ? ({ type: "event_summary", ...summary } as ChatMessagePart) : p));
}
