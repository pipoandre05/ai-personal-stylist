import type { CSSProperties } from "react";
import { cn } from "./cn";

// Mascota de Prendie: la etiqueta colgante del logotipo, cara del asesor. Dibujo aprobado; no se redibuja ni se recolorea.
// Reglas de uso (design/mascota/README.md de Prendie): una sola por pantalla, solo donde habla el asesor, siempre lima,
// cabeza chica bajo 40 px, y la expresión acompaña al texto: nunca es la única señal de estado.

const SPRITE = "/mascota/mascota.svg";

export type MascotPose = "saludo" | "pensando" | "ceja" | "tada" | "ups";

type MascotProps = {
  pose: MascotPose;
  /** Alto en px. El ancho sale de la proporción del dibujo (240:336). Rango recomendado: 96 a 320. */
  height?: number;
  /** Solo si la mascota va sin un texto que diga lo mismo. Con texto al lado es decorativa. */
  label?: string;
  /** Balanceo suave (±4°): para una espera a pantalla completa. */
  swing?: boolean;
  className?: string;
};

/** Mascota de cuerpo entero. */
export function Mascot({ pose, height = 160, label, swing = false, className }: MascotProps) {
  const width = Math.round((height * 240) / 336);
  return (
    <svg
      width={width}
      height={height}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", swing && "origin-[50%_38%] animate-balanceo", className)}
    >
      <use href={`${SPRITE}#m-${pose}`} width="100%" height="100%" />
    </svg>
  );
}

// La cabeza chica necesita trazos más gruesos o el contorno sale fino.
const SMALL_STROKES = { "--w-o": "13px", "--w-i": "7px", "--w-e": "7px", "--w-b": "10px", "--w-m": "8px" } as CSSProperties;

type MascotHeadProps = {
  /** `firma`: ceja arriba y media sonrisa (el gesto de siempre). `tada`: presenta un resultado. */
  mood?: "firma" | "tada";
  /** Alto en px (24 a 40 usa el dibujo chico; más, el completo). */
  size?: number;
  /** El asesor está trabajando: la etiqueta se balancea. */
  swinging?: boolean;
  className?: string;
  /** Fuerza el uso de trazos gruesos y sprite -s (p. ej. para pantallas reducidas de 88px). */
  small?: boolean;
};

/** Cabeza de la mascota junto a la firma del asesor. Siempre decorativa: el texto ya dice quién habla. */
export function MascotHead({ mood = "firma", size = 32, swinging = false, className, small }: MascotHeadProps) {
  const isSmall = small ?? size <= 40;
  const width = Math.round((size * 152) / 242);
  return (
    <svg
      width={width}
      height={size}
      aria-hidden="true"
      style={isSmall ? SMALL_STROKES : undefined}
      className={cn("shrink-0", swinging && "origin-[50%_38%] animate-balanceo", className)}
    >
      <use href={`${SPRITE}#h-${mood}${isSmall ? "-s" : ""}`} width="100%" height="100%" />
    </svg>
  );
}
