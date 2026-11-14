import type { ErrorInfo } from "react";
import type { ChatIntent, EventField, OutfitView, Refinement, ShoppingOptionsBlock } from "@/lib/domain/types";
import { CardBoundary } from "./error-boundary";
import { EventSummaryCard } from "./event-summary-card";
import { OutfitCardV2 } from "./outfit-card-v2";
import { OutfitPair } from "./outfit-pair";
import { SearchOffer } from "./search-offer";
import { ShoppingOptions } from "./shopping-options";
import type { V2Item } from "./thread-items-v2";
import { ToolSteps, type GarmentLookup } from "./tool-steps";

/** Qué hace el hilo cuando la persona toca algo en una tarjeta v2. Todo opcional: lo que falte deja la tarjeta de solo lectura. */
export type ThreadV2Handlers = {
  /** Corregir un dato del evento → `updateEventSummary({ [campo]: valor }, conversationId)`. */
  onEditEvent?: (field: EventField) => void;
  /** "Guardar look" → `setOutfitStatus(id, "saved")`. */
  onSaveOutfit?: (outfit: OutfitView) => void;
  /** "No es para mí" → `setOutfitStatus(id, "discarded")` + motivo (`rateOutfit`). */
  onDiscardOutfit?: (outfit: OutfitView) => void;
  /** Chip de refinamiento de un look o de unas opciones → `streamChat({ conversation_id, text: label, intent })`. */
  onRefine?: (intent: ChatIntent, label: string) => void;
  /** "Sí, búscame opciones" / "Por ahora no" → `streamChat({ conversation_id, text: action.label, intent: action.intent })`. */
  onSearchOfferAction?: (action: Refinement) => void;
  /** Elegir (o quitar) una opción → `selectShoppingOption(outfitId, optionId)`; `null` quita la elección. */
  onSelectOption?: (block: ShoppingOptionsBlock, outfitId: string | null, optionId: string | null) => void;
};

export type ThreadItemV2ViewProps = {
  item: V2Item;
  handlers?: ThreadV2Handlers;
  /** Prendas por id, para las miniaturas del rastro. */
  garments?: GarmentLookup;
  closetHref?: (garmentId: string) => string;
  /** Mientras hay una acción en vuelo (guardar, refinar). */
  busy?: boolean;
  /** Turno en vivo: anima la entrada. El historial no anima. */
  animate?: boolean;
  /** Fecha de referencia para "visto hoy" (la vista previa la fija). */
  now?: Date;
  onError?: (error: Error, info: ErrorInfo) => void;
};

/**
 * Pinta un ítem v2 envuelto en su propia contención de errores: una tarjeta rota muestra un aviso sobrio y el
 * resto del hilo sigue en pie.
 */
export function ThreadItemV2View({ item, handlers = {}, garments, closetHref, busy, animate, now, onError }: ThreadItemV2ViewProps) {
  const wrap = (label: string, node: React.ReactNode) => (
    <CardBoundary key={item.key} label={label} resetKey={item.key} onError={onError}>
      {node}
    </CardBoundary>
  );

  switch (item.kind) {
    case "steps":
      return wrap(
        "Rastro de pasos",
        <ToolSteps steps={item.steps} garments={garments} animate={animate} defaultOpen={item.phase === "search" ? false : undefined} />,
      );
    case "event":
      return wrap("Resumen del evento", <EventSummaryCard summary={item.summary} onEdit={handlers.onEditEvent} busy={busy} />);
    case "outfit":
      return wrap(
        "Look",
        <OutfitCardV2
          outfit={item.outfit}
          fresh={item.fresh}
          onSave={handlers.onSaveOutfit}
          onDiscard={handlers.onDiscardOutfit}
          onRefine={handlers.onRefine}
          closetHref={closetHref}
          busy={busy}
          animate={animate}
        />,
      );
    case "pair":
      return wrap(
        "Dos looks",
        <OutfitPair
          outfits={item.outfits}
          onSave={handlers.onSaveOutfit}
          onDiscard={handlers.onDiscardOutfit}
          onRefine={handlers.onRefine}
          closetHref={closetHref}
          busy={busy}
          animate={animate}
        />,
      );
    case "offer":
      return wrap(
        "Oferta de búsqueda",
        <SearchOffer offer={item.offer} pending={item.pending} onAction={handlers.onSearchOfferAction} busy={busy} />,
      );
    case "options":
      return wrap(
        "Opciones de compra",
        <ShoppingOptions
          block={item.block}
          outfit={item.outfit}
          now={now}
          busy={busy}
          animate={animate}
          onRefine={handlers.onRefine}
          onSelect={
            handlers.onSelectOption
              ? (optionId) => handlers.onSelectOption?.(item.block, item.block.for_outfit_id, optionId)
              : undefined
          }
        />,
      );
  }
}
