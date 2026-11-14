import type { SVGProps } from "react";
import { IconShirt } from "@/components/ui/icons";
import type { GarmentCategory } from "@/lib/domain/types";

// Íconos propios del contrato v2: 24×24, trazo 2, extremos redondeados, currentColor (DESIGN.MD §3).
// Decorativos (aria-hidden): quien los usa pone el texto.

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Base({ className = "size-5", children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCalendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Base>
);

export const IconPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s6.5-5.6 6.5-11.2a6.5 6.5 0 10-13 0C5.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="9.8" r="2.3" />
  </Base>
);

export const IconCloudSun = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2v2M4.9 4.9l1.4 1.4M20 12h2M19.1 4.9l-1.4 1.4M15.9 12.6a4 4 0 00-5.9-4.1M13 22H7a5 5 0 114.9-6H13a3 3 0 010 6z" />
  </Base>
);

export const IconThermo = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4v10.5a4 4 0 11-4 0V4a2 2 0 014 0z" />
  </Base>
);

export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Base>
);

export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />
  </Base>
);

export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20.5 20.5l-4.6-4.6" />
  </Base>
);

export const IconBookmark = (p: IconProps) => (
  <Base {...p}>
    <path d="M18.5 20.5L12 16.5l-6.5 4V5.5a2 2 0 012-2h9a2 2 0 012 2z" />
  </Base>
);

export const IconExternal = (p: IconProps) => (
  <Base {...p}>
    <path d="M14.5 4H20v5.5M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
  </Base>
);

export const IconChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);

export const IconSpark = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
  </Base>
);

export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l7 3v5.5c0 4.6-3 8-7 9.5-4-1.5-7-4.9-7-9.5V6z" />
  </Base>
);

export const IconSwatch = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5a8.5 8.5 0 100 17c1.6 0 2-1.1 1.5-2.1s0-2.4 1.5-2.4h2a4 4 0 004-4A8.5 8.5 0 0012 3.5z" />
    <path d="M7.8 11.5v.1M10.5 7.8v.1M14.5 7.8v.1" />
  </Base>
);

export const IconHanger = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 8V6.8a2.3 2.3 0 10-2.3-2.3M12 8l8.2 5.6a1 1 0 01-.6 1.8H4.4a1 1 0 01-.6-1.8z" />
  </Base>
);

export const IconRetry = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12a7.5 7.5 0 112.2 5.3M4.5 12V7M4.5 12H9.5" />
  </Base>
);

/** Silueta simple por categoría: marcador de una pieza sin foto y contorno de la pieza que falta (PD-12). */
export function CategoryGlyph({
  category,
  dashed = false,
  strokeWidth,
  viewBox,
  className = "size-6",
}: {
  category: GarmentCategory;
  dashed?: boolean;
  /** Trazo propio: a tamaño grande (la pieza que falta en la mesa) el 2 por defecto engorda. */
  strokeWidth?: number;
  /** Recorte del viewBox (por defecto "0 0 24 24"): para que una silueta apaisada (zapatos) llene su caja. */
  viewBox?: string;
  className?: string;
}) {
  const dash = {
    ...(dashed ? { strokeDasharray: "3.2 3.2" } : {}),
    ...(strokeWidth ? { strokeWidth } : {}),
    ...(viewBox ? { viewBox } : {}),
  };
  switch (category) {
    case "top":
      return <IconShirt className={className} {...dash} />;
    case "bottom":
      return (
        <Base className={className} {...dash}>
          <path d="M7 3.5h10l2.5 17H14l-2-10-2 10H4.5z" />
        </Base>
      );
    case "dress":
      return (
        <Base className={className} {...dash}>
          <path d="M9 3l3 2 3-2 1 6.5 3.5 11H4.5L8 9.5z" />
        </Base>
      );
    case "outerwear":
      return (
        <Base className={className} {...dash}>
          <path d="M9 3.5l3 2.5 3-2.5 5 2.5-1 6-3-.8v10.3H8V11.2l-3 .8-1-6zM12 6v14.5" />
        </Base>
      );
    case "shoes":
      return (
        <Base className={className} {...dash}>
          <path d="M3 17.5v-3.2l6.5-1.3 3-5 3.2 4 5.3 1.2v4.3z" />
        </Base>
      );
    case "bag":
      return (
        <Base className={className} {...dash}>
          <path d="M5 9h14l1 11.5H4zM9 9V7a3 3 0 016 0v2" />
        </Base>
      );
    case "accessory":
    default:
      return (
        <Base className={className} {...dash}>
          <circle cx="7.5" cy="13.5" r="3.5" />
          <circle cx="16.5" cy="13.5" r="3.5" />
          <path d="M11 13.2h2" />
        </Base>
      );
  }
}
