"use client";

import { useState } from "react";
import { Button } from "./button";
import { Chip } from "./chip";
import { cn } from "./cn";

type QuickRepliesProps = {
  options: string[];
  /** Múltiple: se eligen varias y se envían con "Listo". Por defecto, un toque envía. */
  multiple?: boolean;
  onSubmit: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
};

/** Respuestas sugeridas de un toque (o varias + "Listo"), para el hilo del asesor. */
export function QuickReplies({ options, multiple = false, onSubmit, disabled, className }: QuickRepliesProps) {
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <div role="group" aria-label="Respuestas sugeridas" className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const selected = picked.includes(o);
        return (
          <Chip
            key={o}
            mode={multiple ? "toggle" : "shortcut"}
            selected={multiple && selected}
            disabled={disabled}
            onClick={() => (multiple ? setPicked(selected ? picked.filter((v) => v !== o) : [...picked, o]) : onSubmit([o]))}
          >
            {o}
          </Chip>
        );
      })}
      {multiple ? (
        <Button
          className="ml-auto"
          disabled={disabled || picked.length === 0}
          onClick={() => onSubmit(picked)}
        >
          Listo
        </Button>
      ) : null}
    </div>
  );
}
