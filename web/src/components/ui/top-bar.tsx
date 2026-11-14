import Link from "next/link";
import type { ReactNode } from "react";
import { IconBack } from "./icons";
import { cn } from "./cn";

type TopBarProps = {
  /** Título de la pantalla (font-display). */
  title?: ReactNode;
  /** Muestra el wordmark "Estilo" en cursiva en vez de un título. */
  wordmark?: boolean;
  /** Ruta de la flecha. Por defecto "/asesor": el hogar es siempre la conversación. */
  backHref?: string;
  /** Nombre accesible de la flecha. */
  backLabel?: string;
  /** Oculta la flecha (solo para el encabezado de la conversación). */
  noBack?: boolean;
  /** Contenido a la derecha: normalmente un Button variante "text". */
  action?: ReactNode;
  className?: string;
};

/** Barra superior pegajosa con zona segura de iOS. */
export function TopBar({ title, wordmark, backHref = "/asesor", backLabel = "Volver a la conversación", noBack, action, className }: TopBarProps) {
  return (
    <header className={cn("sticky top-0 z-20 bg-fondo/90 pt-seguro backdrop-blur-md", className)}>
      <div className="flex h-14 items-center justify-between gap-2 px-5">
        <div className="flex min-w-0 items-center gap-1">
          {!noBack ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="-ml-3 flex size-11 shrink-0 items-center justify-center rounded-full text-tinta"
            >
              <IconBack />
            </Link>
          ) : null}
          {wordmark ? (
            <span className="font-display text-2xl italic">Estilo</span>
          ) : title ? (
            <span className="truncate font-display text-xl">{title}</span>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </div>
    </header>
  );
}
