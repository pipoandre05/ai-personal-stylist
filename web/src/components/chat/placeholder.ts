import type { QuickReplies } from "@/lib/domain/types";
import type { ThreadItem } from "./thread-types";

export const LIMIT_PLACEHOLDER = "Por hoy llegamos al máximo de mensajes. Mañana seguimos.";

export type ComputePlaceholderInput = {
  limit?: boolean;
  online?: boolean;
  replies?: QuickReplies | null;
  busy?: boolean;
  items: ThreadItem[];
};

/**
 * Calcula el placeholder contextual del compositor según el momento del hilo (UX_UI_SPEC §7.9):
 * - Sin conexión / Límite
 * - Con respuestas sugeridas: "O dímelo con tus palabras"
 * - Tras una foto de la persona: "Pregúntame por la foto…"
 * - Tras un look: "¿Qué le cambiarías?"
 * - Reposo / respondiendo: "Escríbele a tu asesor…"
 */
export function computePlaceholder({
  limit,
  online = true,
  replies,
  busy,
  items,
}: ComputePlaceholderInput): string {
  if (limit) return LIMIT_PLACEHOLDER;
  if (!online) return "Sin conexión";
  if (replies && replies.options.length > 0 && !busy) {
    return "O dímelo con tus palabras";
  }

  if (items.length === 0) return "Escríbele a tu asesor…";
  const last = items[items.length - 1];

  if (last.kind === "person") {
    if (Boolean(last.imageUrl) || last.photoDeleted) {
      return "Pregúntame por la foto…";
    }
    return "Escríbele a tu asesor…";
  }

  if (last.kind === "advisor") {
    if (last.outfits && last.outfits.length > 0) {
      return "¿Qué le cambiarías?";
    }
    return "Escríbele a tu asesor…";
  }

  return "Escríbele a tu asesor…";
}
