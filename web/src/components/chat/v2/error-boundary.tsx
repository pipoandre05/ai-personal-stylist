"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconAlert } from "@/components/ui/icons";

type Props = {
  /** Qué tarjeta es ("Look", "Opciones de compra"): va en el aviso y en el nombre accesible. */
  label: string;
  /** Para registrar el error (telemetría); no debe lanzar. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Cambia cuando llegan datos nuevos: una tarjeta rota se intenta de nuevo con otra `resetKey`. */
  resetKey?: string | number;
  children: ReactNode;
};

type State = { failed: boolean; prevKey: string | number | undefined };

/**
 * Contención de errores por tarjeta. Una tarjeta v2 con datos inesperados muestra un aviso sobrio en su lugar y el
 * resto del hilo sigue en pie. Va alrededor de CADA tarjeta, no del hilo entero.
 */
export class CardBoundary extends Component<Props, State> {
  state: State = { failed: false, prevKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  // Con datos nuevos (otro resetKey) se vuelve a intentar pintar la tarjeta.
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.prevKey ? { prevKey: props.resetKey, failed: false } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  private retry = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    return <CardFallback label={this.props.label} onRetry={this.retry} />;
  }
}

/** Aviso sobrio (bloque de error de UX_UI_SPEC §7.18). Exportado para verlo en la vista previa. */
export function CardFallback({ label, onRetry }: { label: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-campo border-[1.5px] border-error bg-superficie p-4 text-cuerpo text-tinta"
    >
      <IconAlert className="mt-0.5 size-5 shrink-0 text-error" />
      <div className="min-w-0">
        <p className="font-extrabold text-error">No pude mostrar esta tarjeta</p>
        <p className="mt-0.5">
          {label}: algo vino distinto de lo esperado. Lo demás de la conversación sigue igual.
        </p>
        {onRetry ? (
          <Button variant="text" size="mediano" className="-ml-2 mt-1" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
