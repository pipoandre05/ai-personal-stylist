import { cn } from "@/components/ui/cn";
import type { GarmentCategory } from "@/lib/domain/types";
import { CategoryGlyph } from "./glyphs";

type PieceImageProps = {
  src: string | null | undefined;
  /** Nombre de la prenda: es el `alt` y, sin foto, el rótulo del marcador. */
  alt: string;
  category?: GarmentCategory;
  /** Sombra de la prenda recortada (parte de la foto, DESIGN.MD §3). */
  shadow?: boolean;
  /** Muestra el nombre dentro del marcador cuando no hay foto (si el espacio alcanza). */
  showName?: boolean;
  className?: string;
};

/**
 * Prenda sobre el fondo del contenedor, sin recorte propio (`object-contain`). Sin URL: marcador sobrio con la
 * silueta de su categoría y, si cabe, el nombre. Nunca un bloque de color (DESIGN.MD §5).
 */
export function PieceImage({ src, alt, category = "top", shadow = false, showName = false, className }: PieceImageProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex size-full flex-col items-center justify-center gap-1 rounded-insignia bg-superficie/70 p-1 text-center text-tinta-suave",
          className,
        )}
      >
        <CategoryGlyph category={category} className="size-[45%] max-h-8 max-w-8 min-h-4 min-w-4 shrink-0" />
        {showName ? <span className="line-clamp-2 text-meta">{alt}</span> : null}
      </div>
    );
  }
  return (
    // Las URLs son firmadas y de corta vida (Supabase Storage): next/image no aporta aquí.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      decoding="async"
      loading="lazy"
      className={cn("size-full object-contain object-center", shadow && "drop-shadow-prenda", className)}
    />
  );
}
