import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { trackAiUsage } from "@/lib/analytics";
import { getAnthropic } from "@/lib/ai/client";
import type { LoadedImage } from "@/lib/ai/image";
import { aiConfig, isMockAI } from "@/lib/env";
import type { ChatEvent, ChatIntent, ChatMessagePart, EventSummary, QuickReplies } from "@/lib/domain/types";
import { describeEventForAdvisor } from "@/lib/domain/event-summary";
import { renderIntentBlock, type ResolvedIntent } from "@/lib/domain/intents";
import type { UserCtx } from "@/lib/server/types";
import { logError } from "@/lib/server/log";
import { loadPersonContext } from "./context";
import { HISTORY_LIMIT, toMessageParams, type StoredMessage } from "./history";
import { assistantNotes, userIntentLine } from "./history-notes";
import { runMockAgent } from "./mock-agent";
import { SYSTEM_PROMPT } from "./system-prompt";
import { AGENT_TOOLS } from "./tool-defs";
import { newToolState, runTool, type ToolContext } from "./tools";

export const MAX_ITERATIONS = 6;
const MAX_TOKENS = 16000;
const REFUSAL_TEXT = "No puedo ayudarte con eso. Si quieres, te armo un look para otra ocasión.";

export type AgentRunInput = {
  ctx: UserCtx;
  conversationId: string;
  /** Texto de la persona, ya persistido como último mensaje de la conversación (vacío si solo mandó foto o es el saludo). */
  userText: string;
  /** Foto del mensaje actual. `loaded` es null en modo simulado (no se descarga). */
  image?: { path: string; loaded: LoadedImage | null } | null;
  /** Primer turno: no hay mensaje de la persona, el asesor saluda. */
  start?: boolean;
  /** Botón que tocó la persona, ya verificado por la ruta (ids de la persona). */
  intent?: ResolvedIntent | null;
  emit: (event: ChatEvent) => void;
  signal?: AbortSignal;
};

export type AgentRunResult = {
  text: string;
  outfitIds: string[];
  garmentIds: string[];
  paletteId: string | null;
  quickReplies: QuickReplies | null;
};

type HistoryRow = { role: "user" | "assistant"; text: string; parts: ChatMessagePart[] | null };

const RECENT_TEXTS = 4;

/** Lo que el turno necesita saber del hilo, aparte de los mensajes que ve el modelo. */
export type HistoryFacts = {
  /** Mensajes de la persona, los más nuevos primero. */
  recentUserTexts: string[];
  /** Botones que tocó la persona en esta conversación (más nuevos primero). */
  intents: ChatIntent[];
  /** Último resumen del evento (con las correcciones de la persona). */
  event: EventSummary | null;
  /** Cuántas veces se mostró el resumen con datos por completar: aproxima las preguntas ya hechas (tope D-01). */
  eventQuestionsAsked: number;
};

async function loadHistory(ctx: UserCtx, conversationId: string) {
  const { data, error } = await ctx.supabase
    .from("messages")
    .select("role, text, parts")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT)
    .returns<HistoryRow[]>();
  if (error) logError("run.loadHistory.messages", error);
  const rows = [...(data ?? [])].reverse();

  const outfitIds = [...new Set(rows.flatMap((r) => (r.parts ?? []).flatMap((p) => (p.type === "outfit" ? [p.outfit_id] : []))))];
  const titles = new Map<string, string>();
  if (outfitIds.length) {
    const { data: outfits, error: outfitsError } = await ctx.supabase
      .from("outfits")
      .select("id, title")
      .in("id", outfitIds)
      .returns<{ id: string; title: string }[]>();
    if (outfitsError) logError("run.loadHistory.outfits", outfitsError);
    for (const o of outfits ?? []) titles.set(o.id, o.title);
  }

  const stored: StoredMessage[] = rows.map((r) => ({
    role: r.role,
    text: r.text,
    outfitTitles: (r.parts ?? []).flatMap((p) => (p.type === "outfit" && titles.has(p.outfit_id) ? [titles.get(p.outfit_id) as string] : [])),
    imagePaths: r.role === "user" ? (r.parts ?? []).flatMap((p) => (p.type === "image" ? [p.path] : [])) : [],
    ...(r.role === "assistant" ? { notes: assistantNotes(r.parts ?? []) } : { intentLine: userIntentLine(r.parts ?? []) }),
  }));

  const userRows = rows.filter((r) => r.role === "user");
  const eventParts = rows.flatMap((r) => (r.parts ?? []).flatMap((p) => (p.type === "event_summary" ? [p] : [])));
  const lastEvent = eventParts[eventParts.length - 1];
  let event: EventSummary | null = null;
  if (lastEvent) {
    const { type: _t, ...summary } = lastEvent;
    void _t;
    event = summary;
  }
  const facts: HistoryFacts = {
    recentUserTexts: userRows.map((r) => r.text).filter(Boolean).reverse().slice(0, RECENT_TEXTS),
    intents: userRows.flatMap((r) => (r.parts ?? []).flatMap((p) => (p.type === "intent" ? [p.intent] : []))).reverse(),
    event,
    eventQuestionsAsked: eventParts.filter((p) => p.missing.length > 0).length,
  };
  return { stored, truncated: rows.length >= HISTORY_LIMIT, facts };
}

