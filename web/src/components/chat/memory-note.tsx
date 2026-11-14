import { IconCheck } from "@/components/ui";

/** "Anotado: …": nota discreta, sin fondo ni borde. */
export function MemoryNote({ fact }: { fact: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-tinta-suave">
      <IconCheck className="mt-0.5 size-4 shrink-0" />
      <span>Anotado: {fact}</span>
    </p>
  );
}
