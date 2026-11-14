import { useId, type ReactNode } from "react";
import { IconAlert } from "./icons";
import { cn } from "./cn";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  /** Marca el campo como obligatorio en la etiqueta (asterisco visual). */
  required?: boolean;
  className?: string;
  /** Recibe los atributos de accesibilidad que debe llevar el control. */
  children: (control: FieldControlProps) => ReactNode;
};

/** Etiqueta visible + control + ayuda o error accesibles (aria-describedby). */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const uid = useId();
  const id = `f-${uid}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-tinta">
        {label}
        {required ? <span aria-hidden="true" className="text-tinta-suave"> *</span> : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-tinta-suave">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-error">
          <IconAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export const inputClasses = (invalid?: boolean) =>
  cn(
    "h-12 w-full rounded-sm border bg-superficie px-4 text-base text-tinta placeholder:text-tinta-suave focus-visible:border-acento",
    invalid ? "border-error" : "border-linea-fuerte",
  );
