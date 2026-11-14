import { vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/actions/auth", () => ({ signOut: vi.fn() }));
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SpaceHeader } from "@/components/ui/space-header";
import { SpaceSheet, type SpaceSummary } from "@/components/ui/space-sheet";
import { AppHeader } from "@/components/ui/app-header";
import { GarmentTile } from "@/components/espacio/garment-tile";
import { ClosetGrid } from "@/components/espacio/closet-grid";
import { CategoryFilter } from "@/components/espacio/category-filter";
import type { GarmentView } from "@/lib/domain/types";

describe("UI-15 y UI-18: Tu espacio (Hoja y vistas secundarias)", () => {
  describe("1. SpaceSheet (UI-15)", () => {
    it("renderiza estado de cuenta nueva (sin nada guardado) sin errores ni lima", () => {
      const html = renderToStaticMarkup(
        createElement(SpaceSheet, {
          open: true,
          onClose: () => {},
          summary: {
            closetCount: 0,
            looksCount: 0,
            memoryCount: 0,
            paletteSeason: null,
          },
        }),
      );

      expect(html).toContain("Tu espacio");
      expect(html).toContain("Aún no hay prendas");
      expect(html).toContain("Aún no guardas looks");
      expect(html).toContain("Todavía no te conozco");
      expect(html).toContain("Aún sin calcular");
      expect(html).toContain("Cerrar sesión");
      // Regla de marca: cero lima en la hoja Tu espacio
      expect(html).not.toContain("bg-accion");
      expect(html).not.toContain("text-accion");
    });

    it("renderiza conteos, bajadas contextuales y miniaturas cuando hay datos", () => {
      const summary: SpaceSummary = {
        closetCount: 14,
        latestGarmentName: "Blazer de lino",
        garmentThumbs: ["#B7C2A6", "#EDE6D6", "#8A7B66"],
        looksCount: 3,
        latestLookTitle: "Lino y salvia de día",
        lookThumb: "#B7C2A6",
        memoryCount: 5,
        latestMemoryFact: "Taco ancho en eventos de día",
        paletteSeason: "Otoño cálido",
        paletteSwatches: ["#8A5A2B", "#B7C2A6", "#C9A24D", "#6B4F3A", "#A8553A"],
      };

      const html = renderToStaticMarkup(
        createElement(SpaceSheet, {
          open: true,
          onClose: () => {},
          summary,
        }),
      );

      expect(html).toContain("14");
      expect(html).toContain("Última: Blazer de lino");
      expect(html).toContain("3");
      expect(html).toContain("Lino y salvia de día");
      expect(html).toContain("5");
      expect(html).toContain("Taco ancho en eventos de día");
      expect(html).toContain("Otoño cálido · orientativa");
      // Muestras de paleta y miniaturas presentes
      expect(html).toContain("#8A5A2B");
      expect(html).toContain("#B7C2A6");
    });

    it("incluye accesibilidad modal adecuada en el diálogo", () => {
      const html = renderToStaticMarkup(
        createElement(SpaceSheet, {
          open: true,
          onClose: () => {},
        }),
      );

      expect(html).toContain('aria-labelledby="space-sheet-title"');
      expect(html).toContain('id="space-sheet-title"');
      expect(html).toContain('tabindex="-1"');
      expect(html).toContain('aria-label="Cerrar"');
    });
  });

  describe("2. AppHeader y botón Tu espacio", () => {
    it("renderiza el botón Tu espacio con aria-haspopup y aria-expanded", () => {
      const html = renderToStaticMarkup(
        createElement(AppHeader, {
          closetCount: 8,
        }),
      );

      expect(html).toContain("Estilo");
      expect(html).toContain("Tu espacio");
      expect(html).toContain('aria-haspopup="dialog"');
      expect(html).toContain('aria-expanded="false"');
    });
  });

  describe("3. SpaceHeader (UI-18)", () => {
    it("renderiza enlace de retorno a /asesor con chevron y área táctil", () => {
      const html = renderToStaticMarkup(
        createElement(SpaceHeader, {}),
      );

      expect(html).toContain('href="/asesor"');
      expect(html).toContain("Volver a la conversación");
      expect(html).toContain("min-h-11");
    });

    it("admite backHref y backLabel personalizados (ej: /yo)", () => {
      const html = renderToStaticMarkup(
        createElement(SpaceHeader, {
          backHref: "/yo",
          backLabel: "Volver a tu perfil",
        }),
      );

      expect(html).toContain('href="/yo"');
      expect(html).toContain("Volver a tu perfil");
    });
  });

  describe("4. GarmentTile y ClosetGrid (UI-18)", () => {
    const mockGarment: GarmentView = {
      id: "g-1",
      user_id: "u-1",
      name: "Blazer de lino",
      category: "outerwear",
      subcategory: "blazer",
      formality: 3,
      seasons: ["primavera", "verano"],
      occasions: ["formal"],
      colors: [{ name: "salvia", hex: "#B7C2A6" }],
      material: "lino",
      pattern: "liso",
      brand: "",
      favorite: true,
      status: "ready",
      photo_path: "garments/g1.jpg",
      photo_url: "https://example.com/g1.jpg",
      user_edited: false,
      created_at: new Date().toISOString(),
      archived_at: null,
    };

    it("renderiza GarmentTile con proporción 4:5, insignia favorita y categoría", () => {
      const html = renderToStaticMarkup(
        createElement(GarmentTile, { garment: mockGarment }),
      );

      expect(html).toContain("aspect-[4/5]");
      expect(html).toContain("Favorita");
      expect(html).toContain("Blazer de lino");
      expect(html).toContain("Abrigo");
    });

    it("ClosetGrid renderiza en cuadrícula de exactamente 2 columnas", () => {
      const html = renderToStaticMarkup(
        createElement(ClosetGrid, { garments: [mockGarment] }),
      );

      expect(html).toContain("grid-cols-2");
      expect(html).not.toContain("grid-cols-3");
    });
  });

  describe("5. CategoryFilter (UI-18)", () => {
    it("resalta la opción activa con estilo inverso y muestra chips inactivos", () => {
      const html = renderToStaticMarkup(
        createElement(CategoryFilter, {
          available: ["outerwear", "top"],
          active: null,
        }),
      );

      expect(html).toContain("Todo");
      expect(html).toContain("Abrigos");
      expect(html).toContain("Arriba");
      expect(html).toContain("border-inverso bg-inverso text-sobre-inverso");
    });
  });
});
