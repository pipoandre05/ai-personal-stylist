// Utilidades de texto: todo lo que viene de una tienda se trata como TEXTO PLANO (BF-09).

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ntilde: "ñ", Ntilde: "Ñ" };

/** Quita etiquetas HTML, decodifica entidades básicas, elimina caracteres de control y colapsa espacios. */
export function plainText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  let s = input.slice(0, max * 8);
  s = s.replace(/<[^>]*>/g, " ");
  s = s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? Number.parseInt(e.slice(2), 16) : Number.parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 31 && code < 0x10ffff ? String.fromCodePoint(code) : " ";
    }
    return ENTITIES[e] ?? " ";
  });
  // Tras decodificar pueden reaparecer etiquetas (`&lt;b&gt;`): se vuelven a quitar.
  s = s.replace(/<[^>]*>/g, " ");
  // Caracteres de control, de ancho cero y de dirección de texto.
  s = s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, " ");
  s = s.replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Minúsculas y sin tildes. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Raíz muy simple para singular/plural en español: `sandalias` y `sandalia` quedan iguales. */
export function stem(t: string): string {
  if (t.length > 5 && t.endsWith("es")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s")) return t.slice(0, -1);
  return t;
}

/** Palabras de al menos 3 letras, sin tildes, en minúsculas. */
export function words(s: string): string[] {
  return fold(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

export const STOPWORDS = new Set([
  "del", "con", "sin", "para", "por", "una", "uno", "unos", "unas", "los", "las", "color", "tono", "tipo", "estilo",
  "hasta", "como", "que", "muy", "mas", "menos", "pieza", "algo", "cerca", "talla", "precio",
]);
