import { describe, expect, it } from "vitest";
import {
  DRESS_CODE_UNSPECIFIED,
  computeMissing,
  describeEventForAdvisor,
  emptyEventSummary,
  eventCells,
  mergeEvent,
  needsWeatherRefresh,
  parseDressCodeAnswer,
  parseEventDate,
  parseEventText,
  parseTimeOfDayAnswer,
  shortDateLabel,
  targetFormality,
  weatherForSummary,
} from "@/lib/domain/event-summary";

// 2026-11-14 es sábado.
const TODAY = "2026-11-14";
const SENTENCE = "Este sábado tengo un matrimonio en Casablanca, de día, en una viña. ¿Qué me pongo? Si no tengo nada, búscame opciones.";

describe("resumen del evento (C-8)", () => {
  it("lee del primer mensaje todo lo que dice y deja pendiente lo que no", () => {
    const patch = parseEventText(SENTENCE, TODAY);
    expect(patch).toMatchObject({
      kind: "Matrimonio",
      date: "2026-11-21",
      place: "Casablanca",
      time_of_day: "day",
      venue: "outdoor",
      place_note: "En una viña",
    });
    expect(patch.dress_code).toBeUndefined();
    const s = mergeEvent(emptyEventSummary(), patch);
    expect(s.missing).toEqual(["dress_code"]);
    expect(s.weather).toBeNull();
    expect(needsWeatherRefresh(s)).toBe(true);
  });

  it("entiende fechas relativas y explícitas (un sábado, 'este sábado' es el siguiente)", () => {
    expect(parseEventDate("mañana", TODAY)).toBe("2026-11-15");
    expect(parseEventDate("pasado mañana", TODAY)).toBe("2026-11-16");
    expect(parseEventDate("hoy", TODAY)).toBe(TODAY);
    expect(parseEventDate("el viernes", TODAY)).toBe("2026-11-20");
    expect(parseEventDate("este sábado", TODAY)).toBe("2026-11-21");
    expect(parseEventDate("el 3 de diciembre", TODAY)).toBe("2026-12-03");
    expect(parseEventDate("el 3 de enero", TODAY)).toBe("2027-01-03");
    expect(parseEventDate("algún día", TODAY)).toBeUndefined();
  });

  it("missing sale ordenado por lo que más cambia el look", () => {
    expect(emptyEventSummary().missing).toEqual(["time_of_day", "dress_code", "kind", "date"]);
    const s = mergeEvent(emptyEventSummary(), { kind: "cena" });
    expect(s.kind).toBe("Cena");
    expect(s.missing).toEqual(["time_of_day", "dress_code", "date"]);
    expect(computeMissing(mergeEvent(s, { time_of_day: "night", dress_code: DRESS_CODE_UNSPECIFIED, date: "2026-11-20" }))).toEqual([]);
  });

  it("cambiar la fecha o el lugar invalida el clima; cambiar otra cosa no", () => {
    let s = mergeEvent(emptyEventSummary(), { date: "2026-11-21", place: "Casablanca" });
    s = { ...s, weather: { min: 11, max: 27, note: "Despejado" } };
    expect(mergeEvent(s, { dress_code: "formal" }).weather).not.toBeNull();
    expect(mergeEvent(s, { place: "Valparaíso" }).weather).toBeNull();
    expect(mergeEvent(s, { date: "2026-11-22" }).weather).toBeNull();
    expect(mergeEvent(s, { place: "Casablanca" }).weather).not.toBeNull();
  });

  it("ignora valores vacíos o fechas mal formadas", () => {
    const s = mergeEvent(emptyEventSummary(), { date: "21/11", place: "  ", kind: "" });
    expect(s.date).toBeNull();
    expect(s.place).toBeNull();
    expect(s.kind).toBeNull();
  });

  it("las cuatro celdas 2×2 salen del resumen", () => {
    const s = {
      ...mergeEvent(emptyEventSummary(), parseEventText(SENTENCE, TODAY)),
      weather: weatherForSummary({ temp_min: 11, temp_max: 27, summary: "despejado, entre 11 y 27 °C", precipitation_probability: 5, wind_kmh: 34 }),
    };
    const cells = eventCells(s);
    expect(cells.map((c) => c.key)).toEqual(["date", "place", "weather", "setting"]);
    expect(cells[0]).toMatchObject({ title: "Sábado 21 nov", detail: "Matrimonio" });
    expect(cells[1]).toMatchObject({ title: "Casablanca", detail: "En una viña" });
    expect(cells[2]).toMatchObject({ title: "11° a 27°", detail: "Despejado · con viento" });
    expect(cells[3]).toMatchObject({ title: "De día", detail: "Al aire libre" });
    expect(eventCells(emptyEventSummary()).every((c) => c.title === null)).toBe(true);
  });

  it("formatea fechas sin desfase de zona", () => {
    expect(shortDateLabel("2026-11-21")).toBe("Sábado 21 nov");
    expect(shortDateLabel("2026-01-01")).toBe("Jueves 1 ene");
    expect(shortDateLabel("xx")).toBe("");
  });

  it("interpreta la respuesta sobre la vestimenta y sobre el momento", () => {
    expect(parseDressCodeAnswer("Dice «formal de día»")).toBe("formal de día");
    expect(parseDressCodeAnswer("No dice nada")).toBe(DRESS_CODE_UNSPECIFIED);
    expect(parseDressCodeAnswer("dice cóctel")).toBe("cóctel");
    expect(parseDressCodeAnswer("hola")).toBeUndefined();
    expect(parseTimeOfDayAnswer("De noche")).toBe("night");
    expect(parseTimeOfDayAnswer("De día")).toBe("day");
    expect(parseTimeOfDayAnswer("mañana")).toBeUndefined(); // "mañana" es una fecha, no un momento del día
  });

  it("deduce la formalidad que pide el evento", () => {
    expect(targetFormality({ kind: "Matrimonio", dress_code: "formal de día" })).toBe(4);
    expect(targetFormality({ kind: "Cena", dress_code: null })).toBe(3);
    expect(targetFormality({ kind: "Cumpleaños", dress_code: "casual" })).toBe(2);
    expect(targetFormality({ kind: "Matrimonio", dress_code: "gala" })).toBe(5);
    expect(targetFormality({ kind: null, dress_code: null })).toBeNull();
    expect(targetFormality(null)).toBeNull();
  });

  it("describe el evento para el asesor como dato", () => {
    const text = describeEventForAdvisor(mergeEvent(emptyEventSummary(), parseEventText(SENTENCE, TODAY)));
    expect(text).toContain("tipo: Matrimonio");
    expect(text).toContain("falta: dress_code");
    expect(text).toContain("clima: sin pronóstico");
  });
});
