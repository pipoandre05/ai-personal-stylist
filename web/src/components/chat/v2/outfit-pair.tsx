import { cn } from "@/components/ui/cn";
import type { ChatIntent, OutfitView } from "@/lib/domain/types";
import { OutfitCardV2 } from "./outfit-card-v2";

export type OutfitPairProps = {
  /** Los dos looks de un mismo `pair_id`, en cualquier orden: el "seguro" siempre va primero. */
  outfits: [OutfitView, OutfitView];
  onSave?: (outfit: OutfitView) => void;
  onDiscard?: (outfit: OutfitView) => void;
  onRefine?: (intent: ChatIntent, label: string) => void;
  closetHref?: (garmentId: string) => string;
  busy?: boolean;
  animate?: boolean;
  className?: string;
};

/** El "seguro" primero; si la variante falta o empata, el orden en que llegaron. */
export function orderPair(outfits: [OutfitView, OutfitView]): [OutfitView, OutfitView] {
  const [a, b] = outfits;
  return a.variant === "atrevido" && b.variant !== "atrevido" ? [b, a] : [a, b];
}

/**
 * Dos looks para elegir.
 *
 * Decisión de diseño: **apilados con rótulo, no carrusel.** A 390 px un carrusel esconde la alternativa fuera de
 * pantalla (la persona puede no enterarse de que hay un segundo look), pelea con el scroll vertical del hilo y con el
 * gesto de volver, y obliga a comparar de memoria. Apilados, ambos son lectura normal del hilo (un solo gesto: bajar),
 * y la pertenencia al par se dice con palabras: una cabecera "Dos looks para elegir", el rótulo "Opción 1 de 2" /
 * "Opción 2 de 2" en cada tarjeta, la variante ("Más seguro" / "Más atrevido") y un conector "o" entre ambas.
 *
 * Peso igual para los dos: ninguno va en `inverso` ni con lima (eso diría "este es el recomendado"); el énfasis lo
 * lleva la cabecera. Cada tarjeta guarda con su propio "Guardar look" (en `inverso`); guardar uno es la señal de gusto.
 */
export function OutfitPair({ outfits, onSave, onDiscard, onRefine, closetHref, busy, animate, className }: OutfitPairProps) {
  const [first, second] = orderPair(outfits);
  const headingId = `outfit-pair-${first.pair_id ?? first.id}-title`;
  const common = { onSave, onDiscard, onRefine, closetHref, busy, animate };

  return (
    <section role="group" aria-labelledby={headingId} className={cn("flex flex-col gap-3", className)}>
      <header className="rounded-tarjeta bg-inverso px-[18px] py-4 text-sobre-inverso">
        <p className="text-sobretitulo uppercase text-sobre-inverso-suave">Dos looks para elegir</p>
        <h3 id={headingId} className="mt-1 font-display text-titulo-s">
          Te armé dos y puedes quedarte con el que prefieras
        </h3>
        <p className="mt-1.5 text-cuerpo text-sobre-inverso-suave">
          El primero va a la segura; el segundo se atreve un poco más.
        </p>
      </header>
      <OutfitCardV2 outfit={first} tag="Opción 1 de 2" {...common} />
      <div aria-hidden="true" className="flex items-center gap-3 px-1 text-sobretitulo uppercase text-tinta-suave">
        <span className="h-px flex-1 bg-linea" />o<span className="h-px flex-1 bg-linea" />
      </div>
      <OutfitCardV2 outfit={second} tag="Opción 2 de 2" {...common} />
    </section>
  );
}
