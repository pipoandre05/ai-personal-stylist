"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { getContextualGreeting, START_SUGGESTIONS } from "./greeting";

type GreetingCopy = { greeting: string; subtitle: string };

// El saludo se calcula una vez por nombre y se guarda: `useSyncExternalStore` exige que la lectura sea estable entre renders.
let cachedGreeting: { name: string | null; copy: GreetingCopy } | null = null;
function clientGreeting(name: string | null): GreetingCopy {
  if (!cachedGreeting || cachedGreeting.name !== name) cachedGreeting = { name, copy: getContextualGreeting(name) };
  return cachedGreeting.copy;
}
const subscribeNever = () => () => {};

export type StartScreenProps = {
  displayName?: string | null;
  onSelectSuggestion: (text: string) => void;
  disabled?: boolean;
  /** El compositor. En móvil queda fijo abajo; en pantallas anchas va bajo el saludo, como en los chats de asistentes. */
  composer?: ReactNode;
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
  composer,
}: StartScreenProps) {
  // El saludo depende de la hora del teléfono y de una variante al azar: se calcula después de montar, en el cliente.
  // Calcularlo durante el render lo dejaba distinto entre servidor y navegador (error de hidratación) y con la hora del servidor.
  // En el servidor (y durante la hidratación) no hay saludo; el navegador lo calcula justo después.
  const copy = useSyncExternalStore(
    subscribeNever,
    () => clientGreeting(displayName ?? null),
    () => null,
  );

  return (
    <section
      aria-label="Inicio de conversación"
      className="flex flex-1 flex-col items-center text-center"
    >
      <div className="mt-auto max-w-md px-6 pt-10">
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          {/* Mientras no hay saludo se reserva el alto, para que nada salte al aparecer. */}
          {copy ? copy.greeting : <span aria-hidden="true" className="invisible">Hola</span>}
        </h1>
        <p className="mt-2 text-cuerpo text-tinta-suave">
          {copy ? copy.subtitle : <span aria-hidden="true" className="invisible">…</span>}
        </p>
      </div>

      <div
        role="group"
        aria-label="Sugerencias para empezar"
        className="mt-8 flex w-full max-w-lg flex-col gap-2.5 px-6 pb-10 sm:flex-row sm:flex-wrap sm:justify-center md:order-3 md:mt-6 md:mb-auto"
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

      {/* Móvil: último y pegado abajo (los márgenes automáticos centran el saludo en el espacio que queda).
          Pantallas anchas: sube bajo el saludo y las sugerencias quedan después. */}
      {composer ? (
        <div className="sticky bottom-0 z-20 mt-auto w-full bg-fondo text-left md:static md:order-2 md:mt-8 md:px-6">{composer}</div>
      ) : null}
    </section>
  );
}
