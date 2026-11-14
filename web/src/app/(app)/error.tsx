"use client";

import { Button, Screen } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Screen className="px-5">
      <div role="alert" className="py-16">
        <h1 className="font-display text-3xl">No pude cargar esta pantalla.</h1>
        <p className="mt-3 max-w-sm text-tinta-suave">
          Puede ser tu conexión. Tus datos están guardados: inténtalo de nuevo.
        </p>
        <Button className="mt-6" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </Screen>
  );
}
