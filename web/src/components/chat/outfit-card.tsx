"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, cn, IconCheck, IconPlus, Spinner, useToast } from "@/components/ui";
import { rateOutfit, setOutfitStatus } from "@/lib/actions/outfits";
import type { OutfitItemView, OutfitRating, OutfitView } from "@/lib/domain/types";
import { btnPrimary, btnSecondary, cardBase, eyebrow, eyebrowAccent } from "./styles";
import { Thumb } from "./thumb";

const REASONS = ["No es mi estilo", "Muy formal", "Muy casual", "No me acomoda", "Otro motivo"] as const;

type Layout = { container: string; cells: string[] };

/** Composición editorial según cuántas prendas hay (2 a 6). */
function layoutFor(n: number): Layout {
  switch (n) {
    case 1:
      return { container: "aspect-[4/5]", cells: [""] };
    case 2:
      return { container: "grid-cols-2 aspect-[3/2]", cells: ["", ""] };
    case 3:
      return { container: "grid-cols-2 grid-rows-2 aspect-[4/5]", cells: ["row-span-2", "", ""] };
    case 4:
      return { container: "grid-cols-2 grid-rows-3 aspect-[4/5]", cells: ["row-span-3", "", "", ""] };
    case 5:
      return {
        container: "grid-cols-6 grid-rows-[3fr_2fr] aspect-[4/5]",
        cells: ["col-span-3", "col-span-3", "col-span-2", "col-span-2", "col-span-2"],
      };
    default:
      return {
        container: "grid-cols-3 grid-rows-[3fr_2fr_2fr] aspect-[4/5]",
        cells: ["col-span-2 row-span-2", "", "", "", "", ""],
      };
  }
}

