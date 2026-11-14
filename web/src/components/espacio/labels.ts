// Textos compartidos de "Tu espacio" (sin "use client": los usan servidor y cliente).

export const FORMALITY_LABELS: Record<number, string> = {
  1: "Deportivo",
  2: "Casual",
  3: "Intermedio",
  4: "Formal",
  5: "Gala",
};

export const UNDERTONE_LABELS = { calido: "cálido", frio: "frío", neutro: "neutro" } as const;
export const CONTRAST_LABELS = { bajo: "bajo", medio: "medio", alto: "alto" } as const;
export const CONFIDENCE_LABELS = { baja: "Confianza baja", media: "Confianza media", alta: "Confianza alta" } as const;

/** "día a día" -> "Día a día". Los valores guardados van en minúsculas. */
export function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export const sectionLabelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-tinta-suave";
export const overlineClass = "text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave";
