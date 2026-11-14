"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { IconCamera } from "@/components/ui/icons";

// El asesor ofrece "Mandar foto" / "Mandar selfie" como texto: esas opciones abren el selector en vez de enviar.
export const PHOTO_ACTION = /^(mandar|enviar|subir|tomar|sacar)\b.*\b(foto|selfie)\b/i;
export const SELFIE = /selfie/i;

export type SuggestedRepliesProps = {
  options: string[];
  multiple?: boolean;
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
  onPickPhoto?: (selfie: boolean) => void;
  className?: string;
};

/**
 * UI-6: Respuestas sugeridas de un toque sobre el compositor.
 * - Modo simple: botones contorno de 44 px alineados a la derecha que envían en un clic.
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

  const handleSendSimple = async (option: string, isPhoto: boolean, isSelfie: boolean) => {
    if (disabled) return;
    if (isPhoto && onPickPhoto) {
      onPickPhoto(isSelfie);
      return;
    }
    setIsDismissing(true);
    try {
      await onSend(option);
    } catch {
      setIsDismissing(false);
    }
  };

  const handleToggle = (option: string) => {
    if (disabled) return;
    setPicked((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
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
          {options.map((o) => {
            const selected = picked.includes(o);
            return (
              <Chip
                key={o}
                mode="toggle"
                selected={selected}
                disabled={disabled}
                onClick={() => handleToggle(o)}
              >
                {o}
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
        options.map((o) => {
          const isPhoto = PHOTO_ACTION.test(o);
          const isSelfie = SELFIE.test(o);
          return (
            <Button
              key={o}
              variant="contorno"
              size="mediano"
              type="button"
              disabled={disabled}
              icon={isPhoto ? <IconCamera className="size-5" /> : undefined}
              onClick={() => handleSendSimple(o, isPhoto, isSelfie)}
            >
              {o}
            </Button>
          );
        })
      )}
    </div>
  );
}
