import type { EventField, EventSummary, EventTimeOfDay, EventVenue, Weather } from "./types";

// Resumen del evento (C-8). Todo lo de este archivo es puro: lo usan el asesor, el asesor simulado y la Server Action.

/** La invitación no dice nada: se supone en voz alta y no se vuelve a preguntar. */
export const DRESS_CODE_UNSPECIFIED = "no especificado";

/** Tope de preguntas sobre el evento antes de proponer (D-01: evento, hasta dos). */
export const MAX_EVENT_QUESTIONS = 2;

/** Lo que cambia el look y el asesor debe saber o suponer, en orden de importancia (D-01). */
const ASKABLE: readonly EventField[] = ["time_of_day", "dress_code", "kind", "date"];

export function emptyEventSummary(): EventSummary {
  return {
    kind: null,
    date: null,
    place: null,
    place_note: null,
    setting: { time_of_day: null, venue: null },
    dress_code: null,
    weather: null,
    missing: [...ASKABLE],
  };
}

/** Qué dato falta, en el orden en que conviene preguntarlo. Pura. */
export function computeMissing(s: Pick<EventSummary, "kind" | "date" | "dress_code" | "setting">): EventField[] {
  const empty: Record<string, boolean> = {
    time_of_day: s.setting.time_of_day === null,
    dress_code: s.dress_code === null,
    kind: s.kind === null,
    date: s.date === null,
  };
  return ASKABLE.filter((f) => empty[f]);
}

export type EventPatch = {
  kind?: string;
  date?: string;
  place?: string;
  place_note?: string;
  time_of_day?: EventTimeOfDay;
  venue?: EventVenue;
  dress_code?: string;
};

const clean = (v: string | undefined, max = 80) => {
  const t = v?.trim().replace(/\s+/g, " ").slice(0, max);
  return t ? t : undefined;
};

/**
 * Aplica un parche al resumen. El clima se invalida (`weather: null`) si cambia la fecha o el lugar: quien llama lo vuelve
 * a pedir con `needsWeatherRefresh`. `missing` siempre se recalcula.
 */
export function mergeEvent(current: EventSummary, patch: EventPatch): EventSummary {
  const next: EventSummary = {
    ...current,
    setting: { ...current.setting },
  };
  const kind = clean(patch.kind, 60);
  if (kind) next.kind = kind[0].toUpperCase() + kind.slice(1);
  const place = clean(patch.place);
  if (place) next.place = place;
  const note = clean(patch.place_note);
  if (note) next.place_note = note[0].toUpperCase() + note.slice(1);
  if (patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) next.date = patch.date;
  if (patch.time_of_day) next.setting.time_of_day = patch.time_of_day;
  if (patch.venue) next.setting.venue = patch.venue;
  const code = clean(patch.dress_code);
  if (code) next.dress_code = code;
  if (next.date !== current.date || next.place !== current.place) next.weather = null;
  next.missing = computeMissing(next);
  return next;
}

export function needsWeatherRefresh(s: EventSummary): boolean {
  return s.weather === null;
}

/** Datos del clima que muestra el resumen. */
export function weatherForSummary(w: Pick<Weather, "temp_min" | "temp_max" | "summary" | "precipitation_probability"> & { wind_kmh?: number | null }): NonNullable<EventSummary["weather"]> {
  const sky = w.summary.split(",")[0]?.trim() ?? "";
  const note: string[] = [];
  if (sky) note.push(sky[0].toUpperCase() + sky.slice(1));
  if (typeof w.wind_kmh === "number" && w.wind_kmh >= 30) note.push("con viento");
  if (w.precipitation_probability !== null && w.precipitation_probability >= 40) note.push(`${w.precipitation_probability}% de lluvia`);
  return { min: w.temp_min, max: w.temp_max, note: note.join(" · ") };
}

const WEEKDAY = new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", weekday: "long" });
const MONTH = new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", month: "short" });

