import { z } from "zod";
import { GARMENT_CATEGORIES, OUTFIT_CHANGES, SEARCH_CHANGES, type ChatIntent, type GarmentCategory } from "./types";

/** Forma exacta que acepta `POST /api/chat` en `intent`. Solo ids y enumeraciones. */
export const ChatIntentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("refine_outfit"), outfit_id: z.string().uuid(), change: z.enum(OUTFIT_CHANGES), garment_id: z.string().uuid().optional() }).strict(),
  z.object({ kind: z.literal("refine_search"), block_id: z.string().uuid(), change: z.enum(SEARCH_CHANGES) }).strict(),
  z.object({ kind: z.literal("accept_search"), outfit_id: z.string().uuid(), slot: z.enum(GARMENT_CATEGORIES) }).strict(),
  z.object({ kind: z.literal("decline_search"), outfit_id: z.string().uuid(), slot: z.enum(GARMENT_CATEGORIES) }).strict(),
]) satisfies z.ZodType<ChatIntent>;

/** Datos verificados en el servidor sobre lo que apunta el intent (títulos, precios...). */
export type IntentFacts = {
  outfit_title?: string;
  /** Ocasión del look original: el ajuste la conserva. */
  outfit_occasion?: string;
  garment_name?: string;
  missing_description?: string;
  slot?: GarmentCategory;
  search_query?: string;
  shown_prices?: number[];
  budget_max_clp?: number | null;
  /** Para `refine_search`: look al que completa el bloque. */
  for_outfit_id?: string | null;
};

export type ResolvedIntent = { intent: ChatIntent; facts: IntentFacts };

const OUTFIT_CHANGE_TEXT: Record<(typeof OUTFIT_CHANGES)[number], string> = {
  more_formal: "una versión más formal",
  less_formal: "una versión más relajada",
  other_color: "el mismo look en otra combinación de colores",
  warmer: "una versión más abrigada",
  lighter: "una versión más fresca",
  swap_garment: "cambiar esa prenda por otra del clóset",
  drop_garment: "el look sin esa prenda (si sigue siendo válido)",
};

const SEARCH_CHANGE_TEXT: Record<(typeof SEARCH_CHANGES)[number], string> = {
  cheaper: "opciones más baratas",
  other_color: "otro color",
  other_style: "otro estilo",
  lower_heel: "un taco más bajo",
  dismiss: "no le interesa ninguna de las opciones mostradas",
};

const clp = (n: number) => `$${n.toLocaleString("es-CL")}`;

/**
 * Bloque que recibe el asesor cuando la persona tocó un botón. Lo escribe el servidor (no es texto de la persona ni de
 * un tercero): es la única vía en que un `intent` llega al modelo. Pura.
 */
export function renderIntentBlock(r: ResolvedIntent): string {
  const { intent, facts } = r;
  const lines = ["<intencion_de_la_persona origen=\"boton\">", JSON.stringify(intent)];
  switch (intent.kind) {
    case "refine_outfit":
      lines.push(
        `La persona pidió ${OUTFIT_CHANGE_TEXT[intent.change]} del look "${facts.outfit_title ?? "anterior"}"${facts.garment_name ? `, sobre "${facts.garment_name}"` : ""}.`,
        `Propón UN look nuevo con propose_outfit (sin variant), para la misma ocasión${facts.outfit_occasion ? ` ("${facts.outfit_occasion}")` : ""}, usando solo prendas de get_closet. El anterior queda como estaba.`,
      );
      break;
    case "refine_search":
      lines.push(
        `La persona pidió para la búsqueda de ${facts.slot ?? "la pieza"} ("${facts.search_query ?? ""}"): ${SEARCH_CHANGE_TEXT[intent.change]}.`,
        facts.shown_prices?.length ? `Precios mostrados: ${facts.shown_prices.map(clp).join(", ")}.` : "",
        intent.change === "dismiss"
          ? "No busques de nuevo: reconoce que no sirvieron y pregunta, en una frase y con suggest_replies, qué cambiaría."
          : "Busca de nuevo con search_products (authorization: refinement), ajustando la descripción o el tope de precio según el pedido.",
      );
      break;
    case "accept_search":
      lines.push(
        `La persona aceptó que busques opciones para ${facts.slot ?? intent.slot} del look "${facts.outfit_title ?? ""}"${facts.missing_description ? `: ${facts.missing_description}` : ""}.`,
        "Busca con search_products (authorization: accepted_offer). Si te falta presupuesto o talla y cambia el resultado, pregunta UNA cosa antes.",
      );
      break;
    case "decline_search":
      lines.push(
        `La persona prefirió no buscar opciones para ${facts.slot ?? intent.slot} por ahora.`,
        "No busques. Acéptalo en una frase y, si corresponde, propón la segunda mejor combinación con lo que ya tiene.",
      );
      break;
  }
  lines.push("</intencion_de_la_persona>");
  return lines.filter(Boolean).join("\n");
}

/** Una línea para el historial: qué botón tocó la persona. */
export function intentHistoryLine(intent: ChatIntent): string {
  switch (intent.kind) {
    case "refine_outfit":
      return `[Tocó un botón para ajustar el look: ${intent.change}]`;
    case "refine_search":
      return `[Tocó un botón para ajustar la búsqueda: ${intent.change}]`;
    case "accept_search":
      return `[Aceptó que busques opciones para: ${intent.slot}]`;
    case "decline_search":
      return `[Prefirió no buscar opciones para: ${intent.slot}]`;
  }
}
