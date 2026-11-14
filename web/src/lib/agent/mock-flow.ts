import { hashString } from "@/lib/ai/mock";
import {
  DRESS_CODE_UNSPECIFIED,
  MAX_EVENT_QUESTIONS,
  parseDressCodeAnswer,
  parseEventText,
  parseTimeOfDayAnswer,
  targetFormality,
  type EventPatch,
} from "@/lib/domain/event-summary";
import type { ResolvedIntent } from "@/lib/domain/intents";
import { findSearchQuote } from "@/lib/domain/shopping";
import { CATEGORY_LABELS, type AgentToolName, type EventField, type EventSummary, type GarmentCategory, type MissingPiece, type Weather } from "@/lib/domain/types";
import type { ClosetItem } from "./tools";
import { EMPTY_CLOSET_TEXT, lookTitle, missingPieceText, planMockLooks, refineMockLook, type MockLooksPlan } from "./pick-outfit";

// Guion del asesor simulado para el recorrido que manda (PLAN_GENERAL §1): evento -> look(s) -> pieza faltante ->
// opciones de compra -> elegir, más el camino inverso ("quiero un look nuevo") y los botones de refinamiento.
// Es PURO: habla con el mundo solo a través de `MockEnv`, así que los tests lo corren con un entorno falso y verifican qué
// herramientas llama, en qué orden y con qué datos. En producción `MockEnv` usa las herramientas REALES (valida y persiste).

export type ToolResult = { content: string; isError: boolean };

export type MockEnv = {
  say(text: string): Promise<void>;
  replies(options: string[], multiple?: boolean): Promise<void>;
  tool(name: AgentToolName, input: unknown): Promise<ToolResult>;
  closet(): Promise<ClosetItem[]>;
  /** Ids de prendas de un look de la persona. */
  outfitItems(outfitId: string): Promise<string[]>;
  /** Pieza faltante de un look de la persona. */
  outfitMissing(outfitId: string): Promise<MissingPiece | null>;
  /** Estado del turno: lo que dejaron las herramientas. */
  event(): EventSummary | null;
  weather(): Weather | null;
  today: string;
};

export type FlowInput = {
  userText: string;
  intent: ResolvedIntent | null;
  eventQuestionsAsked: number;
  recentUserTexts: string[];
};

