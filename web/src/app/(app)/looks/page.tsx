import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Screen, SpaceHeader } from "@/components/ui";
import { LookList } from "@/components/espacio/look-list";
import { listOutfits } from "@/lib/data/queries";
import LooksSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tus looks — Estilo" };

async function LooksContent() {
  const saved = await listOutfits({ status: "saved" });

  if (saved.length === 0) {
    return (
      <div className="pt-2">
        <header>
          <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
            Tus looks
          </h1>
        </header>
        <div className="mt-12">
          <h2 className="font-display text-titular font-extrabold tracking-[-0.02em] text-tinta">
            Aún no guardas looks
          </h2>
          <p className="mt-3 mb-6 font-body text-destacado text-tinta">
            Cuéntame para qué ocasión vistes y armo uno con tu clóset.
          </p>
          <Link
            href="/asesor"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-accion px-6 font-body text-base font-extrabold text-tinta transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
          >
            <span>Pedirle un look al asesor</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <header className="pb-2">
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          Tus looks
        </h1>
        <p className="mt-1 font-body text-meta text-tinta-suave">
          {saved.length} {saved.length === 1 ? "guardado" : "guardados"}
        </p>
      </header>

      <div className="mt-4">
        <LookList outfits={saved} />
      </div>
    </div>
  );
}

export default function LooksPage() {
  return (
    <Screen>
      <SpaceHeader backHref="/asesor" backLabel="Volver a la conversación" />
      <div className="px-6 pb-10">
        <Suspense fallback={<LooksSkeleton />}>
          <LooksContent />
        </Suspense>
      </div>
    </Screen>
  );
}
