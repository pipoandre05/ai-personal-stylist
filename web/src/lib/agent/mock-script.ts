import {
  COMFORT_OPTIONS,
  FIT_OPTIONS,
  OCCASION_OPTIONS,
  QUICK_OCCASIONS,
  SECTION_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/domain/types";
import type { ProfileField } from "@/lib/domain/profile-completeness";

// Guion del asesor simulado (AI_MODE=mock). Todo lo de este archivo es puro y determinista.

export type MockInput = {
  text: string;
  hasImage: boolean;
  start: boolean;
  missing: ProfileField[];
};

export type MockPlan =
  | { kind: "greet" }
  | { kind: "photo"; tool: "add_garment" | "analyze_palette" }
  | { kind: "look" }
  | { kind: "missing" }
  | { kind: "profile_answer"; field: ProfileField }
  | { kind: "chat" };

const PALETTE_WORDS = /\b(selfie|paleta|cara|rostro|color(es)?)\b/i;
const LOOK_WORDS = /(qu[eé] me pongo|\blook\b|outfit|[aá]rmame|conjunto|tenida|qu[eé] uso)/i;
const MISSING_WORDS = /(\bfalta\b|me faltan?|vers[aá]til)/i;

/** Decide qué hace el asesor simulado con el mensaje de la persona. */
export function planMockTurn(input: MockInput): MockPlan {
  if (input.start) return { kind: "greet" };
  if (input.hasImage) return { kind: "photo", tool: PALETTE_WORDS.test(input.text) ? "analyze_palette" : "add_garment" };
  if (LOOK_WORDS.test(input.text)) return { kind: "look" };
  if (MISSING_WORDS.test(input.text)) return { kind: "missing" };
  if (input.missing.length > 0) return { kind: "profile_answer", field: input.missing[0] };
  return { kind: "chat" };
}

export type ProfilePatch = {
  display_name?: string;
  clothing_sections?: string[];
  current_style?: string[];
  aspirational_style?: string[];
  occasions?: string[];
  fit_preferences?: string[];
  comfort_constraints?: string[];
};

const lower = (s: string) => s.toLowerCase();
const pickKnown = (text: string, options: readonly string[]) => options.filter((o) => lower(text).includes(lower(o)));
const splitFree = (text: string) =>
  text
    .split(/[,;]|\sy\s/)
    .map((x) => x.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 4);
const known = (text: string, options: readonly string[]) => {
  const hits = pickKnown(text, options);
  return hits.length ? [...hits] : splitFree(text);
};

/** Interpreta la respuesta de la persona a la pregunta pendiente. */
export function parseProfileAnswer(field: ProfileField, text: string): ProfilePatch {
  const clean = text.trim();
  switch (field) {
    case "display_name": {
      const name = clean.replace(/^(me llamo|mi nombre es|soy|yo soy)\s+/i, "").split(/[,.!]/)[0].trim().slice(0, 60);
      return { display_name: name ? name[0].toUpperCase() + name.slice(1) : "Amiga" };
    }
    case "clothing_sections":
      return { clothing_sections: known(clean, SECTION_OPTIONS) };
    case "current_style":
      return { current_style: known(clean, STYLE_OPTIONS) };
    case "aspirational_style":
      return { aspirational_style: known(clean, STYLE_OPTIONS) };
    case "occasions":
      return { occasions: known(clean, OCCASION_OPTIONS) };
    case "fit_and_comfort": {
      const fit = pickKnown(clean, FIT_OPTIONS);
      const comfort = pickKnown(clean, COMFORT_OPTIONS);
      if (fit.length || comfort.length) {
        return { ...(fit.length ? { fit_preferences: fit } : {}), ...(comfort.length ? { comfort_constraints: comfort } : {}) };
      }
      // "nada en particular" también es una respuesta: se registra para no volver a preguntar.
      return { fit_preferences: [/^(nada|ninguna?|no)\b/i.test(clean) ? "sin preferencia" : clean.slice(0, 60)] };
    }
  }
}

export type MockQuestion = { text: string; options: string[]; multiple: boolean };

/** Pregunta que corresponde a un campo pendiente. */
export function questionFor(field: ProfileField, name: string | null): MockQuestion {
  switch (field) {
    case "display_name":
      return {
        text: "Hola, soy tu asesor de imagen. Te ayudo a armar looks con la ropa que ya tienes. Para empezar, ¿cómo te llamas?",
        options: [],
        multiple: false,
      };
    case "clothing_sections":
      return { text: `${name ? `Mucho gusto, ${name}. ` : ""}¿Qué tipo de ropa usas?`, options: [...SECTION_OPTIONS], multiple: false };
    case "current_style":
      return { text: "¿Cómo describirías tu estilo hoy?", options: STYLE_OPTIONS.slice(0, 6), multiple: true };
    case "aspirational_style":
      return { text: "¿Y cómo te gustaría verte?", options: STYLE_OPTIONS.slice(0, 6), multiple: true };
    case "occasions":
      return { text: "¿Para qué ocasiones quieres más ideas?", options: OCCASION_OPTIONS.slice(0, 6), multiple: true };
    case "fit_and_comfort":
      return {
        text: "Última pregunta: ¿hay algo de calce o comodidad que deba tener en cuenta?",
        options: ["holgado", "entallado", "sin tacos", "sin prendas ajustadas", "Nada en particular"],
        multiple: true,
      };
  }
}

export const INVITE_TEXT =
  "Con esto ya te conozco mejor. Si quieres, mándame una selfie con luz natural y te propongo una paleta de colores orientativa (la foto no se guarda). Y mándame fotos de 3 a 5 prendas, una por foto, para armarte looks con tu clóset.";

export const CHAT_REPLY_OPTIONS = QUICK_OCCASIONS.map((o) => o.label);
