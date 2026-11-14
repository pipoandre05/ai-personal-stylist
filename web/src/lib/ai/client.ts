import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { anthropicApiKey } from "@/lib/env";

let client: Anthropic | null = null;

/** Cliente perezoso: la clave solo se exige cuando se usa (y nunca en modo simulado). */
export function getAnthropic(): Anthropic {
  client ??= new Anthropic({ apiKey: anthropicApiKey(), maxRetries: 2, timeout: 50_000 });
  return client;
}
