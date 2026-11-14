"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppHeader, type SpaceSummary } from "@/components/ui";
import type { ChatMessageView, ConversationSummary } from "@/lib/domain/types";
import { Composer } from "./composer";
import { NEW_SESSION_PATH, startsNewSession } from "./new-session";
import { StartScreen } from "./start-screen";
import { SuggestedReplies } from "./suggested-replies";
import { Thread } from "./thread";
import { useConversation } from "./use-conversation";
import { EventEditor } from "./v2/event-editor";

type ConversationProps = {
  conversationId: string | null;
  initialMessages: ChatMessageView[];
  closetCount: number;
  displayName: string | null;
  spaceSummary?: SpaceSummary;
  conversations?: ConversationSummary[];
  autoStart?: boolean;
};

/**
 * Envoltura que reinicia el hilo al pedir "Nueva conversación".
 * Tras el primer mensaje la dirección pasa a `/asesor/<id>` sin cambiar de página (`history.replaceState`), así que volver
 * a `/asesor` no desmonta nada: sin esta envoltura el hilo anterior se quedaba en pantalla. Cambiar la `key` lo desmonta
 * y parte limpio. El cambio de `/asesor` a `/asesor/<id>` no la toca: no corta una respuesta en curso.
 */
export function Conversation(props: ConversationProps) {
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = useState(pathname);
  const [epoch, setEpoch] = useState(0);
  if (pathname !== previousPath) {
    setPreviousPath(pathname);
    if (startsNewSession(previousPath, pathname)) setEpoch((e) => e + 1);
  }
  // Al reiniciar se ignoran los mensajes con que se montó la página: una sesión nueva parte vacía.
  const fresh = epoch > 0 && pathname === NEW_SESSION_PATH;
  return (
    <ConversationView
      key={epoch}
      {...props}
      conversationId={fresh ? null : props.conversationId}
      initialMessages={fresh ? [] : props.initialMessages}
      autoStart={fresh ? false : props.autoStart}
    />
  );
}

/** Presentación del hilo y pantalla de inicio: solo marcado y clases. La lógica vive en `useConversation`. */
function ConversationView({
  conversationId,
  initialMessages,
  closetCount,
  displayName,
  spaceSummary,
  conversations = [],
  autoStart = false,
}: ConversationProps) {
  const [c, mainRef, composerRef] = useConversation({
    conversationId,
    initialMessages,
    autoStart,
  });
  const { replies, activeRefinements, busy, disabled } = c;

  const showStartScreen = c.items.length === 0;

  const composer = (
    <Composer
      ref={composerRef}
      busy={busy}
      disabled={disabled}
      placeholder={c.placeholder}
      onSend={(text, file) => c.send(text, file)}
      onStop={c.stop}
      onFocusField={c.onFocusField}
      // En la pantalla de inicio, en escritorio, el campo va suelto bajo el saludo: sin franja, sin caja alrededor.
      className={
        showStartScreen
          ? "escritorio:border-0 escritorio:bg-transparent escritorio:px-0 escritorio:pt-0 escritorio:pb-0"
          : undefined
      }
    />
  );

  return (
    <main
      id="contenido"
      ref={mainRef}
      data-inicio={showStartScreen ? "" : undefined}
      className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-fondo"
    >
      <AppHeader
        summary={spaceSummary}
        closetCount={closetCount}
        conversations={conversations}
        currentConversationId={conversationId}
      />
      <h1 className="sr-only">Tu asesor de imagen</h1>

      {!c.online ? (
        <p
          role="status"
          className="bg-alerta-suave px-5 py-2 text-sm text-alerta"
        >
          Sin conexión. Vuelve a conectarte para escribirle a tu asesor.
        </p>
      ) : null}

      {showStartScreen ? (
        <StartScreen
          displayName={displayName}
          onSelectSuggestion={(text) => c.send(text)}
          disabled={busy || disabled}
          composer={composer}
        />
      ) : (
        <Thread
          items={c.items}
          busy={busy}
          tool={c.tool}
          showStatus={c.awaiting}
          todayKey={c.todayKey}
          onRetryPerson={c.retryPerson}
          onRetryAdvisor={c.retryAdvisor}
          onAsk={(text) => c.send(text)}
          actionBusy={c.actionBusy}
          handlers={{
            onEditEvent: c.openEdit,
            onSaveOutfit: c.saveOutfit,
            onDiscardOutfit: c.discardOutfit,
            onRefine: c.refine,
            onSearchOfferAction: (a) => c.refine(a.intent, a.label),
            onSelectOption: c.selectOption,
          }}
        />
      )}

      <EventEditor
        field={c.editField}
        summary={c.editSummary}
        busy={c.actionBusy}
        onClose={c.closeEdit}
        onSubmit={c.submitEdit}
      />

      {c.failedStart ? (
        <p className="px-5 pb-4 text-sm text-tinta-suave">
          {displayName ? `${displayName}, no` : "No"} pude abrir la conversación
          todavía. Tus datos están guardados.
        </p>
      ) : null}

      {showStartScreen ? null : (
        <div className="sticky bottom-0 z-20 bg-fondo">
          {c.showJump ? (
            <button
              type="button"
              onClick={c.jumpToEnd}
              aria-label="Ir al final"
              className="absolute bottom-full left-1/2 mb-3 flex size-11 -translate-x-1/2 animate-aparecer items-center justify-center rounded-full bg-inverso text-sobre-inverso shadow-flotante"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5"
              >
                <path d="M12 5v13M6.5 12.5L12 18l5.5-5.5" />
              </svg>
            </button>
          ) : null}

          {/* Zona única de respuestas rápidas sobre el compositor (UI-20, Pieza A) */}
          {replies && !busy && !disabled ? (
            <SuggestedReplies
              key={`${replies.multiple}-${replies.options.join("|")}`}
              options={replies.options}
              multiple={replies.multiple}
              onSend={(text) => c.send(text)}
              onPickPhoto={c.pickPhoto}
            />
          ) : activeRefinements.length > 0 && !busy && !disabled ? (
            <SuggestedReplies
              key={activeRefinements.map((r) => r.id).join("|")}
              options={activeRefinements}
              onSend={(text, intent) => c.send(text, null, intent)}
              onPickPhoto={c.pickPhoto}
            />
          ) : null}

          {composer}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        <p key={c.announcement.n}>{c.announcement.text}</p>
      </div>
    </main>
  );
}
