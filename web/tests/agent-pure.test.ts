import { describe, expect, it } from "vitest";
import { toMessageParams } from "@/lib/agent/history";
import { EMPTY_CLOSET_TEXT, isFormalRequest, missingPieceText, pickMockOutfit, planMockLook } from "@/lib/agent/pick-outfit";
import { planMockTurn } from "@/lib/agent/mock-script";
import { validateOutfitComposition } from "@/lib/domain/outfit-rules";
import { parseForecast, describeWeatherCode } from "@/lib/weather";
import { fmtCLP, fmtDate, fmtDateOnly, startOfTodayInSantiagoISO, todayInSantiago } from "@/lib/format";
import type { GarmentCategory } from "@/lib/domain/types";

const item = (id: string, category: GarmentCategory) => ({ id, name: `${category} ${id}`, category, formality: 2, favorite: false });

describe("historial del agente", () => {
  it("antepone el contexto y un marcador cuando el asesor abre la conversación", () => {
    const out = toMessageParams(
      [
        { role: "assistant", text: "Hola, ¿en qué te ayudo?", outfitTitles: [], imagePaths: [] },
        { role: "user", text: "¿Qué me pongo?", outfitTitles: [], imagePaths: [] },
        { role: "assistant", text: "Te propongo esto.", outfitTitles: ["Oficina"], imagePaths: [] },
        { role: "user", text: "Otro, por favor", outfitTitles: [], imagePaths: [] },
      ],
      "<contexto_persona>x</contexto_persona>",
    );
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant", "user"]);
    expect(out[0].content).toEqual([
      { type: "text", text: "<contexto_persona>x</contexto_persona>" },
      { type: "text", text: "<inicio_conversacion/>" },
    ]);
    expect(out[1].content).toBe("Hola, ¿en qué te ayudo?");
    expect(out[3].content).toEqual([
      { type: "text", text: "Te propongo esto." },
      { type: "text", text: '[Propuse el look "Oficina"]' },
    ]);
  });

  it("descarta mensajes vacíos y conserva asistentes que solo propusieron un look", () => {
    const out = toMessageParams(
      [
        { role: "user", text: "Hola", outfitTitles: [], imagePaths: [] },
        { role: "assistant", text: "", outfitTitles: [], imagePaths: [] },
        { role: "assistant", text: "", outfitTitles: ["Cita"], imagePaths: [] },
      ],
      "ctx",
    );
    expect(out).toHaveLength(2);
    expect(out[1].content).toBe('[Propuse el look "Cita"]');
  });

  it("sin mensajes (saludo inicial) genera solo el marcador con el contexto", () => {
    const out = toMessageParams([], "ctx");
    expect(out).toEqual([
      { role: "user", content: [{ type: "text", text: "ctx" }, { type: "text", text: "<inicio_conversacion/>" }] },
    ]);
  });

  it("si el historial se recortó usa un marcador de continuación", () => {
    const out = toMessageParams(
      [
        { role: "assistant", text: "algo", outfitTitles: [], imagePaths: [] },
        { role: "user", text: "ok", outfitTitles: [], imagePaths: [] },
      ],
      "ctx",
      { truncated: true },
    );
    expect(JSON.stringify(out[0].content)).toContain("<continuacion/>");
  });

  it("la foto actual viaja como imagen con su referencia; las antiguas, solo como referencia", () => {
    const block = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AAAA" } } as const;
    const out = toMessageParams(
      [
        { role: "user", text: "mira esta", outfitTitles: [], imagePaths: ["u/chat/vieja.jpg"] },
        { role: "assistant", text: "Listo", outfitTitles: [], imagePaths: [] },
        { role: "user", text: "¿y esta?", outfitTitles: [], imagePaths: ["u/chat/nueva.jpg"] },
      ],
      "ctx",
      { current: { path: "u/chat/nueva.jpg", block } },
    );
    expect(JSON.stringify(out[0].content)).toContain("[Foto enviada, image_path: u/chat/vieja.jpg]");
    expect(JSON.stringify(out[0].content)).not.toContain("AAAA");
    expect(out[2].content).toEqual([
      block,
      { type: "text", text: "Referencia interna de la foto (image_path): u/chat/nueva.jpg" },
      { type: "text", text: "¿y esta?" },
    ]);
  });
});

describe("selección del agente simulado", () => {
  const closet = [item("t", "top"), item("b", "bottom"), item("s", "shoes"), item("o", "outerwear"), item("d", "dress")];

  it("siempre produce looks que cumplen la regla de composición", () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const weather of [null, { temp_min: 6 }, { temp_min: 20 }]) {
        const picked = pickMockOutfit(closet, seed, weather);
        expect(picked).not.toBeNull();
        expect(validateOutfitComposition(picked!)).toEqual({ ok: true });
      }
    }
  });

  it("abriga cuando hace frío y no cuando hace calor", () => {
    const cold = pickMockOutfit(closet, 1, { temp_min: 5 })!;
    const warm = pickMockOutfit(closet, 1, { temp_min: 22 })!;
    expect(cold.some((g) => g.category === "outerwear")).toBe(true);
    expect(warm.some((g) => g.category === "outerwear")).toBe(false);
  });

  it("devuelve null si el clóset no alcanza", () => {
    expect(pickMockOutfit([], 0, null)).toBeNull();
    expect(pickMockOutfit([item("t", "top")], 0, null)).toBeNull();
    expect(pickMockOutfit([item("d", "dress")], 0, null)).toBeNull();
    expect(pickMockOutfit([item("t", "top"), item("s", "shoes")], 0, null)).toBeNull();
  });
});

