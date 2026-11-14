import { cn, Spinner } from "@/components/ui";
import { PersonMessage, FailedLine } from "./person-message";
import { Thumb } from "./thumb";

type PhotoMessageProps = {
  src: string | null;
  text: string;
  uploading?: boolean;
  sending?: boolean;
  /** La foto ya no se conserva (selfie borrada tras el análisis). */
  deleted?: boolean;
  error?: string | null;
  onRetry?: () => void;
  animate?: boolean;
};

/** Foto que envía la persona, alineada a la derecha; el texto adjunto va justo debajo. */
export function PhotoMessage({ src, text, uploading, sending, deleted, error, onRetry, animate }: PhotoMessageProps) {
  return (
    <div className={cn("flex flex-col items-end gap-1.5", animate && "animate-aparecer")}>
      <div className="relative aspect-[3/4] w-3/5 overflow-hidden rounded-lg rounded-br-xs bg-hundido">
        {deleted && !src ? (
          <div className="flex size-full items-center justify-center p-4 text-center text-xs text-tinta-suave">
            Selfie borrada después del análisis
          </div>
        ) : (
          <Thumb src={src} alt={deleted ? "Selfie (se borra después del análisis)" : "Foto que enviaste"} />
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-tinta/30 text-superficie">
            <Spinner className="size-6" label="Subiendo foto" />
          </div>
        ) : null}
      </div>
      {text ? <PersonMessage text={text} sending={sending || uploading} /> : null}
      {error ? <FailedLine error={error} onRetry={onRetry} /> : null}
    </div>
  );
}
