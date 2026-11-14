import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Screen, SpaceHeader, IconShirt } from "@/components/ui";
import { GarmentEditor } from "@/components/espacio/garment-editor";
import { capitalize, FORMALITY_LABELS } from "@/components/espacio/labels";
import { getGarment } from "@/lib/data/queries";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import DetailSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Prenda — Prendie" };

type Params = Promise<{ id: string }>;

function Datum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-body text-meta font-bold uppercase tracking-wider text-tinta-suave">{label}</dt>
      <dd className="mt-1 font-body text-cuerpo text-tinta">{children}</dd>
    </div>
  );
}

async function GarmentDetail({ params }: { params: Params }) {
  const { id } = await params;
  const garment = await getGarment(id);
  if (!garment || garment.archived_at) notFound();

  const name = garment.name || "Prenda sin nombre";
  const category = CATEGORY_LABELS[garment.category] ?? "Prenda";

  return (
    <div className="pt-2">
      {/* Foto grande 4:5 */}
      <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-foto bg-hundido">
        {garment.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage
          <img
            src={garment.photo_url}
            alt={name}
            decoding="async"
            className="w-[78%] aspect-[1/1.05] rounded-campo object-cover drop-shadow-prenda"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-tinta-suave">
            <IconShirt className="size-9" />
            <span className="font-body text-sm">Esta prenda no tiene foto</span>
          </div>
        )}

        {garment.favorite ? (
          <span className="absolute left-2.5 top-2.5 rounded-insignia bg-superficie px-2.5 py-1 font-body text-[11px] font-extrabold text-tinta">
            Favorita
          </span>
        ) : null}
      </div>

      <header className="mt-5">
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          {name}
        </h1>
      </header>

      {garment.status === "failed" ? (
        <p className="mt-4 rounded-insignia bg-falta/20 px-3 py-2 font-body text-sm font-medium text-tinta">
          No pude reconocer esta prenda del todo. Completa los datos y guarda.
        </p>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
        <Datum label="Categoría">
          {category}
          {garment.subcategory ? ` · ${capitalize(garment.subcategory)}` : ""}
        </Datum>
        <Datum label="Formalidad">{FORMALITY_LABELS[garment.formality] ?? "Sin definir"}</Datum>
        <div className="col-span-2">
          <dt className="font-body text-meta font-bold uppercase tracking-wider text-tinta-suave">Colores</dt>
          <dd className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {garment.colors.length > 0 ? (
              garment.colors.map((c) => (
                <span key={`${c.name}-${c.hex}`} className="inline-flex items-center gap-2 font-body text-cuerpo text-tinta">
                  <span aria-hidden="true" className="size-4 rounded-full border border-linea" style={{ backgroundColor: c.hex }} />
                  {capitalize(c.name)}
                </span>
              ))
            ) : (
              <span className="font-body text-cuerpo text-tinta-suave">Sin colores detectados</span>
            )}
          </dd>
        </div>
        <Datum label="Temporadas">{garment.seasons.length > 0 ? garment.seasons.map(capitalize).join(", ") : "Todo el año"}</Datum>
        <Datum label="Ocasiones">{garment.occasions.length > 0 ? garment.occasions.map(capitalize).join(", ") : "Sin definir"}</Datum>
        {garment.material ? <Datum label="Material">{capitalize(garment.material)}</Datum> : null}
        {garment.pattern ? <Datum label="Estampado">{capitalize(garment.pattern)}</Datum> : null}
        {garment.brand ? <Datum label="Marca">{garment.brand}</Datum> : null}
      </dl>

      <GarmentEditor garment={garment} />
    </div>
  );
}

export default function GarmentPage({ params }: { params: Params }) {
  return (
    <Screen>
      <SpaceHeader backHref="/closet" backLabel="Volver a la conversación" />
      <div className="px-6 pb-10">
        <Suspense fallback={<DetailSkeleton />}>
          <GarmentDetail params={params} />
        </Suspense>
      </div>
    </Screen>
  );
}
