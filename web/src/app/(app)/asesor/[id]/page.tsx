import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Conversation } from "@/components/chat/conversation";
import { ThreadSkeleton } from "@/components/chat/thread-skeleton";
import type { SpaceSummary } from "@/components/ui";
import {
  getActiveColorAnalysis,
  getConversation,
  getProfile,
  listConversations,
  listGarments,
  listMemoryFacts,
  listOutfits,
} from "@/lib/data/queries";
import { COLOR_SEASON_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Tu asesor — Estilo" };

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Sesión histórica con el asesor (/asesor/[id]) (UI-20):
 * - Si getConversation(id) devuelve null (inexistente o ajena): redirige a /asesor.
 * - Si existe: monta el hilo con sus mensajes y el panel de sesiones sincronizado.
 */
async function HistoricalConversation({ id }: { id: string }) {
  const [conversation, conversations, garments, outfits, memoryFacts, palette, profile] = await Promise.all([
    getConversation(id),
    listConversations(),
    listGarments(),
    listOutfits({ status: "saved" }),
    listMemoryFacts(),
    getActiveColorAnalysis(),
    getProfile(),
  ]);

  if (!conversation) {
    redirect("/asesor");
  }

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
      conversationId={conversation.id}
      initialMessages={conversation.messages}
      autoStart={false}
      conversations={conversations}
      closetCount={garments.length}
      displayName={profile?.display_name ?? null}
      spaceSummary={spaceSummary}
    />
  );
}

export default async function HistoricalAsesorPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <HistoricalConversation id={id} />
    </Suspense>
  );
}
