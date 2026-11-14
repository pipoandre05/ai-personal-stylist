import { ButtonLink, Mascot, Screen } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen className="justify-center px-5">
      <Mascot pose="ups" height={168} className="mb-4" />
      <h1 className="font-display text-4xl">No encuentro esta página.</h1>
      <p className="mt-3 max-w-sm text-tinta-suave">
        Puede que el enlace esté mal escrito o que ya no exista. Volvamos a la conversación y
        seguimos con tu look.
      </p>
      <div className="mt-6">
        <ButtonLink href="/asesor" fullWidth>
          Volver al asesor
        </ButtonLink>
      </div>
    </Screen>
  );
}
