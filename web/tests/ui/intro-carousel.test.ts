import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { INTRO_SLIDES, IntroCarousel } from "@/components/onboarding/intro-carousel";
import { MascotHead } from "@/components/ui/mascot";

describe("UI-26 · Recorrido de entrada (D-02 a D-05 y D-10)", () => {
  it("D-04: alinea contenido arriba (justify-start) y mantiene mascota en caja fija de 176 px", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    // Alineación superior en los articles
    expect(markup).toContain("justify-start");
    // Mascota en caja de 176 px
    expect(markup).toContain("h-[176px]");
    // Cinco slides en total
    expect(INTRO_SLIDES).toHaveLength(5);
  });

  it("D-04: pie con cotas fijas de 44 px (indicadores y enlaces) y 52 px (botón de acción principal)", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    // Fila de indicadores de 44 px
    expect(markup).toContain("h-11 grid-cols-[76px_1fr_76px]");
    // Botón principal de 52 px
    expect(markup).toContain("h-[52px]");
    // Enlaces secundarios en contenedor de 44 px
    expect(markup).toContain("h-11 items-center justify-center gap-1");
  });

  it("D-05: en paso 1 reserva espacio invisible para botón Atrás y mantiene puntos simétricos", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    // Placeholder invisible con tabIndex -1 y aria-hidden en índice 0
    expect(markup).toContain('class="invisible h-11" aria-hidden="true" tabindex="-1"');
    // Indicadores en el centro de la cuadrícula
    expect(markup).toContain('role="group" aria-label="Pantallas"');
  });

  it("D-10: botón principal en bg-inverso text-sobre-inverso, 52 px, text-sm font-bold y active:scale-[0.98]", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    expect(markup).toContain("bg-inverso");
    expect(markup).toContain("text-sobre-inverso");
    expect(markup).toContain("h-[52px]");
    expect(markup).toContain("text-sm font-bold");
    expect(markup).toContain("active:scale-[0.98]");
  });

  it("D-10: indicadores de paso sin transition-all, animando solo opacity y scale-x en 24x8 con motion-reduce", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    // Cero transition-all
    expect(markup).not.toContain("transition-all");
    // Capas separadas con opacity y scale-x / transform
    expect(markup).toContain("transition-opacity duration-200 ease-salida motion-reduce:transition-none");
    expect(markup).toContain("transition-[opacity,transform] duration-200 ease-salida motion-reduce:transition-none");
    // Caja 24x8
    expect(markup).toContain("h-2 w-6");
    // Botón de 44 px accesible
    expect(markup).toContain("size-11");
  });

  it("D-03: incluye variante de cabeza chica h-firma-s de 88 px para pantallas bajas y apaisado", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    // MascotaHead de 88 px con h-firma-s
    expect(markup).toContain("#h-firma-s");
    expect(markup).toContain('height="88"');
    expect(markup).toContain('width="55"');
    expect(markup).toContain("--w-o:13px");
  });

  it("D-03: MascotHead admite prop small para forzar trazos gruesos en escalas reducidas", () => {
    const head = renderToStaticMarkup(h(MascotHead, { size: 88, small: true }));
    expect(head).toContain("#h-firma-s");
    expect(head).toContain("--w-o:13px");
  });

  it("D-02: apaisado en 2 columnas con columna derecha de 320 px y privacidad oculta", () => {
    const markup = renderToStaticMarkup(h(IntroCarousel));
    // Contenedor principal con flex-row en landscape
    expect(markup).toContain("landscape:[@media(max-height:500px)]:flex-row");
    // Columna derecha fija de 320 px
    expect(markup).toContain("landscape:[@media(max-height:500px)]:w-[320px]");
    // Privacidad oculta en landscape
    expect(markup).toContain("landscape:[@media(max-height:500px)]:hidden");
  });
});
