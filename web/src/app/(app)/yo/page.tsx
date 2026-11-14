import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonStyles, Screen, SpaceHeader } from "@/components/ui";
import { DeleteAccount } from "@/components/espacio/delete-account";
import { capitalize } from "@/components/espacio/labels";
import { MemoryList } from "@/components/espacio/memory-list";
import { signOut } from "@/lib/actions/auth";
import { getActiveColorAnalysis, getStyleProfile, listMemoryFacts } from "@/lib/data/queries";
import YoSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tu perfil — Prendie" };

async function YoContent() {
  const [style, palette, facts] = await Promise.all([
    getStyleProfile(),
    getActiveColorAnalysis(),
    listMemoryFacts(),
  ]);

  const recommendedColors = palette?.recommended ?? [];
  const stylesList = style?.current_style ?? [];

  return (
    <div className="pt-2">
      <header>
        <h1 className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">
          Tu perfil
        </h1>
      </header>

      {/* Tu paleta */}
      <section className="mt-8 border-t border-linea pt-8">
        <h2 className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Tu paleta
        </h2>
        {recommendedColors.length > 0 ? (
          <div className="my-3 flex gap-2">
            {recommendedColors.slice(0, 5).map((c, i) => (
              <i
                key={i}
                className="size-9 rounded-full not-italic"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        ) : (
          <p className="my-3 font-body text-cuerpo text-tinta-suave">
            Aún no tienes paleta calculada.
          </p>
        )}
        <Link
          href="/yo/paleta"
          className={buttonStyles({ variant: "contorno", size: "mediano" })}
        >
          Ver mi paleta
        </Link>
      </section>

      {/* Tu estilo */}
      <section className="mt-8 border-t border-linea pt-8">
        <h2 className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Tu estilo
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {stylesList.length > 0 ? (
            stylesList.map((s) => (
              <span
                key={s}
                className="inline-flex h-8 items-center rounded-insignia bg-hundido px-3 font-body text-sm font-bold text-tinta"
              >
                {capitalize(s)}
              </span>
            ))
          ) : (
            <span className="font-body text-cuerpo text-tinta-suave">Aún no me lo cuentas.</span>
          )}
        </div>
      </section>

      {/* Lo que sé de ti */}
      <section id="memoria" className="mt-8 border-t border-linea pt-8">
        <h2 className="mb-3 font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Lo que sé de ti
        </h2>
        <MemoryList facts={facts} />
      </section>

      {/* Privacidad */}
      <section className="mt-8 border-t border-linea pt-8">
        <h2 className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Privacidad
        </h2>
        <p className="mt-2 font-body text-cuerpo text-tinta">
          Tus fotos son privadas y solo las ves tú. Puedes borrar tu cuenta cuando quieras.
        </p>
      </section>

      {/* Borrar mi cuenta */}
      <section className="mt-8 border-t border-linea pt-8">
        <h2 className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta">
          Borrar mi cuenta
        </h2>
        <p className="mt-2 mb-4 font-body text-cuerpo text-tinta">
          Se borran tu clóset, tus looks y lo que sé de ti. No se puede deshacer.
        </p>
        <DeleteAccount />
      </section>

      {/* Cerrar sesión */}
      <div className="mt-8 border-t border-linea pt-6">
        <form action={signOut}>
          <button
            type="submit"
            className={buttonStyles({ variant: "contorno", size: "mediano" })}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default function YoPage() {
  return (
    <Screen>
      <SpaceHeader backHref="/asesor" backLabel="Volver a la conversación" />
      <div className="px-6 pb-12">
        <Suspense fallback={<YoSkeleton />}>
          <YoContent />
        </Suspense>
      </div>
    </Screen>
  );
}
