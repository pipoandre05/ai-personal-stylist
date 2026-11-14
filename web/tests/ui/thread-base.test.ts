import { describe, expect, it } from "vitest";
import { computePlaceholder, LIMIT_PLACEHOLDER } from "@/components/chat/placeholder";
import type { AdvisorItem, PersonItem } from "@/components/chat/thread-types";
import type { OutfitView } from "@/lib/domain/types";

describe("UI-3, UI-4, UI-5: Base del hilo (Encabezado, Voces y Compositor)", () => {
  describe("1. computePlaceholder (Placeholders contextuales)", () => {
    it("devuelve 'Sin conexión' cuando online es false", () => {
      const ph = computePlaceholder({
        online: false,
        items: [],
      });
      expect(ph).toBe("Sin conexión");
    });

    it("devuelve LIMIT_PLACEHOLDER cuando limit es true", () => {
      const ph = computePlaceholder({
        limit: true,
        online: true,
        items: [],
      });
      expect(ph).toBe(LIMIT_PLACEHOLDER);
    });

    it("devuelve 'O dímelo con tus palabras' cuando hay sugerencias activas", () => {
      const ph = computePlaceholder({
        replies: {
          options: ["Formal de día", "Casual"],
          multiple: false,
        },
        busy: false,
        items: [],
      });
      expect(ph).toBe("O dímelo con tus palabras");
    });

    it("devuelve 'Escríbele a tu asesor…' cuando hay sugerencias pero el asesor está ocupado (busy)", () => {
      const ph = computePlaceholder({
        replies: {
          options: ["Formal de día", "Casual"],
          multiple: false,
        },
        busy: true,
        items: [],
      });
      expect(ph).toBe("Escríbele a tu asesor…");
    });

    it("devuelve 'Escríbele a tu asesor…' en reposo inicial sin ítems", () => {
      const ph = computePlaceholder({
        items: [],
      });
      expect(ph).toBe("Escríbele a tu asesor…");
    });

    it("devuelve 'Pregúntame por la foto…' cuando el último ítem es una foto de la persona", () => {
      const personPhoto: PersonItem = {
        kind: "person",
        key: "p-1",
        at: new Date().toISOString(),
        fresh: true,
        text: "",
        imageUrl: "https://example.com/foto.jpg",
        photoDeleted: false,
        status: "sent",
        error: null,
      };

      const ph = computePlaceholder({
        items: [personPhoto],
      });
      expect(ph).toBe("Pregúntame por la foto…");
    });

    it("devuelve 'Pregúntame por la foto…' cuando el último ítem es una selfie borrada", () => {
      const personSelfie: PersonItem = {
        kind: "person",
        key: "p-2",
        at: new Date().toISOString(),
        fresh: true,
        text: "",
        imageUrl: null,
        photoDeleted: true,
        status: "sent",
        error: null,
      };

      const ph = computePlaceholder({
        items: [personSelfie],
      });
      expect(ph).toBe("Pregúntame por la foto…");
    });

    it("devuelve '¿Qué le cambiarías?' cuando el último resultado del asesor es un look", () => {
      const mockOutfit: OutfitView = {
        id: "outfit-1",
        title: "Lino y salvia",
        occasion: "Matrimonio de día en viña",
        rationale: "Ideal para viña de día",
        status: "proposed",
        weather: null,
        missing_piece: null,
        rating: null,
        created_at: new Date().toISOString(),
        items: [],
      };

      const advisorLook: AdvisorItem = {
        kind: "advisor",
        key: "a-1",
        id: "m-1",
        at: new Date().toISOString(),
        fresh: true,
        text: "Aquí tienes una propuesta.",
        outfits: [mockOutfit],
        garments: [],
        palette: null,
        memories: [],
        streaming: false,
        error: null,
      };

      const ph = computePlaceholder({
        items: [advisorLook],
      });
      expect(ph).toBe("¿Qué le cambiarías?");
    });

    it("devuelve 'Escríbele a tu asesor…' tras texto normal del asesor sin looks ni sugerencias", () => {
      const advisorText: AdvisorItem = {
        kind: "advisor",
        key: "a-2",
        id: "m-2",
        at: new Date().toISOString(),
        fresh: true,
        text: "Hola, cuéntame qué tienes en mente.",
        outfits: [],
        garments: [],
        palette: null,
        memories: [],
        streaming: false,
        error: null,
      };

      const ph = computePlaceholder({
        items: [advisorText],
      });
      expect(ph).toBe("Escríbele a tu asesor…");
    });
  });
});
