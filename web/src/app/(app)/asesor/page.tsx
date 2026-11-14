import type { Metadata } from "next";
import { Suspense } from "react";
import { Conversation } from "@/components/chat/conversation";
import { ThreadSkeleton } from "@/components/chat/thread-skeleton";
import type { SpaceSummary } from "@/components/ui";
import {
  getActiveColorAnalysis,
  getLatestConversation,
  getProfile,
  listGarments,
  listMemoryFacts,
  listOutfits,
} from "@/lib/data/queries";
import { COLOR_SEASON_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Tu asesor — Estilo" };

/** El hilo con el asesor: pantalla principal. Las lecturas de sesión van dentro de Suspense (Cache Components). */
async function AsesorContent() {
  const [conversation, garments, outfits, memoryFacts, palette, profile] = await Promise.all([
    getLatestConversation(),
    listGarments(),
    listOutfits({ status: "saved" }),
    listMemoryFacts(),
    getActiveColorAnalysis(),
    getProfile(),
  ]);

  const spaceSummary: SpaceSummary = {
    closetCount: garments.length,
    latestGarmentName: garments[0]?.name ?? null,
    garmentThumbs: garments
      .slice(0, 3)
      .map((g) => g.photo_url)
      .filter((u): u is string => Boolean(u)),
    looksCount: outfits.length,
    latestLookTitle: outfits[0]?.title ?? null,
    lookThumb: outfits[0]?.items[0]?.photo_url ?? null,
    memoryCount: memoryFacts.length,
    latestMemoryFact: memoryFacts[0]?.fact ?? null,
    paletteSeason: palette ? COLOR_SEASON_LABELS[palette.season] : null,
    paletteSwatches: palette?.recommended.slice(0, 5).map((c) => c.hex) ?? [],
  };

  return (
    <Conversation
      conversationId={conversation?.id ?? null}
      initialMessages={conversation?.messages ?? []}
      closetCount={garments.length}
      displayName={profile?.display_name ?? null}
      spaceSummary={spaceSummary}
    />
  );
}

export default function AsesorPage() {
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <AsesorContent />
    </Suspense>
  );
}
