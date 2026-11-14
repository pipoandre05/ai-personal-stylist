"use client";

import { useRef, type KeyboardEvent } from "react";
import { Chip } from "./chip";
import { cn } from "./cn";

export type ChipOption = { value: string; label: string; disabled?: boolean };

type Common = {
  options: readonly ChipOption[];
  /** Nombre accesible del grupo (si no usas fieldset/legend por fuera). */
  label?: string;
  className?: string;
};

export type ChipGroupProps =
  | (Common & { multiple: true; value: readonly string[]; onChange: (value: string[]) => void })
  | (Common & { multiple?: false; value: string | null; onChange: (value: string | null) => void });

/**
 * Grupo de chips controlado.
 * Múltiple: botones con aria-pressed. Única: radiogroup con flechas (foco itinerante);
 * tocar el elegido no lo deselecciona (comportamiento de radio).
 */
export function ChipGroup(props: ChipGroupProps) {
  const { options, label, className } = props;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  if (props.multiple) {
    const { value, onChange } = props;
    return (
      <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
        {options.map((o) => {
          const selected = value.includes(o.value);
          return (
            <Chip
              key={o.value}
              selected={selected}
              disabled={o.disabled}
              onClick={() => onChange(selected ? value.filter((v) => v !== o.value) : [...value, o.value])}
            >
              {o.label}
            </Chip>
          );
        })}
      </div>
    );
  }

  const { value, onChange } = props;
  const enabled = options.filter((o) => !o.disabled);
  const tabbable = value && enabled.some((o) => o.value === value) ? value : enabled[0]?.value;

  function onKeyDown(e: KeyboardEvent, index: number) {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    for (let step = 1; step <= options.length; step++) {
      const next = (index + dir * step + options.length * step) % options.length;
      if (!options[next].disabled) {
        onChange(options[next].value);
        refs.current[next]?.focus();
        return;
      }
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o, i) => (
        <Chip
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          mode="radio"
          selected={value === o.value}
          disabled={o.disabled}
          tabIndex={o.value === tabbable ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
