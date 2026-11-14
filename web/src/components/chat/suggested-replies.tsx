"use client";

import { useState } from "react";
import { Chip, cn, IconCamera } from "@/components/ui";
import { btnPill } from "./styles";

// El asesor ofrece "Mandar foto" / "Mandar selfie" como texto: esas opciones abren el selector en vez de enviar.
const PHOTO_ACTION = /^(mandar|enviar|subir|tomar|sacar)\b.*\b(foto|selfie)\b/i;
const SELFIE = /selfie/i;

type SuggestedRepliesProps = {
  options: string[];
  multiple: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onPickPhoto: (selfie: boolean) => void;
};

/** Respuestas de un toque sobre el compositor. Simple: un toque envía. Múltiple: se marcan y "Listo" envía. */
export function SuggestedReplies({ options, multiple, disabled, onSend, onPickPhoto }: SuggestedRepliesProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const scrolls = !multiple && options.length > 6;

  return (
    <div role="group" aria-label="Respuestas sugeridas" className="animate-aparecer px-5 pt-3">
      <div
        className={cn(
          "flex gap-2",
          scrolls ? "-mx-5 overflow-x-auto px-5 pb-1 scroll-px-5" : "max-h-40 flex-wrap overflow-y-auto",
        )}
      >
        {options.map((o) => {
          if (!multiple && PHOTO_ACTION.test(o)) {
            return (
              <Chip key={o} mode="shortcut" disabled={disabled} onClick={() => onPickPhoto(SELFIE.test(o))}>
                <IconCamera className="size-4" />
                {o}
              </Chip>
            );
          }
          const selected = picked.includes(o);
          return (
            <Chip
              key={o}
              mode={multiple ? "toggle" : "shortcut"}
              selected={multiple && selected}
              disabled={disabled}
              onClick={() => (multiple ? setPicked(selected ? picked.filter((v) => v !== o) : [...picked, o]) : onSend(o))}
            >
              {o}
            </Chip>
          );
        })}
      </div>
      {multiple ? (
        <div className="mt-2 flex justify-end">
          <button type="button" className={btnPill} disabled={disabled || picked.length === 0} onClick={() => onSend(picked.join(", "))}>
            Listo
          </button>
        </div>
      ) : null}
    </div>
  );
}
