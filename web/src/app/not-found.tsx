import { ButtonLink, Screen } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen className="justify-center px-5">
      <div className="mb-5 h-0.5 w-10 bg-acento" aria-hidden="true" />
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
