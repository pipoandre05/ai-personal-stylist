import type {
  ChatEvent,
  ChatMessagePart,
  EventSummary,
  MemoryNote,
  OutfitView,
  QuickReplies,
  SearchOffer,
  ShoppingOptionsBlock,
  ToolStep,
} from "@/lib/domain/types";
import { settleSteps, upsertStep } from "@/lib/domain/steps";

/**
 * Reduce los eventos SSE de un turno a lo que se guarda en `messages.parts` (y al texto visible). Pura: la usa
 * `POST /api/chat` y los tests de "reconstruir el hilo al recargar".
 */
export function createTurnCollector() {
  let text = "";
  const outfits: OutfitView[] = [];
  const garmentIds: string[] = [];
  let paletteId: string | null = null;
  const memoryNotes: MemoryNote[] = [];
  let quickReplies: QuickReplies | null = null;
  let steps: ToolStep[] = [];
  let event: EventSummary | null = null;
  const blocks: ShoppingOptionsBlock[] = [];
  let offer: SearchOffer | null = null;

  return {
    push(e: ChatEvent) {
      switch (e.type) {
        case "text_delta":
          text += e.text;
          break;
        case "outfit":
          outfits.push(e.outfit);
          break;
        case "garment":
          garmentIds.push(e.garment.id);
          break;
        case "palette":
          paletteId = e.analysis.id;
          break;
        case "memory":
          memoryNotes.push({ id: e.id, fact: e.fact });
          break;
        case "quick_replies":
          quickReplies = { options: e.options, multiple: e.multiple };
          break;
        case "tool_step": {
          const { type: _type, ...step } = e;
          void _type;
          steps = upsertStep(steps, step);
          break;
        }
        case "event_summary": {
          const { type: _type, ...summary } = e;
          void _type;
          event = summary;
          break;
        }
        case "shopping_options": {
          const { type: _type, ...block } = e;
          void _type;
          const i = blocks.findIndex((b) => b.id === block.id);
          if (i === -1) blocks.push(block);
          else blocks[i] = block;
          break;
        }
        case "search_offer": {
          const { type: _type, ...o } = e;
          void _type;
          offer = o;
          break;
        }
        default:
          break;
      }
    },
    get text() {
      return text;
    },
    get outfitIds() {
      return outfits.map((o) => o.id);
    },
    get garmentIds() {
      return garmentIds;
    },
    get paletteId() {
      return paletteId;
    },
    /** Partes a guardar en el mensaje del asistente, en un orden estable. */
    parts(): ChatMessagePart[] {
      const out: ChatMessagePart[] = [];
      for (const o of outfits) {
        out.push({
          type: "outfit",
          outfit_id: o.id,
          ...(o.evidence ? { evidence: o.evidence } : {}),
          ...(o.refinements ? { refinements: o.refinements } : {}),
          ...(o.variant ? { variant: o.variant } : {}),
          ...(o.pair_id ? { pair_id: o.pair_id } : {}),
        });
      }
      for (const id of garmentIds) out.push({ type: "garment", garment_id: id });
      if (paletteId) out.push({ type: "palette", analysis_id: paletteId });
      for (const m of memoryNotes) out.push({ type: "memory", memory_id: m.id, fact: m.fact });
      for (const s of settleSteps(steps)) out.push({ type: "tool_step", ...s });
      if (event) out.push({ type: "event_summary", ...event });
      for (const b of blocks) out.push({ type: "shopping_options", ...b });
      if (offer) out.push({ type: "search_offer", ...offer });
      if (quickReplies) out.push({ type: "quick_replies", ...(quickReplies as QuickReplies) });
      return out;
    },
  };
}
