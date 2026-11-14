"use client";

import { useRef, useState } from "react";
import type { ConversationSummary } from "@/lib/domain/types";
import { buttonStyles } from "./button";
import { IconMenu, IconSpace } from "./icons";
import { SessionsSheet } from "./sessions-sheet";
import { SpaceSheet, type SpaceSummary } from "./space-sheet";

export type AppHeaderProps = {
  /** Resumen completo de Tu espacio para la hoja inferior. */
  summary?: SpaceSummary;
  /** Compatibilidad: número de prendas para mostrar junto a "Tu clóset". */
  closetCount?: number;
  /** Lista de sesiones históricas para el panel lateral. */
  conversations?: ConversationSummary[];
  /** Id de la sesión activa para destacarla en el panel. */
  currentConversationId?: string | null;
};

/**
 * Encabezado de la conversación (UI-20):
 * - Izquierda: botón de menú de 44 px para el panel de sesiones + Wordmark "Estilo".
 * - Derecha: botón contorno "Tu espacio" para la hoja inferior.
 */
export function AppHeader({
  summary,
  closetCount,
  conversations = [],
  currentConversationId,
}: AppHeaderProps) {
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const spaceButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const activeSummary: SpaceSummary = summary ?? {
    closetCount: closetCount ?? 0,
  };

  function handleCloseSpace() {
    setSpaceOpen(false);
    spaceButtonRef.current?.focus();
  }

  function handleCloseSessions() {
    setSessionsOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-20 bg-fondo/90 pt-seguro backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Lado izquierdo: menú de sesiones + wordmark */}
        <div className="flex items-center gap-2">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setSessionsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sessionsOpen}
            aria-label="Sesiones"
            className="inline-flex size-11 items-center justify-center rounded-full border border-linea-fuerte bg-transparent text-tinta transition-colors hover:bg-hundido"
          >
            <IconMenu className="size-5" />
          </button>
          <span className="font-display text-titulo font-extrabold tracking-[-0.03em]">
            Estilo
          </span>
        </div>

        {/* Lado derecho: Tu espacio */}
        <button
          ref={spaceButtonRef}
          type="button"
          onClick={() => setSpaceOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={spaceOpen}
          className={buttonStyles({ variant: "contorno", size: "mediano" })}
        >
          <IconSpace className="size-5" />
          <span>Tu espacio</span>
        </button>
      </div>

      <SessionsSheet
        open={sessionsOpen}
        onClose={handleCloseSessions}
        conversations={conversations}
        currentConversationId={currentConversationId}
      />
      <SpaceSheet open={spaceOpen} onClose={handleCloseSpace} summary={activeSummary} />
    </header>
  );
}
