import { btnText } from "./styles";
import { cn } from "@/components/ui";

type PersonMessageProps = {
  text: string;
  sending?: boolean;
  /** Mensaje de fallo (no se envió). */
  error?: string | null;
  onRetry?: () => void;
  animate?: boolean;
};

/** Lo que escribe la persona: bloque `hundido` a la derecha. */
export function PersonMessage({ text, sending, error, onRetry, animate }: PersonMessageProps) {
  if (!text) return null;
  return (
    <div className={cn("flex flex-col items-end", animate && "animate-aparecer")}>
      <p
        className={cn(
          "w-fit max-w-[82%] whitespace-pre-wrap break-words rounded-campo bg-hundido px-4 py-3 text-cuerpo font-medium text-tinta transition-opacity duration-150",
          sending && "opacity-70",
        )}
      >
        <span className="sr-only">Tú: </span>
        {text}
      </p>
      {error ? <FailedLine error={error} onRetry={onRetry} /> : null}
    </div>
  );
}

export function FailedLine({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mt-1 flex max-w-[82%] flex-wrap items-center justify-end gap-x-2 text-right text-meta text-error">
      <span>No se envió. {error}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={btnText}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
