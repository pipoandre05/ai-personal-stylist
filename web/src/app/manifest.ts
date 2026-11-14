import type { MetadataRoute } from "next";

// Colores = tokens de globals.css (fondo y tinta).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Prendie",
    short_name: "Prendie",
    description: "Te ayudo a verte como quieres verte, con lo que ya tienes y con lo que realmente vale la pena comprar.",
    lang: "es-CL",
    start_url: "/asesor",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f2ee",
    theme_color: "#f2f2ee",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
