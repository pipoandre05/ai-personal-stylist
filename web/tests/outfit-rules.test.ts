import { describe, expect, it } from "vitest";
import { validateOutfitComposition } from "@/lib/domain/outfit-rules";
import type { GarmentCategory } from "@/lib/domain/types";

const g = (id: string, category: GarmentCategory, extra: Record<string, unknown> = {}) => ({ id, category, ...extra });
const make = (...cats: GarmentCategory[]) => cats.map((c, i) => g(String(i), c));
const reason = (r: ReturnType<typeof validateOutfitComposition>) => (r.ok ? "" : r.reason);

describe("validateOutfitComposition (R-05)", () => {
  it("acepta arriba + abajo", () => {
    expect(validateOutfitComposition(make("top", "bottom"))).toEqual({ ok: true });
  });

  it("acepta dos partes de arriba con una de abajo", () => {
    expect(validateOutfitComposition(make("top", "top", "bottom"))).toEqual({ ok: true });
  });

  it("acepta un vestido con calzado, y con una parte de arriba como capa", () => {
    expect(validateOutfitComposition(make("dress", "shoes"))).toEqual({ ok: true });
    expect(validateOutfitComposition(make("dress", "top"))).toEqual({ ok: true });
  });

  it("acepta el máximo: 7 prendas", () => {
    // 2 arriba + 1 abajo + abrigo + calzado + bolso + 1 accesorio
    expect(validateOutfitComposition(make("top", "top", "bottom", "outerwear", "shoes", "bag", "accessory"))).toEqual({ ok: true });
    expect(validateOutfitComposition(make("top", "bottom", "outerwear", "shoes", "bag", "accessory", "accessory"))).toEqual({ ok: true });
  });

  it("rechaza menos de dos y más de siete prendas", () => {
    expect(validateOutfitComposition(make("dress")).ok).toBe(false);
    const eight = validateOutfitComposition(make("top", "top", "bottom", "outerwear", "shoes", "bag", "accessory", "accessory"));
    expect(eight.ok).toBe(false);
    expect(reason(eight)).toMatch(/7/);
  });

  it("rechaza prendas repetidas", () => {
    expect(validateOutfitComposition([g("1", "top"), g("1", "top"), g("2", "bottom")]).ok).toBe(false);
  });

  it("rechaza arriba sin abajo, abajo sin arriba y accesorios solos", () => {
    expect(reason(validateOutfitComposition(make("top", "shoes")))).toMatch(/parte de abajo|vestido/i);
    expect(validateOutfitComposition(make("bottom", "outerwear")).ok).toBe(false);
    expect(validateOutfitComposition(make("bag", "accessory")).ok).toBe(false);
  });

  it("rechaza vestido con abajo, dos vestidos y vestido con dos arriba", () => {
    expect(reason(validateOutfitComposition(make("dress", "bottom")))).toMatch(/vestido/i);
    expect(validateOutfitComposition(make("dress", "dress")).ok).toBe(false);
    expect(validateOutfitComposition(make("dress", "top", "top")).ok).toBe(false);
  });

  it("rechaza tres partes de arriba y dos de abajo", () => {
    expect(validateOutfitComposition(make("top", "top", "top", "bottom")).ok).toBe(false);
    expect(validateOutfitComposition(make("top", "bottom", "bottom")).ok).toBe(false);
  });

  it("rechaza dos calzados, dos abrigos y dos bolsos", () => {
    expect(reason(validateOutfitComposition(make("top", "bottom", "shoes", "shoes")))).toMatch(/calzado/i);
    expect(reason(validateOutfitComposition(make("top", "bottom", "outerwear", "outerwear")))).toMatch(/abrigo/i);
    expect(reason(validateOutfitComposition(make("top", "bottom", "bag", "bag")))).toMatch(/bolso/i);
  });

  it("rechaza tres accesorios", () => {
    expect(validateOutfitComposition(make("top", "bottom", "accessory", "accessory", "accessory")).ok).toBe(false);
  });

  it("rechaza prendas que no están listas o están archivadas", () => {
    expect(validateOutfitComposition([g("1", "top", { status: "failed" }), g("2", "bottom", { status: "ready" })]).ok).toBe(false);
    expect(validateOutfitComposition([g("1", "top", { status: "processing" }), g("2", "bottom")]).ok).toBe(false);
    expect(
      validateOutfitComposition([g("1", "top", { archived_at: "2026-11-01T00:00:00Z" }), g("2", "bottom")]).ok,
    ).toBe(false);
    expect(
      validateOutfitComposition([g("1", "top", { status: "ready", archived_at: null }), g("2", "bottom", { status: "ready" })]),
    ).toEqual({ ok: true });
  });
});
