import { cn } from "./cn";

type SpinnerProps = {
  className?: string;
  /** Texto para lectores de pantalla. Si se omite, el ícono es decorativo. */
  label?: string;
};

/** Indicador de carga. Gira con transform (se detiene con prefers-reduced-motion). */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden="true"
        className={cn("size-4 animate-spin", className)}
      >
        <circle cx="12" cy="12" r="9" opacity="0.25" />
        <path d="M21 12a9 9 0 00-9-9" />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}
