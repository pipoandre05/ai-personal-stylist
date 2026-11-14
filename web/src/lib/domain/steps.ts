import type { AgentToolName, EventSummary, GarmentCategory, ToolStep, ToolStepItem, Weather } from "./types";
import { targetFormality } from "./event-summary";

// Pasos de trabajo del asesor (C-1). Puro: lo usan las herramientas, el colector del hilo y los tests.

/** Rótulos del paso en curso y en pasado. `null` = herramienta silenciosa (no deja rastro). */
export const STEP_LABELS: Record<AgentToolName, { running: string; done: string } | null> = {
  get_closet: { running: "Revisando tu clóset", done: "Revisé tu clóset" },
  get_weather: { running: "Mirando el clima", done: "Miré el clima" },
  propose_outfit: { running: "Armando el look", done: "Armé el look" },
  remember: { running: "Tomando nota", done: "Tomé nota" },
  update_profile: { running: "Guardando tu perfil", done: "Guardé tu perfil" },
  add_garment: { running: "Reconociendo la prenda", done: "Reconocí la prenda" },
  analyze_palette: { running: "Mirando tu tono de piel", done: "Miré tu tono de piel" },
  set_event_summary: { running: "Entendiendo tu evento", done: "Entendí tu evento" },
  search_products: { running: "Buscando opciones", done: "Busqué opciones" },
  suggest_replies: null,
  offer_search: null,
};

/** Lo que una herramienta agrega al paso cuando termina. */
export type StepInfo = {
  label_done?: string;
  detail?: string;
  items?: ToolStepItem[];
  /** `error` aunque la herramienta no haya fallado (p. ej. la búsqueda no estaba disponible). */
  status?: "done" | "error";
};

export function runningStep(id: string, tool: AgentToolName): ToolStep | null {
  const labels = STEP_LABELS[tool];
  if (!labels) return null;
  return { id, tool, status: "running", label_running: labels.running, label_done: labels.done };
}

export function finishedStep(step: ToolStep, failed: boolean, info: StepInfo = {}): ToolStep {
  const status = failed ? "error" : (info.status ?? "done");
  const out: ToolStep = {
    id: step.id,
    tool: step.tool,
    status,
    label_running: step.label_running,
    label_done: info.label_done ?? step.label_done,
  };
  if (!failed && info.detail) out.detail = info.detail;
  if (!failed && info.items && info.items.length) out.items = info.items;
  return out;
}

/** Reemplaza el paso con el mismo `id` (conserva su posición) o lo agrega al final. */
export function upsertStep(steps: ToolStep[], step: ToolStep): ToolStep[] {
  const i = steps.findIndex((s) => s.id === step.id);
  if (i === -1) return [...steps, step];
  const next = [...steps];
  next[i] = step;
  return next;
}

/** Al terminar el turno ningún paso sigue "en curso": los que quedaron colgados se marcan con error. */
export function settleSteps(steps: ToolStep[]): ToolStep[] {
  return steps.map((s) => (s.status === "running" ? { ...s, status: "error" as const } : s));
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Serving = { id: string; category: GarmentCategory; formality: number; seasons: string[] };

/**
 * ¿La prenda sirve para el día? Por temporada según el clima y, si el evento pide formalidad, a un nivel de distancia
 * como máximo (D-03). Sin datos, sirve. Pura.
 */
export function servesForDay(g: Serving, ctx: { weather: Pick<Weather, "temp_max" | "temp_min"> | null; formality: number | null }): boolean {
  const seasons = g.seasons.map((s) => s.toLowerCase());
  if (ctx.weather && seasons.length > 0 && seasons.length < 3) {
    if (ctx.weather.temp_max >= 22 && !seasons.some((s) => s === "verano" || s === "entretiempo")) return false;
    if (ctx.weather.temp_max <= 14 && !seasons.some((s) => s === "invierno" || s === "entretiempo")) return false;
  }
  if (ctx.formality !== null && g.category !== "accessory" && Math.abs(g.formality - ctx.formality) > 1) return false;
  return true;
}

const MAX_STEP_ITEMS = 40;

/** Paso de `get_closet`: "32 prendas · 9 sirven para el día" con las prendas consideradas. */
export function closetStepInfo(
  garments: Serving[],
  ctx: { weather: Weather | null; event: EventSummary | null },
  chosen: ReadonlySet<string> = new Set(),
): StepInfo {
  const formality = targetFormality(ctx.event);
  const serving = garments.filter((g) => servesForDay(g, { weather: ctx.weather, formality }));
  const parts = [plural(garments.length, "prenda", "prendas")];
  if (garments.length > 0) parts.push(`${serving.length} ${serving.length === 1 ? "sirve" : "sirven"} para el día`);
  // Una prenda elegida que "no servía" por el filtro igual se muestra: la elegida manda.
  const considered = [...serving, ...garments.filter((g) => chosen.has(g.id) && !serving.includes(g))];
  if (chosen.size > 0) parts.push(`elegí ${chosen.size}`);
  return {
    detail: parts.join(" · "),
    items: considered.slice(0, MAX_STEP_ITEMS).map((g) => ({ garment_id: g.id, chosen: chosen.has(g.id) })),
  };
}
