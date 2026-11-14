import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IconCamera, Screen, SpaceHeader } from "@/components/ui";
import { CategoryFilter } from "@/components/espacio/category-filter";
import { ClosetGrid } from "@/components/espacio/closet-grid";
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
      <div className="pt-2">
        <header>
          <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
            Tu clóset
          </h1>
        </header>
        <div className="mt-12">
          <h2 className="font-display text-titular font-extrabold tracking-[-0.02em] text-tinta">
            Tu clóset está vacío
          </h2>
          <p className="mt-3 mb-6 font-body text-destacado text-tinta">
            Mándame una foto de una prenda y la sumo yo.
          </p>
          <Link
            href="/asesor"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-accion px-6 font-body text-base font-extrabold text-tinta transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
          >
            <IconCamera className="size-5" aria-hidden="true" />
            <span>Mandar una foto al asesor</span>
          </Link>
        </div>
      </div>
    );
  }

  const noun = (n: number) => `${n} ${n === 1 ? "prenda" : "prendas"}`;

  return (
    <div className="pt-2">
      <header>
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          Tu clóset
        </h1>
        <p className="mt-1 font-body text-meta text-tinta-suave" aria-live="polite">
          {shown.length !== total && active
            ? `${noun(shown.length)} en ${CATEGORY_LABELS_SHORT[active].toLowerCase()} · ${noun(total)} en total`
            : noun(total)}
        </p>
      </header>

      <CategoryFilter available={available} active={active as GarmentCategory | null} />

      <div className="mt-4">
        {shown.length > 0 ? (
          <ClosetGrid garments={shown} />
        ) : (
          <p className="py-8 text-center font-body text-tinta-suave">
            No tienes prendas en esta categoría.
          </p>
        )}
      </div>

      <p className="mt-8 font-body text-meta text-tinta-suave">
        Para sumar una prenda, mándale la foto a tu asesor en la conversación.
      </p>
    </div>
  );
}

export default function ClosetPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Screen>
      <SpaceHeader backHref="/asesor" backLabel="Volver a la conversación" />
      <div className="px-6 pb-10">
        <Suspense fallback={<ClosetSkeleton />}>
          <ClosetContent searchParams={searchParams} />
        </Suspense>
      </div>
    </Screen>
  );
}
