import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./cn";
import { IconCheck } from "./icons";

const base =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

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
  const tone =
    mode === "shortcut"
      ? "border-linea-fuerte bg-superficie text-tinta"
      : selected
        ? "border-acento bg-acento-suave text-acento"
        : "border-transparent bg-hundido text-tinta";
  return (
    <button type={type} className={cn(base, tone, mode === "shortcut" && "shrink-0", className)} {...aria} {...rest}>
      {selected && mode !== "shortcut" ? <IconCheck className="size-4" /> : null}
      {children}
    </button>
  );
}

/** Chip de solo lectura (perfil). No es un botón. */
export function ReadOnlyChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex min-h-8 items-center rounded-full bg-hundido px-3 text-sm text-tinta-suave", className)}>
      {children}
    </span>
  );
}
