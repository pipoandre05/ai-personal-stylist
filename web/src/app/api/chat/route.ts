import { titleFromFirstMessage } from "@/lib/domain/conversation-title";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { friendlyAiError } from "@/lib/ai/errors";
import { downloadImage } from "@/lib/ai/image";
import { resolveIntent } from "@/lib/agent/intent";
import { runStylistTurn, type AgentRunInput } from "@/lib/agent/run";
import { createTurnCollector } from "@/lib/chat/collector";
import { encodeSSE } from "@aps/core";
import { ChatIntentSchema } from "@/lib/domain/intents";
import { logError } from "@/lib/server/log";
import { isOwnPhotoPath } from "@/lib/domain/photo-path";
import type { ChatEvent, ChatMessagePart } from "@/lib/domain/types";
import { chatDailyLimit, isMockAI } from "@/lib/env";
import { startOfTodayInSantiagoISO } from "@/lib/format";
import { apiError, authenticate, BAD_INPUT, INTERNAL, readJson, UNAUTHORIZED } from "@/lib/server/route-helpers";
import type { UserCtx } from "@/lib/server/types";

// Node es el runtime por defecto; con cacheComponents `export const runtime` no está permitido.
export const maxDuration = 60;

const Body = z
  .object({
    conversation_id: z.string().uuid().optional(),
    text: z.string().trim().max(2000).default(""),
    image_path: z.string().max(200).optional(),
    start: z.boolean().optional(),
    /**
     * Botón que tocó la persona (refinar un look o una búsqueda, aceptar o no buscar opciones). `text` lleva el rótulo del
     * botón, que es lo que ve la persona en el hilo; `intent` es lo que entiende el asesor, y solo después de que el
     * servidor verifica que cada id es de la persona. Requiere `conversation_id`.
     */
    intent: ChatIntentSchema.optional(),
    /**
     * Idempotencia (opcional). El cliente genera un uuid (`crypto.randomUUID()`) POR MENSAJE DE LA PERSONA y lo
     * envía igual en cada reintento de ese mismo mensaje (no uno nuevo por request). El servidor lo usa como `id`
     * del mensaje: si ya existe, no lo vuelve a guardar; si el turno del asesor ya terminó devuelve su `done`, y si
     * el turno se cortó lo reintenta. Así un reintento tras un error no duplica el mensaje.
     */
    client_message_id: z.string().uuid().optional(),
  })
  .refine((b) => b.start || b.text.length > 0 || b.image_path || b.intent, { message: "empty" })
  .refine((b) => !b.intent || b.conversation_id, { message: "intent sin conversación" });

const EMPTY_REPLY = "No logré armar una respuesta. ¿Lo intentamos de nuevo?";
const LIMIT_REACHED = "Llegaste al máximo de mensajes de hoy. Mañana seguimos con tus looks.";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function staticStream(events: ChatEvent[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const e of events) controller.enqueue(encoder.encode(encodeSSE(e)));
      controller.close();
    },
  });
  return new Response(body, { headers: SSE_HEADERS });
}

