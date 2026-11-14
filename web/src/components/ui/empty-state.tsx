import type { ReactNode } from "react";
import { cn } from "./cn";

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
      <h2 className="font-display text-3xl">{title}</h2>
      {description ? <p className="max-w-sm text-tinta-suave">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
