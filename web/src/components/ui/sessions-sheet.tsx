"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ConversationSummary } from "@/lib/domain/types";
import { fmtDate } from "@/lib/format";
import { cn } from "./cn";
import { IconClose, IconPlus } from "./icons";

export type SessionsSheetProps = {
  open: boolean;
  onClose: () => void;
  conversations?: ConversationSummary[];
  currentConversationId?: string | null;
};

/**
 * Panel lateral deslizable de sesiones (UI-20, Pieza D) sobre <dialog> nativo:
 * Botón de "Nueva conversación" hacia /asesor, lista histórica ordenada por fecha
 * con fmtDate(), accesibilidad completa (foco al título, Escape, velo) y voz de Prendie.
 */
export function SessionsSheet({
  open,
  onClose,
  conversations = [],
  currentConversationId,
}: SessionsSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const items = conversations.slice(0, 50);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sessions-sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      // `open:flex` y no `flex`: una clase de display fija le gana a `dialog:not([open]) { display: none }` del navegador
      // y deja el panel visible aunque esté cerrado.
      className="m-0 fixed inset-y-0 left-0 z-50 open:flex h-full max-h-dvh w-[85%] max-w-[340px] flex-col overflow-hidden bg-superficie p-5 text-tinta shadow-flotante backdrop:bg-tinta/40 open:animate-aparecer"
    >
      {/* Cabecera */}
      <div className="flex shrink-0 items-center justify-between">
        <h2
          id="sessions-sheet-title"
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta outline-none"
        >
          Conversaciones
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-hundido"
        >
          <IconClose className="size-5" />
        </button>
      </div>

      {/* Nueva conversación */}
      <div className="mt-4 shrink-0">
        <Link
          href="/asesor"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-linea-fuerte bg-transparent text-sm font-bold text-tinta transition-colors hover:bg-hundido"
        >
          <IconPlus className="size-4" />
          <span>Nueva conversación</span>
        </Link>
      </div>

      {/* Lista de sesiones */}
      <div className="mt-5 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {items.length === 0 ? (
          <div className="rounded-tarjeta bg-hundido px-4 py-6 text-center text-meta text-tinta-suave">
            Aún no tienes conversaciones guardadas. Escríbele a tu asesor para empezar.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-linea" role="list">
            {items.map((c) => {
              const isCurrent = c.id === currentConversationId;
              const title = c.title?.trim() || "Conversación";
              return (
                <li key={c.id}>
                  <Link
                    href={`/asesor/${c.id}`}
                    onClick={onClose}
                    className={cn(
                      "group flex flex-col py-3 px-2 rounded-lg transition-colors hover:bg-hundido",
                      isCurrent && "bg-hundido",
                    )}
                  >
                    <span className="line-clamp-1 text-sm font-bold text-tinta">
                      {title}
                    </span>
                    <span className="mt-1 text-meta text-tinta-suave">
                      {fmtDate(c.updated_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </dialog>
  );
}
