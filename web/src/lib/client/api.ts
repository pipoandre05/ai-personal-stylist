import { createSSEParser } from "@/lib/chat/sse";
import type { ChatEvent, ColorAnalysis, GarmentView } from "@/lib/domain/types";

const NETWORK_ERROR = "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.";
const GENERIC_ERROR = "Algo salió mal. Intenta de nuevo en un momento.";

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // respuesta sin JSON
  }
  return res.status === 401 ? "Tu sesión expiró. Vuelve a entrar para continuar." : GENERIC_ERROR;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  if (!res.ok) throw new Error(await errorMessage(res));
  return (await res.json()) as T;
}

/** Reconoce la prenda de una foto ya subida. Lanza `Error` con mensaje listo para mostrar. */
export async function createGarment(photo_path: string): Promise<GarmentView> {
  const { garment } = await postJson<{ garment: GarmentView }>("/api/garments", { photo_path });
  return garment;
}

export async function createColorAnalysis(photo_path: string): Promise<ColorAnalysis> {
  const { analysis } = await postJson<{ analysis: ColorAnalysis }>("/api/color-analysis", { photo_path });
  return analysis;
}

/**
 * Envía un mensaje al asesor (con foto opcional) y entrega cada evento SSE a `onEvent` a medida que llega.
 * Resuelve al terminar el flujo; lanza `Error` si la request falla antes de empezar.
 * Con `signal` abortado resuelve en silencio.
 * `{ text: "", start: true }` pide el saludo inicial; es idempotente si la persona ya tiene mensajes.
 *
 * Reintentos: genera `client_message_id = crypto.randomUUID()` UNA vez por mensaje de la persona (al crearlo en la
 * interfaz) y reenvía el MISMO valor al reintentar ese mensaje. Si el servidor ya lo guardó, no lo duplica: devuelve el
 * cierre del turno si el asesor ya respondió, o retoma el turno si se cortó. Un mensaje nuevo lleva un uuid nuevo.
 */
export async function streamChat(
  input: { conversation_id?: string; text: string; image_path?: string; start?: boolean; client_message_id?: string },
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
    throw new Error(NETWORK_ERROR);
  }
  if (!res.ok) throw new Error(await errorMessage(res));
  if (!res.body) throw new Error(GENERIC_ERROR);

  const parser = createSSEParser(onEvent);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
    }
    parser.flush();
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
    throw new Error(NETWORK_ERROR);
  } finally {
    reader.releaseLock();
  }
}
