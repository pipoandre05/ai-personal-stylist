import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Screen, TopBar, cn } from "@/components/ui";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Entrar — Prendie" };

const tab = (active: boolean) =>
  cn(
    "flex min-h-11 flex-1 items-center justify-center rounded-sm text-sm font-semibold transition-[opacity] duration-150",
    active ? "bg-tinta text-superficie" : "text-tinta hover:bg-hundido",
  );

/** El modo viene de searchParams (dato de la solicitud): va dentro de Suspense (Cache Components). */
async function Contenido({ searchParams }: Pick<PageProps<"/entrar">, "searchParams">) {
  const { modo } = await searchParams;
  const crear = (Array.isArray(modo) ? modo[0] : modo) === "crear";

  return (
    <>
      <h1 className="font-display text-3xl">{crear ? "Crea tu cuenta" : "Hola de nuevo"}</h1>
      <p className="mt-2 text-tinta-suave">
        {crear ? "Con tu email y una contraseña. Tardas menos de un minuto." : "Entra para ver tu clóset y tus looks."}
      </p>

      <nav aria-label="Tipo de acceso" className="mt-6 flex gap-1 rounded-sm border border-linea-fuerte bg-superficie p-1">
        <Link href="/entrar?modo=crear" aria-current={crear ? "page" : undefined} className={tab(crear)}>
          Crear cuenta
        </Link>
        <Link href="/entrar" aria-current={crear ? undefined : "page"} className={tab(!crear)}>
          Entrar
        </Link>
      </nav>

      <AuthForm key={crear ? "crear" : "entrar"} crear={crear} />
    </>
  );
}

export default function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <Screen>
      <TopBar backHref="/" backLabel="Volver al inicio" />
      <div className="px-5 pt-2">
        <Suspense fallback={<div aria-hidden="true" className="h-9 w-3/4 animate-respirar rounded-sm bg-hundido" />}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </div>
    </Screen>
  );
}
