import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  PHOTO_ACTION,
  SELFIE,
  SuggestedReplies,
} from "@/components/chat/suggested-replies";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("UI-6: SuggestedReplies (Respuestas sugeridas)", () => {
  describe("1. Detección de acciones de foto (PHOTO_ACTION y SELFIE)", () => {
    it("reconoce variantes de mandar o subir foto", () => {
      expect(PHOTO_ACTION.test("Mandar foto")).toBe(true);
      expect(PHOTO_ACTION.test("mandar foto")).toBe(true);
      expect(PHOTO_ACTION.test("Enviar foto")).toBe(true);
      expect(PHOTO_ACTION.test("Subir foto")).toBe(true);
      expect(PHOTO_ACTION.test("Tomar foto")).toBe(true);
      expect(PHOTO_ACTION.test("Sacar foto")).toBe(true);
    });

    it("reconoce selfies distinguiéndolas de fotos generales", () => {
      expect(PHOTO_ACTION.test("Mandar selfie")).toBe(true);
      expect(SELFIE.test("Mandar selfie")).toBe(true);
      expect(SELFIE.test("Mandar foto")).toBe(false);
    });

    it("no confunde respuestas conversacionales con acciones de foto", () => {
      expect(PHOTO_ACTION.test("Tengo un matrimonio")).toBe(false);
      expect(PHOTO_ACTION.test("Es de día")).toBe(false);
      expect(PHOTO_ACTION.test("Formal")).toBe(false);
    });
  });

  describe("2. Renderizado en modo simple (botones de contorno)", () => {
    const simpleOptions = ["Es de día", "Es de noche", "Mandar foto"];

    it("renderiza el grupo accesible con role='group' y etiqueta aria", () => {
      const out = html(
        h(SuggestedReplies, {
          options: simpleOptions,
          multiple: false,
          onSend: vi.fn(),
          onPickPhoto: vi.fn(),
        }),
      );

      expect(out).toContain('role="group"');
      expect(out).toContain('aria-label="Respuestas sugeridas"');
      expect(out).toContain("flex-wrap");
      expect(out).toContain("justify-end");
      expect(out).toContain("gap-2");
      expect(out).toContain("px-6");
      expect(out).toContain("pb-3");
    });

    it("renderiza cada opción como botón contorno mediano (h-11, rounded-full, border-linea-fuerte)", () => {
      const out = html(
        h(SuggestedReplies, {
          options: simpleOptions,
          multiple: false,
          onSend: vi.fn(),
          onPickPhoto: vi.fn(),
        }),
      );

      expect(out).toContain("Es de día");
      expect(out).toContain("Es de noche");
      expect(out).toContain("Mandar foto");
      // Clases del botón contorno mediano
      expect(out).toContain("h-11");
      expect(out).toContain("rounded-full");
      expect(out).toContain("border-linea-fuerte");
      expect(out).toContain("text-tinta");
    });

    it("Mandar foto incluye el ícono de cámara con tamaño accesible size-5", () => {
      const out = html(
        h(SuggestedReplies, {
          options: simpleOptions,
          multiple: false,
          onSend: vi.fn(),
          onPickPhoto: vi.fn(),
        }),
      );

      // Ícono de cámara dentro del botón
      expect(out).toContain("size-5");
      expect(out).toContain("<svg");
      expect(out).toContain('aria-hidden="true"');
    });

    it("respeta regla de marca: cero lima en sugerencias", () => {
      const out = html(
        h(SuggestedReplies, {
          options: simpleOptions,
          multiple: false,
          onSend: vi.fn(),
          onPickPhoto: vi.fn(),
        }),
      );

      expect(out).not.toContain("bg-accion");
      expect(out).not.toContain("text-accion");
    });
  });

  describe("3. Renderizado en modo múltiple (chips toggle + botón Listo inverso)", () => {
    const multiOptions = ["Tacos", "Colores muy vivos", "Telas que arrugan", "Nada que evitar"];

    it("renderiza las opciones como chips con aria-pressed='false' por defecto", () => {
      const out = html(
        h(SuggestedReplies, {
          options: multiOptions,
          multiple: true,
          onSend: vi.fn(),
        }),
      );

      expect(out).toContain('aria-pressed="false"');
      expect(out).toContain("Tacos");
      expect(out).toContain("Colores muy vivos");
      expect(out).toContain("Telas que arrugan");
      expect(out).toContain("Nada que evitar");
      // Chips con borde y área táctil accesible
      expect(out).toContain("after:-inset-1");
    });

    it("renderiza botón 'Listo' en variante inverso (bg-inverso) y deshabilitado sin selección", () => {
      const out = html(
        h(SuggestedReplies, {
          options: multiOptions,
          multiple: true,
          onSend: vi.fn(),
        }),
      );

      expect(out).toContain("Listo");
      expect(out).toContain("bg-inverso");
      expect(out).toContain("text-sobre-inverso");
      // Deshabilitado por falta de selección
      expect(out).toMatch(/<button[^>]*disabled[^>]*>Listo<\/button>/);
    });

    it("cero lima en modo múltiple", () => {
      const out = html(
        h(SuggestedReplies, {
          options: multiOptions,
          multiple: true,
          onSend: vi.fn(),
        }),
      );

      expect(out).not.toContain("bg-accion");
      expect(out).not.toContain("text-accion");
    });
  });

  describe("4. Estados y casos borde", () => {
    it("devuelve null cuando la lista de opciones está vacía", () => {
      const out = html(
        h(SuggestedReplies, {
          options: [],
          onSend: vi.fn(),
        }),
      );
      expect(out).toBe("");
    });

    it("deshabilita todos los controles cuando disabled es true", () => {
      const out = html(
        h(SuggestedReplies, {
          options: ["Opción A", "Opción B"],
          disabled: true,
          onSend: vi.fn(),
        }),
      );

      const matches = out.match(/disabled/g);
      expect(matches).not.toBeNull();
      // Ambos botones están deshabilitados
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
