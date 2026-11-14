import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink, EmptyState, Screen, TopBar } from "@/components/ui";
import { CategoryFilter } from "@/components/espacio/category-filter";
import { ClosetGrid } from "@/components/espacio/closet-grid";
import { overlineClass } from "@/components/espacio/labels";
import { listGarments } from "@/lib/data/queries";
import { CATEGORY_LABELS_SHORT, GARMENT_CATEGORIES, type GarmentCategory } from "@/lib/domain/types";
import ClosetSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tu clóset — Estilo" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function ClosetContent({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).categoria;
  const wanted = typeof raw === "string" ? raw : null;
  const active = GARMENT_CATEGORIES.find((c) => c === wanted) ?? null;

  const all = await listGarments();
  const total = all.length;
  const available = GARMENT_CATEGORIES.filter((c) => all.some((g) => g.category === c));
  const shown = active ? all.filter((g) => g.category === active) : all;

  if (total === 0) {
    return (
      <>
        <ClosetHead count={0} />
        <EmptyState
          title="Tu clóset está vacío"
          description="Las prendas entran por la conversación: mándale una foto a tu asesor y la agrego por ti."
          action={<ButtonLink href="/asesor">Mándale una foto a tu asesor</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <ClosetHead count={total} shown={active ? shown.length : undefined} filterLabel={active ? CATEGORY_LABELS_SHORT[active] : undefined} />
      <CategoryFilter available={available} active={active as GarmentCategory | null} />
      <div className="mt-6">
        {shown.length > 0 ? (
          <ClosetGrid garments={shown} />
        ) : (
          <p className="py-8 text-tinta-suave">No tienes prendas en esta categoría.</p>
        )}
      </div>
      <p className="mt-10 text-sm text-tinta-suave">
        Para sumar una prenda, mándale la foto a tu asesor en la conversación.
      </p>
    </>
  );
}

function ClosetHead({ count, shown, filterLabel }: { count: number; shown?: number; filterLabel?: string }) {
  const noun = (n: number) => `${n} ${n === 1 ? "prenda" : "prendas"}`;
  return (
    <header className="pb-5">
      <p className={overlineClass}>Tu espacio</p>
      <h1 className="mt-1 font-display text-3xl">Tu clóset</h1>
      <p className="mt-1 text-sm text-tinta-suave" aria-live="polite">
        {shown !== undefined ? `${noun(shown)} en ${filterLabel?.toLowerCase()} · ${noun(count)} en total` : noun(count)}
      </p>
    </header>
  );
}

export default function ClosetPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Screen>
      <TopBar />
      <div className="px-5 pt-2 pb-10">
        <Suspense fallback={<ClosetSkeleton />}>
          <ClosetContent searchParams={searchParams} />
        </Suspense>
      </div>
    </Screen>
  );
}
