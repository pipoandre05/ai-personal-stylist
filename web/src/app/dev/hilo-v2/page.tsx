import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HiloV2Preview } from "./preview";

// Vista previa de desarrollo del contrato v2 (sin red, sin sesión). En producción no existe: responde 404.
export const metadata: Metadata = {
  title: "Hilo v2 · vista previa",
  robots: { index: false, follow: false },
};

export default function HiloV2PreviewPage() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") notFound();
  return <HiloV2Preview />;
}
