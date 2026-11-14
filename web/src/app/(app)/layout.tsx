import { Suspense, type ReactNode } from "react";
import { RegisterSW, ToastProvider } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import Loading from "./loading";

/** Lee la sesión (dato dinámico): con Cache Components debe vivir dentro de Suspense. */
async function SessionGate({ children }: { children: ReactNode }) {
  await requireUser();
  return children;
}

/** Rutas con sesión: exige usuario y monta toasts. Sin barra de pestañas (DP-17). */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-tinta focus:px-4 focus:py-3 focus:text-superficie"
      >
        Saltar al contenido
      </a>
      <RegisterSW />
      <Suspense fallback={<Loading />}>
        <SessionGate>{children}</SessionGate>
      </Suspense>
    </ToastProvider>
  );
}
