import { AppHeader } from "@/components/ui";

/** Esqueleto del hilo mientras carga el historial: tres líneas que respiran. */
export function ThreadSkeleton() {
  return (
    <main id="contenido" className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-fondo">
      <AppHeader />
      <div role="status" className="flex flex-1 flex-col gap-3 px-5 pt-8">
        <span className="sr-only">Cargando la conversación…</span>
        <div aria-hidden="true" className="h-4 w-[90%] animate-respirar rounded-xs bg-hundido" />
        <div aria-hidden="true" className="h-4 w-3/4 animate-respirar rounded-xs bg-hundido [animation-delay:150ms]" />
        <div aria-hidden="true" className="h-4 w-3/5 animate-respirar rounded-xs bg-hundido [animation-delay:300ms]" />
      </div>
    </main>
  );
}
