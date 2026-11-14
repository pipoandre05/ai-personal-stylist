// Botones compactos del hilo (h-11). Píldora completa (rounded-full), trazo 1.5, tokens de Prendie.

const base =
  "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border-[1.5px] font-body text-sm font-bold transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

export const btnPrimary = `${base} border-transparent bg-accion px-4 text-sobre-color hover:opacity-90`;
export const btnSecondary = `${base} border-linea-fuerte bg-transparent px-4 text-tinta hover:bg-hundido`;
export const btnPill = `${base} border-transparent bg-inverso px-5 text-sobre-inverso hover:opacity-90`;
export const btnText =
  "inline-flex h-11 items-center justify-center px-2 font-body text-sm font-bold text-tinta underline underline-offset-4 transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

/** Sobretítulo editorial (text-sobretitulo: 12px, mayúsculas, tracking 0.12em). */
export const eyebrow = "text-sobretitulo uppercase text-tinta-suave";
export const eyebrowAccent = "text-sobretitulo uppercase text-tinta";

/** Tarjetas del hilo (sin borde ni sombra; superficie sobre fondo). */
export const cardBase = "rounded-tarjeta bg-superficie p-[18px]";
