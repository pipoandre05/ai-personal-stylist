import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";
import { shortDateLabel } from "@/lib/domain/event-summary";
import type { ChatIntent, OutfitEvidence, OutfitView } from "@/lib/domain/types";
import { fmtCLP } from "@/lib/format";
import { EVIDENCE_WORD, SLOT_SHORT, VARIANT_LABEL, safeHex } from "./format";
import { IconBookmark, IconCloudSun, IconShield, IconSpark, IconSwatch, IconCalendar, IconHanger } from "./glyphs";
import { buildPieces } from "./outfit-layout";
import { OutfitTable } from "./outfit-table";

export type OutfitCardV2Props = {
  outfit: OutfitView;
  /**
   * "Recién propuesto": superficie `inverso` con "Guardar look" como única acción en `accion`. Lo decide quien arma
   * el hilo (el último look sin guardar ni descartar); al llegar otro look o al guardar, vuelve a papel.
   */
  fresh?: boolean;
  /** Rótulo visible de pertenencia a un par: "Opción 1 de 2". */
  tag?: string;
  onSave?: (outfit: OutfitView) => void;
  onDiscard?: (outfit: OutfitView) => void;
  /** @deprecated Los ajustes de look ahora se consolidan sobre el compositor en suggested-replies (UI-20). */
  onRefine?: (intent: ChatIntent, label: string) => void;
  /** Enlace de cada prenda de la leyenda (p. ej. `/closet/[id]`). Sin él, los nombres van como texto. */
  closetHref?: (garmentId: string) => string;
  /** Mientras se guarda o se manda un refinamiento. */
  busy?: boolean;
  /** Anima la caída de las prendas (look recién llegado). */
  animate?: boolean;
  /** "Tus looks": sin acciones de descarte. */
  compact?: boolean;
  className?: string;
};

type Skin = {
  root: string;
  kicker: string;
  title: string;
  soft: string;
  strong: string;
  divider: string;
  chip: string;
  ring: string;
  badge: string;
};

const SKIN: Record<"inverso" | "papel", Skin> = {
  inverso: {
    root: "bg-inverso text-sobre-inverso",
    kicker: "text-sobre-inverso-suave",
    title: "text-sobre-inverso",
    soft: "text-sobre-inverso-suave",
    strong: "text-sobre-inverso",
    divider: "border-sobre-inverso/20",
    chip: "bg-sobre-inverso/10 text-sobre-inverso",
    ring: "ring-inverso",
    badge: "bg-sobre-inverso/10 text-sobre-inverso",
  },
  papel: {
    root: "bg-superficie text-tinta",
    kicker: "text-tinta-suave",
    title: "text-tinta",
    soft: "text-tinta-suave",
    strong: "text-tinta",
    divider: "border-linea",
    chip: "bg-hundido text-tinta",
    ring: "ring-hundido",
    badge: "bg-hundido text-tinta",
  },
};

/** "Sábado 21 nov · Casablanca · 11° a 27°"; sin clima, la ocasión. */
export function outfitKicker(o: Pick<OutfitView, "weather" | "occasion">): string {
  const w = o.weather;
  if (!w) return o.occasion;
  const parts = [w.date ? shortDateLabel(w.date) : "", w.city, `${Math.round(w.temp_min)}° a ${Math.round(w.temp_max)}°`];
  return parts.filter(Boolean).join(" · ") || o.occasion;
}

function EvidenceIcon({ kind }: { kind: OutfitEvidence["kind"] }) {
  const cls = "size-3.5 shrink-0";
  if (kind === "weather") return <IconCloudSun className={cls} />;
  if (kind === "closet") return <IconHanger className={cls} />;
  if (kind === "occasion") return <IconCalendar className={cls} />;
  return <IconSwatch className={cls} />;
}

/**
 * Tarjeta de look del contrato v2: composición con la pieza faltante adentro, variante dicha con palabras, el porqué
 * con evidencia (chips con dato) y acciones ("Guardar look" y "No es para mí").
 * Los botones de ajuste / refinamientos se extraen y consolidan sobre el compositor en UI-20 (Pieza A).
 */
