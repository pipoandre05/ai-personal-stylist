import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink, Screen, TopBar } from "@/components/ui";
import { overlineClass } from "@/components/espacio/labels";
import { PaletteAdjust } from "@/components/espacio/palette-adjust";
import { PaletteBadges, PaletteSwatches, PaletteTitle } from "@/components/espacio/palette-swatches";
import { getActiveColorAnalysis } from "@/lib/data/queries";
import PaletaSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tu paleta — Estilo" };

async function PaletaContent() {
  const analysis = await getActiveColorAnalysis();

  if (!analysis) {
    return (
      <>
        <header>
          <p className={overlineClass}>Tu espacio</p>
          <h1 className="mt-1 font-display text-3xl">Tu paleta</h1>
        </header>
        <div className="mt-8">
          <h2 className="font-display text-2xl">Aún no tienes paleta</h2>
          <p className="mt-3 max-w-sm text-base text-tinta-suave">
            Mándale una selfie a tu asesor y te doy una orientación de los colores que tienden a iluminarte la cara. Es solo una
            orientación a partir de una foto, no un diagnóstico.
          </p>
          <ButtonLink href="/asesor" className="mt-5">
            Mandar una selfie al asesor
          </ButtonLink>
        </div>
        <section aria-labelledby="a-mano" className="mt-12 border-t border-linea pt-8">
          <h2 id="a-mano" className="font-display text-xl">
            ¿Ya conoces tu estación?
          </h2>
          <p className="mt-2 mb-4 max-w-sm text-sm text-tinta-suave">Puedes elegirla tú y la guardo como tu paleta.</p>
          <PaletteAdjust current={null} label="Elegir mi estación" />
        </section>
      </>
    );
  }

  return (
    <>
      <header>
        <p className={overlineClass}>Tu espacio · orientativa</p>
        <PaletteTitle analysis={analysis} as="h1" className="mt-1 text-4xl leading-[1.05]" />
        <div className="mt-3">
          <PaletteBadges analysis={analysis} />
        </div>
      </header>

      {analysis.rationale ? <p className="mt-6 max-w-prose text-base text-tinta">{analysis.rationale}</p> : null}

      {!analysis.lighting_ok ? (
        <p className="mt-5 rounded-sm bg-alerta-suave px-3 py-2 text-sm text-alerta">
          La luz de la foto no era pareja. Tómalo como punto de partida.
        </p>
      ) : null}

      <div className="mt-8">
        <PaletteSwatches analysis={analysis} />
      </div>

      <p className="mt-8 text-sm text-tinta-suave">
        Es una orientación a partir de una foto, no un diagnóstico.
        {analysis.source === "ai" ? " Tu selfie ya se borró." : ""} Si algo no te calza, ajústala.
      </p>

      <div className="mt-6 flex flex-col items-start gap-3">
        <PaletteAdjust current={analysis.season} />
        <ButtonLink href="/asesor" variant="text">
          Mandar otra selfie
        </ButtonLink>
      </div>
    </>
  );
}

export default function PaletaPage() {
  return (
    <Screen>
      <TopBar backHref="/yo" backLabel="Volver a tu perfil" />
      <div className="px-5 pt-2 pb-12">
        <Suspense fallback={<PaletaSkeleton />}>
          <PaletaContent />
        </Suspense>
      </div>
    </Screen>
  );
}
