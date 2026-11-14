import type { Profile, StyleProfile } from "./types";

/** Campos de la primera conversación, en el orden en que el asesor los pregunta. */
export const PROFILE_FIELDS = [
  "display_name",
  "clothing_sections",
  "current_style",
  "aspirational_style",
  "occasions",
  "fit_and_comfort",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

type ProfileLike = Pick<Profile, "display_name"> | null | undefined;
type StyleLike = Partial<Pick<StyleProfile, "clothing_sections" | "current_style" | "aspirational_style" | "occasions" | "fit_preferences" | "comfort_constraints">> | null | undefined;

/** Campos que todavía no se han respondido (`perfil_incompleto` en el contexto del agente). Pura. */
export function missingProfileFields(profile: ProfileLike, style: StyleLike): ProfileField[] {
  const empty = (xs: string[] | undefined) => !xs || xs.length === 0;
  const missing: ProfileField[] = [];
  if (!profile?.display_name?.trim()) missing.push("display_name");
  if (empty(style?.clothing_sections)) missing.push("clothing_sections");
  if (empty(style?.current_style)) missing.push("current_style");
  if (empty(style?.aspirational_style)) missing.push("aspirational_style");
  if (empty(style?.occasions)) missing.push("occasions");
  if (empty(style?.fit_preferences) && empty(style?.comfort_constraints)) missing.push("fit_and_comfort");
  return missing;
}

/** El onboarding se da por completo con nombre, estilo actual y ocasiones (DP-17). */
export function isOnboardingComplete(profile: ProfileLike, style: StyleLike): boolean {
  const missing = missingProfileFields(profile, style);
  return !missing.includes("display_name") && !missing.includes("current_style") && !missing.includes("occasions");
}
