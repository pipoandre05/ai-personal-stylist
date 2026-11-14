import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/button";
import type { Refinement, SearchOffer as SearchOfferData } from "@/lib/domain/types";
import { SLOT_SHORT } from "./format";
import { CategoryGlyph } from "./glyphs";

export type SearchOfferProps = {
  offer: SearchOfferData;
  /** Solo se puede responder si es el último mensaje del hilo (`ChatMessageView.search_offer`). */
  pending?: boolean;
  /** La persona tocó una respuesta: `action.intent` viaja tal cual (`accept_search` o `decline_search`). */
  onAction?: (action: Refinement) => void;
  busy?: boolean;
  className?: string;
};

/**
 * El asesor ofrece buscar la pieza que falta; nunca busca sin que la persona lo acepte. Las respuestas van a la
 * derecha y en voz de la persona, como las respuestas sugeridas. Deja claro que el asesor no compra nada.
 */
export function SearchOffer({ offer, pending = true, onAction, busy = false, className }: SearchOfferProps) {
  return (
    <section aria-label="Oferta para buscar la pieza que falta" className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start gap-3 rounded-campo bg-superficie p-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-insignia bg-falta text-sobre-color"
        >
          <CategoryGlyph category={offer.slot} className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sobretitulo uppercase text-tinta-suave">Lo que falta · {SLOT_SHORT[offer.slot].toLowerCase()}</p>
          <p className="mt-0.5 text-nombre text-tinta">{offer.description}</p>
          <p className="mt-1 text-meta text-tinta-suave">
            Puedo buscar hasta 3 opciones en tiendas. Yo no compro nada: tú eliges y compras en la tienda.
          </p>
        </div>
      </div>
      {pending ? (
        <div role="group" aria-label="Responder a la oferta" className="flex flex-wrap justify-end gap-2">
          {offer.actions.map((a) => (
            <Button
              key={a.id}
              variant="contorno"
              size="mediano"
              disabled={busy || !onAction}
              onClick={() => onAction?.(a)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
