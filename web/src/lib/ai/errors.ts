import Anthropic from "@anthropic-ai/sdk";

/** Mensaje en español para la persona; nunca expone detalles internos del proveedor. */
export function friendlyAiError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) {
    return "El asesor tiene mucha demanda en este momento. Intenta de nuevo en un minuto.";
  }
  if (err instanceof Anthropic.APIError && err.status === 529) {
    return "El asesor está saturado en este momento. Intenta de nuevo en un minuto.";
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return "El asesor demoró demasiado en responder. Intenta de nuevo.";
  }
  return "No pude responderte ahora. Intenta de nuevo en un momento.";
}
