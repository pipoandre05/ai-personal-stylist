import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink, buttonStyles, Screen, TopBar } from "@/components/ui";
import { DeleteAccount } from "@/components/espacio/delete-account";
import { overlineClass } from "@/components/espacio/labels";
import { MemoryList } from "@/components/espacio/memory-list";
import { PaletteBadges, PaletteSwatches, PaletteTitle } from "@/components/espacio/palette-swatches";
import { ProfileSummary } from "@/components/espacio/profile-summary";
import { signOut } from "@/lib/actions/auth";
import { countGarments, getActiveColorAnalysis, getProfile, getStyleProfile, listMemoryFacts } from "@/lib/data/queries";
import YoSkeleton from "./skeleton";

export const metadata: Metadata = { title: "Tu perfil — Estilo" };

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-linea pt-8">
      <h2 id={id} className="font-display text-2xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function YoContent() {
  const [profile, style, palette, facts, garments] = await Promise.all([
    getProfile(),
    getStyleProfile(),
    getActiveColorAnalysis(),
    listMemoryFacts(),
    countGarments(),
  ]);
  const name = profile?.display_name?.trim() || null;
  const initial = (name ?? profile?.city ?? "T").charAt(0).toUpperCase();

  return (
    <div className="space-y-10">
      <header>
        <p className={overlineClass}>Tu espacio</p>
        <h1 className="mt-1 font-display text-3xl">Tu perfil</h1>
        <div className="mt-5 flex items-center gap-4 rounded-md border border-linea bg-superficie p-4">
          <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-acento-suave font-display text-2xl italic text-acento">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl">{name ?? "Tu perfil de imagen"}</p>
            <p className="text-sm text-tinta-suave">
              {[profile?.city, `${garments} ${garments === 1 ? "prenda" : "prendas"}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </header>

      <Section id="paleta" title="Tu paleta">
        {palette ? (
          <div>
            <PaletteTitle analysis={palette} as="p" className="text-2xl" />
            <div className="mt-2">
              <PaletteBadges analysis={palette} />
            </div>
            <div className="mt-5">
              <PaletteSwatches analysis={palette} compact />
            </div>
            <ButtonLink href="/yo/paleta" variant="secondary" className="mt-6">
              Ver tu paleta
            </ButtonLink>
          </div>
        ) : (
          <div>
            <p className="max-w-sm text-base text-tinta-suave">
              Aún no tienes paleta. Mándale una selfie a tu asesor y te doy una orientación de los colores que tienden a iluminarte.
            </p>
            <ButtonLink href="/asesor" className="mt-5">
              Mandar una selfie al asesor
            </ButtonLink>
          </div>
        )}
      </Section>

      <Section id="estilo" title="Lo que tu asesor sabe de ti">
        <ProfileSummary profile={profile} style={style} />
      </Section>

      <Section id="memoria" title="Lo que tu asesor recuerda de ti">
        <MemoryList facts={facts} />
      </Section>

      <Section id="privacidad" title="Privacidad">
        <ul className="space-y-2 text-base text-tinta">
          <li>Tus fotos están en un espacio privado: solo tú puedes verlas.</li>
          <li>Tu selfie se usa solo para el análisis y se borra apenas termino; guardo solo el resultado.</li>
          <li>Tu asesor nunca compra ni paga nada por ti.</li>
        </ul>
        <form action={signOut} className="mt-6">
          <button type="submit" className={buttonStyles({ variant: "secondary" })}>
            Cerrar sesión
          </button>
        </form>
      </Section>

      <Section id="borrar" title="Borrar mis datos">
        <p className="mb-4 max-w-sm text-base text-tinta-suave">
          Puedes borrar tu cuenta y todo lo que guardé de ti cuando quieras.
        </p>
        <DeleteAccount />
      </Section>
    </div>
  );
}

export default function YoPage() {
  return (
    <Screen>
      <TopBar />
      <div className="px-5 pt-2 pb-12">
        <Suspense fallback={<YoSkeleton />}>
          <YoContent />
        </Suspense>
      </div>
    </Screen>
  );
}
