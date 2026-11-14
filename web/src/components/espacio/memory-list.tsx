"use client";

import { useState, useTransition } from "react";
import { Button, useToast } from "@/components/ui";
import { deleteMemoryFact } from "@/lib/actions/memory";
import type { MemoryFact } from "@/lib/domain/types";
import { fmtDate } from "@/lib/format";

const SOURCE_LABELS: Record<MemoryFact["source"], string> = {
  onboarding: "De tu primera conversación",
  chat: "De la conversación",
  feedback: "De tu opinión sobre un look",
};

/** Lo que el asesor recuerda: cada hecho con origen, fecha y "Borrar". */
export function MemoryList({ facts }: { facts: MemoryFact[] }) {
  const { toast } = useToast();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [, startTransition] = useTransition();

  function remove(id: string) {
    setHidden((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const res = await deleteMemoryFact(id);
      if (!res.ok) {
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast({ message: res.error, tone: "error" });
      }
    });
  }

  const visible = facts.filter((f) => !hidden.has(f.id));

  if (visible.length === 0) {
    return (
      <p className="text-base text-tinta-suave">
        Aún no recuerdo nada de ti. Lo que me cuentes en la conversación y lo que opines de mis looks aparecerá aquí.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-linea border-y border-linea">
      {visible.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-base text-tinta">{f.fact}</p>
            <p className="mt-0.5 text-sm text-tinta-suave">
              {SOURCE_LABELS[f.source]} · {fmtDate(f.created_at)}
            </p>
          </div>
          <Button variant="text" className="shrink-0 text-sm" onClick={() => remove(f.id)} aria-label={`Borrar: ${f.fact}`}>
            Borrar
          </Button>
        </li>
      ))}
    </ul>
  );
}
