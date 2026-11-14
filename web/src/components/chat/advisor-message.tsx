import { cn } from "@/components/ui";
import { eyebrowAccent } from "./styles";

type AdvisorMessageProps = {
  text: string;
  streaming?: boolean;
  className?: string;
};

/** Texto del asesor: editorial, sin burbuja, a ancho completo. Plano: nunca HTML; los saltos de párrafo se respetan. */
export function AdvisorMessage({ text, streaming, className }: AdvisorMessageProps) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;
  const last = paragraphs.length - 1;

  return (
    <div className={cn("text-base leading-relaxed text-tinta", className)}>
      <p className={cn(eyebrowAccent, "mb-1.5")}>Estilo</p>
      {paragraphs.map((p, i) => (
        <p key={i} className={cn("whitespace-pre-line break-words", i > 0 && "mt-3")}>
          {p}
          {streaming && i === last ? (
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-respirar bg-acento align-baseline"
            />
          ) : null}
        </p>
      ))}
    </div>
  );
}
