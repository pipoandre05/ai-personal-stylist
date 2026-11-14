import type { Metadata } from "next";
import { Suspense } from "react";
import { Conversation } from "@/components/chat/conversation";
import { ThreadSkeleton } from "@/components/chat/thread-skeleton";
import type { SpaceSummary } from "@/components/ui";
import {
  getActiveColorAnalysis,
  getProfile,
  listConversations,
  listGarments,
  listMemoryFacts,
  listOutfits,
  needsOnboarding,
} from "@/lib/data/queries";
import { COLOR_SEASON_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Tu asesor — Prendie" };

/**
 * Sesión nueva con el asesor (/asesor) (UI-20):
 * - Pantalla de inicio de cero con saludo contextual y sugerencias.
 * - No lee getLatestConversation ni llama al asesor de entrada (salvo onboarding pendiente).
 * - Carga sesiones para el panel lateral de navegación.
 */
async function AsesorContent() {
  const [onboarding, conversations, garments, outfits, memoryFacts, palette, profile] = await Promise.all([
    needsOnboarding(),
    listConversations(),
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
      conversationId={null}
      initialMessages={[]}
      autoStart={onboarding}
      conversations={conversations}
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
