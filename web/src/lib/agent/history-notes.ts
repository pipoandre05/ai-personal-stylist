import type { ChatMessagePart } from "@/lib/domain/types";
import { describeEventForAdvisor } from "@/lib/domain/event-summary";
import { intentHistoryLine } from "@/lib/domain/intents";

// Notas de historial: lo que el asistente mostró con herramientas y el texto no menciona. Sin ellas el asesor no
// recordaría que ya mostró opciones, que ofreció buscar ni qué entendió del evento. Pura.

const money = (n: number) => "$" + n.toLocaleString("es-CL");

export function assistantNotes(parts: ChatMessagePart[]): string[] {
  const notes: string[] = [];
  const event = [...parts].reverse().find((p) => p.type === "event_summary");
  if (event && event.type === "event_summary") {
    const { type: _t, ...summary } = event;
    void _t;
    notes.push("[Resumen del evento que mostré]\n" + describeEventForAdvisor(summary));
  }
  for (const p of parts) {
    if (p.type === "outfit" && p.variant) notes.push(`[El look del par es la variante ${p.variant}]`);
    if (p.type === "search_offer") notes.push(`[Ofrecí buscar opciones para: ${p.slot} (${p.description}); esperando su respuesta]`);
    if (p.type === "shopping_options") {
      const shown = p.options.map((o) => `${o.store_name} "${o.title}" ${money(o.price_clp)}`).join("; ");
      const chosen = p.options.find((o) => o.id === p.selected_option_id);
      notes.push(
        `[Mostré opciones de compra para ${p.slot} (${p.query}): ${shown || "ninguna"}${chosen ? `; la persona eligió ${chosen.store_name} "${chosen.title}"` : ""}]`,
      );
    }
  }
  return notes;
}

/** Línea de historial de un mensaje de la persona que nació de un botón. */
export function userIntentLine(parts: ChatMessagePart[]): string | undefined {
  const p = parts.find((x) => x.type === "intent");
  return p && p.type === "intent" ? intentHistoryLine(p.intent) : undefined;
}
