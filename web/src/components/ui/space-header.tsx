import Link from "next/link";
import { IconBack } from "./icons";
import { cn } from "./cn";

export type SpaceHeaderProps = {
  /** Enlace de regreso. Por defecto "/asesor": el hogar siempre es la conversación. */
  backHref?: string;
  /** Texto visible de la acción. */
  backLabel?: string;
  className?: string;
};

/**
 * Encabezado de vistas secundarias de Tu espacio:
 * Sticky, 56 px, enlace "Volver a la conversación" con chevron y área táctil accesible.
 */
export function SpaceHeader({
  backHref = "/asesor",
  backLabel = "Volver a la conversación",
  className,
}: SpaceHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-20 flex h-14 items-center bg-fondo/90 px-4 pt-seguro backdrop-blur-md", className)}>
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-1 -ml-2 px-2 rounded-full font-body text-control text-tinta transition-colors hover:text-tinta-suave focus-visible:ring-3 focus-visible:ring-foco"
      >
        <IconBack className="size-5 shrink-0" aria-hidden="true" />
        <span>{backLabel}</span>
      </Link>
    </header>
  );
}
