import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonStyles, Screen, SpaceHeader } from "@/components/ui";
import { PaletteAdjust } from "@/components/espacio/palette-adjust";
import { getActiveColorAnalysis } from "@/lib/data/queries";
import { COLOR_SEASON_LABELS } from "@/lib/domain/types";
import PaletaSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tu paleta — Prendie" };

async function PaletaContent() {
  const analysis = await getActiveColorAnalysis();

  if (!analysis) {
    return (
      <div className="pt-2">
        <header>
          <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
            Tu paleta
          </h1>
          <p className="mt-1 font-body text-meta text-tinta-suave">Aún sin calcular</p>
        </header>
        <div className="mt-8">
          <h2 className="font-display text-titulo-s font-extrabold text-tinta">
            Aún no tienes paleta
          </h2>
          <p className="mt-2 font-body text-cuerpo text-tinta-suave">
            Mándale una selfie a tu asesor y te doy una orientación de los colores que tienden a iluminarte la cara.
            Es solo una orientación, no un diagnóstico.
          </p>
          <Link
            href="/asesor"
            className={buttonStyles({ variant: "contorno", size: "mediano", className: "mt-4" })}
          >
            Mandar una foto al asesor
          </Link>
        </div>
      </div>
    );
  }

  const seasonLabel = COLOR_SEASON_LABELS[analysis.season] ?? "Tu estación";
  const recommended = analysis.recommended ?? [];

  return (
    <div className="pt-2">
      <header>
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          Tu paleta
        </h1>
        <p className="mt-1 font-body text-meta text-tinta-suave">
          {seasonLabel} · orientativa
        </p>
      </header>

      {/* Muestras principales en fila */}
      {recommended.length > 0 ? (
        <div className="mt-5 flex gap-2">
          {recommended.slice(0, 5).map((c, i) => (
            <i
              key={i}
              className="size-9 rounded-full not-italic"
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      ) : null}

      {/* Colores que te favorecen */}
      <section className="mt-8 border-t border-linea pt-8">
        <h2 className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Colores que te favorecen
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {recommended.map((c) => (
            <div key={`${c.name}-${c.hex}`} className="flex flex-col items-center gap-1.5">
              <i
                className="size-12 rounded-full border border-linea not-italic"
                style={{ backgroundColor: c.hex }}
              />
              <span className="w-full truncate text-center font-body text-meta text-tinta-suave">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo la calculé */}
      <section className="mt-8 border-t border-linea pt-8">
        <h2 className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Cómo la calculé
        </h2>
        <p className="mt-2 font-body text-cuerpo text-tinta">
          Mira tu foto y lo que me contaste. Es una orientación, no un diagnóstico.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PaletteAdjust current={analysis.season} />
        </div>
      </section>
    </div>
  );
}

export default function PaletaPage() {
  return (
    <Screen>
      <SpaceHeader backHref="/yo" backLabel="Volver a tu perfil" />
      <div className="px-6 pb-12">
        <Suspense fallback={<PaletaSkeleton />}>
          <PaletaContent />
        </Suspense>
      </div>
    </Screen>
  );
}
