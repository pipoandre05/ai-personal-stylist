"use client";

import { useState, useTransition } from "react";
import { Button, Input, useToast } from "@/components/ui";
import { deleteMyData } from "@/lib/actions/privacy";

const CONFIRM_WORD = "BORRAR";

/**
 * Borrado definitivo de cuenta (UI-18):
 * Confirmación destructiva en dos pasos (escribir BORRAR) y estilo de botón error.
 */
export function DeleteAccount() {
  const { toast } = useToast();
  const [step, setStep] = useState<0 | 1>(0);
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteMyData();
      if (res && !res.ok) {
        setError(res.error);
        toast({ message: res.error, tone: "error" });
      }
    });
  }

  if (step === 0) {
    return (
      <Button variant="destructive" onClick={() => setStep(1)} aria-expanded={false}>
        Borrar mi cuenta
      </Button>
    );
  }

  const ready = word.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <section aria-labelledby="borrar-titulo" className="rounded-tarjeta bg-hundido p-4">
      <h3 id="borrar-titulo" className="font-display text-titulo-s font-extrabold text-error">
        Esto no se puede deshacer
      </h3>
      <p className="mt-2 font-body text-cuerpo text-tinta">Se borrará todo, de forma definitiva:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-cuerpo text-tinta">
        <li>tus fotos</li>
        <li>tus prendas</li>
        <li>tus looks</li>
        <li>tu conversación con el asesor</li>
        <li>lo que el asesor recuerda de ti</li>
        <li>tu cuenta</li>
      </ul>
      <div className="mt-4">
        <Input
          label={`Para confirmar, escribe ${CONFIRM_WORD}`}
          value={word}
          onChange={(e) => setWord(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          error={error}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="destructive" disabled={!ready} loading={pending} loadingLabel="Borrando…" onClick={confirm}>
          Borrar todo para siempre
        </Button>
        <Button
          variant="text"
          className="text-tinta"
          disabled={pending}
          onClick={() => {
            setStep(0);
            setWord("");
            setError(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </section>
  );
}
