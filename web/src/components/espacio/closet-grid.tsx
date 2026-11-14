import type { GarmentView } from "@/lib/domain/types";
import { GarmentTile } from "./garment-tile";

/** Galería de 2 columnas (UI-18). Las primeras 4 fotos cargan con prioridad eager. */
export function ClosetGrid({ garments }: { garments: GarmentView[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {garments.map((g, i) => (
        <li key={g.id} className="min-w-0">
          <GarmentTile garment={g} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