/** Un turno del asesor: bucle de herramientas con streaming, máximo `MAX_ITERATIONS` vueltas. */
export async function runStylistTurn(input: AgentRunInput): Promise<AgentRunResult> {
  const { ctx, conversationId, userText, emit, signal } = input;
  const person = await loadPersonContext(ctx.supabase, ctx.userId);
  const { stored, truncated, facts } = await loadHistory(ctx, conversationId);

  // Solo las fotos recientes de la conversación pueden pasar a add_garment / analyze_palette.
  const allowed = stored.flatMap((m) => m.imagePaths);
  const tctx: ToolContext = {
    ctx,
    conversationId,
    city: person.city,
    emit,
    state: newToolState(allowed, {
      event: facts.event,
      intent: input.intent ?? null,
      intents: [...(input.intent ? [input.intent.intent] : []), ...facts.intents],
      recentUserTexts: [userText, ...facts.recentUserTexts.filter((t) => t !== userText)].filter(Boolean),
    }),
  };
  const finish = (text: string): AgentRunResult => ({
    text: text.trim(),
    outfitIds: tctx.state.outfitIds,
    garmentIds: tctx.state.garmentIds,
    paletteId: tctx.state.paletteId,
    quickReplies: tctx.state.quickReplies,
  });

  if (isMockAI()) {
    const text = await runMockAgent(
      {
        userText,
        hasImage: Boolean(input.image),
        imagePath: input.image?.path ?? null,
        start: Boolean(input.start),
        person,
        intent: input.intent ?? null,
        event: facts.event,
        eventQuestionsAsked: facts.eventQuestionsAsked,
        recentUserTexts: tctx.state.recentUserTexts,
      },
      tctx,
      signal,
    );
    return finish(text);
  }

  const { stylistModel, effort } = aiConfig();
  const client = getAnthropic();
  const current = input.image
    ? {
        path: input.image.path,
        block: input.image.loaded
          ? ({
              type: "image",
              source: { type: "base64", media_type: input.image.loaded.mediaType, data: input.image.loaded.base64 },
            } as const)
          : null,
      }
    : null;
  // Lo que cambia por turno (evento actual, botón tocado) va al final del último mensaje: no rompe el prefijo cacheado.
  const turnBlocks: string[] = [];
  if (facts.event) turnBlocks.push(`<evento_actual>\n${describeEventForAdvisor(facts.event)}\n</evento_actual>`);
  if (input.intent) turnBlocks.push(renderIntentBlock(input.intent));
  const messages = toMessageParams(stored, person.text, { truncated, current, turnBlocks });
  let text = "";

  const push = (delta: string) => {
    text += delta;
    emit({ type: "text_delta", text: delta });
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // En la última vuelta se cierra el uso de herramientas para obligar a responder con texto.
    const lastTurn = iteration === MAX_ITERATIONS - 1;
    const stream = client.beta.messages.stream(
      {
        model: stylistModel,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        output_config: { effort },
        // Prefijo estático: tools -> system. El marcador cachea ambos.
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: AGENT_TOOLS,
        tool_choice: lastTurn ? { type: "none" } : { type: "auto" },
        messages,
        // Un falso positivo del clasificador de seguridad no debe convertirse en una caída (DT-06).
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal },
    );

    // Separa el texto de vueltas distintas (antes y después de una herramienta).
    let startedThisTurn = false;
    stream.on("text", (delta) => {
      if (!startedThisTurn && text && !/\s$/.test(text)) push("\n\n");
      startedThisTurn = true;
      push(delta);
    });

    const message = await stream.finalMessage();
    void trackAiUsage("chat", stylistModel, message.usage, ctx);

    if (message.stop_reason === "refusal") {
      if (!text) push(REFUSAL_TEXT);
      break;
    }
    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (message.stop_reason === "max_tokens") {
      // Un tool_use cortado a media entrada nunca se ejecuta; un texto cortado se entrega tal cual.
      if (toolUses.length > 0 && !text) push("Me alargué más de la cuenta. ¿Me lo pides de nuevo?");
      break;
    }
    if (message.stop_reason !== "tool_use" || toolUses.length === 0) break;

    // El contenido del asistente se reenvía sin modificar (incluye los bloques de pensamiento).
    messages.push({ role: "assistant", content: message.content });

    // Todos los tool_result de la vuelta viajan en un solo mensaje de la persona.
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const use of toolUses) {
      const out = await runTool(use.name, use.input, tctx);
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: out.content,
        ...(out.isError ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: results });
  }

  return finish(text);
}
