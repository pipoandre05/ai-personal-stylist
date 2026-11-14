import Link from "next/link";
import { cn } from "@/components/ui";
import { IconHeart, IconShirt } from "@/components/ui";
import type { GarmentView } from "@/lib/domain/types";

type GarmentTileProps = {
  garment: GarmentView;
  /** La primera fila no se difiere: es lo que se ve al abrir. */
  priority?: boolean;
};

/** Miniatura del clóset: foto 3:4 con `object-cover`, nombre debajo y marca de favorita. */
export function GarmentTile({ garment, priority = false }: GarmentTileProps) {
  const incomplete = garment.status === "failed";
  const processing = garment.status === "processing";
  const alt = garment.name ? `${garment.name}` : "Prenda sin nombre";

  return (
    <Link
      href={`/closet/${garment.id}`}
      className="group block rounded-md transition-opacity duration-150 ease-estilo active:opacity-80"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-hundido">
        {garment.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage, de corta duración
          <img
            src={garment.photo_url}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover object-center"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-2 text-center text-tinta-suave">
            <IconShirt className="size-7" />
            <span className="text-xs">Sin foto</span>
          </div>
        )}

        {garment.favorite ? (
          <span className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-superficie text-acento">
            <IconHeart className="size-4 fill-current" />
            <span className="sr-only">Favorita</span>
          </span>
        ) : null}

        {incomplete || processing ? (
          <span
            className={cn(
              "absolute inset-x-1.5 bottom-1.5 rounded-sm px-2 py-1 text-center text-xs font-medium",
              incomplete ? "bg-alerta-suave text-alerta" : "bg-superficie text-tinta-suave",
            )}
          >
            {incomplete ? "Completar datos" : "Procesando"}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 truncate text-sm text-tinta">{garment.name || "Prenda sin nombre"}</p>
    </Link>
  );
}