export async function POST(request: Request) {
  const ctx = await authenticate();
  if (!ctx) return apiError(UNAUTHORIZED, 401);

  const body = Body.safeParse(await readJson(request));
  if (!body.success) return apiError(BAD_INPUT, 400);
  const { text, image_path, start, client_message_id, intent } = body.data;
  if (image_path !== undefined && !isOwnPhotoPath(image_path, ctx.userId)) return apiError(BAD_INPUT, 400);
  const { supabase, userId } = ctx;

  let conversationId: string;

  // Reintento de un mensaje ya guardado (RLS: solo ve los propios).
  let previous: { id: string; conversation_id: string; created_at: string } | null = null;
  if (!start && client_message_id) {
    previous = await findOwnMessage(ctx, client_message_id);
    if (previous) {
      // El turno del asesor ya terminó: no se vuelve a ejecutar, se entrega su cierre.
      const { data: reply, error: replyError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", previous.conversation_id)
        .eq("role", "assistant")
        .gt("created_at", previous.created_at)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<{ id: string }>();
      if (replyError) logError("chat.retry.lookup_reply", replyError);
      if (reply) {
        return staticStream([
          { type: "conversation", id: previous.conversation_id },
          { type: "done", message_id: reply.id },
        ]);
      }
    }
  }

  if (previous) {
    conversationId = previous.conversation_id;
  } else if (start) {
    // Saludo inicial: solo si la persona no tiene mensajes. Es idempotente (doble clic, doble render).
    const { data: existing, error: existingError } = await supabase
      .from("messages")
      .select("id, conversation_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; conversation_id: string }>();
    if (existingError) logError("chat.start.lookup", existingError);
    if (existing) {
      return staticStream([
        { type: "conversation", id: existing.conversation_id },
        { type: "done", message_id: existing.id },
      ]);
    }
    const created = await createConversation(ctx, "Primera conversación");
    if (!created) return apiError(INTERNAL, 500);
    conversationId = created;
  } else {
    // Tope diario antes de gastar inferencia (R-15). El saludo inicial no cuenta.
    const { count, error: countError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", startOfTodayInSantiagoISO());
    if (countError) logError("chat.daily_limit", countError);
    if ((count ?? 0) >= chatDailyLimit()) return apiError(LIMIT_REACHED, 429);

    if (body.data.conversation_id) {
      const { data, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", body.data.conversation_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (convError) logError("chat.conversation.lookup", convError);
      if (!data) return apiError(BAD_INPUT, 400);
      conversationId = body.data.conversation_id;
    } else {
      const created = await createConversation(ctx, titleFromFirstMessage(text, Boolean(image_path)));
      if (!created) return apiError(INTERNAL, 500);
      conversationId = created;
    }
  }

  // El botón se verifica antes de guardar nada: ids de otra persona o de otra conversación no llegan al asesor.
  let resolvedIntent: AgentRunInput["intent"] = null;
  if (intent && !start) {
    resolvedIntent = await resolveIntent(ctx, conversationId, intent);
    if (!resolvedIntent) return apiError(BAD_INPUT, 400);
  }

  // La foto se lee antes de guardar nada: si no se puede leer, no queda un mensaje huérfano.
  let image: AgentRunInput["image"] = null;
  if (image_path) {
    try {
      image = { path: image_path, loaded: isMockAI() ? null : await downloadImage(ctx, image_path) };
    } catch (err) {
      logError("chat.download_image", err);
      return apiError("No pude leer esa foto. Intenta enviarla de nuevo.", 400);
    }
  }

  if (!start && !previous) {
    // El mensaje de la persona se guarda antes de llamar al modelo: si el modelo falla no se pierde.
    const parts: ChatMessagePart[] = [
      ...(image_path ? [{ type: "image", path: image_path } as const] : []),
      ...(intent ? [{ type: "intent", intent } as const] : []),
    ];
    const { error } = await supabase.from("messages").insert({
      ...(client_message_id ? { id: client_message_id } : {}),
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      text,
      parts,
    });
    if (error) {
      // 23505: otro request con el mismo client_message_id ganó la carrera (doble toque): ya está guardado.
      const duplicate = client_message_id && error.code === "23505" && (await findOwnMessage(ctx, client_message_id));
      if (!duplicate) {
        logError("chat.insert_user_message", error);
        return apiError(INTERNAL, 500);
      }
    } else {
        void track("chat_message_sent", { has_image: Boolean(image_path) }, ctx);
    }
  }

  return streamTurn({ ctx, conversationId, userText: text, image, start: Boolean(start), intent: resolvedIntent, request });
}

async function findOwnMessage(ctx: UserCtx, id: string) {
  const { data, error } = await ctx.supabase
    .from("messages")
    .select("id, conversation_id, created_at")
    .eq("id", id)
    .eq("user_id", ctx.userId)
    .eq("role", "user")
    .maybeSingle<{ id: string; conversation_id: string; created_at: string }>();
  if (error) logError("chat.find_message", error);
  return data ?? null;
}

async function createConversation(ctx: UserCtx, title: string): Promise<string | null> {
  const { data, error } = await ctx.supabase
    .from("conversations")
    .insert({ user_id: ctx.userId, title })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    logError("chat.create_conversation", error ?? "sin datos");
    return null;
  }
  return data.id;
}

function streamTurn(args: {
  ctx: UserCtx;
  conversationId: string;
  userText: string;
  image: AgentRunInput["image"];
  start: boolean;
  intent: AgentRunInput["intent"];
  request: Request;
}): Response {
  const { ctx, conversationId, userText, image, start, intent, request } = args;
  const { supabase, userId } = ctx;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      // Reduce los eventos del turno a lo que se guarda (texto y `parts`): ver lib/chat/collector.ts.
      const collector = createTurnCollector();

      const emit = (event: ChatEvent) => {
        collector.push(event);
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        } catch {
          open = false; // el cliente se fue
        }
      };

      let failure: string | null = null;
      emit({ type: "conversation", id: conversationId });
      try {
        await runStylistTurn({ ctx, conversationId, userText, image, start, intent, emit, signal: request.signal });
      } catch (err) {
        if (!request.signal.aborted) {
          console.error("[chat]", err instanceof Error ? err.message : err);
          failure = friendlyAiError(err);
        }
      }

      // Se guarda lo que haya, también si el turno se cortó: prendas, paleta y looks ya quedaron persistidos.
      const reply = collector.text;
      const hasWork = collector.outfitIds.length > 0 || collector.garmentIds.length > 0 || collector.paletteId !== null;
      const finalText = reply.trim() || (hasWork || failure || request.signal.aborted ? "" : EMPTY_REPLY);
      const parts: ChatMessagePart[] = collector.parts();
      if (finalText || parts.length) {
        const { data: saved, error: saveError } = await supabase
          .from("messages")
          .insert({ conversation_id: conversationId, user_id: userId, role: "assistant", text: finalText, parts })
          .select("id")
          .single<{ id: string }>();
        if (saveError) logError("chat.save_assistant_message", saveError);
        const { error: touchError } = await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
        if (touchError) logError("chat.touch_conversation", touchError);
        if (finalText !== reply.trim()) emit({ type: "text_delta", text: finalText });
        if (saved && !failure) emit({ type: "done", message_id: saved.id });
      }
      if (failure) emit({ type: "error", message: failure });

      if (open) {
        try {
          controller.close();
        } catch {
          // ya cerrado
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
