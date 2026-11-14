import { Screen, Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <Screen className="items-center justify-center">
      <div role="status" className="flex items-center gap-3 text-sm text-tinta-suave">
        <Spinner className="size-5" />
        Cargando…
      </div>
    </Screen>
  );
}
