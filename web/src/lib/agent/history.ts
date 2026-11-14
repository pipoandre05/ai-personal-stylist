import type Anthropic from "@anthropic-ai/sdk";

export const HISTORY_LIMIT = 20;

/** Mensaje sintético cuando la conversación empieza con el asesor (la API exige que el primero sea de la persona). */
export const START_MARKER = "<inicio_conversacion/>";
export const CONTINUE_MARKER = "<continuacion/>";

type Block = Anthropic.Beta.BetaContentBlockParam;

export type StoredMessage = {
  role: "user" | "assistant";
  text: string;
  outfitTitles: string[];
  imagePaths: string[];
  /** Lo que el asistente mostró y el texto no dice (resumen del evento, opciones de compra, ofertas): una línea por cosa. */
  notes?: string[];
  /** Botón que tocó la persona en este mensaje (línea ya renderizada). */
  intentLine?: string;
};

export type CurrentImage = { path: string; block: Anthropic.Beta.BetaImageBlockParam | null };

/**
 * Convierte mensajes guardados en `MessageParam[]`. Pura.
 * - El historial debe empezar con un mensaje de la persona: si empieza con el asesor se antepone un marcador.
 * - Los looks propuestos se anotan en el texto del asistente: sin eso el modelo no sabe a qué look se refiere "el segundo".
 * - Las fotos antiguas no se reenvían (costo; las selfies se borran): quedan como una línea con su `image_path`.
 *   La foto del turno actual viaja como bloque de imagen más su referencia interna.
 * - Mensajes vacíos se descartan (la API los rechaza).
 */
export function toMessageParams(
  stored: StoredMessage[],
  contextBlock: string,
  opts: {
    truncated?: boolean;
    current?: CurrentImage | null;
    /** Bloques del sistema para el último mensaje de la persona (evento actual, intención verificada). */
    turnBlocks?: string[];
  } = {},
): Anthropic.Beta.BetaMessageParam[] {
  const lastIndex = stored.length - 1;
  const entries: { role: "user" | "assistant"; blocks: Block[] }[] = [];

  stored.forEach((m, index) => {
    const blocks: Block[] = [];
    const isCurrent = index === lastIndex && m.role === "user" && opts.current && m.imagePaths.includes(opts.current.path);
    if (isCurrent && opts.current) {
      if (opts.current.block) blocks.push(opts.current.block);
      blocks.push({ type: "text", text: `Referencia interna de la foto (image_path): ${opts.current.path}` });
    }
    const older = m.imagePaths.filter((p) => !(isCurrent && p === opts.current?.path));
    for (const p of older) blocks.push({ type: "text", text: `[Foto enviada, image_path: ${p}]` });
    const text = m.text.trim();
    if (text) blocks.push({ type: "text", text });
    if (m.role === "user" && m.intentLine) blocks.push({ type: "text", text: m.intentLine });
    if (m.role === "assistant") {
      for (const title of m.outfitTitles) blocks.push({ type: "text", text: `[Propuse el look "${title}"]` });
      for (const note of m.notes ?? []) blocks.push({ type: "text", text: note });
    }
    if (blocks.length) entries.push({ role: m.role, blocks });
  });

  if (entries.length === 0) {
    entries.push({ role: "user", blocks: [{ type: "text", text: START_MARKER }] });
  } else if (entries[0].role === "assistant") {
    entries.unshift({ role: "user", blocks: [{ type: "text", text: opts.truncated ? CONTINUE_MARKER : START_MARKER }] });
  }
  entries[0].blocks.unshift({ type: "text", text: contextBlock });
  // Lo que cambia en cada turno va al final, después del prefijo cacheable (contexto de la persona).
  const last = entries[entries.length - 1];
  if (opts.turnBlocks?.length && last.role === "user") {
    for (const text of opts.turnBlocks) last.blocks.push({ type: "text", text });
  }

  return entries.map(({ role, blocks }) => ({
    role,
    content: blocks.length === 1 && blocks[0].type === "text" ? blocks[0].text : blocks,
  }));
}
