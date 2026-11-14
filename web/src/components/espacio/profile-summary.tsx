"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ChipGroup, Input, ReadOnlyChip, useToast, type ChipOption } from "@/components/ui";
import { saveProfile } from "@/lib/actions/profile";
import {
  BUDGET_OPTIONS_CLP,
  COMFORT_OPTIONS,
  FIT_OPTIONS,
  OCCASION_OPTIONS,
  STYLE_OPTIONS,
  type Profile,
  type StyleProfile,
} from "@/lib/domain/types";
import { fmtCLP } from "@/lib/format";
import { capitalize, sectionLabelClass } from "./labels";

type ProfileSummaryProps = {
  profile: Profile | null;
  style: StyleProfile | null;
};

/** Catálogo + lo que ya esté guardado (viene de la conversación y puede no estar en el catálogo). */
function withExisting(catalog: readonly string[], existing: readonly string[]): ChipOption[] {
  return [...new Set<string>([...catalog, ...existing])].map((v) => ({ value: v, label: capitalize(v) }));
}

function ReadRow({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div>
      <dt className={sectionLabelClass}>{label}</dt>
      <dd className="mt-2 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((v) => <ReadOnlyChip key={v}>{capitalize(v)}</ReadOnlyChip>)
        ) : (
          <span className="text-sm text-tinta-suave">Aún no me lo cuentas.</span>
        )}
      </dd>
    </div>
  );
}

/** Lo que el asesor sabe de la persona: lectura y edición simple con los mismos catálogos del chat. */
export function ProfileSummary({ profile, style }: ProfileSummaryProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const [city, setCity] = useState(profile?.city ?? "");
  const [currentStyle, setCurrentStyle] = useState<string[]>(style?.current_style ?? []);
  const [occasions, setOccasions] = useState<string[]>(style?.occasions ?? []);
  const [fit, setFit] = useState<string[]>(style?.fit_preferences ?? []);
  const [comfort, setComfort] = useState<string[]>(style?.comfort_constraints ?? []);
  const [budget, setBudget] = useState<string | null>(style?.budget_monthly_clp != null ? String(style.budget_monthly_clp) : null);
  const [cityError, setCityError] = useState<string | null>(null);

  const budgetOptions: ChipOption[] = BUDGET_OPTIONS_CLP.map((b) => ({ value: String(b.value), label: b.label }));
  if (style?.budget_monthly_clp != null && !budgetOptions.some((o) => o.value === String(style.budget_monthly_clp))) {
    budgetOptions.push({ value: String(style.budget_monthly_clp), label: `Hasta ${fmtCLP(style.budget_monthly_clp)}` });
  }
  const budgetLabel = budgetOptions.find((o) => o.value === (style?.budget_monthly_clp != null ? String(style.budget_monthly_clp) : ""))?.label;

  function save() {
    if (city.trim().length < 2) {
      setCityError("Escribe el nombre de tu ciudad.");
      return;
    }
    setCityError(null);
    startTransition(async () => {
      const res = await saveProfile({
        city,
        current_style: currentStyle,
        occasions,
        fit_preferences: fit,
        comfort_constraints: comfort,
        budget_monthly_clp: budget ? Number(budget) : null,
      });
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        return;
      }
      toast({ message: "Guardé tu perfil." });
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <div>
        <dl className="space-y-5">
          <ReadRow label="Tu estilo" values={style?.current_style ?? []} />
          <ReadRow label="Para qué te vistes" values={style?.occasions ?? []} />
          <ReadRow label="Calce" values={style?.fit_preferences ?? []} />
          <ReadRow label="Comodidad" values={style?.comfort_constraints ?? []} />
          <div>
            <dt className={sectionLabelClass}>Ciudad</dt>
            <dd className="mt-1 text-base text-tinta">{profile?.city || "Aún no me la cuentas."}</dd>
          </div>
          <div>
            <dt className={sectionLabelClass}>Presupuesto mensual</dt>
            <dd className="mt-1 text-base text-tinta">{budgetLabel ?? "Aún no me lo cuentas."}</dd>
          </div>
        </dl>
        <Button variant="secondary" className="mt-6" onClick={() => setEditing(true)}>
          Editar mi perfil
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">Tu estilo</legend>
        <ChipGroup multiple label="Tu estilo" options={withExisting(STYLE_OPTIONS, style?.current_style ?? [])} value={currentStyle} onChange={setCurrentStyle} />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">Para qué te vistes</legend>
        <ChipGroup multiple label="Para qué te vistes" options={withExisting(OCCASION_OPTIONS, style?.occasions ?? [])} value={occasions} onChange={setOccasions} />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">Calce</legend>
        <ChipGroup multiple label="Calce" options={withExisting(FIT_OPTIONS, style?.fit_preferences ?? [])} value={fit} onChange={setFit} />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">Comodidad</legend>
        <ChipGroup multiple label="Comodidad" options={withExisting(COMFORT_OPTIONS, style?.comfort_constraints ?? [])} value={comfort} onChange={setComfort} />
      </fieldset>
      <Input
        label="Ciudad"
        hint="La uso solo para mirar el clima."
        value={city}
        onChange={(e) => setCity(e.target.value)}
        error={cityError}
        autoComplete="address-level2"
        maxLength={80}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">Presupuesto mensual</legend>
        <ChipGroup label="Presupuesto mensual" options={budgetOptions} value={budget} onChange={setBudget} />
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} loadingLabel="Guardando…">
          Guardar perfil
        </Button>
        <Button variant="text" onClick={() => setEditing(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
