// Componentes de interfaz del contrato v2 del hilo. Presentación pura: reciben datos y callbacks por props.
// Integración paso a paso: ./README.md

export { CardBoundary, CardFallback } from "./error-boundary";
export { EventSummaryCard, type EventSummaryCardProps } from "./event-summary-card";
export { OutfitCardV2, OutfitCardSkeleton, outfitKicker, type OutfitCardV2Props } from "./outfit-card-v2";
export { OutfitPair, orderPair, type OutfitPairProps } from "./outfit-pair";
export { SearchOffer, type SearchOfferProps } from "./search-offer";
export { ShoppingOptions, searchLine, type ShoppingOptionsProps } from "./shopping-options";
export { ToolSteps, summarizeSteps, type GarmentLookup, type GarmentRef, type ToolStepsProps } from "./tool-steps";
export { ThreadItemV2View, type ThreadItemV2ViewProps, type ThreadV2Handlers } from "./thread-item-v2";
export {
  applyEventToTurn,
  buildThreadItemsV2,
  buildTurnItems,
  emptyTurnState,
  findFreshOutfitId,
  freshOutfitIdOf,
  normalizeSteps,
  type ItemContext,
  type TurnSource,
  type TurnState,
  type V2Item,
} from "./thread-items-v2";
export { fmtSeenAt, safeHttpsUrl, STOCK_NOTICE } from "./format";
