import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Screen, TopBar, IconShirt } from "@/components/ui";
import { GarmentEditor } from "@/components/espacio/garment-editor";
import { capitalize, FORMALITY_LABELS, overlineClass, sectionLabelClass } from "@/components/espacio/labels";
import { getGarment } from "@/lib/data/queries";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import DetailSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Prenda — Estilo" };

type Params = Promise<{ id: string }>;

function Datum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className={sectionLabelClass}>{label}</dt>
      <dd className="mt-1 text-base text-tinta">{children}</dd>
    </div>
  );
}

async function GarmentDetail({ params }: { params: Params }) {
  const { id } = await params;
  const garment = await getGarment(id);
  if (!garment || garment.archived_at) notFound();

  const name = garment.name || "Prenda sin nombre";
  const category = CATEGORY_LABELS[garment.category];

  return (
    <>
      <header>
        <p className={overlineClass}>{category}</p>
        <h1 className="mt-1 font-display text-3xl">{name}</h1>
      </header>

      <div className="mt-5 aspect-[3/4] w-full overflow-hidden rounded-md bg-hundido">
        {garment.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage
          <img src={garment.photo_url} alt={name} decoding="async" className="size-full object-cover object-center" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-tinta-suave">
            <IconShirt className="size-9" />
            <span className="text-sm">Esta prenda no tiene foto</span>
          </div>
        )}
      </div>

      {garment.status === "failed" ? (
        <p className="mt-5 rounded-sm bg-alerta-suave px-3 py-2 text-sm text-alerta">
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
          <dt className={sectionLabelClass}>Colores</dt>
          <dd className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {garment.colors.length > 0 ? (
              garment.colors.map((c) => (
                <span key={`${c.name}-${c.hex}`} className="inline-flex items-center gap-2 text-base text-tinta">
                  <span aria-hidden="true" className="size-4 rounded-full border border-tinta/10" style={{ backgroundColor: c.hex }} />
                  {capitalize(c.name)}
                </span>
              ))
            ) : (
              <span className="text-base text-tinta-suave">Sin colores detectados</span>
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
    </>
  );
}

export default function GarmentPage({ params }: { params: Params }) {
  return (
    <Screen>
      <TopBar backHref="/closet" backLabel="Volver a tu clóset" />
      <div className="px-5 pt-2 pb-10">
        <Suspense fallback={<DetailSkeleton />}>
          <GarmentDetail params={params} />
        </Suspense>
      </div>
    </Screen>
  );
}
