"use client";

import { btnText } from "./styles";
import { AdvisorMessage } from "./advisor-message";
import { GarmentCard } from "./garment-card";
import { MemoryNote } from "./memory-note";
import { OutfitCard } from "./outfit-card";
import { PaletteCard } from "./palette-card";
import { PersonMessage } from "./person-message";
import { PhotoMessage } from "./photo-message";
import type { AdvisorItem, PersonItem, ThreadItem } from "./thread-types";
import { ToolStatus } from "./tool-status";
import { cn } from "@/components/ui";
import type { AgentToolName } from "@/lib/domain/types";

const TZ = "America/Santiago";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFmt = new Intl.DateTimeFormat("es-CL", { timeZone: TZ, day: "numeric", month: "short" });

export function dayKey(iso: string): string {
  return dayFmt.format(new Date(iso));
}

function dayLabel(iso: string, todayKey: string): string {
  const key = dayKey(iso);
  if (!todayKey) return labelFmt.format(new Date(iso)).replace(".", "");
  if (key === todayKey) return "Hoy";
  const yesterday = dayFmt.format(new Date(new Date(`${todayKey}T12:00:00Z`).getTime() - 24 * 3600 * 1000));
  if (key === yesterday) return "Ayer";
  return labelFmt.format(new Date(iso)).replace(".", "");
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave">
      <span aria-hidden="true" className="h-px flex-1 bg-linea" />
      {label}
      <span aria-hidden="true" className="h-px flex-1 bg-linea" />
    </div>
  );
}

type ThreadProps = {
  items: ThreadItem[];
  busy: boolean;
  /** Herramienta en curso (null = "Pensando…"). */
  tool: AgentToolName | null;
  /** Mostrar el indicador de pensando en el turno que está transmitiendo. */
  showStatus: boolean;
  todayKey: string;
  onRetryPerson: (key: string) => void;
  onRetryAdvisor: (key: string) => void;
  onAsk: (text: string) => void;
};

/** El hilo: mensajes y tarjetas en orden. No lleva aria-live (se anuncia aparte, al terminar cada turno). */
export function Thread({ items, busy, tool, showStatus, todayKey, onRetryPerson, onRetryAdvisor, onAsk }: ThreadProps) {
  return (
    <section aria-label="Conversación con tu asesor" aria-busy={busy} className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-4">
      {items.map((item, i) => {
        const prev = items[i - 1];
        const separator = prev && dayKey(prev.at) !== dayKey(item.at) ? dayLabel(item.at, todayKey) : null;
        return (
          <div key={item.key} className="flex flex-col gap-6">
            {separator ? <DaySeparator label={separator} /> : null}
            {item.kind === "person" ? (
              <PersonTurn item={item} onRetry={() => onRetryPerson(item.key)} />
            ) : (
              <AdvisorTurn
                item={item}
                tool={tool}
                showStatus={showStatus && item.streaming}
                onRetry={() => onRetryAdvisor(item.key)}
                onAsk={onAsk}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

function PersonTurn({ item, onRetry }: { item: PersonItem; onRetry: () => void }) {
  const failed = item.status === "failed";
  const hasPhoto = Boolean(item.imageUrl) || item.photoDeleted;
  if (hasPhoto) {
    return (
      <PhotoMessage
        src={item.imageUrl}
        text={item.text}
        deleted={item.photoDeleted}
        uploading={item.status === "uploading"}
        sending={item.status === "sending"}
        error={failed ? (item.error ?? "Intenta de nuevo.") : null}
        onRetry={onRetry}
        animate={item.fresh}
      />
    );
  }
  return (
    <PersonMessage
      text={item.text}
      sending={item.status === "sending"}
      error={failed ? (item.error ?? "Intenta de nuevo.") : null}
      onRetry={onRetry}
      animate={item.fresh}
    />
  );
}

const LIMIT = /m[aá]ximo de mensajes/i;

function AdvisorTurn({
  item,
  tool,
  showStatus,
  onRetry,
  onAsk,
}: {
  item: AdvisorItem;
  tool: AgentToolName | null;
  showStatus: boolean;
  onRetry: () => void;
  onAsk: (text: string) => void;
}) {
  const animate = item.fresh;
  return (
    <div className={cn("flex flex-col gap-4", animate && "animate-aparecer")}>
      <AdvisorMessage text={item.text} streaming={item.streaming && !showStatus} />
      {item.garments.map((g) => (
        <GarmentCard key={g.id} garment={g} animate={animate} />
      ))}
      {item.palette ? <PaletteCard analysis={item.palette} animate={animate} /> : null}
      {item.outfits.map((o) => (
        <OutfitCard key={o.id} outfit={o} animate={animate} onAsk={onAsk} />
      ))}
      {item.memories.map((m, i) => (
        <MemoryNote key={`${i}-${m}`} fact={m} />
      ))}
      {showStatus ? <ToolStatus tool={tool} /> : null}
      {item.error ? (
        <div role="alert" className="border-l-2 border-error pl-3 text-base text-tinta">
          <p>{item.error}</p>
          {LIMIT.test(item.error) ? null : (
            <button type="button" onClick={onRetry} className={btnText}>
              Reintentar
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
