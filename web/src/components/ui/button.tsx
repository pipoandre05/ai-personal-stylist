import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "text" | "destructive";

const base =
  "inline-flex min-w-11 items-center justify-center gap-2 rounded-sm font-body font-semibold transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.98] aria-disabled:cursor-not-allowed aria-disabled:opacity-40 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "h-12 px-5 text-base bg-tinta text-superficie hover:opacity-90",
  secondary: "h-12 px-5 text-base border border-tinta bg-transparent text-tinta hover:bg-hundido",
  text: "h-11 px-2 text-base font-medium text-acento underline decoration-1 underline-offset-4",
  destructive: "h-12 px-5 text-base bg-error text-superficie hover:opacity-90",
};

/** Clases del botón, para aplicarlas a otros elementos (enlaces, labels). */
export function buttonStyles({
  variant = "primary",
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; fullWidth?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], fullWidth && "w-full", className);
}

type CommonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  /** Ícono opcional antes de la etiqueta. */
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
  return (
    <button
      type={type}
      className={buttonStyles({ variant, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export type ButtonLinkProps = CommonProps & ComponentProps<typeof Link>;

/** Enlace con apariencia de botón (navegación, no acción). */
export function ButtonLink({
  variant = "primary",
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, fullWidth, className })} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
