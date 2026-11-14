import { cn } from "@/components/ui/cn";
import type { GarmentCategory } from "@/lib/domain/types";
import { CategoryGlyph } from "./glyphs";
import { layoutPieces, type Piece } from "./outfit-layout";
import { PieceImage } from "./piece";

/** Recorte del viewBox de cada silueta para que llene su caja (las apaisadas pierden aire arriba y abajo). */
const GLYPH_CROP: Partial<Record<GarmentCategory, string>> = {
  shoes: "2 6.5 20.5 12.5",
  bag: "3.5 2 17 19.5",
  accessory: "2.5 8 19 11",
};

type OutfitTableProps = {
  pieces: Piece[];
  /** Las prendas caen una tras otra (look recién llegado). El historial no anima. */
  animate?: boolean;
};

/**
 * La mesa del look: las prendas recortadas sobre `hundido`, con leve rotación y solapes. La pieza que falta es el
 * contorno punteado de su categoría con la palabra "Falta"; si la persona eligió una opción, esa pieza entra en su
 * lugar con la palabra "Elegida". Los números enlazan con la leyenda de abajo.
 */
export function OutfitTable({ pieces, animate = false }: OutfitTableProps) {
  const placements = layoutPieces(pieces.map((p) => p.category));
  return (
    <div
      role="group"
      aria-label="Así se ve el look"
      className="relative -mx-1 mt-3 aspect-[3/2] overflow-hidden rounded-foto bg-hundido"
    >
      {pieces.map((p, i) => {
        const pl = placements[i];
        return (
          <div
            key={p.key}
            className={cn("absolute rotate-[var(--r)]", animate && "animate-aparecer")}
            style={{
              left: `${pl.left}%`,
              top: `${pl.top}%`,
              width: `${pl.width}%`,
              aspectRatio: pl.aspect,
              animationDelay: animate ? `${120 + i * 80}ms` : undefined,
              ["--r" as string]: `${pl.rotate}deg`,
            }}
          >
            {p.kind === "missing" ? (
              <>
                <CategoryGlyph
                  category={p.category}
                  dashed
                  strokeWidth={0.9}
                  viewBox={GLYPH_CROP[p.category]}
                  className="size-full text-tinta-suave"
                />
                <span className="absolute -top-3.5 left-1/2 z-[2] -translate-x-1/2 whitespace-nowrap rounded-insignia bg-falta px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sobre-color">
                  Falta
                </span>
              </>
            ) : (
              <>
                <PieceImage src={p.src} alt={p.name} category={p.category} shadow showName />
                {p.kind === "chosen" ? (
                  <span className="absolute bottom-0 left-1/2 z-[2] -translate-x-1/2 rounded-insignia bg-inverso px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sobre-inverso">
                    Elegida
                  </span>
                ) : null}
              </>
            )}
            <span
              aria-hidden="true"
              className={cn(
                "absolute z-[2] font-display text-[13px] font-extrabold",
                p.kind === "missing"
                  ? "-left-1 -top-1 grid size-5 place-items-center rounded-full bg-falta text-[11px] text-sobre-color"
                  : "-left-1 -top-1 text-tinta-suave",
              )}
            >
              {p.index}
            </span>
          </div>
        );
      })}
    </div>
  );
}
