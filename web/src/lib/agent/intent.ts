import "server-only";
import type { ChatIntent, ChatMessagePart, MissingPiece, ShoppingOptionsBlock } from "@/lib/domain/types";
import type { ResolvedIntent } from "@/lib/domain/intents";
import { logError } from "@/lib/server/log";
import type { UserCtx } from "@/lib/server/types";

/**
 * Verifica un `intent` que llegó del navegador: cada id debe ser de la persona (y el bloque, de su conversación) antes de
 * que el asesor lo reciba como dato del sistema. Devuelve null si algo no cuadra: la ruta responde 400.
 */
export async function resolveIntent(ctx: UserCtx, conversationId: string, intent: ChatIntent): Promise<ResolvedIntent | null> {
  const { supabase, userId } = ctx;
  const ownOutfit = async (id: string) => {
    const { data, error } = await supabase
      .from("outfits")
      .select("id, title, occasion, missing_piece")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle<{ id: string; title: string; occasion: string; missing_piece: MissingPiece | null }>();
    if (error) logError("intent.ownOutfit", error);
    return data ?? null;
  };

  switch (intent.kind) {
    case "refine_outfit": {
      const outfit = await ownOutfit(intent.outfit_id);
      if (!outfit) return null;
      let garment_name: string | undefined;
      if (intent.garment_id) {
        const { data } = await supabase
          .from("garments")
          .select("name")
          .eq("id", intent.garment_id)
          .eq("user_id", userId)
          .maybeSingle<{ name: string }>();
        if (!data) return null;
        garment_name = data.name;
      }
      return { intent, facts: { outfit_title: outfit.title, outfit_occasion: outfit.occasion, garment_name } };
    }
    case "accept_search":
    case "decline_search": {
      const outfit = await ownOutfit(intent.outfit_id);
      if (!outfit || outfit.missing_piece?.category !== intent.slot) return null;
      return { intent, facts: { outfit_title: outfit.title, missing_description: outfit.missing_piece.description, slot: intent.slot } };
    }
    case "refine_search": {
      const { data, error } = await supabase
        .from("messages")
        .select("parts")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<{ parts: ChatMessagePart[] | null }[]>();
      if (error) logError("intent.refineSearch", error);
      for (const row of data ?? []) {
        const block = (row.parts ?? []).find((p): p is Extract<ChatMessagePart, { type: "shopping_options" }> => p.type === "shopping_options" && p.id === intent.block_id);
        if (block) {
          const b: ShoppingOptionsBlock = block;
          return {
            intent,
            facts: { slot: b.slot, search_query: b.query, shown_prices: b.options.map((o) => o.price_clp), budget_max_clp: b.budget_max_clp, for_outfit_id: b.for_outfit_id },
          };
        }
      }
      return null;
    }
  }
}
