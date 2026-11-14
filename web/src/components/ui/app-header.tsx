"use client";

import { useRef, useState } from "react";
import { buttonStyles } from "./button";
import { IconSpace } from "./icons";
import { SpaceSheet, type SpaceSummary } from "./space-sheet";

export type AppHeaderProps = {
  /** Resumen completo de Tu espacio para la hoja inferior. */
  summary?: SpaceSummary;
  /** Compatibilidad: número de prendas para mostrar junto a "Tu clóset". */
  closetCount?: number;
};

/**
 * Encabezado de la conversación:
 * Wordmark "Estilo" (Bricolage Grotesque 26px 800) + botón contorno "Tu espacio"
 * con ícono de cuadrícula que despliega la hoja inferior SpaceSheet accesible.
 */
export function AppHeader({ summary, closetCount }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeSummary: SpaceSummary = summary ?? {
    closetCount: closetCount ?? 0,
  };

  function handleClose() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-20 bg-fondo/90 pt-seguro backdrop-blur-md">
      <div className="flex h-14 items-center justify-between pl-6 pr-4">
        <span className="font-display text-titulo font-extrabold tracking-[-0.03em]">Estilo</span>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={buttonStyles({ variant: "contorno", size: "mediano" })}
        >
          <IconSpace className="size-5" />
          <span>Tu espacio</span>
        </button>
      </div>

      <SpaceSheet open={open} onClose={handleClose} summary={activeSummary} />
    </header>
  );
}
