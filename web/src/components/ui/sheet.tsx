"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "./icons";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Título visible y nombre accesible de la hoja. */
  title: string;
  children: ReactNode;
};

/**
 * Hoja inferior sobre <dialog> nativo: foco atrapado, Escape y fondo inertes los da el navegador.
 * Se cierra con Escape, con la X o tocando fuera.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mx-auto mt-auto max-h-[88dvh] w-full max-w-app overflow-y-auto rounded-t-lg bg-superficie p-0 text-tinta shadow-flotante backdrop:bg-tinta/50 open:animate-subir"
    >
      <div className="px-5 pt-3 pb-seguro">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-3 flex size-11 items-center justify-center rounded-full text-tinta"
          >
            <IconClose />
          </button>
        </div>
        <div className="mt-3 pb-4">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
