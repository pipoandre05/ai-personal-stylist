"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ChipGroup, IconHeart, Input, useToast, type ChipOption } from "@/components/ui";
import { archiveGarment, toggleFavorite, updateGarment } from "@/lib/actions/garments";
import {
  CATEGORY_LABELS,
  GARMENT_CATEGORIES,
  OCCASION_OPTIONS,
  SEASONS,
  type GarmentCategory,
  type GarmentSeason,
  type GarmentView,
} from "@/lib/domain/types";
import { capitalize, FORMALITY_LABELS } from "./labels";

const CATEGORY_OPTIONS: ChipOption[] = GARMENT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));
const SEASON_OPTIONS: ChipOption[] = SEASONS.map((s) => ({ value: s, label: capitalize(s) }));
const FORMALITY_OPTIONS: ChipOption[] = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: FORMALITY_LABELS[n] }));

/** Acciones sobre una prenda: favorita, edición fina y archivar (con confirmación). */
export function GarmentEditor({ garment }: { garment: GarmentView }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [favorite, setFavorite] = useState(garment.favorite);
  const [editing, setEditing] = useState(garment.status === "failed");
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const [name, setName] = useState(garment.name);
  const [category, setCategory] = useState<GarmentCategory>(garment.category);
  const [subcategory, setSubcategory] = useState(garment.subcategory);
  const [formality, setFormality] = useState(String(garment.formality));
  const [seasons, setSeasons] = useState<string[]>(garment.seasons.filter((s) => SEASONS.includes(s as GarmentSeason)));
  const [occasions, setOccasions] = useState<string[]>(garment.occasions);
  const [nameError, setNameError] = useState<string | null>(null);

  // Las ocasiones guardadas que no están en el catálogo (vienen de la conversación) no se pierden.
  const occasionOptions: ChipOption[] = [
    ...new Set<string>([...OCCASION_OPTIONS, ...garment.occasions]),
  ].map((o) => ({ value: o, label: capitalize(o) }));

  function onFavorite() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const res = await toggleFavorite(garment.id);
      if (!res.ok) {
        setFavorite(!next);
        toast({ message: res.error, tone: "error" });
      }
    });
  }

  function onSave() {
    if (!name.trim()) {
      setNameError("Ponle un nombre a la prenda.");
      return;
    }
    setNameError(null);
    startTransition(async () => {
      const res = await updateGarment(garment.id, {
        name,
        category,
        subcategory,
        formality: Number(formality),
        seasons: seasons as GarmentSeason[],
        occasions,
      });
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        return;
      }
      toast({ message: "Guardé los cambios." });
      setEditing(false);
      router.refresh();
    });
  }

  function onArchive() {
    startTransition(async () => {
      const res = await archiveGarment(garment.id);
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        return;
      }
      toast({ message: "Prenda archivada." });
      router.push("/closet");
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <Button
        variant="secondary"
        fullWidth
        aria-pressed={favorite}
        onClick={onFavorite}
        icon={<IconHeart className={favorite ? "size-5 fill-current text-acento" : "size-5"} />}
      >
        {favorite ? "Es una de tus favoritas" : "Marcar como favorita"}
      </Button>

      {editing ? (
        <form
          className="space-y-6 border-t border-linea pt-8"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <h2 className="font-display text-2xl">Editar prenda</h2>

          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            error={nameError}
            required
            autoComplete="off"
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tinta">Categoría</legend>
            <ChipGroup label="Categoría" options={CATEGORY_OPTIONS} value={category} onChange={(v) => v && setCategory(v as GarmentCategory)} />
          </fieldset>

          <Input
            label="Subcategoría"
            hint="Por ejemplo: blazer, jeans, mocasín."
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            maxLength={40}
            autoComplete="off"
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tinta">Formalidad</legend>
            <ChipGroup label="Formalidad" options={FORMALITY_OPTIONS} value={formality} onChange={(v) => v && setFormality(v)} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tinta">Temporadas</legend>
            <ChipGroup multiple label="Temporadas" options={SEASON_OPTIONS} value={seasons} onChange={setSeasons} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tinta">Ocasiones</legend>
            <ChipGroup multiple label="Ocasiones" options={occasionOptions} value={occasions} onChange={setOccasions} />
          </fieldset>

          <p className="text-sm text-tinta-suave">
            Los colores los detecta el asesor desde la foto. Si no calzan, mándale una foto mejor por la conversación.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" loading={pending} loadingLabel="Guardando…">
              Guardar cambios
            </Button>
            <Button variant="text" onClick={() => setEditing(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" fullWidth onClick={() => setEditing(true)}>
          Editar prenda
        </Button>
      )}

      <div className="border-t border-linea pt-6">
        {confirmingArchive ? (
          <div role="group" aria-label="Confirmar archivo" className="rounded-md bg-hundido p-4">
            <p className="text-base text-tinta">¿Archivar? Dejará de aparecer en tus looks.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="destructive" onClick={onArchive} loading={pending} loadingLabel="Archivando…">
                Archivar prenda
              </Button>
              <Button variant="text" onClick={() => setConfirmingArchive(false)} disabled={pending}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="text" className="text-tinta-suave" onClick={() => setConfirmingArchive(true)}>
            Archivar prenda
          </Button>
        )}
      </div>
    </div>
  );
}
