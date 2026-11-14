"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { siteUrl } from "@/lib/env";
import type { ActionResult } from "@/lib/domain/types";
import { GENERIC_ERROR } from "@/lib/server/action-helpers";
import { createClient } from "@/lib/supabase/server";

const Credentials = z.object({
  email: z.string().trim().toLowerCase().email("Ese correo no parece válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(72, "La contraseña es demasiado larga."),
});

function readCredentials(formData: FormData) {
  return Credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
}

/** Compatible con `useActionState(signUp, null)`. */
export async function signUp(_prev: ActionResult | null | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = readCredentials(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };

  let hasSession = false;
  try {
    const supabase = await createClient();
    const base = siteUrl();
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: base ? { emailRedirectTo: `${base}/entrar` } : undefined,
    });
    if (error) {
      if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
        return { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión." };
      }
      if (error.code === "weak_password") {
        return { ok: false, error: "Esa contraseña es muy fácil de adivinar. Prueba con otra más larga." };
      }
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return { ok: false, error: "Hiciste muchos intentos seguidos. Espera un momento e intenta de nuevo." };
      }
      return { ok: false, error: "No pudimos crear tu cuenta. Intenta de nuevo en un momento." };
    }
    // Con confirmación de correo activa, un correo ya registrado vuelve sin identidades y sin error.
    if (data.user && (data.user.identities?.length ?? 1) === 0) {
      return { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión." };
    }
    hasSession = Boolean(data.session);
    if (hasSession) void track("signup_completed", {});
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }

  // redirect() lanza: va fuera del try.
  if (hasSession) redirect("/asesor");
  return {
    ok: false,
    error: "Te enviamos un correo para confirmar tu cuenta. Revísalo y luego inicia sesión.",
  };
}

export async function signIn(_prev: ActionResult | null | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = readCredentials(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      if (error?.code === "email_not_confirmed") {
        return { ok: false, error: "Falta confirmar tu correo. Revisa tu bandeja y vuelve a intentar." };
      }
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
  // El onboarding ocurre dentro del chat (DP-17): siempre se entra a /asesor.
  redirect("/asesor");
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // aun si falla, se manda a la portada
  }
  redirect("/");
}
