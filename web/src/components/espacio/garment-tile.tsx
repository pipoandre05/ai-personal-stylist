import Link from "next/link";
import { IconShirt } from "@/components/ui";
import { CATEGORY_LABELS, type GarmentView } from "@/lib/domain/types";

type GarmentTileProps = {
  garment: GarmentView;
  /** La primera fila no se difiere: es lo que se ve al abrir. */
  priority?: boolean;
};

/**
 * Miniatura del clóset (UI-18):
 * Foto 4:5 con recorte al 78% sobre fondo hundido, radio foto 24px,
 * insignia "Favorita" en superficie, nombre y categoría debajo.
 */
export function GarmentTile({ garment, priority = false }: GarmentTileProps) {
  const incomplete = garment.status === "failed";
  const processing = garment.status === "processing";
  const name = garment.name || "Prenda sin nombre";
  const categoryLabel = CATEGORY_LABELS[garment.category] ?? "Prenda";

  return (
    <Link
      href={`/closet/${garment.id}`}
      className="group flex min-w-0 flex-col gap-2 rounded-foto text-inherit no-underline transition-opacity duration-150 ease-estilo active:opacity-80 focus-visible:ring-3 focus-visible:ring-foco"
    >
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-foto bg-hundido">
        {garment.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage
          <img
            src={garment.photo_url}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="w-[78%] aspect-[1/1.05] rounded-campo object-cover drop-shadow-prenda"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-2 text-center text-tinta-suave">
            <IconShirt className="size-8" />
            <span className="font-body text-xs">Sin foto</span>
          </div>
        )}

        {garment.favorite ? (
          <span className="absolute left-2.5 top-2.5 rounded-insignia bg-superficie px-2.5 py-1 font-body text-[11px] font-extrabold text-tinta">
            Favorita
          </span>
        ) : null}

        {incomplete || processing ? (
          <span className="absolute inset-x-2 bottom-2 rounded-insignia bg-superficie/90 px-2 py-1 text-center font-body text-[11px] font-extrabold text-tinta-suave">
            {incomplete ? "Completar datos" : "Procesando"}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="truncate font-body text-sm font-extrabold text-tinta">
          {name}
        </p>
        <p className="mt-0.5 font-body text-meta text-tinta-suave">
          {categoryLabel}
        </p>
      </div>
    </Link>
  );
}