describe("asesor simulado: recorrido central", () => {
  const closetOk = [item("t", "top"), item("b", "bottom"), item("s", "shoes")];

  it("'tengo un evento el fin de semana, ¿qué me pongo?' se reconoce como pedido de look formal", () => {
    const text = "Tengo un evento el fin de semana, ¿qué me pongo?";
    expect(planMockTurn({ text, hasImage: false, start: false, missing: [] })).toEqual({ kind: "look" });
    expect(isFormalRequest(text)).toBe(true);
  });

  it("anota preferencias dichas al pasar solo con el perfil completo", () => {
    const t = "No me gusta el rojo";
    expect(planMockTurn({ text: t, hasImage: false, start: false, missing: [] })).toEqual({ kind: "remember", fact: t, memoryKind: "dislike" });
    expect(planMockTurn({ text: t, hasImage: false, start: false, missing: ["current_style"] })).toEqual({ kind: "profile_answer", field: "current_style" });
  });

  it("con clóset suficiente propone un look válido", () => {
    const plan = planMockLook(closetOk, 3, null, { formal: true });
    expect(plan.kind).toBe("outfit");
    if (plan.kind === "outfit") expect(validateOutfitComposition(plan.items)).toEqual({ ok: true });
  });

  it("si hay vestido y también arriba+abajo, nunca devuelve null por elegir la base equivocada", () => {
    const closet = [item("d", "dress"), item("t", "top"), item("b", "bottom")];
    for (let seed = 0; seed < 6; seed++) expect(pickMockOutfit(closet, seed, null)).not.toBeNull();
  });

  it("al clóset al que le falta una parte de abajo le describe la prenda y no arma look", () => {
    const plan = planMockLook([item("t", "top"), item("s", "shoes"), item("g", "bag")], 0, null);
    expect(plan.kind).toBe("missing");
    if (plan.kind !== "missing") return;
    expect(plan.piece.category).toBe("bottom");
    const text = missingPieceText(plan.piece);
    expect(text).toContain("te falta una parte de abajo");
    expect(text).toContain(plan.piece.description.charAt(0).toLowerCase());
    expect(text).not.toMatch(/compra|comprar|tienda|\$/i);
  });

  it("al que le falta una parte de arriba también", () => {
    const plan = planMockLook([item("b", "bottom"), item("s", "shoes")], 0, null);
    expect(plan.kind === "missing" && plan.piece.category).toBe("top");
  });

  it("con clóset vacío pide fotos", () => {
    expect(planMockLook([], 0, null)).toEqual({ kind: "empty" });
    expect(EMPTY_CLOSET_TEXT).toMatch(/fotos/);
  });
});

describe("clima", () => {
  const json = {
    daily: {
      time: ["2026-11-14", "2026-11-15"],
      temperature_2m_max: [24.4, 19],
      temperature_2m_min: [10.6, 8],
      precipitation_probability_max: [5, 70],
      weather_code: [0, 63],
    },
  };

  it("parsea el día pedido", () => {
    const w = parseForecast(json, "Santiago", "2026-11-15");
    expect(w).toMatchObject({ date: "2026-11-15", city: "Santiago", temp_min: 8, temp_max: 19, precipitation_probability: 70 });
    expect(w?.summary).toContain("con lluvia");
    expect(w?.summary).toContain("70% de probabilidad de lluvia");
  });

  it("redondea y no menciona lluvia improbable", () => {
    const w = parseForecast(json, "Santiago", "2026-11-14");
    expect(w).toMatchObject({ temp_min: 11, temp_max: 24 });
    expect(w?.summary).not.toContain("probabilidad");
  });

  it("devuelve null si falta el día o los datos son inválidos", () => {
    expect(parseForecast(json, "Santiago", "2030-01-01")).toBeNull();
    expect(parseForecast(null, "Santiago", "2026-11-14")).toBeNull();
    expect(parseForecast({ daily: { time: ["2026-11-14"] } }, "Santiago", "2026-11-14")).toBeNull();
  });

  it("traduce códigos WMO", () => {
    expect(describeWeatherCode(0)).toBe("despejado");
    expect(describeWeatherCode(3)).toBe("nublado");
    expect(describeWeatherCode(95)).toBe("con tormenta");
    expect(describeWeatherCode(null)).toBe("sin detalle");
  });
});

describe("formato", () => {
  it("fmtCLP", () => {
    expect(fmtCLP(12990)).toBe("$12.990");
    expect(fmtCLP(1500000)).toBe("$1.500.000");
  });
  it("fmtDateOnly no se corre por zona horaria", () => {
    expect(fmtDateOnly("2026-11-14")).toBe("14 de noviembre de 2026");
    expect(fmtDateOnly("2026-01-01")).toBe("1 de enero de 2026");
  });
  it("fmtDate usa America/Santiago", () => {
    // 2026-11-14T02:30Z es 23:30 del 13 en Santiago (UTC-3 en verano)
    expect(fmtDate("2026-11-14T02:30:00Z")).toContain("13");
    expect(fmtDate("basura")).toBe("");
  });
  it("startOfTodayInSantiagoISO es la medianoche local en UTC (-3 en verano, -4 en invierno)", () => {
    expect(startOfTodayInSantiagoISO(new Date("2026-11-14T15:00:00Z"))).toBe("2026-11-14T03:00:00.000Z");
    expect(startOfTodayInSantiagoISO(new Date("2026-11-14T02:30:00Z"))).toBe("2026-11-13T03:00:00.000Z");
    expect(startOfTodayInSantiagoISO(new Date("2026-07-10T15:00:00Z"))).toBe("2026-07-10T04:00:00.000Z");
  });
  it("todayInSantiago usa el día local", () => {
    expect(todayInSantiago(new Date("2026-11-14T02:30:00Z"))).toBe("2026-11-13");
    expect(todayInSantiago(new Date("2026-11-14T15:00:00Z"))).toBe("2026-11-14");
  });
});
