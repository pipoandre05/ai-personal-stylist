import { IconCheck } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import type { OutfitView } from "@/lib/domain/types";
import { overlineClass } from "./labels";

const MAX_THUMBS = 4;

/** Tarjeta de look para listado: sin acciones. Las fotos son las de las prendas reales. */
export function LookCard({ outfit }: { outfit: OutfitView }) {
  const saved = outfit.status === "saved";
  const shown = outfit.items.slice(0, MAX_THUMBS);
  const extra = outfit.items.length - shown.length;
  const meta = [outfit.occasion, outfit.weather?.summary].filter(Boolean).join(" · ");
  const titleId = `look-${outfit.id}`;

  return (
    <article aria-labelledby={titleId} className="rounded-md border border-linea bg-superficie p-4">
      {meta ? <p className={overlineClass}>{meta}</p> : null}
      <h3 id={titleId} className="mt-1 font-display text-2xl">
        {outfit.title}
      </h3>

      <ul className="mt-4 grid grid-cols-4 gap-1.5" aria-label="Prendas del look">
        {shown.map((item) => (
          <li key={item.garment_id} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-hundido">
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage
              <img src={item.photo_url} alt={item.name} loading="lazy" decoding="async" className="size-full object-cover object-center" />
            ) : (
              <span className="flex size-full items-center justify-center p-1 text-center text-xs text-tinta-suave">{item.name}</span>
            )}
            {extra > 0 && item === shown[shown.length - 1] ? (
              <span className="absolute inset-0 flex items-center justify-center bg-tinta/60 text-sm font-semibold text-superficie">
                +{extra}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-tinta-suave">{outfit.items.map((i) => i.name).join(" · ")}</p>

      {outfit.rationale ? (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-acento">Por qué funciona</p>
          <p className="mt-1.5 text-base text-tinta">{outfit.rationale}</p>
        </>
      ) : null}

      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-exito">
            <IconCheck className="size-4" />
            Guardado
          </span>
        ) : null}
        {outfit.rating === "love" ? <span>Te encantó</span> : outfit.rating === "ok" ? <span>Te sirvió</span> : null}
        <span>Armado el {fmtDate(outfit.created_at)}</span>
      </p>
    </article>
  );
}

type LookListProps = {
  outfits: OutfitView[];
  /** Título de la sección (h2). */
  heading: string;
  description?: string;
};

export function LookList({ outfits, heading, description }: LookListProps) {
  if (outfits.length === 0) return null;
  return (
    <section aria-label={heading}>
      <h2 className="font-display text-2xl">{heading}</h2>
      {description ? <p className="mt-1 text-sm text-tinta-suave">{description}</p> : null}
      <ul className="mt-5 space-y-6">
        {outfits.map((o) => (
          <li key={o.id}>
            <LookCard outfit={o} />
          </li>
        ))}
      </ul>
    </section>
  );
}