const parse = (content: string): Record<string, unknown> => {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const money = (n: number) => "$" + n.toLocaleString("es-CL");
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// --- Preguntas sobre el evento (D-01: una cosa por turno, con respuestas sugeridas) ---

export type EventQuestion = { text: string; options: string[] };

export function questionForEvent(field: EventField, event: EventSummary | null): EventQuestion {
  switch (field) {
    case "time_of_day":
      return { text: "Me falta una cosa para acertar: ¿el evento es de día o de noche? Cambia bastante qué te conviene.", options: ["De día", "De noche"] };
    case "dress_code":
      return {
        text: `Me falta una cosa para acertar: ¿qué dice la invitación sobre la vestimenta? Con eso decido entre algo relajado${event?.setting.venue === "outdoor" ? " de viña" : ""} o algo más de fiesta.`,
        options: ["Dice «formal de día»", "No dice nada", "Te mando la invitación"],
      };
    case "kind":
      return { text: "¿Qué tipo de plan es?", options: ["Matrimonio", "Cumpleaños", "Cena", "Reunión"] };
    case "date":
      return { text: "¿Para cuándo es?", options: ["Hoy", "Mañana", "Este sábado", "Este domingo"] };
    default:
      return { text: "¿Me cuentas un poco más del plan?", options: [] };
  }
}

/** Valores que el asesor supone en voz alta cuando ya preguntó lo máximo (D-01). */
function assumptionsFor(missing: EventField[], today: string): { patch: EventPatch; said: string[] } {
  const patch: EventPatch = {};
  const said: string[] = [];
  for (const f of missing) {
    if (f === "time_of_day") {
      patch.time_of_day = "day";
      said.push("que es de día");
    } else if (f === "dress_code") {
      patch.dress_code = DRESS_CODE_UNSPECIFIED;
      said.push("que la invitación no pide un código de vestir");
    } else if (f === "kind") {
      patch.kind = "Evento";
    } else if (f === "date") {
      patch.date = today;
      said.push("que es hoy");
    }
  }
  return { patch, said };
}

// --- Núcleo: del clima al look y a la oferta de compra ---

type LookFlowOpts = { event: EventSummary | null; formal: boolean; seedKey: string; texts: string[] };

async function runLooks(env: MockEnv, plan: Extract<MockLooksPlan, { kind: "pair" | "single" }>, ctx: { occasion: string }): Promise<{ ids: string[]; failed: boolean; missing_piece: MissingPiece | null }> {
  const ids: string[] = [];
  const propose = async (items: { id: string; name: string; category: GarmentCategory }[], variant: "seguro" | "atrevido" | undefined, missing: MissingPiece | null, why: string) => {
    const r = await env.tool("propose_outfit", {
      title: lookTitle(items),
      occasion: ctx.occasion,
      garment_ids: items.map((g) => g.id),
      rationale: why,
      ...(variant ? { variant } : {}),
      ...(missing ? { missing_piece: missing } : {}),
    });
    const id = parse(r.content).outfit_id;
    if (r.isError || typeof id !== "string") return false;
    ids.push(id);
    return true;
  };
  const names = (items: { name: string }[]) => items.map((g) => g.name.toLowerCase()).join(", ");

  if (plan.kind === "pair") {
    const a = await propose(
      plan.seguro,
      "seguro",
      null,
      `Es el más cercano a tu estilo de hoy: ${names(plan.seguro)}. Las prendas comparten formalidad y los colores se acompañan sin competir, así que se ve armado sin riesgo.`,
    );
    const b = a
      ? await propose(
          plan.atrevido,
          "atrevido",
          null,
          `Se acerca más a cómo te gustaría verte: ${names(plan.atrevido)}. Cambia varias prendas respecto del primero y arriesga un poco más en color o en corte, sin perder la formalidad.`,
        )
      : false;
    return { ids, failed: !a || !b, missing_piece: null };
  }
  const ok = await propose(
    plan.items,
    undefined,
    plan.missing_piece,
    `Combina ${names(plan.items)}. Las prendas comparten un nivel de formalidad parecido y los colores se acompañan sin competir, así que el conjunto se ve coherente y cómodo.${plan.missing_piece ? " Solo falta una pieza para cerrarlo." : ""}`,
  );
  return { ids, failed: !ok, missing_piece: plan.missing_piece };
}

/** Busca (o ofrece buscar) la pieza faltante del look. Devuelve true si mostró opciones. */
async function searchOrOffer(
  env: MockEnv,
  args: { outfitId: string | null; piece: MissingPiece; texts: string[]; authorization: "person_request" | "accepted_offer" | "refinement"; extra?: { max_price_clp?: number; color?: string; description?: string; quote?: string } },
): Promise<"shown" | "none" | "unavailable" | "failed"> {
  const r = await env.tool("search_products", {
    ...(args.outfitId ? { for_outfit_id: args.outfitId } : {}),
    slot: args.piece.category,
    description: args.extra?.description ?? args.piece.description,
    authorization: args.authorization,
    ...(args.authorization === "person_request" ? { quote: args.extra?.quote ?? findSearchQuote(args.texts) ?? "" } : {}),
    ...(args.extra?.max_price_clp ? { max_price_clp: args.extra.max_price_clp } : {}),
    ...(args.extra?.color ? { color: args.extra.color } : {}),
  });
  if (r.isError) return "failed";
  const out = parse(r.content);
  if (out.available === false) return "unavailable";
  if (out.found === 0) return "none";
  return "shown";
}

async function lookFlow(env: MockEnv, o: LookFlowOpts): Promise<void> {
  const event = o.event;
  await env.tool("get_weather", event ? { ...(event.place ? { place: event.place } : {}), ...(event.date ? { date: event.date } : {}) } : {});
  await env.tool("get_closet", {});
  const closet = await env.closet();
  const seed = hashString(o.seedKey);
  const plan = planMockLooks(closet, seed, env.weather(), {
    formal: o.formal,
    targetFormality: targetFormality(event),
    event: event !== null,
  });

  if (plan.kind === "empty") return env.say(EMPTY_CLOSET_TEXT);
  if (plan.kind === "missing_base") return env.say(missingPieceText(plan.piece));
  if (plan.kind === "single" && plan.items.length === 0) return env.say(EMPTY_CLOSET_TEXT);

  const occasion = [event?.kind, event?.setting.time_of_day === "day" ? "de día" : event?.setting.time_of_day === "night" ? "de noche" : null].filter(Boolean).join(" ") || "día a día";
  const res = await runLooks(env, plan, { occasion });
  if (res.failed) return env.say("No pude armar el look ahora. ¿Me lo pides de nuevo en un momento?");

  if (plan.kind === "pair") {
    await env.say(
      "Te dejé dos opciones para elegir: una segura, la más cercana a tu estilo de hoy, y otra un poco más atrevida. Cambian en varias prendas, así que mira cuál te representa más. Si quieres, ajusto cualquiera.",
    );
    return;
  }
  if (!res.missing_piece) {
    await env.say("Te armé esto con lo que ya tienes. Funciona porque las prendas tienen una formalidad parecida y los colores se complementan. Si quieres, lo ajusto.");
    return;
  }

  const piece = res.missing_piece;
  const outfitId = res.ids[0];
  await env.say(`Te armé lo mejor que se puede con lo que ya tienes. Te falta una sola pieza: ${CATEGORY_LABELS[piece.category].toLowerCase()}. ${piece.why} `);
  const quote = findSearchQuote(o.texts);
  if (quote) {
    // La persona ya pidió que buscara: no se le pregunta "¿te busco?".
    const r = await searchOrOffer(env, { outfitId, piece, texts: o.texts, authorization: "person_request", extra: { quote } });
    await sayAfterSearch(env, r, piece);
  } else {
    await env.tool("offer_search", { outfit_id: outfitId, slot: piece.category, description: piece.description });
    await env.say(`¿Te busco opciones de ${lower(CATEGORY_LABELS[piece.category])} que calcen con el look? Te muestro hasta tres, con tienda y precio, y tú decides.`);
  }
}

async function sayAfterSearch(env: MockEnv, r: "shown" | "none" | "unavailable" | "failed", piece: MissingPiece): Promise<void> {
  if (r === "shown") {
    await env.say(`Busqué ${lower(piece.description)} y te dejé las mejores opciones. Elige una y la ves puesta en el look; la compra la haces tú en la tienda.`);
  } else if (r === "none") {
    await env.say("No encontré opciones buenas con ese pedido. ¿Subimos el tope de precio o cambiamos el estilo?");
  } else if (r === "unavailable") {
    await env.say(`Por ahora no puedo buscar en tiendas. Lo que te serviría es ${lower(piece.description)}; búscalo en tu tienda de confianza y, si lo encuentras, mándame una foto y lo armamos.`);
  } else {
    await env.say("No pude buscar opciones ahora. ¿Me lo pides de nuevo en un momento?");
  }
}

// --- Caminos ---

async function askOrAssume(env: MockEnv, asked: number): Promise<"asked" | "ready"> {
  const ev = env.event();
  if (!ev || ev.missing.length === 0) return "ready";
  if (asked < MAX_EVENT_QUESTIONS) {
    const q = questionForEvent(ev.missing[0], ev);
    await env.say(q.text);
    if (q.options.length) await env.replies(q.options);
    return "asked";
  }
  const { patch, said } = assumptionsFor(ev.missing, env.today);
  await env.tool("set_event_summary", patch);
  if (said.length) await env.say(`Supongo ${said.join(" y ")}; corrígeme si no. `);
  return "ready";
}

/** Camino 1: la persona cuenta un evento. */
export async function eventFlow(env: MockEnv, input: FlowInput): Promise<void> {
  await env.say("Qué buen panorama. Esto es lo que entendí; toca cualquier dato si me equivoqué. ");
  const r = await env.tool("set_event_summary", { ...parseEventText(input.userText, env.today), new_event: true });
  if (r.isError) return env.say("No logré entender bien el plan. ¿Me cuentas de nuevo qué evento es y cuándo?");
  if ((await askOrAssume(env, input.eventQuestionsAsked)) === "asked") return;
  await finishEvent(env, input);
}

/** Camino 1b: responde la pregunta pendiente. */
export async function eventAnswerFlow(env: MockEnv, input: FlowInput): Promise<void> {
  const ev = env.event();
  const target = ev?.missing[0];
  const patch: EventPatch = parseEventText(input.userText, env.today);
  // La respuesta a la pregunta pendiente manda sobre lo que se pueda leer suelto en el mensaje.
  if (target === "dress_code") patch.dress_code = parseDressCodeAnswer(input.userText) ?? patch.dress_code ?? DRESS_CODE_UNSPECIFIED;
  if (target === "time_of_day") patch.time_of_day = parseTimeOfDayAnswer(input.userText) ?? patch.time_of_day ?? "day";
  if (target === "date" && !patch.date) patch.date = env.today;
  if (target === "kind" && !patch.kind) patch.kind = input.userText.trim().slice(0, 40) || "Evento";
  const r = await env.tool("set_event_summary", patch);
  if (r.isError) return env.say("No pude anotar eso. ¿Me lo dices de otra forma?");
  if ((await askOrAssume(env, input.eventQuestionsAsked)) === "asked") return;
  const ev2 = env.event();
  const code = ev2?.dress_code;
  const lead =
    code && code !== DRESS_CODE_UNSPECIFIED
      ? `Perfecto. ${code[0].toUpperCase()}${code.slice(1)}${ev2?.setting.venue === "outdoor" ? " al aire libre" : ""} es elegante pero cómodo. Déjame ver qué tienes. `
      : "Perfecto, con eso me alcanza. Déjame ver qué tienes. ";
  await env.say(lead);
  await finishEvent(env, input);
}

async function finishEvent(env: MockEnv, input: FlowInput): Promise<void> {
  const ev = env.event();
  const target = targetFormality(ev);
  await lookFlow(env, {
    event: ev,
    formal: (target ?? 0) >= 4,
    seedKey: `${ev?.kind ?? ""}|${ev?.date ?? ""}|${ev?.place ?? ""}`,
    texts: input.recentUserTexts,
  });
}

/** "¿Qué me pongo?" sin evento (día normal): el mismo núcleo, sin preguntas. */
export async function dayLookFlow(env: MockEnv, input: FlowInput, formal: boolean, intro = "Dame un segundo, reviso tu clóset. "): Promise<void> {
  await env.say(intro);
  await lookFlow(env, { event: null, formal, seedKey: input.userText || "inicio", texts: input.recentUserTexts });
}

/** Camino 2: "quiero un look nuevo". Parte por lo que quiere comprar y después lo amarra al clóset (D-13). */
export async function newLookFlow(env: MockEnv, input: FlowInput, piece: GarmentCategory | null): Promise<void> {
  if (!piece) {
    await env.say("Partamos por lo que quieres sumar: te ayudo a buscarlo y después lo amarramos con lo que ya tienes. ¿Qué te gustaría?");
    await env.replies(["Quiero unos zapatos nuevos", "Quiero un blazer nuevo", "Quiero un vestido nuevo", "Quiero un bolso nuevo"]);
    return;
  }
  await env.say(`Dale, partimos por lo nuevo. Miro tu clóset solo para avisarte si ya tienes algo parecido y ver qué lo completa. `);
  await env.tool("get_closet", {});
  const closet = await env.closet();
  const label = CATEGORY_LABELS[piece].toLowerCase();
  const equivalent = closet.find((g) => g.category === piece);
  if (equivalent) await env.say(`Ojo: ya tienes ${equivalent.name.toLowerCase()}; igual te busco opciones por si quieres algo distinto. `);

  const plan = planMockLooks(closet, hashString(input.userText), env.weather(), { exclude: piece });
  const wanted: MissingPiece = {
    category: piece,
    description: input.userText.replace(/^(quiero|necesito|busco|me gustar[ií]a)\s+/i, "").replace(/[.!?]+$/, "").trim() || label,
    why: `Es lo que quieres sumar, y con lo que ya tienes se arma un look completo.`,
  };
  let outfitId: string | null = null;
  if (plan.kind === "single" && plan.items.length >= 2) {
    const names = plan.items.map((g) => g.name.toLowerCase()).join(", ");
    const r = await env.tool("propose_outfit", {
      title: lookTitle(plan.items),
      occasion: "look nuevo",
      garment_ids: plan.items.map((g) => g.id),
      rationale: `Con lo que ya tienes (${names}) se arma la base del look; lo nuevo que buscas lo completa.`,
      missing_piece: wanted,
    });
    const id = parse(r.content).outfit_id;
    if (!r.isError && typeof id === "string") outfitId = id;
  }
  const quote = findSearchQuote([input.userText, ...input.recentUserTexts]);
  const result = await searchOrOffer(env, { outfitId, piece: wanted, texts: [input.userText, ...input.recentUserTexts], authorization: "person_request", extra: quote ? { quote } : undefined });
  await sayAfterSearch(env, result, wanted);
}

/** Camino 3: botones de refinamiento y de la oferta. */
export async function intentFlow(env: MockEnv, input: FlowInput): Promise<void> {
  const resolved = input.intent;
  if (!resolved) return;
  const { intent, facts } = resolved;

  if (intent.kind === "decline_search") {
    await env.say("Dale, lo dejamos así. Si más adelante quieres que busque, me dices.");
    return;
  }

  if (intent.kind === "accept_search") {
    const piece = (await env.outfitMissing(intent.outfit_id)) ?? { category: intent.slot, description: facts.missing_description ?? CATEGORY_LABELS[intent.slot], why: "" };
    const r = await searchOrOffer(env, { outfitId: intent.outfit_id, piece, texts: input.recentUserTexts, authorization: "accepted_offer" });
    await sayAfterSearch(env, r, piece);
    return;
  }

  if (intent.kind === "refine_search") {
    if (intent.change === "dismiss") {
      await env.say("Entendido, ninguna te convenció. ¿Qué cambiarías?");
      await env.replies(["Más baratas", "Otro color", "Otro estilo", "Nada, gracias"]);
      return;
    }
    const slot = facts.slot ?? "shoes";
    const prices = facts.shown_prices ?? [];
    const base = facts.search_query?.split(" · ")[0] ?? CATEGORY_LABELS[slot].toLowerCase();
    const piece: MissingPiece = { category: slot, description: base, why: "" };
    const extra: { max_price_clp?: number; color?: string; description?: string } = {};
    if (intent.change === "cheaper") extra.max_price_clp = prices.length ? Math.max(1000, Math.max(...prices) - 1) : 40000;
    if (intent.change === "other_color") extra.color = "negro";
    if (intent.change === "lower_heel") extra.description = `${base} de taco bajo`;
    if (intent.change === "other_style") extra.description = `${base} clásico`;
    const r = await searchOrOffer(env, { outfitId: facts.for_outfit_id ?? null, piece, texts: input.recentUserTexts, authorization: "refinement", extra });
    if (r === "shown") {
      const note = intent.change === "cheaper" ? `Más baratas: todas bajo ${money(extra.max_price_clp ?? 0)}.` : "Aquí van otras, con el ajuste que pediste.";
      await env.say(`${note} Si te gusta una, elígela y la ves puesta en el look.`);
    } else await sayAfterSearch(env, r, piece);
    return;
  }

  // refine_outfit
  await env.tool("get_closet", {});
  const closet = await env.closet();
  const prev = await env.outfitItems(intent.outfit_id);
  const ids = refineMockLook(closet, prev, intent.change, intent.garment_id);
  if (!ids) {
    await env.say("Con lo que tienes en el clóset no me sale otra combinación válida para ese cambio. Si quieres, probamos otra cosa o buscamos una pieza nueva.");
    return;
  }
  const items = ids.map((id) => closet.find((g) => g.id === id)).filter((g): g is ClosetItem => Boolean(g));
  const r = await env.tool("propose_outfit", {
    title: lookTitle(items),
    occasion: facts.outfit_occasion || "día a día",
    garment_ids: ids,
    rationale: `Ajusté el look como pediste (${intent.change.replace("_", " ")}): ${items.map((g) => g.name.toLowerCase()).join(", ")}. Mantiene la ocasión y los colores se siguen acompañando.`,
  });
  await env.say(r.isError ? "No pude armar el ajuste ahora. ¿Me lo pides de nuevo en un momento?" : "Listo, te dejé el look ajustado. El anterior sigue ahí por si prefieres volver.");
}

