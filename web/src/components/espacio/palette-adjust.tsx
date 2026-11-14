"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ChipGroup, useToast, type ChipOption } from "@/components/ui";
import { setManualColorSeason } from "@/lib/actions/color";
import { COLOR_SEASONS, COLOR_SEASON_LABELS, type ColorSeason } from "@/lib/domain/types";

const OPTIONS: ChipOption[] = COLOR_SEASONS.map((s) => ({ value: s, label: COLOR_SEASON_LABELS[s] }));

type PaletteAdjustProps = {
  current: ColorSeason | null;
  /** Texto del botón que abre el selector. */
  label?: string;
};

/** "Ajustar": la persona elige su estación a mano (queda como "Elegida por ti"). */
export function PaletteAdjust({ current, label = "Ajustar" }: PaletteAdjustProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [season, setSeason] = useState<string | null>(current);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!season) return;
    startTransition(async () => {
      const res = await setManualColorSeason(season as ColorSeason);
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        return;
      }
      toast({ message: "Listo, cambié tu paleta." });
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} aria-expanded={false}>
        {label}
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-linea bg-superficie p-4">
      <p id="ajuste-titulo" className="text-base font-semibold text-tinta">
        ¿Cuál te calza mejor?
      </p>
      <p className="mt-1 text-sm text-tinta-suave">Elige una estación. Reemplaza la paleta que te mostré.</p>
      <div className="mt-4" role="group" aria-labelledby="ajuste-titulo">
        <ChipGroup label="Estación de color" options={OPTIONS} value={season} onChange={setSeason} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={!season || season === current} loading={pending} loadingLabel="Guardando…">
          Guardar paleta
        </Button>
        <Button variant="text" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
