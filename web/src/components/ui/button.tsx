import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "text"
  | "destructive"
  | "principal"
  | "inverso"
  | "outline"
  | "contorno";

export type ButtonSize = "default" | "standard" | "mediano" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] font-body leading-none transition-[transform,opacity] duration-150 ease-salida active:scale-[0.97] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 disabled:cursor-not-allowed disabled:opacity-45";

const sizes: Record<ButtonSize, string> = {
  default: "h-[52px] px-6 text-base font-extrabold",
  standard: "h-[52px] px-6 text-base font-extrabold",
  mediano: "h-11 px-[18px] text-sm font-bold",
  sm: "h-11 px-[18px] text-sm font-bold",
};

export type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onInverse?: boolean;
  fullWidth?: boolean;
  className?: string;
};

/** Clases del botón, para aplicarlas a otros elementos (enlaces, labels). */
export function buttonStyles({
  variant = "primary",
  size = "default",
  onInverse = false,
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}) {
  const isOutline = variant === "secondary" || variant === "outline" || variant === "contorno";
  const isPrimary = variant === "primary" || variant === "principal";
  const isInverso = variant === "inverso";
  const isText = variant === "text";
  const isDestructive = variant === "destructive";

  let variantCls = "";
  if (isPrimary) {
    variantCls = "border-transparent bg-accion text-sobre-color hover:opacity-90";
  } else if (isInverso) {
    variantCls = "border-transparent bg-inverso text-sobre-inverso hover:opacity-90";
  } else if (isOutline) {
    variantCls = onInverse
      ? "border-sobre-inverso text-sobre-inverso bg-transparent hover:bg-sobre-inverso/10"
      : "border-linea-fuerte text-tinta bg-transparent hover:bg-hundido";
  } else if (isText) {
    variantCls = "border-transparent bg-transparent text-tinta underline underline-offset-4 hover:opacity-80";
  } else if (isDestructive) {
    variantCls = "border-transparent bg-error text-sobre-estado hover:opacity-90";
  }

  // Variante texto siempre usa altura compacta de 44 px (h-11 px-2 text-sm)
  const sizeCls = isText ? "h-11 px-2 text-sm font-bold" : sizes[size] ?? sizes.default;

  return cn(base, sizeCls, variantCls, fullWidth && "w-full", className);
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onInverse?: boolean;
  fullWidth?: boolean;
  /** Ícono opcional antes de la etiqueta (trazo 2, tamaño 20 px / size-5). */
  icon?: ReactNode;
};

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Muestra spinner, deshabilita y marca aria-busy. */
    loading?: boolean;
    /** Texto mientras carga (gerundio: "Guardando…"). Si se omite, se mantiene la etiqueta. */
    loadingLabel?: string;
  };

export function Button({
  variant = "primary",
  size = "default",
  onInverse = false,
  fullWidth,
  icon,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const renderIcon = icon ? (
    <span className="inline-flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:stroke-2" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, onInverse, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : renderIcon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export type ButtonLinkProps = CommonProps & ComponentProps<typeof Link>;

/** Enlace con apariencia de botón (navegación, no acción). */
export function ButtonLink({
  variant = "primary",
  size = "default",
  onInverse = false,
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const renderIcon = icon ? (
    <span className="inline-flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:stroke-2" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  return (
    <Link className={buttonStyles({ variant, size, onInverse, fullWidth, className })} {...rest}>
      {renderIcon}
      {children}
    </Link>
  );
}
