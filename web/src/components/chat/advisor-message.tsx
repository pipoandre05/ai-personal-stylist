import type { ReactNode } from "react";
import { cn } from "@/components/ui";

type AdvisorMessageProps = {
  text: string;
  streaming?: boolean;
  hideSignature?: boolean;
  className?: string;
};

/**
 * Parsea formato simple de énfasis (**texto** o *texto*) a <strong> con font-extrabold,
 * manteniendo el texto plano y sin dependencias externas.
 */
function formatAdvisorText(content: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const boldText = match[2] ?? match[4];
    parts.push(
      <strong key={match.index} className="font-extrabold">
        {boldText}
      </strong>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

/** Texto del asesor: editorial, sin burbuja, a ancho completo (Manrope 600 16/24). */
export function AdvisorMessage({ text, streaming, hideSignature = false, className }: AdvisorMessageProps) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;
  const last = paragraphs.length - 1;

  return (
    <div
      className={cn(
        "text-destacado text-tinta [&_p+p]:mt-3 [&_strong]:font-extrabold [&_em]:font-extrabold [&_em]:not-italic [&_a]:font-extrabold [&_a]:underline [&_a]:underline-offset-4",
        className,
      )}
    >
      {!hideSignature ? (
        <span className="mb-1 block text-sobretitulo uppercase text-tinta-suave">Prendie</span>
      ) : null}
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line break-words">
          {formatAdvisorText(p)}
          {streaming && i === last ? (
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-4 w-[2px] translate-y-0.5 bg-tinta animate-respirar motion-reduce:animate-none"
            />
          ) : null}
        </p>
      ))}
    </div>
  );
}
