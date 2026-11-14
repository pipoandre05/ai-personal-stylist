"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { IconCamera } from "@/components/ui/icons";
import type { ChatIntent } from "@/lib/domain/types";

// El asesor ofrece "Mandar foto" / "Mandar selfie" como texto: esas opciones abren el selector en vez de enviar.
export const PHOTO_ACTION = /^(mandar|enviar|subir|tomar|sacar)\b.*\b(foto|selfie)\b/i;
export const SELFIE = /selfie/i;

export type SuggestedOption =
  | string
  | {
      id?: string;
      label: string;
      intent?: ChatIntent;
    };

export type SuggestedRepliesProps = {
  options: (string | SuggestedOption)[];
  multiple?: boolean;
  disabled?: boolean;
  onSend: (text: string, intent?: ChatIntent) => void | Promise<void>;
  onPickPhoto?: (selfie: boolean) => void;
  className?: string;
};

/**
 * UI-6 / UI-20 (Pieza A): Zona única de respuestas sugeridas y ajustes sobre el compositor.
 * - Modo simple: botones contorno de 44 px alineados a la derecha que envían en un clic.
 *   Dispara el texto o el intent asociado al refinamiento (looks o compras).
 *   "Mandar foto" / "Mandar selfie" incluye ícono de cámara y abre el selector de fotos.
 * - Modo múltiple: chips seleccionables (toggle) con aria-pressed y botón de acción "Listo" inverso.
 * - Sin lima (la acción lima queda reservada para el CTA principal del asesor).
 * - Transición de opacidad al enviar (150 ms, motion-reduce:transition-none).
 * - Resiliencia: si onSend falla o rechaza, restaura la visibilidad para no bloquear a la persona.
 */
export function SuggestedReplies({
  options,
  multiple = false,
  disabled = false,
  onSend,
  onPickPhoto,
  className,
}: SuggestedRepliesProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [isDismissing, setIsDismissing] = useState(false);

  if (!options || options.length === 0) {
    return null;
  }

  const handleSendSimple = async (
    label: string,
    intent: ChatIntent | undefined,
    isPhoto: boolean,
    isSelfie: boolean,
  ) => {
    if (disabled) return;
    if (isPhoto && onPickPhoto) {
      onPickPhoto(isSelfie);
      return;
    }
    setIsDismissing(true);
    try {
      await onSend(label, intent);
    } catch {
      setIsDismissing(false);
    }
  };

  const handleToggle = (label: string) => {
    if (disabled) return;
    setPicked((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const handleSendMultiple = async () => {
    if (disabled || picked.length === 0) return;
    setIsDismissing(true);
    try {
      await onSend(picked.join(", "));
    } catch {
      setIsDismissing(false);
    }
  };

  return (
    <div
      role="group"
      aria-label="Respuestas sugeridas"
      className={cn(
        "flex flex-wrap justify-end gap-2 px-6 pb-3 transition-opacity duration-150 motion-reduce:transition-none",
        isDismissing ? "pointer-events-none opacity-0" : "animate-aparecer opacity-100",
        className,
      )}
    >
      {multiple ? (
        <>
          {options.map((opt) => {
            const label = typeof opt === "string" ? opt : opt.label;
            const key = typeof opt === "string" ? opt : opt.id || opt.label;
            const selected = picked.includes(label);
            return (
              <Chip
                key={key}
                mode="toggle"
                selected={selected}
                disabled={disabled}
                onClick={() => handleToggle(label)}
              >
                {label}
              </Chip>
            );
          })}
          <Button
            variant="inverso"
            size="mediano"
            type="button"
            disabled={disabled || picked.length === 0}
            onClick={handleSendMultiple}
          >
            Listo
          </Button>
        </>
      ) : (
        options.map((opt) => {
          const label = typeof opt === "string" ? opt : opt.label;
          const intent = typeof opt === "string" ? undefined : opt.intent;
          const key = typeof opt === "string" ? opt : opt.id || opt.label;
          const isPhoto = PHOTO_ACTION.test(label);
          const isSelfie = SELFIE.test(label);
          return (
            <Button
              key={key}
              variant="contorno"
              size="mediano"
              type="button"
              disabled={disabled}
              icon={isPhoto ? <IconCamera className="size-5" /> : undefined}
              onClick={() => handleSendSimple(label, intent, isPhoto, isSelfie)}
            >
              {label}
            </Button>
          );
        })
      )}
    </div>
  );
}
