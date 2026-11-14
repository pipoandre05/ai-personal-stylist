import { describe, expect, it } from "vitest";
import { buttonStyles } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { cardBase, eyebrowAccent, btnPrimary, btnSecondary, btnPill, btnText } from "@/components/chat/styles";

describe("UI-2: Primitivas de interfaz (Prendie identity)", () => {
  describe("1. buttonStyles", () => {
    it("aplica píldora completa (rounded-full) y borde 1.5px por defecto", () => {
      const cls = buttonStyles();
      expect(cls).toContain("rounded-full");
      expect(cls).toContain("border-[1.5px]");
      expect(cls).toContain("active:scale-[0.97]");
      expect(cls).toContain("disabled:opacity-45");
      expect(cls).toContain("h-[52px]");
      expect(cls).toContain("px-6");
      expect(cls).toContain("text-base");
    });

    it("tamaño mediano genera 44 px (h-11 px-[18px] text-sm)", () => {
      const cls = buttonStyles({ size: "mediano" });
      expect(cls).toContain("h-11");
      expect(cls).toContain("px-[18px]");
      expect(cls).toContain("text-sm");
    });

    it("variante principal usa lima (bg-accion text-sobre-color)", () => {
      const cls = buttonStyles({ variant: "primary" });
      expect(cls).toContain("bg-accion");
      expect(cls).toContain("text-sobre-color");
    });

    it("variante inverso usa bg-inverso text-sobre-inverso", () => {
      const cls = buttonStyles({ variant: "inverso" });
      expect(cls).toContain("bg-inverso");
      expect(cls).toContain("text-sobre-inverso");
    });

    it("variante contorno usa border-linea-fuerte text-tinta", () => {
      const cls = buttonStyles({ variant: "secondary" });
      expect(cls).toContain("border-linea-fuerte");
      expect(cls).toContain("text-tinta");
    });

    it("variante contorno sobre inverso usa border-sobre-inverso text-sobre-inverso", () => {
      const cls = buttonStyles({ variant: "contorno", onInverse: true });
      expect(cls).toContain("border-sobre-inverso");
      expect(cls).toContain("text-sobre-inverso");
    });

    it("variante texto usa h-11 px-2 text-sm text-tinta underline underline-offset-4", () => {
      const cls = buttonStyles({ variant: "text" });
      expect(cls).toContain("h-11");
      expect(cls).toContain("px-2");
      expect(cls).toContain("text-sm");
      expect(cls).toContain("text-tinta");
      expect(cls).toContain("underline");
      expect(cls).toContain("underline-offset-4");
    });

    it("variante destructivo usa bg-error text-sobre-estado", () => {
      const cls = buttonStyles({ variant: "destructive" });
      expect(cls).toContain("bg-error");
      expect(cls).toContain("text-sobre-estado");
    });
  });

  describe("2. inputClasses", () => {
    it("aplica campo base con min-h-12, rounded-campo, bg-hundido, sin borde duro y foco azul de 3px", () => {
      const cls = inputClasses();
      expect(cls).toContain("min-h-12");
      expect(cls).toContain("rounded-campo");
      expect(cls).toContain("bg-hundido");
      expect(cls).toContain("focus-visible:ring-3");
      expect(cls).toContain("focus-visible:ring-foco");
    });

    it("aplica border-error cuando es inválido", () => {
      const cls = inputClasses(true);
      expect(cls).toContain("border-error");
    });
  });

  describe("3. components/chat/styles.ts", () => {
    it("cardBase usa rounded-tarjeta bg-superficie p-[18px] sin borde", () => {
      expect(cardBase).toContain("rounded-tarjeta");
      expect(cardBase).toContain("bg-superficie");
      expect(cardBase).toContain("p-[18px]");
      expect(cardBase).not.toContain("border-linea");
      expect(cardBase).not.toContain("rounded-md");
    });

    it("eyebrowAccent no usa el alias transitorio acento", () => {
      expect(eyebrowAccent).not.toContain("text-acento");
      expect(eyebrowAccent).toContain("text-tinta");
    });

    it("botones compactos del hilo son píldoras rounded-full", () => {
      expect(btnPrimary).toContain("rounded-full");
      expect(btnPrimary).toContain("bg-accion");
      expect(btnPrimary).toContain("text-sobre-color");

      expect(btnSecondary).toContain("rounded-full");
      expect(btnSecondary).toContain("border-linea-fuerte");
      expect(btnSecondary).toContain("text-tinta");

      expect(btnPill).toContain("rounded-full");
      expect(btnPill).toContain("bg-inverso");
      expect(btnPill).toContain("text-sobre-inverso");

      expect(btnText).toContain("underline");
      expect(btnText).toContain("text-tinta");
      expect(btnText).not.toContain("text-acento");
    });
  });
});
