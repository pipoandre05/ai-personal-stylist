import type { GarmentCategory } from "@/lib/domain/types";
import { stem } from "./text";

// Vocabulario para calzar una pieza pedida con las fichas de una tienda. Determinista y chico a propósito: es una
// ayuda de puntaje, no un clasificador. Palabras sin tildes y en singular (se comparan con `stem`).

const NOUNS: Record<GarmentCategory, string[]> = {
  shoes: ["sandalia", "zapato", "zapatilla", "bota", "botin", "mocasin", "mule", "bailarina", "alpargata", "zueco", "chalas", "stiletto", "sneaker", "ballerina", "oxford", "plataforma"],
  outerwear: ["blazer", "chaqueta", "abrigo", "parka", "cardigan", "polar", "chaleco", "poncho", "gabardina", "trench", "cazadora", "campera", "sobrecamisa", "kimono"],
  top: ["blusa", "camisa", "polera", "top", "sweater", "poleron", "camiseta", "tricot", "bodysuit", "musculosa", "jersey"],
  bottom: ["pantalon", "falda", "jeans", "short", "bermuda", "calza", "palazzo", "jogger", "culotte", "pollera"],
  dress: ["vestido", "enterito", "jumpsuit", "mono"],
  bag: ["cartera", "bolso", "mochila", "clutch", "bandolera", "tote", "rinonera", "morral", "sobre"],
  accessory: ["cinturon", "panuelo", "bufanda", "gorro", "collar", "aro", "lente", "sombrero", "reloj", "pulsera", "anillo", "pashmina", "guante", "cintillo", "joya"],
};

const NOUN_SET: Record<GarmentCategory, Set<string>> = Object.fromEntries(
  (Object.keys(NOUNS) as GarmentCategory[]).map((c) => [c, new Set(NOUNS[c].map(stem))]),
) as Record<GarmentCategory, Set<string>>;

export function isNounOf(category: GarmentCategory, word: string): boolean {
  return NOUN_SET[category].has(stem(word));
}

/** ¿La palabra es el nombre de alguna prenda de cualquier categoría? */
export function isAnyGarmentNoun(word: string): boolean {
  return (Object.keys(NOUN_SET) as GarmentCategory[]).some((c) => NOUN_SET[c].has(stem(word)));
}

// Familias de color: dentro de una familia el calce es parcial ("tono parecido"); la misma palabra calza completo.
const COLOR_FAMILIES: string[][] = [
  ["camel", "tostado", "caramelo", "cognac", "coñac", "miel", "tan", "cafe claro", "habano"],
  ["beige", "arena", "crudo", "nude", "natural", "hueso", "marfil", "avena", "champagne", "piedra", "taupe", "visón", "vison"],
  ["cafe", "marron", "chocolate", "moka", "mocca", "tabaco", "castano", "brown"],
  ["blanco", "off white", "ivory", "perla"],
  ["negro", "black", "carbon"],
  ["gris", "plomo", "grafito", "plata", "plateado"],
  ["azul", "marino", "navy", "celeste", "denim", "indigo", "petroleo"],
  ["verde", "salvia", "oliva", "musgo", "militar", "menta", "esmeralda", "botella"],
  ["rojo", "burdeo", "burgundy", "vino", "granate", "rojo"],
  ["rosa", "rosado", "fucsia", "palo de rosa", "coral", "salmon"],
  ["amarillo", "mostaza", "limon", "dorado", "oro"],
  ["morado", "lila", "violeta", "lavanda", "purpura"],
  ["naranja", "terracota", "teja", "ladrillo", "cobre"],
];

const FOLDED_FAMILIES = COLOR_FAMILIES.map((f) => f.map((w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()));

/** Calce de color entre lo pedido y el texto de la ficha: `exact` (la misma palabra), `family` (tono parecido) o `none`. */
export function colorMatch(wanted: string, haystackFolded: string): { level: "exact" | "family" | "near" | "none"; found?: string } {
  const w = wanted.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!w) return { level: "none" };
  const has = (term: string) => new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s|es)?([^a-z]|$)`).test(haystackFolded);
  const wantedWords = w.split(/\s+/).filter((x) => x.length >= 3);
  if (wantedWords.length && wantedWords.every(has)) return { level: "exact", found: w };
  const fams = FOLDED_FAMILIES.filter((f) => f.includes(w) || wantedWords.some((x) => f.includes(x)));
  for (const f of fams) {
    const hit = f.find((t) => has(t));
    if (hit) return { level: "family", found: hit };
  }
  // Tonos cercanos: los neutros cálidos (camel, beige, café) se llevan bien entre sí, pero no son lo pedido.
  const warm = FOLDED_FAMILIES.slice(0, 3);
  if (warm.some((f) => f.includes(w) || wantedWords.some((x) => f.includes(x)))) {
    for (const f of warm) {
      const hit = f.find((t) => has(t));
      if (hit) return { level: "near", found: hit };
    }
  }
  return { level: "none" };
}
