import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink, EmptyState, Screen, TopBar } from "@/components/ui";
import { overlineClass } from "@/components/espacio/labels";
import { LookList } from "@/components/espacio/look-list";
import { listOutfits } from "@/lib/data/queries";
import LooksSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tus looks — Estilo" };

async function LooksContent() {
  const [saved, proposed] = await Promise.all([
    listOutfits({ status: "saved" }),
    listOutfits({ status: "proposed" }),
  ]);
  const recent = proposed.slice(0, 10);

  return (
    <>
      <header className="pb-6">
        <p className={overlineClass}>Tu espacio</p>
        <h1 className="mt-1 font-display text-3xl">Tus looks</h1>
        {saved.length > 0 ? (
          <p className="mt-1 text-sm text-tinta-suave">
            {saved.length} {saved.length === 1 ? "guardado" : "guardados"}
          </p>
        ) : null}
      </header>

      {saved.length === 0 && recent.length === 0 ? (
        <EmptyState
          title="Aún no guardas looks"
          description="Cuéntale a tu asesor para qué te vistes y te armo uno con tu ropa. Los que te gusten quedan guardados aquí."
          action={<ButtonLink href="/asesor">Pedirle un look al asesor</ButtonLink>}
        />
      ) : (
        <div className="space-y-12">
          {saved.length > 0 ? (
            <LookList heading="Guardados" outfits={saved} />
          ) : (
            <p className="text-tinta-suave">
              Todavía no guardas ninguno. Cuando te guste un look, guárdalo desde la conversación y queda aquí.
            </p>
          )}
          <LookList
            heading="Propuestos hace poco"
            description="Looks que te mostré y no guardaste."
            outfits={recent}
          />
          <ButtonLink href="/asesor" variant="secondary">
            Pedirle un look al asesor
          </ButtonLink>
        </div>
      )}
    </>
  );
}

export default function LooksPage() {
  return (
    <Screen>
      <TopBar />
      <div className="px-5 pt-2 pb-10">
        <Suspense fallback={<LooksSkeleton />}>
          <LooksContent />
        </Suspense>
      </div>
    </Screen>
  );
}
