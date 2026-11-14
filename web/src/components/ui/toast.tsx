"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconAlert } from "./icons";

export type ToastInput = {
  message: string;
  tone?: "default" | "error";
  action?: { label: string; onAction: () => void };
};

type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<{ toast: (t: ToastInput) => void } | null>(null);

/** Muestra avisos breves. No roba foco; se anuncia con aria-live="polite". */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++counter.current;
      // Un solo aviso visible: el nuevo reemplaza al anterior.
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
      setItems([{ ...input, id }]);
      timers.current.set(id, setTimeout(() => dismiss(id), input.action ? 7000 : 5000));
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-app flex-col items-center gap-2 px-5 pb-3"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex min-h-12 w-full animate-subir items-center gap-3 rounded-md bg-tinta px-4 py-3 text-sm text-superficie shadow-flotante"
          >
            {t.tone === "error" ? <IconAlert className="size-5 shrink-0" /> : null}
            <p className="min-w-0 flex-1">{t.message}</p>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action?.onAction();
                  dismiss(t.id);
                }}
                className="-my-2 -mr-2 min-h-11 shrink-0 px-2 font-semibold text-superficie underline underline-offset-4"
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
