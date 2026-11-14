import type { GarmentView } from "@/lib/domain/types";
import { GarmentTile } from "./garment-tile";

/** Galería de 3 columnas. Las primeras 6 fotos cargan de inmediato; el resto, al acercarse. */
export function ClosetGrid({ garments }: { garments: GarmentView[] }) {
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
      {garments.map((g, i) => (
        <li key={g.id} className="min-w-0">
          <GarmentTile garment={g} priority={i < 6} />
        </li>
      ))}
    </ul>
  );
}
