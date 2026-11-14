import type { ReactNode } from "react";
import { cn } from "./cn";

type ScreenProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Contenedor de pantalla: columna `max-w-app` sobre fondo hueso, márgenes laterales px-5.
 * Es el <main> de la página (id="contenido" para el enlace "Saltar al contenido").
 */
export function Screen({ children, className }: ScreenProps) {
  return (
    <main
      id="contenido"
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-app flex-1 flex-col bg-fondo",
        "pb-seguro",
        className,
      )}
    >
      {children}
    </main>
  );
}
