// Botones compactos del hilo (h-11). Los de `components/ui` son h-12; aquí no se pueden mezclar clases de
// altura sin un resolvedor de conflictos, así que el hilo define los suyos con los mismos tokens.

const base =
  "inline-flex h-11 min-w-11 items-center justify-center gap-2 font-body text-sm font-semibold transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const btnPrimary = `${base} rounded-sm bg-tinta px-4 text-superficie hover:opacity-90`;
export const btnSecondary = `${base} rounded-sm border border-tinta bg-transparent px-4 text-tinta hover:bg-hundido`;
export const btnPill = `${base} rounded-full bg-tinta px-5 text-superficie hover:opacity-90`;
export const btnText = `${base} px-2 font-medium text-acento underline decoration-1 underline-offset-4`;

/** Sobretítulo editorial (spec: text-xs, mayúsculas, tracking 0.14em). */
export const eyebrow = "text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave";
export const eyebrowAccent = "text-xs font-semibold uppercase tracking-[0.14em] text-acento";

/** Tarjetas del hilo. */
export const cardBase = "rounded-md border border-linea bg-superficie p-4";
