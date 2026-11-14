import { OutfitCardV2 } from "@/components/chat/v2/outfit-card-v2";
import { fmtDate } from "@/lib/format";
import type { OutfitView } from "@/lib/domain/types";

type LookListProps = {
  outfits: OutfitView[];
  /** Título de la sección (h2). */
  heading?: string;
  description?: string;
};

/**
 * Lista de looks guardados en Tu espacio (UI-18):
 * Reutiliza OutfitCardV2 en modo compact (superficie blanca, sin controles de chat)
 * y muestra la fecha en que se guardó.
 */
export function LookList({ outfits, heading, description }: LookListProps) {
  if (outfits.length === 0) return null;

  return (
    <section aria-label={heading || "Tus looks"}>
      {heading ? (
        <h2 className="font-display text-titulo-s font-extrabold text-tinta">
          {heading}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-1 font-body text-meta text-tinta-suave">{description}</p>
      ) : null}
      <ul className="mt-4 space-y-6">
        {outfits.map((o) => (
          <li key={o.id} className="space-y-2">
            <OutfitCardV2
              outfit={o}
              compact
              closetHref={(id) => `/closet/${id}`}
            />
            <p className="px-1 font-body text-meta text-tinta-suave">
              Guardado el {fmtDate(o.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
