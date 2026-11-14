"use client";

import { btnText } from "./styles";
import { AdvisorMessage } from "./advisor-message";
import { GarmentCard } from "./garment-card";
import { MemoryNote } from "./memory-note";
import { OutfitCard } from "./outfit-card";
import { PaletteCard } from "./palette-card";
import { PersonMessage } from "./person-message";
import { PhotoMessage } from "./photo-message";
import { isV2Turn, type AdvisorItem, type PersonItem, type ThreadItem } from "./thread-types";
import { buildTurnItems, freshOutfitIdOf, ThreadItemV2View, type GarmentLookup, type ThreadV2Handlers } from "./v2";
import { ToolStatus } from "./tool-status";
import { cn } from "@/components/ui";
import type { OutfitView } from "@/lib/domain/types";
import { useMemo } from "react";
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
    <div className="flex items-center gap-3 text-sobretitulo uppercase text-tinta-suave">
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
  /** Acciones de las tarjetas v2. */
  handlers?: ThreadV2Handlers;
  /** Hay una acción en vuelo (guardar, elegir, corregir). */
  actionBusy?: boolean;
};

/** Prendas por id (de los looks y de las tarjetas del hilo) para las miniaturas del rastro. */
function garmentLookup(items: ThreadItem[]): GarmentLookup {
  const out: GarmentLookup = {};
  for (const i of items) {
    if (i.kind !== "advisor") continue;
    for (const o of i.outfits) for (const g of o.items) out[g.garment_id] = { name: g.name, photo_url: g.photo_url, category: g.category };
    for (const g of i.garments) out[g.id] = { name: g.name, photo_url: g.photo_url, category: g.category };
  }
  return out;
}

/** El hilo: mensajes y tarjetas en orden. No lleva aria-live (se anuncia aparte, al terminar cada turno). */
export function Thread({ items, busy, tool, showStatus, todayKey, onRetryPerson, onRetryAdvisor, onAsk, handlers, actionBusy }: ThreadProps) {
  const garments = useMemo(() => garmentLookup(items), [items]);
  const outfitIndex = useMemo(() => {
    const m = new Map<string, OutfitView>();
    for (const i of items) if (i.kind === "advisor") for (const o of i.outfits) m.set(o.id, o);
    return m;
  }, [items]);
  // "Look recién propuesto" (superficie inverso): solo el último look (no par) del último turno del asesor.
  const lastAdvisorKey = items.findLast((i) => i.kind === "advisor")?.key;
  const lastKey = items.at(-1)?.key;
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
                handlers={handlers}
                garments={garments}
                findOutfit={(id) => outfitIndex.get(id)}
                isLast={item.key === lastKey}
                isLastAdvisor={item.key === lastAdvisorKey}
                actionBusy={actionBusy}
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
  handlers,
  garments,
  findOutfit,
  isLast,
  isLastAdvisor,
  actionBusy,
}: {
  item: AdvisorItem;
  tool: AgentToolName | null;
  showStatus: boolean;
  onRetry: () => void;
  onAsk: (text: string) => void;
  handlers?: ThreadV2Handlers;
  garments: GarmentLookup;
  findOutfit: (id: string) => OutfitView | undefined;
  isLast: boolean;
  isLastAdvisor: boolean;
  actionBusy?: boolean;
}) {
  const animate = item.fresh;
  const v2 = isV2Turn(item);
  const v2Items = v2
    ? buildTurnItems(
        {
          id: item.id ?? item.key,
          tool_steps: item.tool_steps,
          event_summary: item.event_summary,
          outfits: item.outfits,
          search_offer: item.search_offer,
          shopping_blocks: item.shopping_blocks,
        },
        { isLastMessage: isLast && !item.streaming, freshOutfitId: isLastAdvisor ? freshOutfitIdOf(item.outfits) : null, findOutfit },
      )
    : [];
  return (
    <div className={cn("flex flex-col gap-3.5", animate && "animate-aparecer")}>
      <AdvisorMessage text={item.text} streaming={item.streaming && !showStatus} />
      {item.garments.map((g) => (
        <GarmentCard key={g.id} garment={g} animate={animate} />
      ))}
      {item.palette ? <PaletteCard analysis={item.palette} animate={animate} /> : null}
      {v2
        ? v2Items.map((it) => (
            <ThreadItemV2View
              key={it.key}
              item={it}
              handlers={handlers}
              garments={garments}
              closetHref={(id) => `/closet/${id}`}
              busy={actionBusy}
              animate={animate}
            />
          ))
        : item.outfits.map((o) => <OutfitCard key={o.id} outfit={o} animate={animate} onAsk={onAsk} />)}
      {item.memories.map((m, i) => (
        <MemoryNote key={`${i}-${m}`} fact={m} />
      ))}
      {showStatus && v2Items.length === 0 ? <ToolStatus tool={tool} /> : null}
      {item.error ? (
        <div role="alert" className="border-l-[3px] border-error pl-3 text-destacado text-tinta">
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
