"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui";
import { deleteMemoryFact } from "@/lib/actions/memory";
import type { MemoryFact } from "@/lib/domain/types";

/**
 * Lo que el asesor sabe de ti (UI-18):
 * Hechos con punto lavanda (bg-memoria) y botón de texto "Borrar" accesible.
 */
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
      <p className="font-body text-cuerpo text-tinta-suave">
        Aún no recuerdo nada de ti. Lo que me cuentes en la conversación y lo que opines de mis looks aparecerá aquí.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-linea border-t border-linea">
      {visible.map((f) => (
        <li key={f.id} className="flex min-h-11 items-center justify-between gap-3 py-2.5">
          <span className="flex items-center font-body text-cuerpo text-tinta min-w-0">
            <i className="mr-2 inline-block size-2.5 shrink-0 rounded-full bg-memoria not-italic" aria-hidden="true" />
            <span className="truncate">{f.fact}</span>
          </span>
          <button
            type="button"
            onClick={() => remove(f.id)}
            aria-label={`Borrar: ${f.fact}`}
            className="min-h-11 shrink-0 px-2 font-body text-control text-tinta-suave underline underline-offset-4 transition-colors hover:text-error focus-visible:ring-3 focus-visible:ring-foco rounded-sm"
          >
            Borrar
          </button>
        </li>
      ))}
    </ul>
  );
}
