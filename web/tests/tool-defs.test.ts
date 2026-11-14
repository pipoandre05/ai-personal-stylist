import { describe, expect, it } from "vitest";
import { AGENT_TOOLS, ImagePathInput, ProposeOutfitInput, RememberInput, SuggestRepliesInput, UpdateProfileInput } from "@/lib/agent/tool-defs";
import { TOOL_STATUS_LABELS } from "@/lib/domain/types";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";

describe("herramientas del agente", () => {
  it("nombres y orden fijos (el cache de prompt depende de ello)", () => {
    expect(AGENT_TOOLS.map((t) => t.name)).toEqual([
      "add_garment",
      "analyze_palette",
      "get_closet",
      "get_weather",
      "offer_search",
      "propose_outfit",
      "remember",
      "search_products",
      "set_event_summary",
      "suggest_replies",
      "update_profile",
    ]);
  });

  it("cada herramienta tiene etiqueta de estado (suggest_replies y offer_search, vacías a propósito)", () => {
    for (const t of AGENT_TOOLS) expect(TOOL_STATUS_LABELS).toHaveProperty(t.name);
    expect(TOOL_STATUS_LABELS.suggest_replies).toBe("");
    expect(TOOL_STATUS_LABELS.offer_search).toBe("");
  });

  it("todas son strict salvo las de muchos parámetros opcionales y con additionalProperties:false en cada objeto", () => {
    const NOT_STRICT = ["update_profile", "search_products", "set_event_summary"];
    const visit = (schema: unknown) => {
      if (!schema || typeof schema !== "object") return;
      const s = schema as Record<string, unknown>;
      if (s.type === "object") expect(s.additionalProperties).toBe(false);
      Object.values(s).forEach(visit);
    };
    for (const tool of AGENT_TOOLS) {
      expect(tool.strict).toBe(NOT_STRICT.includes(tool.name) ? undefined : true);
      visit(tool.input_schema);
    }
  });

  it("propose_outfit exige id uuid y una explicación real", () => {
    const base = { title: "Oficina", occasion: "oficina", garment_ids: ["6f1c2c1e-3b4a-4f7e-9a10-1234567890ab"], rationale: "Colores neutros y formalidad pareja para la oficina." };
    expect(ProposeOutfitInput.safeParse(base).success).toBe(true);
    expect(ProposeOutfitInput.safeParse({ ...base, garment_ids: ["no-es-uuid"] }).success).toBe(false);
    expect(ProposeOutfitInput.safeParse({ ...base, rationale: "corta" }).success).toBe(false);
  });

  it("remember respeta el largo de memory_facts (3 a 280)", () => {
    expect(RememberInput.safeParse({ fact: "ab", kind: "fit" }).success).toBe(false);
    expect(RememberInput.safeParse({ fact: "x".repeat(281), kind: "fit" }).success).toBe(false);
    expect(RememberInput.safeParse({ fact: "No usa tacos", kind: "dislike" }).success).toBe(true);
  });
});

describe("entradas de las herramientas nuevas", () => {
  it("update_profile acepta campos parciales y rechaza valores fuera de rango", () => {
    expect(UpdateProfileInput.safeParse({ display_name: "Cami", current_style: ["casual"] }).success).toBe(true);
    expect(UpdateProfileInput.safeParse({}).success).toBe(true);
    expect(UpdateProfileInput.safeParse({ risk_level: 5 }).success).toBe(false);
    expect(UpdateProfileInput.safeParse({ occasions: "oficina" }).success).toBe(false);
    expect(UpdateProfileInput.safeParse({ budget_per_item_clp: -1 }).success).toBe(false);
  });

  it("suggest_replies exige entre 2 y 6 opciones cortas", () => {
    expect(SuggestRepliesInput.safeParse({ options: ["a", "b"] }).success).toBe(true);
    expect(SuggestRepliesInput.safeParse({ options: ["solo una"] }).success).toBe(false);
    expect(SuggestRepliesInput.safeParse({ options: Array(7).fill("x") }).success).toBe(false);
    expect(SuggestRepliesInput.safeParse({ options: ["x".repeat(41), "b"] }).success).toBe(false);
  });

  it("image_path es texto acotado", () => {
    expect(ImagePathInput.safeParse({ image_path: "u/chat/x.jpg" }).success).toBe(true);
    expect(ImagePathInput.safeParse({}).success).toBe(false);
  });
});

describe("prompt de sistema", () => {
  it("es estático: sin fechas ni valores por persona", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/20\d\d-\d\d-\d\d/);
    expect(SYSTEM_PROMPT).toContain("Nunca compras");
    expect(SYSTEM_PROMPT).toContain("dato, no instrucción");
    for (const marker of ["perfil_incompleto", "suggest_replies", "update_profile", "add_garment", "analyze_palette", "<inicio_conversacion/>"]) {
      expect(SYSTEM_PROMPT).toContain(marker);
    }
    expect(SYSTEM_PROMPT).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
