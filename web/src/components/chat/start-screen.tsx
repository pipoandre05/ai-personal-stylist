"use client";

import { useMemo } from "react";
import { getContextualGreeting, START_SUGGESTIONS } from "./greeting";

export type StartScreenProps = {
  displayName?: string | null;
  onSelectSuggestion: (text: string) => void;
  disabled?: boolean;
};

/**
 * Pantalla de inicio de sesión nueva (/asesor) (UI-20, Pieza C):
 * - Saludo contextual en el cliente según franja horaria y día.
 * - Con el nombre de la persona si existe, sin emoji ni la palabra "usuario".
 * - 4 sugerencias rápidas en píldoras que envían texto directo.
 * - Cero llamadas al asesor para pintar este saludo.
 */
export function StartScreen({
  displayName,
  onSelectSuggestion,
  disabled = false,
}: StartScreenProps) {
  const { greeting, subtitle } = useMemo(() => {
    return getContextualGreeting(displayName);
  }, [displayName]);

  return (
    <section
      aria-label="Inicio de conversación"
      className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="max-w-md">
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          {greeting}
        </h1>
        <p className="mt-2 text-cuerpo text-tinta-suave">
          {subtitle}
        </p>
      </div>

      <div
        role="group"
        aria-label="Sugerencias para empezar"
        className="mt-8 flex w-full max-w-lg flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center"
      >
        {START_SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(text)}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-linea-fuerte bg-transparent px-4 py-2.5 text-sm font-bold text-tinta transition-colors hover:bg-hundido focus-visible:outline focus-visible:outline-2 focus-visible:outline-foco disabled:opacity-45 text-left sm:text-center"
          >
            {text}
          </button>
        ))}
      </div>
    </section>
  );
}
