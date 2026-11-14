import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShoppingOptions } from "@/components/chat/v2/shopping-options";
import { SHOPPING_BLOCK } from "@/app/dev/hilo-v2/fixtures";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("ShoppingOptions UI-25 (D-16) · Opciones de compra en escritorio y contenedor", () => {
  it("envoltura declara @container y estilo de superficie de tarjeta", () => {
    const out = html(h(ShoppingOptions, { block: SHOPPING_BLOCK }));
    expect(out).toContain("@container");
    expect(out).toContain("rounded-tarjeta bg-superficie p-[18px]");
  });

  it("región de opciones incluye clases de contenedor para cuadrícula de 3 columnas y reseteo de sangrado", () => {
    const out = html(h(ShoppingOptions, { block: SHOPPING_BLOCK }));
    // margen sangrado en móvil y reseteo en contenedor >= 600px
    expect(out).toContain("-mx-[18px] px-[18px]");
    expect(out).toContain("@[600px]:mx-0 @[600px]:px-0");

    // ol con flex/snap en móvil y grid 3 columnas en contenedor >= 600px
    expect(out).toContain("@[600px]:grid @[600px]:grid-cols-3 @[600px]:overflow-visible");

    // items li con ancho automático en contenedor >= 600px
    expect(out).toContain("@[600px]:w-auto");
  });

  it("con 1 sola opción: ocupa el ancho completo en móvil y @[600px]:col-span-3", () => {
    const single = { ...SHOPPING_BLOCK, options: [SHOPPING_BLOCK.options[0]] };
    const out = html(h(ShoppingOptions, { block: single }));
    expect(out).toContain("w-full @[600px]:col-span-3");
    // No activa paginación
    expect(out).not.toContain("Opciones anteriores");
    expect(out).not.toContain("Opciones siguientes");
  });

  it("con 3 opciones: muestra las 3 sin controles de paginación", () => {
    const out = html(h(ShoppingOptions, { block: SHOPPING_BLOCK }));
    expect(out.match(/aria-pressed/g)).toHaveLength(3);
    expect(out).not.toContain("Opciones anteriores");
    expect(out).not.toContain("Opciones siguientes");
  });

  it("con más de 3 opciones (p. ej. 5 opciones): muestra las primeras 3 y controles de paginación de 44 px en contorno", () => {
    const fiveOptions = {
      ...SHOPPING_BLOCK,
      options: [
        ...SHOPPING_BLOCK.options,
        { ...SHOPPING_BLOCK.options[0], id: "opt-4", title: "Mocasín de cuero", store_name: "Tienda D" },
        { ...SHOPPING_BLOCK.options[1], id: "opt-5", title: "Botín gamuza", store_name: "Tienda E" },
      ],
    };
    const out = html(h(ShoppingOptions, { block: fiveOptions }));

    // Solo 3 opciones visibles en la página actual
    expect(out.match(/aria-pressed/g)).toHaveLength(3);

    // Controles de paginación presentes
    expect(out).toContain("Opciones 1 a 3 de 5");
    expect(out).toContain('aria-label="Opciones anteriores"');
    expect(out).toContain('aria-label="Opciones siguientes"');

    // Botón anterior deshabilitado en página inicial
    expect(out).toMatch(/aria-label="Opciones anteriores"[^>]*aria-disabled="true"/);
    expect(out).toMatch(/aria-label="Opciones anteriores"[^>]*disabled=""/);

    // Botones son de contorno de 44 px (size-11 = 44px) sin color lima (bg-accion)
    expect(out).toContain("size-11");
    expect(out).toContain("border-linea-fuerte");
    expect(out).not.toMatch(/aria-label="Opciones (anteriores|siguientes)"[^>]*bg-accion/);

    // Visible en escritorio con puntero fino
    expect(out).toContain("@[600px]:[@media(pointer:fine)]:flex");
  });
});
