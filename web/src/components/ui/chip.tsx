import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./cn";
import { IconCheck } from "./icons";

const base =
  "relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full border-[1.5px] font-body text-control transition-[transform,opacity,background-color,border-color,color] duration-150 ease-salida active:scale-[0.97] after:absolute after:-inset-1 disabled:cursor-not-allowed disabled:opacity-45";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role"> & {
  selected?: boolean;
  /**
   * "toggle" (por defecto): multiselección, usa aria-pressed.
   * "radio": selección única dentro de un role="radiogroup", usa aria-checked.
   * "shortcut": atajo sin estado (envía al tocar).
   */
  mode?: "toggle" | "radio" | "shortcut";
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

export function Chip({ selected = false, mode = "toggle", className, children, type = "button", ...rest }: ChipProps) {
  const aria =
    mode === "radio"
      ? { role: "radio" as const, "aria-checked": selected }
      : mode === "toggle"
        ? { "aria-pressed": selected }
        : {};

  const tone = selected
    ? "border-inverso bg-inverso text-sobre-inverso"
    : "border-linea-fuerte bg-transparent text-tinta hover:bg-hundido/60";

  return (
    <button type={type} className={cn(base, "px-4", tone, mode === "shortcut" && "shrink-0", className)} {...aria} {...rest}>
      {selected && mode !== "shortcut" ? <IconCheck className="size-4 shrink-0 text-sobre-inverso" /> : null}
      {children}
    </button>
  );
}

/** Chip de solo lectura (perfil). No es un botón. */
export function ReadOnlyChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-9 items-center rounded-full border-[1.5px] border-linea-fuerte bg-transparent px-4 font-body text-control text-tinta", className)}>
      {children}
    </span>
  );
}
