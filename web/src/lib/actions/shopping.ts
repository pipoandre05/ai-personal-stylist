"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { extrasAvailable, markExtrasMissing } from "@/lib/data/outfit-extras";
import { applyBlockSelection, applySelection, findOptionInBlock, findOptionInThread } from "@/lib/domain/shopping";
import type { ActionResult, ChatMessagePart } from "@/lib/domain/types";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";
import { logError } from "@/lib/server/log";

const Id = z.string().uuid();
const OptionId = z.string().regex(/^opt-[0-9a-f]{8}$/);

/**
 * La persona elige (o cambia, o quita con `null`) la opción de compra de un look. NO compra nada: solo marca la opción
 * para verla en el look; "Ver en la tienda" es un enlace que abre ella (DP-09). La opción se busca entre las que de
 * verdad se mostraron en la conversación del look, así que un id inventado no pasa.
 *
 * Persiste en `messages.parts` (el hilo la recupera al recargar, sin migración) y, si existe la columna
 * `outfits.selected_option` (migración 20261114020000), también ahí para "Tus looks".
 */
export async function selectShoppingOption(outfitId: string, optionId: string | null): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedOutfit = Id.safeParse(outfitId);
  const parsedOption = optionId === null ? { success: true as const, data: null } : OptionId.safeParse(optionId);
  if (!parsedOutfit.success || !parsedOption.success) return { ok: false, error: "No encontramos esa opción." };

  const { supabase, userId } = ctx;
  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .select("id, conversation_id")
    .eq("id", parsedOutfit.data)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; conversation_id: string | null }>();
  if (outfitError) logError("actions.shopping.outfit", outfitError);
  if (!outfit?.conversation_id) return { ok: false, error: "No encontramos ese look." };

  const { data: rows, error: rowsError } = await supabase
    .from("messages")
    .select("id, parts")
    .eq("conversation_id", outfit.conversation_id)
    .eq("user_id", userId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<{ id: string; parts: ChatMessagePart[] | null }[]>();
  if (rowsError) {
    logError("actions.shopping.messages", rowsError);
    return { ok: false, error: GENERIC_ERROR };
  }

  const found = parsedOption.data === null ? null : findOptionInThread(rows ?? [], outfit.id, parsedOption.data);
  if (parsedOption.data !== null && !found) return { ok: false, error: "No encontramos esa opción." };

  for (const change of applySelection(rows ?? [], outfit.id, parsedOption.data, found?.blockId ?? null)) {
    const { error } = await supabase.from("messages").update({ parts: change.parts }).eq("id", change.id).eq("user_id", userId);
    if (error) {
      logError("actions.shopping.update_parts", error);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  if (extrasAvailable()) {
    const { error } = await supabase
      .from("outfits")
      .update({ selected_option: found?.option ?? null })
      .eq("id", outfit.id)
      .eq("user_id", userId);
    if (error) markExtrasMissing(error);
  }

  if (found) void track("shopping_option_selected", { affiliate: found.option.affiliate }, ctx);
  revalidatePath("/looks");
  return { ok: true };
}

/**
 * Igual que `selectShoppingOption`, para una búsqueda que la persona pidió sin look ("quiero unos zapatos nuevos"):
 * el bloque no tiene `for_outfit_id`, así que la elección vive solo en ese bloque de la conversación. NO compra nada (DP-09).
 * La opción debe ser una de las que de verdad se mostraron en ese bloque de una conversación de la persona.
 */
export async function selectShoppingOptionInBlock(conversationId: string, blockId: string, optionId: string | null): Promise<ActionResult> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsedConversation = Id.safeParse(conversationId);
  const parsedBlock = z.string().min(1).max(80).safeParse(blockId);
  const parsedOption = optionId === null ? { success: true as const, data: null } : OptionId.safeParse(optionId);
  if (!parsedConversation.success || !parsedBlock.success || !parsedOption.success) return { ok: false, error: "No encontramos esa opción." };

  const { supabase, userId } = ctx;
  const { data: rows, error: rowsError } = await supabase
    .from("messages")
    .select("id, parts")
    .eq("conversation_id", parsedConversation.data)
    .eq("user_id", userId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<{ id: string; parts: ChatMessagePart[] | null }[]>();
  if (rowsError) {
    logError("actions.shopping.block.messages", rowsError);
    return { ok: false, error: GENERIC_ERROR };
  }

  const option = parsedOption.data === null ? null : findOptionInBlock(rows ?? [], parsedBlock.data, parsedOption.data);
  if (parsedOption.data !== null && !option) return { ok: false, error: "No encontramos esa opción." };

  for (const change of applyBlockSelection(rows ?? [], parsedBlock.data, parsedOption.data)) {
    const { error } = await supabase.from("messages").update({ parts: change.parts }).eq("id", change.id).eq("user_id", userId);
    if (error) {
      logError("actions.shopping.block.update_parts", error);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  if (option) void track("shopping_option_selected", { affiliate: option.affiliate }, ctx);
  return { ok: true };
}
