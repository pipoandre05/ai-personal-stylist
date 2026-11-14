import type { Weather } from "@/lib/domain/types";
import { todayInSantiago } from "@/lib/format";

const TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; value: Weather | null }>();

type Forecast = {
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    weather_code?: (number | null)[];
  };
};

/** Resumen en español a partir del código WMO de Open-Meteo. */
export function describeWeatherCode(code: number | null | undefined): string {
  if (code == null) return "sin detalle";
  if (code === 0) return "despejado";
  if (code <= 2) return "mayormente despejado";
  if (code === 3) return "nublado";
  if (code === 45 || code === 48) return "con niebla";
  if (code >= 51 && code <= 57) return "con llovizna";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "con lluvia";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "con nieve";
  if (code >= 95) return "con tormenta";
  return "variable";
}

/** Extrae el día pedido del JSON de Open-Meteo. Pura. */
export function parseForecast(json: unknown, city: string, date: string): Weather | null {
  const daily = (json as Forecast | null)?.daily;
  const idx = daily?.time?.indexOf(date) ?? -1;
  if (!daily || idx < 0) return null;
  const tmax = daily.temperature_2m_max?.[idx];
  const tmin = daily.temperature_2m_min?.[idx];
  if (typeof tmax !== "number" || typeof tmin !== "number") return null;
  const rain = daily.precipitation_probability_max?.[idx];
  const precipitation_probability = typeof rain === "number" ? rain : null;
  const sky = describeWeatherCode(daily.weather_code?.[idx]);
  const rainNote = precipitation_probability !== null && precipitation_probability >= 40
    ? `, ${precipitation_probability}% de probabilidad de lluvia`
    : "";
  return {
    date,
    city,
    temp_min: Math.round(tmin),
    temp_max: Math.round(tmax),
    precipitation_probability,
    summary: `${sky}, entre ${Math.round(tmin)} y ${Math.round(tmax)} °C${rainNote}`,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  return res.json();
}

/**
 * Pronóstico diario de la ciudad (Open-Meteo, sin clave). Ante cualquier falla devuelve null
 * y el agente sigue sin clima. Cache en memoria de 30 minutos por ciudad y día.
 */
export async function getWeather(city: string, date: string = todayInSantiago()): Promise<Weather | null> {
  const name = city.trim();
  if (!name) return null;
  const key = `${name.toLowerCase()}|${date}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  try {
    const geo = (await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=es&format=json`,
    )) as { results?: { latitude: number; longitude: number; country_code?: string }[] };
    const place = geo.results?.find((r) => r.country_code === "CL") ?? geo.results?.[0];
    if (!place) throw new Error("ciudad no encontrada");

    const forecast = await fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
        `&timezone=America%2FSantiago&forecast_days=8`,
    );
    const value = parseForecast(forecast, name, date);
    if (value) cache.set(key, { at: Date.now(), value }); // una falla no se cachea
    return value;
  } catch {
    return null;
  }
}
