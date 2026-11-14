"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, cn, IconCheck, Input, Spinner, useToast } from "@/components/ui";
import { updateGarment } from "@/lib/actions/garments";
import { CATEGORY_LABELS, CATEGORY_LABELS_SHORT, GARMENT_CATEGORIES, type GarmentCategory, type GarmentView } from "@/lib/domain/types";
import { btnPrimary, btnSecondary, btnText, cardBase, eyebrow } from "./styles";
import { Thumb } from "./thumb";

type Mode = "review" | "editing" | "confirmed";

type GarmentCardProps = {
  garment: GarmentView;
  animate?: boolean;
};

/** Prenda reconocida: "Está bien" / "Corregir" (nombre y categoría). */
export function GarmentCard({ garment, animate }: GarmentCardProps) {
  const { toast } = useToast();
  const failed = garment.status === "failed";
  // Una tarjeta de historial ya pasó por la conversación: la prenda está en el clóset.
  const [mode, setMode] = useState<Mode>(failed ? "editing" : animate ? "review" : "confirmed");
  const [name, setName] = useState(garment.name);
  const [category, setCategory] = useState<GarmentCategory>(garment.category);
  const [draftName, setDraftName] = useState(garment.name);
  const [draftCategory, setDraftCategory] = useState<GarmentCategory>(garment.category);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const titleId = `prenda-${garment.id}`;

  async function save() {
    const clean = draftName.trim();
    if (!clean) {
      setNameError("Escribe un nombre para la prenda.");
      return;
    }
    setNameError(null);
    setSaving(true);
    const r = await updateGarment(garment.id, { name: clean, category: draftCategory });
    setSaving(false);
    if (!r.ok) return toast({ message: r.error, tone: "error" });
    setName(clean);
    setCategory(draftCategory);
    setMode("confirmed");
  }

  return (
    <article aria-labelledby={titleId} className={cn(cardBase, animate && "animate-aparecer")}>
      <div className="flex gap-4">
        <div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-sm bg-hundido">
          <Thumb src={garment.photo_url} alt={name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={eyebrow}>{failed && mode === "editing" ? "Completar datos" : "Prenda reconocida"}</p>
          <h3 id={titleId} className="mt-1 font-display text-xl">
            {name || "Prenda sin nombre"}
          </h3>
          {!(failed && mode === "editing") ? (
            <ul className="mt-2 space-y-1 text-sm text-tinta-suave">
              <li>{CATEGORY_LABELS[category]}</li>
              {garment.colors.length > 0 ? (
                <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {garment.colors.map((c) => (
                    <span key={`${c.name}-${c.hex}`} className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full border border-tinta/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </span>
                  ))}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>

      {failed && mode === "editing" ? (
        <p className="mt-3 rounded-sm bg-alerta-suave px-3 py-2 text-sm text-alerta">
          No pude reconocerla bien. Complétala tú, son 2 datos.
        </p>
      ) : null}

      {mode === "review" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className={btnPrimary} onClick={() => setMode("confirmed")}>
            Está bien
          </button>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setDraftName(name);
              setDraftCategory(category);
              setMode("editing");
            }}
          >
            Corregir
          </button>
        </div>
      ) : null}

      {mode === "editing" ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Input
            label="Nombre"
            value={draftName}
            maxLength={80}
            error={nameError}
            onChange={(e) => setDraftName(e.target.value)}
            autoComplete="off"
          />
          <div>
            <p id={`${titleId}-cat`} className="mb-1.5 text-sm font-medium text-tinta">
              Categoría
            </p>
            <div role="radiogroup" aria-labelledby={`${titleId}-cat`} className="flex flex-wrap gap-2">
              {GARMENT_CATEGORIES.map((c) => (
                <Chip key={c} mode="radio" selected={draftCategory === c} onClick={() => setDraftCategory(c)}>
                  {CATEGORY_LABELS_SHORT[c]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className={cn(btnPrimary, "flex-1")} disabled={saving}>
              {saving ? <Spinner /> : null}
              Guardar cambios
            </button>
            {!failed ? (
              <button type="button" className={btnText} onClick={() => setMode("confirmed")} disabled={saving}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {mode === "confirmed" ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-exito">
            <IconCheck className="size-4" />
            En tu clóset
          </p>
          <Link href={`/closet/${garment.id}`} className={btnText}>
            Ver
          </Link>
          <button
            type="button"
            className={btnText}
            onClick={() => {
              setDraftName(name);
              setDraftCategory(category);
              setMode("editing");
            }}
          >
            Corregir
          </button>
        </div>
      ) : null}
    </article>
  );
}
