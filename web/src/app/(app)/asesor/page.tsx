import type { Metadata } from "next";
import { Suspense } from "react";
import { Conversation } from "@/components/chat/conversation";
import { ThreadSkeleton } from "@/components/chat/thread-skeleton";
import { countGarments, getLatestConversation, getProfile } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Tu asesor — Estilo" };

/** El hilo con el asesor: pantalla principal. Las lecturas de sesión van dentro de Suspense (Cache Components). */
async function AsesorContent() {
  const [conversation, closetCount, profile] = await Promise.all([getLatestConversation(), countGarments(), getProfile()]);
  return (
    <Conversation
      conversationId={conversation?.id ?? null}
      initialMessages={conversation?.messages ?? []}
      closetCount={closetCount}
      displayName={profile?.display_name ?? null}
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
