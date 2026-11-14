import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Conversation } from "@/components/chat/conversation";
import { ToastProvider } from "@/components/ui";

// Vista previa de la pantalla de inicio (sin red, sin sesión). En producción no existe: responde 404.
export const metadata: Metadata = { title: "Inicio · vista previa", robots: { index: false, follow: false } };

export default function InicioPreviewPage() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") notFound();
  return (
    <ToastProvider>
      <Conversation conversationId={null} initialMessages={[]} closetCount={0} displayName="Felipe" />
    </ToastProvider>
  );
}
