"use client";

import { useRef, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./button";
import { IconCamera } from "./icons";

type PhotoButtonProps = {
  /** Se llama con la foto elegida (cámara o galería). */
  onFile: (file: File) => void;
  children?: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

/** Botón que abre cámara o galería (sin `capture` forzado: el sistema ofrece ambas). */
export function PhotoButton({
  onFile,
  children = "Agregar foto",
  variant = "secondary",
  loading,
  loadingLabel = "Subiendo foto…",
  disabled,
  fullWidth,
  className,
}: PhotoButtonProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // permite elegir la misma foto otra vez
          if (file) onFile(file);
        }}
      />
      <Button
        variant={variant}
        icon={<IconCamera className="size-5" />}
        loading={loading}
        loadingLabel={loadingLabel}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
        onClick={() => ref.current?.click()}
      >
        {children}
      </Button>
    </>
  );
}
