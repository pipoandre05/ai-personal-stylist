import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { Field, inputClasses } from "./field";
import { cn } from "./cn";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string | null;
  ref?: Ref<HTMLInputElement>;
  /** Contenido a la derecha dentro del campo (p. ej. botón mostrar/ocultar). Debe medir ≥ 44 px de alto/ancho si es interactivo. */
  endAdornment?: ReactNode;
  wrapperClassName?: string;
};

/** Campo de texto con label visible, ayuda y error. `font-size` 16px para evitar el zoom de iOS. */
export function Input({
  label,
  hint,
  error,
  required,
  endAdornment,
  wrapperClassName,
  className,
  ref,
  ...rest
}: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(control) => (
        <div className="relative">
          <input
            ref={ref}
            required={required}
            className={cn(inputClasses(Boolean(error)), Boolean(endAdornment) && "pr-24", className)}
            {...control}
            {...rest}
          />
          {endAdornment ? <div className="absolute inset-y-0 right-0 flex items-center pr-1">{endAdornment}</div> : null}
        </div>
      )}
    </Field>
  );
}
