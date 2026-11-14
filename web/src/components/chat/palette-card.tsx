"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, cn, Spinner, useToast } from "@/components/ui";
import { setManualColorSeason } from "@/lib/actions/color";
import { paletteForSeason } from "@/lib/domain/palettes";
import {
  COLOR_SEASON_LABELS,
  COLOR_SEASONS,
  type ColorAnalysis,
  type ColorSeason,
  type Confidence,
  type NamedColor,
  type Undertone,
} from "@/lib/domain/types";
import { btnSecondary, btnText, cardBase, eyebrow } from "./styles";

const UNDERTONE_WORD: Record<Undertone, string> = { calido: "cálido", frio: "frío", neutro: "neutro" };
const CONFIDENCE_TONE: Record<Confidence, string> = {
  alta: "bg-exito-suave text-exito",
  media: "bg-hundido text-tinta",
  baja: "bg-alerta-suave text-alerta",
};

function Swatches({ label, colors, strike }: { label: string; colors: NamedColor[]; strike?: boolean }) {
  if (colors.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tinta-suave">{label}</p>
      <ul className="mt-2 grid grid-cols-4 gap-3">
        {colors.map((c) => (
          <li key={`${c.name}-${c.hex}`}>
            <span
              role="img"
              aria-label={strike ? `${c.name}, mejor lejos del rostro` : c.name}
              className="relative block aspect-square rounded-sm border border-tinta/10"
              style={{ backgroundColor: c.hex }}
            >
              {strike ? (
                <svg viewBox="0 0 10 10" aria-hidden="true" className="absolute inset-0 size-full text-superficie">
                  <path d="M1.2 8.8L8.8 1.2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
                </svg>
              ) : null}
            </span>
            <span className="mt-1 block text-xs leading-tight text-tinta">{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PaletteCardProps = {
  analysis: ColorAnalysis;
  animate?: boolean;
};

/** Paleta orientativa: estación tentativa, confianza visible y "Ajustar". */
export function PaletteCard({ analysis, animate }: PaletteCardProps) {
  const { toast } = useToast();
  const [data, setData] = useState<ColorAnalysis>(analysis);
  const [adjusting, setAdjusting] = useState(false);
  const [saving, setSaving] = useState<ColorSeason | null>(null);
  const titleId = `paleta-${analysis.id}`;
  const manual = data.source === "manual";

  async function pick(season: ColorSeason) {
    if (season === data.season) {
      setAdjusting(false);
      return;
    }
    setSaving(season);
    const r = await setManualColorSeason(season);
    setSaving(null);
    if (!r.ok) return toast({ message: r.error, tone: "error" });
    const p = paletteForSeason(season);
    setData({
      ...data,
      season,
      undertone: p.undertone,
      contrast: p.contrast,
      confidence: "media",
      lighting_ok: true,
      recommended: p.recommended,
      neutrals: p.neutrals,
      avoid: p.avoid,
      rationale: p.rationale,
      source: "manual",
    });
    setAdjusting(false);
  }

  return (
    <article aria-labelledby={titleId} className={cn(cardBase, animate && "animate-aparecer")}>
      <p className={eyebrow}>Tu paleta · orientativa</p>
      <h3 id={titleId} className="mt-1 font-display text-2xl">
        {COLOR_SEASON_LABELS[data.season]} <em className="text-acento">{UNDERTONE_WORD[data.undertone]}</em>
      </h3>
      <p className="mt-1 text-sm text-tinta-suave">
        Subtono {UNDERTONE_WORD[data.undertone]} · contraste {data.contrast}
      </p>
      <p className="mt-3">
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", CONFIDENCE_TONE[data.confidence])}>
          Confianza {data.confidence}
        </span>
        {manual ? <span className="ml-2 text-xs text-tinta-suave">Elegida por ti</span> : null}
      </p>

      {!data.lighting_ok ? (
        <p className="mt-3 rounded-sm bg-alerta-suave px-3 py-2 text-sm text-alerta">
          La luz de la foto no era pareja. Tómalo como punto de partida.
        </p>
      ) : null}

      <Swatches label="Te favorecen" colors={data.recommended} />
      <Swatches label="Tus neutros" colors={data.neutrals} />
      <Swatches label="Mejor lejos del rostro" colors={data.avoid} strike />

      <p className="mt-5 text-xs text-tinta-suave">
        {manual
          ? "Elegiste esta paleta tú; es una orientación, no un diagnóstico."
          : "Es una orientación a partir de una foto, no un diagnóstico. Tu selfie ya se borró."}
      </p>

      {adjusting ? (
        <div className="mt-4">
          <p id={`${titleId}-aj`} className="text-sm font-medium text-tinta">
            ¿Qué estación te calza mejor?
          </p>
          <div role="radiogroup" aria-labelledby={`${titleId}-aj`} className="mt-2 flex flex-wrap gap-2">
            {COLOR_SEASONS.map((s) => (
              <Chip key={s} mode="radio" selected={data.season === s} disabled={saving !== null} onClick={() => pick(s)}>
                {saving === s ? <Spinner /> : null}
                {COLOR_SEASON_LABELS[s]}
              </Chip>
            ))}
          </div>
          <button type="button" className={cn(btnText, "mt-2")} onClick={() => setAdjusting(false)} disabled={saving !== null}>
            Cancelar
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" className={btnSecondary} onClick={() => setAdjusting(true)}>
            Ajustar
          </button>
          <Link href="/yo/paleta" className={btnText}>
            Ver tu paleta
          </Link>
        </div>
      )}
    </article>
  );
}
