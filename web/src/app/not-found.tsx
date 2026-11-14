import { ButtonLink, Screen } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen className="justify-center px-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave">Error 404</p>
      <h1 className="mt-2 font-display text-4xl">Esta página no existe.</h1>
      <p className="mt-3 max-w-sm text-tinta-suave">Puede que el enlace esté mal escrito o que ya no esté disponible.</p>
      <div className="mt-6">
        <ButtonLink href="/asesor">Ir al asesor</ButtonLink>
      </div>
    </Screen>
  );
}
