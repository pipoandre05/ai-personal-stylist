import { z } from "zod";
import { track } from "@/lib/analytics";
import { friendlyAiError } from "@/lib/ai/errors";
import { downloadImage } from "@/lib/ai/image";
import { runStylistTurn, type AgentRunInput } from "@/lib/agent/run";
import { encodeSSE } from "@/lib/chat/sse";
import { isOwnPhotoPath } from "@/lib/domain/photo-path";
import type { ChatEvent, ChatMessagePart, QuickReplies } from "@/lib/domain/types";
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
  })
  .refine((b) => b.start || b.text.length > 0 || b.image_path, { message: "empty" });

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
  const { text, image_path, start } = body.data;
  if (image_path !== undefined && !isOwnPhotoPath(image_path, ctx.userId)) return apiError(BAD_INPUT, 400);
  const { supabase, userId } = ctx;

  let conversationId: string;

  if (start) {
    // Saludo inicial: solo si la persona no tiene mensajes. Es idempotente (doble clic, doble render).
    const { data: existing } = await supabase
      .from("messages")
      .select("id, conversation_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; conversation_id: string }>();
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
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", startOfTodayInSantiagoISO());
    if ((count ?? 0) >= chatDailyLimit()) return apiError(LIMIT_REACHED, 429);

    if (body.data.conversation_id) {
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", body.data.conversation_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return apiError(BAD_INPUT, 400);
      conversationId = body.data.conversation_id;
    } else {
      const created = await createConversation(ctx, text.slice(0, 60) || "Foto");
      if (!created) return apiError(INTERNAL, 500);
      conversationId = created;
    }
  }

  // La foto se lee antes de guardar nada: si no se puede leer, no queda un mensaje huérfano.
  let image: AgentRunInput["image"] = null;
  if (image_path) {
    try {
      image = { path: image_path, loaded: isMockAI() ? null : await downloadImage(ctx, image_path) };
    } catch {
      return apiError("No pude leer esa foto. Intenta enviarla de nuevo.", 400);
    }
  }

  if (!start) {
    // El mensaje de la persona se guarda antes de llamar al modelo: si el modelo falla no se pierde.
    const parts: ChatMessagePart[] = image_path ? [{ type: "image", path: image_path }] : [];
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: userId, role: "user", text, parts });
    if (error) return apiError(INTERNAL, 500);
    void track("chat_message_sent", { has_image: Boolean(image_path) }, ctx);
  }

  return streamTurn({ ctx, conversationId, userText: text, image, start: Boolean(start), request });
}

async function createConversation(ctx: UserCtx, title: string): Promise<string | null> {
  const { data, error } = await ctx.supabase
    .from("conversations")
    .insert({ user_id: ctx.userId, title })
    .select("id")
    .single<{ id: string }>();
  return error || !data ? null : data.id;
}

function streamTurn(args: {
  ctx: UserCtx;
  conversationId: string;
  userText: string;
  image: AgentRunInput["image"];
  start: boolean;
  request: Request;
}): Response {
  const { ctx, conversationId, userText, image, start, request } = args;
  const { supabase, userId } = ctx;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      let reply = "";
      const outfitIds: string[] = [];
      const garmentIds: string[] = [];
      let paletteId: string | null = null;
      let quickReplies: QuickReplies | null = null;

      const emit = (event: ChatEvent) => {
        if (event.type === "text_delta") reply += event.text;
        if (event.type === "outfit") outfitIds.push(event.outfit.id);
        if (event.type === "garment") garmentIds.push(event.garment.id);
        if (event.type === "palette") paletteId = event.analysis.id;
        if (event.type === "quick_replies") quickReplies = { options: event.options, multiple: event.multiple };
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
        await runStylistTurn({ ctx, conversationId, userText, image, start, emit, signal: request.signal });
      } catch (err) {
        if (!request.signal.aborted) {
          console.error("[chat]", err instanceof Error ? err.message : err);
          failure = friendlyAiError(err);
        }
      }

      // Se guarda lo que haya, también si el turno se cortó: prendas, paleta y looks ya quedaron persistidos.
      const finalText = reply.trim() || (outfitIds.length || garmentIds.length || paletteId || failure || request.signal.aborted ? "" : EMPTY_REPLY);
      const parts: ChatMessagePart[] = [
        ...outfitIds.map((outfit_id): ChatMessagePart => ({ type: "outfit", outfit_id })),
        ...garmentIds.map((garment_id): ChatMessagePart => ({ type: "garment", garment_id })),
        ...(paletteId ? [{ type: "palette", analysis_id: paletteId } as const] : []),
        ...(quickReplies ? [{ type: "quick_replies", ...(quickReplies as QuickReplies) } as const] : []),
      ];
      if (finalText || parts.length) {
        const { data: saved } = await supabase
          .from("messages")
          .insert({ conversation_id: conversationId, user_id: userId, role: "assistant", text: finalText, parts })
          .select("id")
          .single<{ id: string }>();
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
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
