import type { SVGProps } from "react";

// Íconos SVG inline: 24×24, trazo 2, currentColor (DESIGN.MD §3, Prendie identity).
// Decorativos por defecto (aria-hidden); si el ícono es lo único que hay en un botón,
// el botón debe llevar aria-label.

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Base({ children, className = "size-6", ...rest }: IconProps & { children: React.ReactNode }) {
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

export const IconBack = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconAlert = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.2v.1" />
  </Base>
);

export const IconEye = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);

export const IconEyeOff = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.9 5.8A9.7 9.7 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3.3 4M6.6 7.6A15.6 15.6 0 002.5 12S6 18.5 12 18.5a9.6 9.6 0 004-.9" />
    <path d="M9.9 9.9a2.8 2.8 0 003.9 3.9" />
  </Base>
);

export const IconHeart = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0112 7.3a4.4 4.4 0 017.5 2.6C19.5 15.4 12 20 12 20z" />
  </Base>
);

export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" />
  </Base>
);

export const IconStop = (p: IconProps) => (
  <Base {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
  </Base>
);

export const IconCamera = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3V18H4z" />
    <circle cx="12" cy="13" r="3.2" />
  </Base>
);

/** "Tu espacio": cuatro cuadros. */
export const IconSpace = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
  </Base>
);

export const IconChevron = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 5l7 7-7 7" />
  </Base>
);

export const IconShirt = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 4l3 2 3-2 5 3-2 4-2-1v10H8V10l-2 1-2-4z" />
  </Base>
);