function Collage({ items, animate }: { items: OutfitItemView[]; animate?: boolean }) {
  const photos = items.slice(0, 6);
  const layout = layoutFor(photos.length);
  return (
    <div className={cn("mt-4 grid gap-1.5", layout.container)}>
      {photos.map((it, i) => (
        <div
          key={it.garment_id}
          className={cn("relative overflow-hidden rounded-sm bg-hundido", layout.cells[i], animate && "animate-aparecer")}
          style={animate ? { animationDelay: `${i * 40}ms` } : undefined}
        >
          <Thumb src={it.photo_url} alt={it.name} fallbackLabel={it.name} />
        </div>
      ))}
    </div>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

type OutfitCardProps = {
  outfit: OutfitView;
  animate?: boolean;
  /** Pide algo al asesor (p. ej. otra opción tras "No es para mí"). */
  onAsk?: (text: string) => void;
};

type Busy = "save" | "discard" | "rate" | null;

export function OutfitCard({ outfit, animate, onAsk }: OutfitCardProps) {
  const { toast } = useToast();
  const [state, setState] = useState<"proposed" | "saved" | "discarded">(
    outfit.status === "saved" ? "saved" : outfit.status === "discarded" ? "discarded" : "proposed",
  );
  const [rating, setRating] = useState<OutfitRating | null>(outfit.rating);
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const titleId = `look-${outfit.id}`;

  const fail = (error: string) => toast({ message: error, tone: "error" });

  async function save() {
    setBusy("save");
    const r = await setOutfitStatus(outfit.id, "saved");
    setBusy(null);
    if (!r.ok) return fail(r.error);
    setState("saved");
  }

  async function rate(value: "love" | "ok") {
    setBusy("rate");
    const r = await rateOutfit(outfit.id, value);
    setBusy(null);
    if (!r.ok) return fail(r.error);
    setRating(value);
  }

  async function discard() {
    setBusy("discard");
    const r = await setOutfitStatus(outfit.id, "discarded");
    if (!r.ok) {
      setBusy(null);
      return fail(r.error);
    }
    const rated = await rateOutfit(outfit.id, "no");
    setBusy(null);
    if (!rated.ok) return fail(rated.error);
    setRating("no");
    setState("discarded");
  }

  async function chooseReason(value: (typeof REASONS)[number]) {
    setBusy("rate");
    // "Otro motivo" no aporta un hecho útil para la memoria: se registra el "no" sin motivo.
    const r = await rateOutfit(outfit.id, "no", value === "Otro motivo" ? "" : value);
    setBusy(null);
    if (!r.ok) return fail(r.error);
    setReason(value);
    onAsk?.(
      value === "Otro motivo"
        ? "Ese look no es para mí. ¿Me muestras otra opción?"
        : `Ese look no es para mí: ${value.toLowerCase()}. ¿Me muestras otra opción?`,
    );
  }

  const meta = [
    capitalize(outfit.occasion),
    outfit.weather ? `${Math.round(outfit.weather.temp_min)}° a ${Math.round(outfit.weather.temp_max)}°` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      aria-labelledby={titleId}
      className={cn(cardBase, animate && "animate-aparecer", state === "discarded" && "opacity-70 transition-opacity")}
    >
      {meta ? <p className={eyebrow}>{meta}</p> : null}
      <h3 id={titleId} className="mt-1 font-display text-2xl">
        {outfit.title}
      </h3>

      <Collage items={outfit.items} animate={animate} />

      <p className="mt-3 text-sm text-tinta-suave">
        {outfit.items.map((it, i) => (
          <span key={it.garment_id}>
            {i > 0 ? " · " : null}
            <Link href={`/closet/${it.garment_id}`} className="underline decoration-linea-fuerte underline-offset-4">
              {it.name}
            </Link>
          </span>
        ))}
      </p>

      <p className={cn(eyebrowAccent, "mt-5")}>Por qué funciona</p>
      <p className="mt-1.5 text-base text-tinta">{outfit.rationale}</p>

      {outfit.missing_piece ? (
        <div className="mt-4 flex gap-3 rounded-sm border border-dashed border-linea-fuerte p-3">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-xs border border-dashed border-linea-fuerte bg-fondo text-tinta-suave"
          >
            <IconPlus className="size-5" />
          </span>
          <div className="min-w-0">
            <p className={eyebrowAccent}>Lo que lo completaría</p>
            <p className="mt-1 text-sm font-semibold text-tinta">{outfit.missing_piece.description}</p>
            <p className="mt-0.5 text-sm text-tinta-suave">{outfit.missing_piece.why}</p>
          </div>
        </div>
      ) : null}

      {state === "proposed" ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className={btnPrimary} onClick={save} disabled={busy !== null}>
            {busy === "save" ? <Spinner /> : null}
            Guardar look
          </button>
          <button type="button" className={btnSecondary} onClick={discard} disabled={busy !== null}>
            {busy === "discard" ? <Spinner /> : null}
            No es para mí
          </button>
        </div>
      ) : null}

      {state === "saved" ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-sm font-medium text-exito">
            <IconCheck className="size-4" />
            Guardado en Tus looks
          </p>
          {rating === null ? (
            <div className="mt-3">
              <p id={`${titleId}-rate`} className="text-sm text-tinta-suave">
                ¿Qué tanto te gustó?
              </p>
              <div role="radiogroup" aria-labelledby={`${titleId}-rate`} className="mt-2 flex flex-wrap gap-2">
                <Chip mode="radio" selected={false} disabled={busy !== null} onClick={() => rate("love")}>
                  Me encanta
                </Chip>
                <Chip mode="radio" selected={false} disabled={busy !== null} onClick={() => rate("ok")}>
                  Me sirve
                </Chip>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-tinta-suave">Gracias, lo tendré en cuenta.</p>
          )}
        </div>
      ) : null}

      {state === "discarded" ? (
        <div className="mt-5">
          <p className="text-sm text-tinta-suave">Anotado. Lo tendré en cuenta.</p>
          {reason === null ? (
            <div className="mt-3">
              <p id={`${titleId}-why`} className="text-sm font-medium text-tinta">
                ¿Qué no te convenció? <span className="font-normal text-tinta-suave">(opcional)</span>
              </p>
              <div role="radiogroup" aria-labelledby={`${titleId}-why`} className="mt-2 flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <Chip key={r} mode="radio" selected={false} disabled={busy !== null} onClick={() => chooseReason(r)}>
                    {r}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
