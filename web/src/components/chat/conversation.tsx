"use client";

import { AppHeader } from "@/components/ui";
import type { ChatMessageView } from "@/lib/domain/types";
import { Composer } from "./composer";
import { SuggestedReplies } from "./suggested-replies";
import { Thread } from "./thread";
import { useConversation } from "./use-conversation";

type ConversationProps = {
  conversationId: string | null;
  initialMessages: ChatMessageView[];
  closetCount: number;
  displayName: string | null;
};

/** Presentación del hilo: solo marcado y clases. La lógica vive en `useConversation`. */
export function Conversation({ conversationId, initialMessages, closetCount, displayName }: ConversationProps) {
  const [c, mainRef, composerRef] = useConversation({ conversationId, initialMessages });
  const { replies, busy, disabled } = c;

  return (
    <main id="contenido" ref={mainRef} className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-fondo">
      <AppHeader closetCount={closetCount} />
      <h1 className="sr-only">Tu asesor de imagen</h1>

      {!c.online ? (
        <p role="status" className="bg-alerta-suave px-5 py-2 text-sm text-alerta">
          Sin conexión. Vuelve a conectarte para escribirle a tu asesor.
        </p>
      ) : null}

      <Thread
        items={c.items}
        busy={busy}
        tool={c.tool}
        showStatus={c.awaiting}
        todayKey={c.todayKey}
        onRetryPerson={c.retryPerson}
        onRetryAdvisor={c.retryAdvisor}
        onAsk={(text) => c.send(text)}
      />

      {c.failedStart ? (
        <p className="px-5 pb-4 text-sm text-tinta-suave">
          {displayName ? `${displayName}, no` : "No"} pude abrir la conversación todavía. Tus datos están guardados.
        </p>
      ) : null}

      <div className="sticky bottom-0 z-20 border-t border-linea bg-fondo/90 backdrop-blur-md">
        {c.showJump ? (
          <button
            type="button"
            onClick={c.jumpToEnd}
            aria-label="Ir al final"
            className="absolute bottom-full left-1/2 mb-3 flex size-11 -translate-x-1/2 animate-aparecer items-center justify-center rounded-full bg-tinta text-superficie shadow-flotante"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5">
              <path d="M12 5v13M6.5 12.5L12 18l5.5-5.5" />
            </svg>
          </button>
        ) : null}

        {replies && !busy && !disabled ? (
          <SuggestedReplies
            key={`${replies.multiple}-${replies.options.join("|")}`}
            options={replies.options}
            multiple={replies.multiple}
            onSend={(text) => c.send(text)}
            onPickPhoto={c.pickPhoto}
          />
        ) : null}

        <Composer
          ref={composerRef}
          busy={busy}
          disabled={disabled}
          placeholder={c.placeholder}
          onSend={(text, file) => c.send(text, file)}
          onStop={c.stop}
          onFocusField={c.onFocusField}
        />
      </div>

      <div aria-live="polite" className="sr-only">
        <p key={c.announcement.n}>{c.announcement.text}</p>
      </div>
    </main>
  );
}
