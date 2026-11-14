import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FirmaPreview } from "./preview";

// Vista previa de la firma del asesor con la mascota (sin red, sin sesión). En producción no existe: responde 404.
export const metadata: Metadata = { title: "Firma del asesor · vista previa", robots: { index: false, follow: false } };

export default function FirmaPreviewPage() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") notFound();
  return <FirmaPreview />;
}
