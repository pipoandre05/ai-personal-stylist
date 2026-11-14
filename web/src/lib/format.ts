const TZ = "America/Santiago";

const dateTime = new Intl.DateTimeFormat("es-CL", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("es-CL", {
  timeZone: "UTC", // un `date` no tiene hora: no debe correrse por zona horaria
  day: "numeric",
  month: "long",
  year: "numeric",
});

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** `timestamptz` -> "14 nov 2026, 09:30" en America/Santiago. */
export function fmtDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? "" : dateTime.format(d);
}

/** `date` (YYYY-MM-DD) -> "14 de noviembre de 2026", sin desfase de zona. */
export function fmtDateOnly(value: string): string {
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : dateOnly.format(d);
}

/** Monto entero en pesos chilenos: "$12.990". */
export function fmtCLP(amount: number): string {
  return clp.format(Math.round(amount)).replace(/\s/g, "");
}

/** Fecha de hoy en Santiago como YYYY-MM-DD. */
export function todayInSantiago(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** "sábado 14 de noviembre de 2026" en Santiago. */
export function longDateInSantiago(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

/** Instante UTC en que empieza hoy (00:00) en Santiago, como ISO. Para contar "mensajes de hoy". */
export function startOfTodayInSantiagoISO(now: Date = new Date()): string {
  const day = todayInSantiago(now); // YYYY-MM-DD local
  const asUtc = new Date(`${day}T00:00:00Z`);
  // Desfase de Santiago respecto de UTC en ese día (-3 o -4 h según horario de verano).
  const inSantiago = new Date(asUtc.toLocaleString("en-US", { timeZone: TZ }));
  const offsetMs = inSantiago.getTime() - new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(asUtc.getTime() - offsetMs).toISOString();
}
