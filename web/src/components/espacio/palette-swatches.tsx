import { cn } from "@/components/ui";
import { COLOR_SEASON_LABELS, type ColorAnalysis, type NamedColor } from "@/lib/domain/types";
import { CONFIDENCE_LABELS, CONTRAST_LABELS, sectionLabelClass, UNDERTONE_LABELS } from "./labels";

const confidenceTone = {
  alta: "bg-exito-suave text-exito",
  media: "bg-hundido text-tinta",
  baja: "bg-alerta-suave text-alerta",
} as const;

/** "Otoño cálido" con la palabra del subtono en cursiva granate. */
export function PaletteTitle({ analysis, as: Tag = "h2", className }: { analysis: ColorAnalysis; as?: "h1" | "h2" | "p"; className?: string }) {
  return (
    <Tag className={cn("font-display", className)}>
      {COLOR_SEASON_LABELS[analysis.season]} <em className="text-acento">{UNDERTONE_LABELS[analysis.undertone]}</em>
    </Tag>
  );
}

/** Insignia de confianza y, si la persona la eligió, de origen. Nunca solo color: siempre con texto. */
export function PaletteBadges({ analysis }: { analysis: ColorAnalysis }) {
  const badge = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium";
  return (
    <p className="flex flex-wrap items-center gap-2">
      <span className={cn(badge, confidenceTone[analysis.confidence])}>{CONFIDENCE_LABELS[analysis.confidence]}</span>
      {analysis.source === "manual" ? <span className={cn(badge, "bg-acento-suave text-acento")}>Elegida por ti</span> : null}
      <span className="text-sm text-tinta-suave">
        Subtono {UNDERTONE_LABELS[analysis.undertone]} · contraste {CONTRAST_LABELS[analysis.contrast]}
      </span>
    </p>
  );
}

function Swatch({ color, struck = false }: { color: NamedColor; struck?: boolean }) {
  return (
    <li className="min-w-0">
      <div
        role="img"
        aria-label={struck ? `${color.name}, mejor lejos del rostro` : color.name}
        className="relative aspect-square overflow-hidden rounded-sm border border-tinta/10"
        style={{ backgroundColor: color.hex }}
      >
        {struck ? (
          <svg viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full">
            <line x1="0" y1="10" x2="10" y2="0" className="stroke-tinta" strokeWidth="4" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="10" x2="10" y2="0" className="stroke-superficie" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-snug text-tinta">{color.name}</p>
    </li>
  );
}

function Group({ label, colors, struck }: { label: string; colors: NamedColor[]; struck?: boolean }) {
  if (colors.length === 0) return null;
  return (
    <section aria-label={label}>
      <h3 className={cn(sectionLabelClass, "font-body")}>{label}</h3>
      <ul className="mt-3 grid grid-cols-4 gap-3">
        {colors.map((c) => (
          <Swatch key={`${c.name}-${c.hex}`} color={c} struck={struck} />
        ))}
      </ul>
    </section>
  );
}

type PaletteSwatchesProps = {
  analysis: ColorAnalysis;
  /** Compacto: solo "Te favorecen", para el resumen del perfil. */
  compact?: boolean;
};

/** Muestras de la paleta. Los hex son datos: única excepción a "sin colores hardcodeados". */
export function PaletteSwatches({ analysis, compact = false }: PaletteSwatchesProps) {
  if (compact) {
    return <Group label="Te favorecen" colors={analysis.recommended.slice(0, 8)} />;
  }
  return (
    <div className="space-y-7">
      <Group label="Te favorecen" colors={analysis.recommended} />
      <Group label="Tus neutros" colors={analysis.neutrals} />
      <Group label="Mejor lejos del rostro" colors={analysis.avoid} struck />
    </div>
  );
}
