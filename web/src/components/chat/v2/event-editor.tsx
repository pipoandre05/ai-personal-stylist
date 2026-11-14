"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import type { EventField, EventSummary } from "@/lib/domain/types";

// Editor de un dato del evento ("Lo que entendí"). Presentación: entrega el valor por `onSubmit`; no valida reglas
// (las valida `updateEventSummary` en el servidor y su mensaje vuelve por `error`).

const TITLE: Record<EventField, string> = {
  kind: "Tipo de evento",
  date: "Fecha del evento",
  place: "Lugar",
  dress_code: "Vestimenta",
  time_of_day: "Momento del día",
  venue: "Dónde es",
};

const CHOICES: Partial<Record<EventField, { value: string; label: string }[]>> = {
  time_of_day: [
    { value: "day", label: "De día" },
    { value: "night", label: "De noche" },
  ],
  venue: [
    { value: "outdoor", label: "Al aire libre" },
    { value: "indoor", label: "Bajo techo" },
  ],
};

function currentValue(field: EventField, s: EventSummary | null): string {
  if (!s) return "";
  switch (field) {
    case "kind":
      return s.kind ?? "";
    case "date":
      return s.date ?? "";
    case "place":
      return s.place ?? "";
    case "dress_code":
      return s.dress_code && s.dress_code !== "no especificado" ? s.dress_code : "";
    case "time_of_day":
      return s.setting.time_of_day ?? "";
    case "venue":
      return s.setting.venue ?? "";
  }
}

export type EventEditorProps = {
  /** Campo que se corrige; `null` = cerrado. */
  field: EventField | null;
  summary: EventSummary | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

export function EventEditor({ field, summary, busy = false, onClose, onSubmit }: EventEditorProps) {
  return (
    <Sheet open={field !== null} onClose={onClose} title={field ? TITLE[field] : "Corregir"}>
      {field ? <EditorBody key={field} field={field} summary={summary} busy={busy} onSubmit={onSubmit} /> : null}
    </Sheet>
  );
}

function EditorBody({ field, summary, busy, onSubmit }: { field: EventField; summary: EventSummary | null; busy: boolean; onSubmit: (v: string) => void }) {
  const [value, setValue] = useState(() => currentValue(field, summary));
  const choices = CHOICES[field];

  if (choices) {
    return (
      <div className="mt-4 flex flex-col gap-2 pb-2" role="group" aria-label={TITLE[field]}>
        {choices.map((c) => (
          <Button
            key={c.value}
            variant={value === c.value ? "primary" : "secondary"}
            fullWidth
            disabled={busy}
            aria-pressed={value === c.value}
            onClick={() => {
              setValue(c.value);
              onSubmit(c.value);
            }}
          >
            {c.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <form
      className="mt-4 flex flex-col gap-4 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <Input
        label={TITLE[field]}
        type={field === "date" ? "date" : "text"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        autoComplete="off"
        maxLength={80}
      />
      <Button type="submit" fullWidth disabled={busy || !value.trim()}>
        Guardar
      </Button>
    </form>
  );
}
