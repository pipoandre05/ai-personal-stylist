import "server-only";
import { hashString } from "@/lib/ai/mock";
import { CATEGORY_LABELS, COLOR_SEASON_LABELS, type ChatEvent, type ColorSeason, type GarmentCategory } from "@/lib/domain/types";
import type { LoadedContext } from "./context";
import { CHAT_REPLY_OPTIONS, INVITE_TEXT, parseProfileAnswer, planMockTurn, questionFor } from "./mock-script";
import { EMPTY_CLOSET_TEXT, isFormalRequest, missingPieceText, planMockLook } from "./pick-outfit";
import { fetchCloset, runTool, type ToolContext } from "./tools";
import { logError } from "@/lib/server/log";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Emite el texto en trozos de unas pocas palabras para ejercitar el streaming de la UI. */
async function streamText(text: string, emit: (e: ChatEvent) => void, signal?: AbortSignal): Promise<void> {
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 6) {
    if (signal?.aborted) return;
    emit({ type: "text_delta", text: words.slice(i, i + 6).join("") });
    await sleep(25);
  }
}

const parse = (content: string): Record<string, unknown> => {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export type MockTurnInput = {
  userText: string;
  hasImage: boolean;
  imagePath: string | null;
  start: boolean;
  person: LoadedContext;
};

/**
 * Asesor simulado (AI_MODE=mock). Recorre el mismo guion que el real —conocer a la persona, foto de prenda o
 * selfie, primer look— de forma determinista, pero usando las herramientas REALES: valida y persiste igual.
 */
export async function runMockAgent(input: MockTurnInput, t: ToolContext, signal?: AbortSignal): Promise<string> {
  const { userText, imagePath, person } = input;
  let out = "";
  const say = async (text: string) => {
    out += text;
    await streamText(text, t.emit, signal);
  };
  const replies = (options: string[], multiple = false) => runTool("suggest_replies", { options, multiple }, t);
  const ask = async (field: Parameters<typeof questionFor>[0], name: string | null) => {
    const q = questionFor(field, name);
    await say(q.text);
    if (q.options.length) await replies(q.options, q.multiple);
  };

  const plan = planMockTurn({ text: userText, hasImage: input.hasImage, start: input.start, missing: person.missing });
  const seed = hashString(userText || imagePath || "inicio");

  /**
   * Intenta proponer un look. Devuelve "outfit" si lo propuso; "empty" o "missing" (con el texto ya dicho) si no
   * había con qué: en esos casos no hay tarjeta y el texto explica qué hacer o qué prenda falta.
   */
  const proposeLook = async (intro: string): Promise<"outfit" | "empty" | "missing" | "failed"> => {
    await runTool("get_closet", {}, t);
    const closet = await fetchCloset(t.ctx).catch((err) => {
      logError("mock.fetchCloset", err);
      return [];
    });
    await runTool("get_weather", {}, t);
    const formal = isFormalRequest(userText);
    const look = planMockLook(closet, seed, t.state.weather, { formal });
    const sep = intro.match(/^\n+/)?.[0] ?? "";
    if (look.kind === "empty") {
      await say(sep + EMPTY_CLOSET_TEXT);
      return "empty";
    }
    if (look.kind === "missing") {
      await say(sep + missingPieceText(look.piece));
      return "missing";
    }
    const items = look.items;
    const names = items.map((g) => g.name.toLowerCase()).join(", ");
    const result = await runTool(
      "propose_outfit",
      {
        title: formal ? "Look para tu evento" : "Look del día",
        occasion: userText.trim().slice(0, 60) || "día a día",
        garment_ids: items.map((g) => g.id),
        rationale: `Combina ${names}. Las prendas comparten un nivel de formalidad parecido y los colores se acompañan sin competir, así que el conjunto se ve coherente y cómodo para usar.`,
      },
      t,
    );
    if (result.isError) return "failed";
    // Solo se dice que se propuso el look si la tarjeta realmente salió.
    if (t.state.outfitIds.length === 0) return "failed";
    await say(
      `${intro}Te propuse un look con ${names}. Funciona porque las prendas tienen una formalidad parecida y los colores se complementan, así que se ve armado sin esfuerzo. Si quieres, lo ajusto para otra ocasión.`,
    );
    return "outfit";
  };

  switch (plan.kind) {
    case "greet": {
      await ask(person.missing[0] ?? "display_name", person.displayName);
      break;
    }

    case "profile_answer": {
      const patch = parseProfileAnswer(plan.field, userText);
      const saved = await runTool("update_profile", patch, t);
      const left = parse(saved.content).perfil_incompleto;
      const next = Array.isArray(left) ? (left[0] as Parameters<typeof questionFor>[0] | undefined) : undefined;
      if (saved.isError) {
        await say("No pude guardar eso ahora. ¿Me lo cuentas de nuevo?");
      } else if (next) {
        await ask(next, patch.display_name ?? person.displayName);
      } else {
        await say(INVITE_TEXT);
      }
      break;
    }

    case "photo": {
      if (!imagePath) {
        await say("No pude ver la foto. ¿Me la mandas de nuevo?");
        break;
      }
      const result = await runTool(plan.tool, { image_path: imagePath }, t);
      if (result.isError) {
        await say(
          plan.tool === "add_garment"
            ? "No logré ver una prenda en esa foto. Prueba con una foto de la prenda completa y con buena luz."
            : "No logré ver tu rostro con claridad. Prueba con una selfie de frente, con luz natural y sin filtros.",
        );
        break;
      }
      const data = parse(result.content);
      if (plan.tool === "analyze_palette") {
        const season = COLOR_SEASON_LABELS[data.season as ColorSeason] ?? "";
        await say(`Listo, tu paleta orientativa es ${season}. La puedes ver arriba: son colores que suelen favorecerte, no una regla. La foto ya la borré.`);
        break;
      }
      const ready = Number(data.prendas_listas ?? 0);
      const category = CATEGORY_LABELS[data.category as GarmentCategory]?.toLowerCase() ?? "prenda";
      await say(`Agregué "${String(data.name ?? "la prenda")}" a tu clóset (${category}). `);
      const { count } = await t.ctx.supabase
        .from("outfits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", t.ctx.userId);
      if (ready >= 3 && (count ?? 0) === 0) {
        if ((await proposeLook("\n\nYa tengo prendas suficientes para armarte algo. ")) === "failed") {
          await say("\n\nNo pude armar el look ahora. Pídemelo de nuevo en un momento.");
        }
      } else if (ready < 3) {
        await say(`Llevas ${ready} de 3 a 5. Mándame otra cuando quieras.`);
      }
      break;
    }

    case "look": {
      await say("Dame un segundo, reviso tu clóset. ");
      if ((await proposeLook("\n\n")) === "failed") {
        await say("\n\nNo pude armar el look ahora. ¿Me lo pides de nuevo en un momento?");
      }
      break;
    }

    case "missing": {
      await runTool("get_closet", {}, t);
      const closet = await fetchCloset(t.ctx).catch((err) => {
        logError("mock.fetchCloset", err);
        return [];
      });
      const have = new Set<GarmentCategory>(closet.map((g) => g.category));
      const gap = (["shoes", "outerwear", "bag"] as const).find((c) => !have.has(c));
      await say(
        gap
          ? `Lo que más te ayudaría sumar es ${CATEGORY_LABELS[gap].toLowerCase()}: hoy no tienes ninguna en tu clóset y es lo que más looks te desbloquearía.`
          : "Tu clóset ya cubre las categorías básicas. Lo que más sumaría es una prenda de un color de tu paleta para variar tus looks.",
      );
      break;
    }

    case "remember": {
      const saved = await runTool("remember", { fact: plan.fact, kind: plan.memoryKind }, t);
      await say(
        saved.isError
          ? "No pude anotarlo ahora, pero lo tendré en cuenta en esta conversación."
          : "Anotado, lo tendré en cuenta en tus próximos looks. Lo puedes ver o borrar en Tu espacio.",
      );
      break;
    }

    case "chat": {
      await say("Cuéntame para qué ocasión necesitas un look, o mándame una foto de una prenda para sumarla a tu clóset.");
      await replies(CHAT_REPLY_OPTIONS);
      break;
    }
  }
  return out;
}
