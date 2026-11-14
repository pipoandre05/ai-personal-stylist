"use client";

import { Thread } from "@/components/chat/thread";
import type { ThreadItem } from "@/components/chat/thread-types";

const at = "2026-11-14T15:00:00.000Z";
const base = { kind: "advisor" as const, at, fresh: false, outfits: [], garments: [], palette: null, memories: [], id: null };

const ITEMS: ThreadItem[] = [
  { ...base, key: "a1", text: "Para un asado relajado te conviene algo fresco y cómodo. ¿Es de día o de noche?", streaming: false, error: null },
  { ...base, key: "a2", text: "", streaming: false, error: "Se cortó mi respuesta. Intenta de nuevo." },
  { ...base, key: "a3", text: "", streaming: true, error: null },
];

/** Los tres estados de la firma en el hilo real: turno terminado, error y asesor trabajando (la etiqueta se balancea). */
export function FirmaPreview() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-fondo">
      <Thread items={ITEMS} busy tool={null} showStatus todayKey="2026-11-14" onRetryPerson={() => {}} onRetryAdvisor={() => {}} onAsk={() => {}} />
    </main>
  );
}
