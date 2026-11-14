import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";

// Identidad de Prendie (DP-23): Bricolage Grotesque para display, Manrope para el cuerpo. Sin cursivas.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estilo — tu asesor de imagen",
  description:
    "Te ayudo a verte como quieres verte, con lo que ya tienes y con lo que realmente vale la pena comprar.",
  applicationName: "Estilo",
};

export const viewport: Viewport = {
  themeColor: "#f2f2ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
