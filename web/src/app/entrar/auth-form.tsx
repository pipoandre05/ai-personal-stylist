"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { signIn, signUp } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/result";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = { email?: string; password?: string; terms?: string };

function validateEmail(v: string) {
  return EMAIL_RE.test(v.trim()) ? undefined : "Revisa el email, parece incompleto.";
}
function validatePassword(v: string) {
  return v.length >= 8 ? undefined : "La contraseña necesita al menos 8 caracteres.";
}

export function AuthForm({ crear }: { crear: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(crear ? signUp : signIn, null);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const serverError = state && !state.ok ? state.error : null;
  const existingAccount = Boolean(serverError && /ya tiene cuenta/i.test(serverError));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    const next: Errors = {
      email: validateEmail(String(data.get("email") ?? "")),
      password: validatePassword(String(data.get("password") ?? "")),
      terms: crear && !data.get("terms") ? "Para crear tu cuenta necesitas aceptar los términos." : undefined,
    };
    setErrors(next);
    if (next.email || next.password || next.terms) {
      e.preventDefault();
      (next.email ? emailRef : next.password ? passwordRef : termsRef).current?.focus();
    }
  }

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <Input
        ref={emailRef}
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={errors.email}
        onBlur={(e) => setErrors((p) => ({ ...p, email: e.target.value ? validateEmail(e.target.value) : undefined }))}
      />

      <Input
        ref={passwordRef}
        label="Contraseña"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete={crear ? "new-password" : "current-password"}
        minLength={8}
        required
        hint={crear ? "Mínimo 8 caracteres." : undefined}
        error={errors.password}
        onBlur={(e) => setErrors((p) => ({ ...p, password: e.target.value ? validatePassword(e.target.value) : undefined }))}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-sm px-3 text-sm font-medium text-acento"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        }
      />

      {crear ? (
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-tinta">
            <input
              ref={termsRef}
              type="checkbox"
              name="terms"
              required
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5 size-5 shrink-0 accent-acento"
            />
            <span>Acepto los términos y la política de privacidad</span>
          </label>
          {errors.terms ? (
            <p id="terms-error" role="alert" className="mt-1 text-sm text-error">
              {errors.terms}
            </p>
          ) : null}
        </div>
      ) : null}

      {serverError ? (
        <div role="alert" className="rounded-sm bg-error-suave p-4 text-sm text-error">
          {serverError}{" "}
          {existingAccount && crear ? (
            <Link href="/entrar" className="font-semibold underline underline-offset-4">
              Entrar
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        fullWidth
        loading={pending}
        loadingLabel={crear ? "Creando tu cuenta…" : "Entrando…"}
      >
        {crear ? "Crear cuenta" : "Entrar"}
      </Button>
    </form>
  );
}