export function OutfitCardV2({
  outfit,
  fresh = false,
  tag,
  onSave,
  onDiscard,
  closetHref,
  busy = false,
  animate = false,
  compact = false,
  className,
}: OutfitCardV2Props) {
  const saved = outfit.status === "saved";
  const discarded = outfit.status === "discarded";
  // Un look guardado o descartado vuelve a papel aunque siga siendo el último (PD-7, resuelto provisoriamente).
  const skin = SKIN[fresh && outfit.status === "proposed" ? "inverso" : "papel"];
  const onInverse = skin === SKIN.inverso;
  const titleId = `outfit-v2-${outfit.id}-title`;
  const pieces = buildPieces(outfit);
  const evidence = outfit.evidence ?? [];
  const sel = outfit.selected_option ?? null;

  return (
    <article
      aria-labelledby={titleId}
      className={cn("relative rounded-tarjeta p-[18px]", skin.root, discarded && "opacity-70", className)}
    >
      {tag || outfit.variant ? (
        <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {tag ? <span className={cn("text-sobretitulo uppercase", skin.kicker)}>{tag}</span> : null}
          {outfit.variant ? (
            <span
              className={cn(
                "inline-flex h-6 items-center gap-1.5 rounded-insignia px-2 text-[11px] font-extrabold uppercase tracking-[0.12em]",
                skin.badge,
              )}
            >
              {outfit.variant === "seguro" ? <IconShield className="size-3.5" /> : <IconSpark className="size-3.5" />}
              {VARIANT_LABEL[outfit.variant]}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className={cn("text-sobretitulo uppercase", skin.kicker)}>{outfitKicker(outfit)}</p>
      <h3 id={titleId} className={cn("mt-1 font-display text-titulo", skin.title)}>
        {outfit.title}
      </h3>

      <OutfitTable pieces={pieces} animate={animate} />

      <ol className={cn("mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-meta", skin.soft)} aria-label="Piezas del look">
        {pieces.map((p) => (
          <li key={p.key} className="inline-flex items-center gap-1.5">
            <b className={cn("font-display text-meta font-extrabold", skin.strong)}>{p.index}</b>
            {p.kind === "missing" ? (
              <>
                <i aria-hidden="true" className="inline-block size-2 rounded-full bg-falta" />
                <span>{p.name}</span>
              </>
            ) : p.kind === "chosen" ? (
              <span>
                <span className={cn("font-bold", skin.strong)}>Elegida:</span> {p.name}
                {p.store ? ` · ${p.store}` : ""}
                {p.price ? ` · ${fmtCLP(p.price)}` : ""}
              </span>
            ) : closetHref && p.garmentId ? (
              <Link
                href={closetHref(p.garmentId)}
                prefetch={false}
                className="relative underline-offset-4 hover:underline after:absolute after:inset-x-0 after:-inset-y-3"
              >
                {p.name}
              </Link>
            ) : (
              <span>{p.name}</span>
            )}
          </li>
        ))}
      </ol>

      {outfit.missing_piece && !sel ? (
        <p className={cn("mt-2 text-meta", skin.soft)}>
          <span className={cn("font-bold", skin.strong)}>Falta {SLOT_SHORT[outfit.missing_piece.category].toLowerCase()}.</span>{" "}
          {outfit.missing_piece.description}
        </p>
      ) : null}

      {outfit.rationale ? (
        <div className={cn("mt-3 border-t pt-3", skin.divider)}>
          <h4 className={cn("text-sobretitulo uppercase", skin.kicker)}>Por qué funciona</h4>
          <p className="mt-1.5 text-cuerpo">{outfit.rationale}</p>
          {evidence.length > 0 ? (
            <ul aria-label="En qué me basé" className="mt-2.5 flex flex-wrap gap-1">
              {evidence.map((ev, i) => (
                <li
                  key={`${ev.kind}-${i}`}
                  className={cn("inline-flex h-[26px] items-center gap-1.5 rounded-insignia px-2 text-meta font-bold", skin.chip)}
                >
                  <EvidenceIcon kind={ev.kind} />
                  {ev.swatches?.length ? (
                    <span aria-hidden="true" className="mr-0.5 inline-flex">
                      {ev.swatches.map((hex, j) => {
                        const c = safeHex(hex);
                        return c ? (
                          <i
                            key={j}
                            className={cn("-mr-1 block size-3 rounded-full ring-[1.5px] last:mr-0", skin.ring)}
                            style={{ backgroundColor: c }}
                          />
                        ) : null;
                      })}
                    </span>
                  ) : null}
                  <span className="sr-only">{EVIDENCE_WORD[ev.kind]}: </span>
                  {ev.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {discarded ? (
        <p className={cn("mt-3 text-cuerpo", skin.soft)}>Anotado. Lo tendré en cuenta.</p>
      ) : compact ? null : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {saved ? (
            <Button variant="contorno" size="mediano" aria-disabled="true" icon={<IconCheck />} className="pointer-events-none !px-3 whitespace-nowrap">
              Guardado
            </Button>
          ) : (
            <Button
              variant={onInverse ? "principal" : "inverso"}
              size="mediano"
              icon={<IconBookmark />}
              disabled={busy || !onSave}
              onClick={() => onSave?.(outfit)}
              className="!px-3 whitespace-nowrap"
            >
              Guardar look
            </Button>
          )}
          <Button
            variant="contorno"
            size="mediano"
            onInverse={onInverse}
            disabled={busy || !onDiscard}
            onClick={() => onDiscard?.(outfit)}
            className="!px-3 whitespace-nowrap"
          >
            No es para mí
          </Button>
        </div>
      )}
      {saved && !compact ? (
        <p className="mt-2.5 inline-flex items-center gap-2 text-sm font-bold text-exito">
          <IconCheck className="size-4" />
          Guardado en Tus looks
        </p>
      ) : null}
    </article>
  );
}

/** Esqueleto en piel "recién propuesto" mientras el asesor arma el look (UX_UI_SPEC §7.10, Cargando). */
export function OutfitCardSkeleton({ className }: { className?: string }) {
  const bar = "rounded-full bg-sobre-inverso/10 animate-esqueleto motion-reduce:animate-none motion-reduce:opacity-60";
  const ghost = "absolute rounded-campo bg-tinta/5 animate-esqueleto motion-reduce:animate-none motion-reduce:opacity-60";
  return (
    <div role="status" aria-label="Armando el look" className={cn("rounded-tarjeta bg-inverso p-[18px]", className)}>
      <div className={cn(bar, "h-2.5 w-[46%]")} />
      <div className={cn(bar, "mt-2.5 h-[26px] w-[72%]")} />
      <div className="relative mt-3 aspect-video overflow-hidden rounded-foto bg-hundido">
        <div className={ghost} style={{ left: "4%", top: "6%", width: "32%", height: "58%" }} />
        <div className={ghost} style={{ left: "38%", top: "4%", width: "26%", height: "44%", animationDelay: "120ms" }} />
        <div className={ghost} style={{ left: "67%", top: "10%", width: "28%", height: "56%", animationDelay: "240ms" }} />
        <div className={ghost} style={{ left: "12%", top: "70%", width: "22%", height: "24%", animationDelay: "360ms" }} />
      </div>
    </div>
  );
}
