import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { INTRO_SLIDES } from "@/components/onboarding/intro-carousel";
import { Mascot, MascotHead } from "@/components/ui/mascot";

const sprite = readFileSync(join(__dirname, "../../public/mascota/mascota.svg"), "utf8");

describe("mascota", () => {
  it("cada pose que usa la app existe en el sprite", () => {
    for (const id of ["m-saludo", "m-pensando", "m-ceja", "m-tada", "m-ups", "h-firma-s", "h-tada-s", "h-firma", "h-tada"]) {
      expect(sprite).toContain(`id="${id}"`);
    }
  });

  it("de cuerpo entero conserva la proporción del dibujo y es decorativa si no lleva etiqueta", () => {
    const out = renderToStaticMarkup(h(Mascot, { pose: "saludo", height: 168 }));
    expect(out).toContain('width="120"');
    expect(out).toContain('height="168"');
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("/mascota/mascota.svg#m-saludo");
  });

  it("sola, sin texto que diga lo mismo, se anuncia con su etiqueta", () => {
    const out = renderToStaticMarkup(h(Mascot, { pose: "pensando", label: "El asesor está pensando" }));
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="El asesor está pensando"');
    expect(out).not.toContain("aria-hidden");
  });

  it("la cabeza chica usa el dibujo chico con sus grosores, y se balancea solo si el asesor trabaja", () => {
    const quiet = renderToStaticMarkup(h(MascotHead, {}));
    expect(quiet).toContain("#h-firma-s");
    expect(quiet).toContain("--w-o:13px");
    expect(quiet).not.toContain("animate-balanceo");
    expect(renderToStaticMarkup(h(MascotHead, { swinging: true }))).toContain("animate-balanceo");
    expect(renderToStaticMarkup(h(MascotHead, { mood: "tada" }))).toContain("#h-tada-s");
    expect(renderToStaticMarkup(h(MascotHead, { size: 64 }))).toContain('#h-firma"');
  });
});

describe("recorrido de entrada", () => {
  it("son cinco pantallas, breves, con una pose válida cada una", () => {
    expect(INTRO_SLIDES).toHaveLength(5);
    for (const s of INTRO_SLIDES) {
      expect(["saludo", "pensando", "ceja", "tada"]).toContain(s.pose); // "ups" es solo para errores
      expect(s.title.length).toBeLessThanOrEqual(48);
      expect(s.text.length).toBeLessThanOrEqual(130);
      expect(s.proof?.items.length ?? 0).toBeLessThanOrEqual(4);
    }
  });

  it("respeta la voz: tutea, sin emoji, sin 'usuario', y deja claro que el asesor no compra", () => {
    const all = INTRO_SLIDES.map((s) => `${s.eyebrow} ${s.title} ${s.text} ${s.proof?.items.join(" ") ?? ""}`).join(" ");
    expect(all).not.toMatch(/usuari[oa]/i);
    expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(all).not.toMatch(/\busted\b/i);
    expect(all).toContain("Yo no compro nada");
    expect(all).toContain("Prendie");
  });

  it("no promete lo que el producto no hace", () => {
    const all = INTRO_SLIDES.map((s) => `${s.title} ${s.text}`).join(" ").toLowerCase();
    for (const word of ["carrito", "pago", "pagar", "envío", "descuento", "probador", "virtual"]) expect(all).not.toContain(word);
  });
});
