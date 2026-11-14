import type { ReactNode } from "react";
import { cn } from "./cn";
import { IconAlert } from "./icons";

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Normalmente un ButtonLink o Button. */
  action?: ReactNode;
  className?: string;
};

/** Estado vacío editorial: título en display, explicación y una acción. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-3 py-12", className)}>
      <h2 className="font-display text-titulo">{title}</h2>
      {description ? <p className="max-w-sm font-body text-cuerpo text-tinta-suave">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export type ErrorBlockProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * Bloque de error accesible (role="alert"):
 * rounded-campo border-[1.5px] border-error bg-superficie p-4 text-cuerpo text-tinta
 * con ícono y título text-error, y acción "Reintentar".
 */
export function ErrorBlock({
  title = "Ocurrió un error",
  message,
  onRetry,
  retryLabel = "Reintentar",
  className,
}: ErrorBlockProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-campo border-[1.5px] border-error bg-superficie p-4 font-body text-cuerpo text-tinta",
        className,
      )}
    >
      <IconAlert className="mt-0.5 size-5 shrink-0 text-error" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-error">{title}</p>
        {message ? <p className="mt-1 text-cuerpo text-tinta-suave">{message}</p> : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex h-11 items-center font-body text-sm font-bold text-tinta underline underline-offset-4 transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97]"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
