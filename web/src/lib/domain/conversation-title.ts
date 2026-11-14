// Título de una sesión para el panel de sesiones. Lo pone el servidor; la interfaz no lo calcula.

export const DEFAULT_CONVERSATION_TITLE = "Conversación";
const MAX = 40;

function clip(text: string): string {
  const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= MAX) return clean;
  const cut = clean.slice(0, MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 15 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:¿¡]+$/, "")}…`;
}

/** Título a partir del primer mensaje de la persona. Una foto sin texto se llama "Foto". */
export function titleFromFirstMessage(text: string, hasImage = false): string {
  const t = clip(text);
  if (t) return t.charAt(0).toUpperCase() + t.slice(1);
  return hasImage ? "Foto" : DEFAULT_CONVERSATION_TITLE;
}

/** Título a partir del evento entendido: "Matrimonio en Casablanca", "Asado". null si no hay tipo de evento. */
export function titleFromEvent(event: { kind?: string | null; place?: string | null }): string | null {
  const kind = (event.kind ?? "").trim();
  if (!kind) return null;
  const place = (event.place ?? "").trim();
  return clip(place ? `${kind} en ${place}` : kind);
}

/** Lo que se muestra: nunca vacío. */
export function displayTitle(stored: string | null | undefined): string {
  return clip(stored ?? "") || DEFAULT_CONVERSATION_TITLE;
}
