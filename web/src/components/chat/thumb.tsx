import { cn, IconShirt } from "@/components/ui";

type ThumbProps = {
  src: string | null;
  alt: string;
  className?: string;
  /** Texto del marcador cuando la foto no está disponible. */
  fallbackLabel?: string;
};

/** Foto sobre fondo `hundido`. Si no hay URL (o cayó la firmada) muestra un marcador con ícono y nombre. */
export function Thumb({ src, alt, className, fallbackLabel }: ThumbProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("flex size-full flex-col items-center justify-center gap-1 bg-hundido p-2 text-center text-tinta-suave", className)}
      >
        <IconShirt className="size-6" />
        {fallbackLabel ? <span className="text-xs">{fallbackLabel}</span> : null}
      </div>
    );
  }
  return (
    // Las URLs son firmadas y de corta vida (Supabase Storage): next/image no aporta aquí.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} decoding="async" className={cn("size-full bg-hundido object-cover object-center", className)} />
  );
}