/** "Sábado 21 nov" a partir de YYYY-MM-DD, sin desfase de zona. */
export function shortDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  const weekday = WEEKDAY.format(d);
  const month = MONTH.format(d).replace(/\./g, "");
  return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${d.getUTCDate()} ${month}`;
}

export type EventCell = {
  key: "date" | "place" | "weather" | "setting";
  /** `null` = todavía no se sabe (la UI lo muestra como dato por completar). */
  title: string | null;
  detail: string | null;
  field: EventField | null;
};

/** Las cuatro celdas 2×2 de "Lo que entendí": fecha/tipo, lugar, clima, entorno. */
export function eventCells(s: EventSummary): EventCell[] {
  const tod = s.setting.time_of_day;
  const venue = s.setting.venue;
  return [
    { key: "date", title: s.date ? shortDateLabel(s.date) : null, detail: s.kind, field: s.date ? "kind" : "date" },
    { key: "place", title: s.place, detail: s.place_note, field: "place" },
    {
      key: "weather",
      title: s.weather ? `${s.weather.min}° a ${s.weather.max}°` : null,
      detail: s.weather ? s.weather.note || null : null,
      field: null,
    },
    {
      key: "setting",
      title: tod ? (tod === "day" ? "De día" : "De noche") : null,
      detail: venue ? (venue === "outdoor" ? "Al aire libre" : "En interior") : null,
      field: tod ? "venue" : "time_of_day",
    },
  ];
}

/** Línea para el asesor: lo que sabe del evento (dato, no instrucción). */
export function describeEventForAdvisor(s: EventSummary): string {
  const bits = [
    `tipo: ${s.kind ?? "sin definir"}`,
    `fecha: ${s.date ?? "sin definir"}`,
    `lugar: ${s.place ?? "sin definir"}${s.place_note ? ` (${s.place_note})` : ""}`,
    `momento: ${s.setting.time_of_day === "day" ? "de día" : s.setting.time_of_day === "night" ? "de noche" : "sin definir"}`,
    `entorno: ${s.setting.venue === "outdoor" ? "al aire libre" : s.setting.venue === "indoor" ? "en interior" : "sin definir"}`,
    `código de vestir: ${s.dress_code ?? "sin definir"}`,
    `clima: ${s.weather ? `${s.weather.min}° a ${s.weather.max}°, ${s.weather.note}` : "sin pronóstico"}`,
    `falta: ${s.missing.length ? s.missing.join(", ") : "nada"}`,
  ];
  return bits.join("\n");
}

/** Nivel de formalidad (1 a 5) que pide el evento; null si no se puede inferir. */
export function targetFormality(s: Pick<EventSummary, "kind" | "dress_code"> | null): number | null {
  if (!s) return null;
  const code = (s.dress_code ?? "").toLowerCase();
  const kind = (s.kind ?? "").toLowerCase();
  if (/(gala|etiqueta)/.test(code) || /(gala)/.test(kind)) return 5;
  if (/(formal|elegante)/.test(code) && !/informal/.test(code)) return 4;
  if (/(casual|informal)/.test(code)) return 2; // lo que dice la invitación manda sobre el tipo de evento
  if (/(matrimonio|boda|graduaci)/.test(kind)) return 4;
  if (/(c[oó]ctel|cena|bautizo|reuni[oó]n|entrevista|cumplea)/.test(code + " " + kind)) return 3;
  return null;
}

// --- Lectura de texto libre (la usa el asesor simulado; el real usa la herramienta con campos) ---

const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};
const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9,
  octubre: 10, noviembre: 11, diciembre: 12,
};
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Fecha que dice el texto ("este sábado", "mañana", "el 21 de noviembre"), a partir de `today` (YYYY-MM-DD). */
export function parseEventDate(text: string, today: string): string | undefined {
  const t = strip(text);
  if (/\bpasado manana\b/.test(t)) return addDays(today, 2);
  if (/\bmanana\b/.test(t)) return addDays(today, 1);
  if (/\bhoy\b/.test(t)) return today;
  const explicit = t.match(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);
  if (explicit) {
    const day = Number(explicit[1]);
    const month = MONTHS[explicit[2]];
    let year = Number(today.slice(0, 4));
    let iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (iso < today) {
      year += 1;
      iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime()) ? undefined : iso;
  }
  const wd = t.match(/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/);
  if (wd) {
    const target = WEEKDAYS[wd[1]];
    const todayDow = new Date(`${today}T00:00:00Z`).getUTCDay();
    let delta = (target - todayDow + 7) % 7;
    if (delta === 0) delta = 7; // "este sábado" dicho un sábado es el siguiente
    return addDays(today, delta);
  }
  return undefined;
}

const KINDS: [RegExp, string][] = [
  [/matrimonio|boda/, "Matrimonio"],
  [/cumplea/, "Cumpleaños"],
  [/bautizo|bautismo/, "Bautizo"],
  [/graduaci/, "Graduación"],
  [/\bcena\b/, "Cena"],
  [/entrevista/, "Entrevista"],
  [/reuni[oó]n/, "Reunión"],
  [/c[oó]ctel/, "Cóctel"],
  [/fiesta/, "Fiesta"],
  [/\bevento\b/, "Evento"],
];

const VENUES: { re: RegExp; venue: EventVenue }[] = [
  { re: /(vi[nñ]a|jard[ií]n|campo|playa|terraza|aire libre|parque|quinta|exterior)/, venue: "outdoor" },
  { re: /(sal[oó]n|restaurante|hotel|oficina|teatro|interior|club|casino|iglesia)/, venue: "indoor" },
];

/** Lee de un mensaje lo que se puede entender del evento. Lo que no aparece no se incluye. Pura. */
export function parseEventText(text: string, today: string): EventPatch {
  const patch: EventPatch = {};
  const lower = text.toLowerCase();
  const kind = KINDS.find(([re]) => re.test(lower));
  if (kind) patch.kind = kind[1];
  const date = parseEventDate(text, today);
  if (date) patch.date = date;
  const place = text.match(/\ben\s+((?:\p{Lu}[\p{L}]+)(?:\s+(?:de la|de los|del|de)?\s*\p{Lu}[\p{L}]+){0,2})/u);
  if (place) patch.place = place[1].trim();
  if (/\bde d[ií]a\b|\balmuerzo\b|\ben el d[ií]a\b|\bmediod[ií]a\b/.test(lower)) patch.time_of_day = "day";
  else if (/\bde noche\b|\ben la noche\b|\bnocturn/.test(lower)) patch.time_of_day = "night";
  for (const v of VENUES) {
    const m = lower.match(new RegExp(`\\ben\\s+(una?|la|el)\\s+(${v.re.source.slice(1, -1)})(?:\\s+de\\s+[\\p{L}]+)?`, "u"));
    if (m) {
      patch.venue = v.venue;
      patch.place_note = `En ${m[1]} ${m[2]}`;
      break;
    }
  }
  if (!patch.venue) {
    const v = VENUES.find((x) => x.re.test(lower));
    if (v) patch.venue = v.venue;
  }
  const code = lower.match(/\b(semi ?formal|formal|etiqueta|gala|elegante sport|elegante|casual|informal|c[oó]ctel)\b/);
  if (code && !/matrimonio|boda/.test(code[1])) patch.dress_code = code[1];
  return patch;
}

/** Respuesta a "¿qué dice la invitación sobre la vestimenta?": texto entre «» o comillas, o "no dice nada". */
export function parseDressCodeAnswer(text: string): string | undefined {
  const t = text.trim();
  if (/\b(no dice(?: nada)?|sin c[oó]digo|no especifica|ninguno)\b/i.test(t)) return DRESS_CODE_UNSPECIFIED;
  const quoted = t.match(/[«"“]([^»"”]{2,60})[»"”]/);
  if (quoted) return quoted[1].trim();
  const after = t.match(/\bdice\s+(.{2,60})$/i);
  if (after) return after[1].replace(/[.!]+$/, "").trim();
  const known = t.match(/\b(semi ?formal|formal|etiqueta|gala|elegante|casual|informal|c[oó]ctel)\b/i);
  return known ? known[0].toLowerCase() : undefined;
}

export function parseTimeOfDayAnswer(text: string): EventTimeOfDay | undefined {
  const t = strip(text);
  if (/\bnoche\b|\bnocturn/.test(t)) return "night";
  if (/\bdia\b|\btarde\b|\balmuerzo\b/.test(t)) return "day";
  return undefined;
}
