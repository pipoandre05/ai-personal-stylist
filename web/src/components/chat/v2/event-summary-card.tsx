import { cn } from "@/components/ui/cn";
import { eventCells, type EventCell } from "@/lib/domain/event-summary";
import type { EventField, EventSummary } from "@/lib/domain/types";
import { IconCalendar, IconCloudSun, IconHanger, IconMoon, IconPin, IconSun } from "./glyphs";

export type EventSummaryCardProps = {
  summary: EventSummary;
  /**
   * Tocar un dato pide corregirlo. Recibe el campo que corrige esa celda (`updateEventSummary` lo acepta).
   * Sin callback el resumen es solo lectura.
   */
  onEdit?: (field: EventField) => void;
  /** Deshabilita las celdas mientras se guarda una corrección. */
  busy?: boolean;
  className?: string;
};

const MISSING_WORD: Record<EventField, string> = {
  time_of_day: "Momento del día",
  dress_code: "Vestimenta",
  kind: "Tipo de evento",
  date: "Fecha",
  place: "Lugar",
  venue: "Entorno",
};

const PLACEHOLDER: Record<EventCell["key"], string> = {
  date: "Fecha",
  place: "Lugar",
  weather: "Clima",
  setting: "Momento",
};

function CellIcon({ cellKey, summary }: { cellKey: EventCell["key"]; summary: EventSummary }) {
  const cls = "mt-0.5 size-5 shrink-0 text-tinta-suave";
  if (cellKey === "date") return <IconCalendar className={cls} />;
  if (cellKey === "place") return <IconPin className={cls} />;
  if (cellKey === "weather") return <IconCloudSun className={cls} />;
  return summary.setting.time_of_day === "night" ? <IconMoon className={cls} /> : <IconSun className={cls} />;
}

/**
 * "Lo que entendí": ficha de lo que el asesor sacó del evento. Cuatro celdas 2×2 (fecha y tipo, lugar, clima,
 * entorno) más la vestimenta. Cada dato es un botón que pide corregirlo; lo que todavía no se sabe se marca con la
 * palabra "Falta" (nunca solo con color).
 */
export function EventSummaryCard({ summary, onEdit, busy = false, className }: EventSummaryCardProps) {
  const cells = eventCells(summary);
  const dressMissing = summary.missing.includes("dress_code");
  const showDress = summary.dress_code !== null || dressMissing;

  return (
    <div role="group" aria-label="Lo que entendí del evento" aria-busy={busy || undefined} className={cn("grid grid-cols-2 gap-2", className)}>
      {cells.map((cell) => {
        const known = cell.title !== null;
        // El clima no se corrige a mano: cambia con la fecha o el lugar.
        const editable = Boolean(onEdit) && cell.field !== null;
        return (
          <Cell
            key={cell.key}
            editable={editable}
            busy={busy}
            onPress={() => cell.field && onEdit?.(cell.field)}
            icon={<CellIcon cellKey={cell.key} summary={summary} />}
            title={known ? cell.title! : PLACEHOLDER[cell.key]}
            titleMuted={!known}
            detail={cell.detail}
            missing={!known && cell.key !== "weather"}
            hint={!known && cell.key === "weather" ? "Sin pronóstico todavía" : null}
          />
        );
      })}
      {showDress ? (
        <Cell
          wide
          editable={Boolean(onEdit)}
          busy={busy}
          onPress={() => onEdit?.("dress_code")}
          icon={<IconHanger className="mt-0.5 size-5 shrink-0 text-tinta-suave" />}
          title={summary.dress_code ? capitalize(summary.dress_code) : "Vestimenta"}
          titleMuted={!summary.dress_code}
          detail={summary.dress_code ? "Vestimenta" : null}
          missing={!summary.dress_code}
        />
      ) : null}
      {summary.missing.length > 0 ? (
        <p className="col-span-2 px-1 text-meta text-tinta-suave">
          Me falta saber: {summary.missing.map((f) => MISSING_WORD[f].toLowerCase()).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

type CellProps = {
  icon: React.ReactNode;
  title: string;
  titleMuted: boolean;
  detail: string | null;
  missing: boolean;
  hint?: string | null;
  editable: boolean;
  busy: boolean;
  wide?: boolean;
  onPress: () => void;
};

function Cell({ icon, title, titleMuted, detail, missing, hint, editable, busy, wide, onPress }: CellProps) {
  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-nombre", titleMuted ? "text-tinta-suave" : "text-tinta")}>{title}</span>
        {detail ? <span className="block text-meta text-tinta-suave">{detail}</span> : null}
        {hint ? <span className="block text-meta text-tinta-suave">{hint}</span> : null}
        {missing ? (
          <span className="mt-1 inline-block rounded-insignia bg-falta px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sobre-color">
            Falta
          </span>
        ) : null}
      </span>
    </>
  );
  const base = cn("flex min-h-[58px] items-start gap-2.5 rounded-campo bg-superficie p-3 text-left", wide && "col-span-2");
  if (!editable) return <div className={base}>{body}</div>;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPress}
      className={cn(base, "transition-transform duration-150 ease-salida active:scale-[0.97] disabled:opacity-60")}
    >
      {body}
      <span className="sr-only">{missing ? "Tocar para completar" : "Tocar para corregir"}</span>
    </button>
  );
}
