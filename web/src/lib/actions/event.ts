"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { latestEventPart, withEventSummary } from "@/lib/data/thread";
import { mergeEvent, needsWeatherRefresh, weatherForSummary } from "@/lib/domain/event-summary";
import type { ActionDataResult, ChatMessagePart, EventSummary } from "@/lib/domain/types";
import { todayInSantiago } from "@/lib/format";
import { getUserCtx, GENERIC_ERROR, NO_SESSION_ERROR } from "@/lib/server/action-helpers";
import { logError } from "@/lib/server/log";
import { FORECAST_DAYS_AHEAD, getWeather } from "@/lib/weather";

const Patch = z
  .object({
    kind: z.string().trim().min(2).max(60),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    place: z.string().trim().min(2).max(80),
    place_note: z.string().trim().min(2).max(80),
    time_of_day: z.enum(["day", "night"]),
    venue: z.enum(["indoor", "outdoor"]),
    dress_code: z.string().trim().min(2).max(80),
  })
  .partial()
  .strict();

/**
 * La persona corrige un dato del resumen del evento ("Lo que entendí"). Actualiza el último resumen de la conversación
 * en `messages.parts`, vuelve a pedir el clima si cambió la fecha o el lugar y devuelve el resumen nuevo. El asesor lo ve
 * en su siguiente turno (`<evento_actual>`); esta acción no manda ningún mensaje.
 */
export async function updateEventSummary(patch: z.input<typeof Patch>, conversationId?: string): Promise<ActionDataResult<EventSummary>> {
  const ctx = await getUserCtx();
  if (!ctx) return { ok: false, error: NO_SESSION_ERROR };
  const parsed = Patch.safeParse(patch);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return { ok: false, error: "No pudimos leer ese dato." };
  const convId = conversationId === undefined ? undefined : z.string().uuid().safeParse(conversationId);
  if (convId && !convId.success) return { ok: false, error: "No encontramos esa conversación." };

  const { supabase, userId } = ctx;
  let conv = convId?.success ? convId.data : undefined;
  if (!conv) {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (error) logError("actions.event.conversation", error);
    conv = data?.id;
  }
  if (!conv) return { ok: false, error: "No encontramos el evento." };

  const { data: rows, error: rowsError } = await supabase
    .from("messages")
    .select("id, parts")
    .eq("conversation_id", conv)
    .eq("user_id", userId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<{ id: string; parts: ChatMessagePart[] | null }[]>();
  if (rowsError) {
    logError("actions.event.messages", rowsError);
    return { ok: false, error: GENERIC_ERROR };
  }
  const latest = latestEventPart(rows ?? []);
  if (!latest) return { ok: false, error: "No encontramos el evento." };

  let summary = mergeEvent(latest.summary, parsed.data);
  if (needsWeatherRefresh(summary)) {
    const today = todayInSantiago();
    const when = summary.date ?? today;
    const ahead = Math.round((new Date(`${when}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
    if (ahead >= 0 && ahead <= FORECAST_DAYS_AHEAD) {
      const { data: profile } = await supabase.from("profiles").select("city").eq("id", userId).maybeSingle<{ city: string }>();
      const weather = await getWeather(summary.place ?? profile?.city ?? "Santiago", when);
      if (weather) summary = { ...summary, weather: weatherForSummary(weather) };
    }
  }

  const row = (rows ?? []).find((r) => r.id === latest.rowId);
  const { error } = await supabase
    .from("messages")
    .update({ parts: withEventSummary(row?.parts ?? [], summary) })
    .eq("id", latest.rowId)
    .eq("user_id", userId);
  if (error) {
    logError("actions.event.update", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  void track("event_summary_corrected", { fields: Object.keys(parsed.data).join(",") }, ctx);
  revalidatePath("/asesor");
  return { ok: true, data: summary };
}
