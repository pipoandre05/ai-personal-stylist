import { vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/client/api", () => ({
  streamChat: vi.fn(),
}));
vi.mock("@/lib/client/upload", () => ({
  compressImage: vi.fn(),
  uploadUserImage: vi.fn(),
}));

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SpacePhotoButton } from "@/components/espacio/photo-flow";

describe("UI-23: Foto al asesor desde Tu espacio sin pasos muertos", () => {
  describe("1. Botón disparador en Tu espacio", () => {
    it("renderiza botón para selfie en /yo/paleta con id b-paleta y contorno", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "selfie",
          label: "Mandar una foto al asesor",
          variant: "contorno",
          id: "b-paleta",
        })
      );

      expect(html).toContain('id="b-paleta"');
      expect(html).toContain("Mandar una foto al asesor");
      expect(html).toContain("border-linea-fuerte");
      expect(html).toContain('accept="image/*"');
      // No debe contener capture para permitir elegir entre cámara o fototeca
      expect(html).not.toContain('capture="user"');
      expect(html).not.toContain('capture="environment"');
    });

    it("renderiza botón para prenda en /closet con variante accion (lima) en empty state", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "garment",
          label: "Mandar una foto al asesor",
          variant: "accion",
        })
      );

      expect(html).toContain("bg-accion");
      expect(html).toContain("h-[52px]");
      expect(html).toContain("Mandar una foto al asesor");
    });
  });

  describe("2. Modal de vista previa y accesibilidad (<dialog>)", () => {
    it("contiene estructura accesible de diálogo a pantalla completa", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "selfie",
        })
      );

      expect(html).toContain("<dialog");
      expect(html).toContain('aria-labelledby="photo-preview-title"');
      expect(html).toContain('id="photo-preview-title"');
      expect(html).toContain("Tu foto");
      expect(html).toContain('aria-label="Cancelar y volver"');
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="Vista previa de tu foto"');
    });

    it("incluye el copy exacto para selfie en paleta", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "selfie",
        })
      );

      expect(html).toContain("Se envía con tu foto");
      expect(html).toContain(
        "Te mando una selfie. ¿Qué colores me favorecen? Dame una orientación."
      );
    });

    it("incluye el copy exacto para prenda en clóset", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "garment",
        })
      );

      expect(html).toContain("Se envía con tu foto");
      expect(html).toContain("Te mando esta prenda. ¿Con qué la combino?");
    });

    it("la vista previa no contiene lima en sus acciones (regla de la app: acción en inverso)", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "selfie",
          variant: "contorno",
        })
      );

      // Usar esta foto debe ser en inverso, nunca bg-accion
      expect(html).toContain("Usar esta foto");
      expect(html).toContain("Elegir otra");
      expect(html).toContain("bg-inverso");
      expect(html).not.toContain("bg-accion");
    });

    it("respeta la regla de diálogos cerrados (open:flex y no flex directo)", () => {
      const html = renderToStaticMarkup(
        createElement(SpacePhotoButton, {
          kind: "selfie",
        })
      );

      // El diálogo debe tener open:flex y no la clase flex sola
      const dialogMatch = html.match(/<dialog\b[^>]*class(?:Name)?="([^"]*)"/);
      expect(dialogMatch).not.toBeNull();
      const classes = dialogMatch![1].split(/\s+/);
      expect(classes).toContain("open:flex");
      expect(classes).not.toContain("flex");
    });
  });
});
