"use client";

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { IconCamera, IconClose, IconSend } from "@/components/ui";

export type ComposerHandle = {
  /** Abre el selector de foto; con `selfie` pide la cámara frontal. */
  openPicker: (selfie?: boolean) => void;
  focus: () => void;
};

type ComposerProps = {
  /** El asesor está respondiendo (o se está subiendo una foto): Enviar pasa a "Detener". */
  busy: boolean;
  /** Campo y foto bloqueados (sin conexión, límite diario). */
  disabled?: boolean;
  placeholder?: string;
  onSend: (text: string, file: File | null) => void;
  onStop: () => void;
  onFocusField?: () => void;
  ref?: Ref<ComposerHandle>;
};

const MAX_FIELD_PX = 128; // 5 líneas

/** Compositor: foto + campo blanco con borde de tinta + enviar/detener. */
export function Composer({ busy, disabled, placeholder, onSend, onStop, onFocusField, ref }: ComposerProps) {
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<{ file: File; url: string } | null>(null);
  const stagedRef = useRef(staged);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openPicker(selfie = false) {
      const input = inputRef.current;
      if (!input) return;
      if (selfie) input.setAttribute("capture", "user");
      else input.removeAttribute("capture");
      input.click();
    },
    focus() {
      fieldRef.current?.focus({ preventScroll: true });
    },
  }));

  // La vista previa usa una URL de objeto: se libera al reemplazarla, quitarla o desmontar.
  useEffect(() => () => {
    if (stagedRef.current) URL.revokeObjectURL(stagedRef.current.url);
  }, []);

  function stage(file: File | null) {
    if (stagedRef.current) URL.revokeObjectURL(stagedRef.current.url);
    const next = file ? { file, url: URL.createObjectURL(file) } : null;
    stagedRef.current = next;
    setStaged(next);
  }

  // El campo crece con el texto, hasta 5 líneas.
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_PX)}px`;
  }, [text]);

  const canSend = !busy && !disabled && (text.trim().length > 0 || staged !== null);

  function submit() {
    if (!canSend) return;
    onSend(text.trim(), staged?.file ?? null);
    setText("");
    // La URL de la vista previa se libera aquí; el hilo crea la suya para la foto enviada.
    stage(null);
    // En escritorio el foco se queda en el campo. En móvil no se fuerza: reabriría el teclado.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) fieldRef.current?.focus({ preventScroll: true });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    // Enter envía solo con teclado físico (escritorio); en móvil es salto de línea.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col border-t border-linea bg-superficie px-4 pt-2.5 pb-seguro">
      {staged ? (
        <div className="relative mb-2 w-20">
          {/* Vista previa local (URL de objeto): next/image no aplica. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={staged.url} alt="Foto lista para enviar" className="aspect-[4/5] w-full rounded-insignia bg-hundido object-cover" />
          <button
            type="button"
            onClick={() => stage(null)}
            aria-label="Quitar foto"
            className="absolute -top-2.5 -right-2.5 flex size-11 items-center justify-center"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-inverso text-sobre-inverso shadow-flotante">
              <IconClose className="size-4" />
            </span>
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            e.target.value = ""; // permite elegir la misma foto otra vez
            if (picked) {
              stage(picked);
              fieldRef.current?.focus({ preventScroll: true });
            }
          }}
        />
        <button
          type="button"
          aria-label="Mandar una foto"
          disabled={busy || disabled}
          onClick={() => {
            inputRef.current?.removeAttribute("capture");
            inputRef.current?.click();
          }}
          className="grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-linea-fuerte bg-transparent text-tinta transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <IconCamera className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <label htmlFor="mensaje" className="sr-only">
            Escríbele a tu asesor
          </label>
          <textarea
            id="mensaje"
            ref={fieldRef}
            rows={1}
            value={text}
            disabled={disabled}
            enterKeyHint="send"
            autoComplete="off"
            placeholder={placeholder ?? "Escríbele a tu asesor…"}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocusField}
            className="block max-h-32 min-h-11 w-full min-w-0 resize-none rounded-campo border-[1.5px] border-linea-fuerte bg-superficie px-4 py-2.5 font-body text-base font-medium leading-6 text-tinta placeholder:text-tinta-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-foco disabled:cursor-not-allowed disabled:opacity-45"
          />
        </div>

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Detener respuesta"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-inverso text-sobre-inverso transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97]"
          >
            <span className="size-3 rounded-[2px] bg-sobre-inverso" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Enviar"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-inverso text-sobre-inverso transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <IconSend className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
