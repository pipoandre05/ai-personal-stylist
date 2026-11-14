import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EventSummaryCard,
  OutfitCardV2,
  OutfitPair,
  SearchOffer,
  ShoppingOptions,
  ToolSteps,
  fmtSeenAt,
  safeHttpsUrl,
  searchLine,
  summarizeSteps,
} from "@/components/chat/v2";
import { buildPieces, layoutPieces } from "@/components/chat/v2/outfit-layout";
import {
  EVENT_COMPLETE,
  EVENT_INCOMPLETE,
  GARMENTS,
  NOW,
  OUTFIT_ATREVIDO,
  OUTFIT_FALTA,
  OUTFIT_SEGURO,
  SEARCH_OFFER,
  SHOPPING_BLOCK,
  SHOPPING_EDGE,
  SHOPPING_EMPTY,
  STEP_CLOSET_DONE,
  STEP_CLOSET_RUNNING,
  STEP_SEARCH_ERROR,
  WORK_STEPS,
} from "@/app/dev/hilo-v2/fixtures";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("formatos", () => {
  it("fmtSeenAt: hoy y otro día, en hora de Santiago", () => {
    expect(fmtSeenAt("2026-11-14T13:40:00Z", NOW)).toBe("Visto hoy, 14 nov, 10:40");
    expect(fmtSeenAt("2026-11-13T21:05:00Z", NOW)).toBe("Visto el 13 nov, 18:05");
    expect(fmtSeenAt("no es fecha", NOW)).toBe("");
  });

  it("safeHttpsUrl: solo https", () => {
    expect(safeHttpsUrl("https://tienda.example/a?b=1")).toBe("https://tienda.example/a?b=1");
    for (const bad of ["http://x.example", "javascript:alert(1)", "data:text/html,x", "//x.example", "", null, undefined, "no url"]) {
      expect(safeHttpsUrl(bad as string)).toBeNull();
    }
  });

  it("searchLine: plural y 'ninguno sirvió'", () => {
    expect(searchLine(SHOPPING_BLOCK)).toBe("Busqué en 3 tiendas · 41 resultados · elegí 3");
    expect(searchLine({ searched: { stores: 1, results: 1 }, options: SHOPPING_BLOCK.options.slice(0, 1) })).toBe(
      "Busqué en 1 tienda · 1 resultado · elegí 1",
    );
    expect(searchLine(SHOPPING_EMPTY)).toBe("Busqué en 4 tiendas · 18 resultados · ninguno sirvió");
  });

  it("summarizeSteps une los rótulos en pasado y cuenta lo que falló", () => {
    expect(summarizeSteps(WORK_STEPS)).toBe("Entendí tu evento · miré el clima en Casablanca · revisé tu clóset · armé dos looks");
    expect(summarizeSteps([STEP_CLOSET_DONE, STEP_SEARCH_ERROR])).toBe("Revisé tu clóset · 1 paso no se pudo completar");
  });
});

describe("composición del look", () => {
  it("numera en orden de lectura y deja la pieza faltante en su lugar", () => {
    const pieces = buildPieces(OUTFIT_FALTA);
    expect(pieces.map((p) => `${p.index}:${p.category}:${p.kind}`)).toEqual([
      "1:outerwear:garment",
      "2:top:garment",
      "3:bottom:garment",
      "4:bag:garment",
      "5:shoes:missing",
    ]);
  });

  it("con opción elegida, la faltante pasa a 'chosen' con tienda y precio", () => {
    const pieces = buildPieces({ ...OUTFIT_FALTA, selected_option: SHOPPING_BLOCK.options[0] });
    const last = pieces[pieces.length - 1];
    expect(last.kind).toBe("chosen");
    expect(last.store).toBe("Tienda A");
    expect(last.price).toBe(54990);
  });

  it("todas las piezas caben dentro de la mesa para cualquier combinación", () => {
    const sets: Parameters<typeof layoutPieces>[0][] = [
      ["top"],
      ["top", "bottom"],
      ["dress", "shoes"],
      ["outerwear", "top", "bottom", "bag", "shoes"],
      ["outerwear", "top", "bottom", "bag", "shoes", "accessory"],
      ["shoes", "bag", "accessory"],
      ["outerwear", "dress", "bottom", "bag", "shoes", "accessory", "top"],
    ];
    for (const cats of sets) {
      const out = layoutPieces(cats);
      expect(out).toHaveLength(cats.length);
      out.forEach((p, i) => {
        const heightPct = (p.width / p.aspect) * 1.5;
        expect(p.left, `${cats} #${i} izq`).toBeGreaterThanOrEqual(0);
        expect(p.left + p.width, `${cats} #${i} der`).toBeLessThanOrEqual(100);
        expect(p.top, `${cats} #${i} arriba`).toBeGreaterThanOrEqual(0);
        expect(p.top + heightPct, `${cats} #${i} abajo`).toBeLessThanOrEqual(100);
      });
    }
  });
});

describe("OutfitCardV2", () => {
  it("recién propuesto: superficie inverso y 'Guardar look' es el único botón lima", () => {
    const out = html(h(OutfitCardV2, { outfit: OUTFIT_FALTA, fresh: true, onSave() {}, onDiscard() {}, onRefine() {} }));
    expect(out).toContain("bg-inverso text-sobre-inverso");
    expect(out.match(/bg-accion/g)).toHaveLength(1);
    expect(out).toMatch(/bg-accion[^>]*>[\s\S]*?Guardar look/);
  });

  it("en papel: blanco y sin lima", () => {
    const out = html(h(OutfitCardV2, { outfit: { ...OUTFIT_SEGURO, variant: null, pair_id: null }, onSave() {}, onDiscard() {} }));
    expect(out).toContain("bg-superficie text-tinta");
    expect(out).not.toContain("bg-accion");
  });

  it("un look guardado deja la piel inverso y dice 'Guardado'", () => {
    const out = html(h(OutfitCardV2, { outfit: { ...OUTFIT_FALTA, status: "saved" }, fresh: true }));
    expect(out).not.toContain("bg-inverso text-sobre-inverso");
    expect(out).toContain("Guardado en Tus looks");
  });

  it("dice la variante con palabras, la evidencia con dato y marca la pieza faltante", () => {
    const out = html(h(OutfitCardV2, { outfit: OUTFIT_SEGURO, tag: "Opción 1 de 2" }));
    expect(out).toContain("Más seguro");
    expect(out).toContain("Opción 1 de 2");
    expect(out).toContain("27° y viento");
    expect(out).toContain("Tu paleta");
    expect(out).toContain("background-color:#A3AE93");

    const falta = html(h(OutfitCardV2, { outfit: OUTFIT_FALTA }));
    expect(falta).toContain("Falta");
    expect(falta).toContain("Zapatos: no tienes");
  });

  it("no inyecta colores que no son hex y no usa dangerouslySetInnerHTML", () => {
    const evil = { ...OUTFIT_SEGURO, evidence: [{ kind: "palette" as const, label: "x", swatches: ["red;background:url(x)", "#abc"] }] };
    const out = html(h(OutfitCardV2, { outfit: evil }));
    expect(out).not.toContain("url(x)");
    expect(out).toContain("background-color:#abc");
  });

  it("escapa el texto que viene de datos", () => {
    const out = html(h(OutfitCardV2, { outfit: { ...OUTFIT_SEGURO, title: '<img src=x onerror="a()">' } }));
    expect(out).not.toContain("<img src=x");
    expect(out).toContain("&lt;img");
  });

  it("los chips de refinamiento y las acciones no aparecen en la versión compacta", () => {
    const out = html(h(OutfitCardV2, { outfit: OUTFIT_SEGURO, compact: true, onRefine() {}, onSave() {} }));
    expect(out).not.toContain("Ajustar el look");
    expect(out).not.toContain("Guardar look");
  });
});

describe("OutfitPair", () => {
  it("rotula las dos opciones, el seguro primero, y ninguna es inverso ni lima", () => {
    const out = html(h(OutfitPair, { outfits: [OUTFIT_ATREVIDO, OUTFIT_SEGURO] }));
    expect(out.indexOf("Opción 1 de 2")).toBeLessThan(out.indexOf("Opción 2 de 2"));
    expect(out.indexOf("Más seguro")).toBeLessThan(out.indexOf("Más atrevido"));
    expect(out).toContain("Dos looks para elegir");
    expect(out).not.toContain("bg-accion");
  });
});

describe("ToolSteps", () => {
  it("en curso: rótulo en gerundio con role=status", () => {
    const out = html(h(ToolSteps, { steps: [STEP_CLOSET_RUNNING], garments: GARMENTS }));
    expect(out).toContain('role="status"');
    expect(out).toContain("Revisando tu clóset");
  });

  it("varios pasos terminados: plegado con resumen y botón accesible", () => {
    const out = html(h(ToolSteps, { steps: WORK_STEPS, garments: GARMENTS }));
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain("Entendí tu evento · miré el clima");
    expect(out).toContain("hidden");
  });

  it("abierto: miniaturas con las elegidas dichas con palabras", () => {
    const out = html(h(ToolSteps, { steps: WORK_STEPS, garments: GARMENTS, defaultOpen: true }));
    expect(out).toContain("Blazer de lino, elegida");
    expect(out).toContain("Las marcadas son las que usé.");
  });

  it("un paso con error lo dice con palabras", () => {
    const out = html(h(ToolSteps, { steps: [STEP_SEARCH_ERROR], defaultOpen: true }));
    expect(out).toContain("No se pudo completar.");
    expect(out).toContain("La búsqueda no está disponible por ahora");
  });
});

describe("EventSummaryCard", () => {
  it("marca lo que falta con la palabra Falta y lo dice en una línea", () => {
    const out = html(h(EventSummaryCard, { summary: EVENT_INCOMPLETE, onEdit() {} }));
    expect(out).toContain("Falta");
    expect(out).toContain("Me falta saber: vestimenta.");
    expect(out).toContain("Tocar para completar");
  });

  it("completo y de solo lectura: sin botones", () => {
    const out = html(h(EventSummaryCard, { summary: EVENT_COMPLETE }));
    expect(out).not.toContain("<button");
    expect(out).toContain("Sábado 21 nov");
    expect(out).toContain("Formal de día");
  });
});

describe("SearchOffer", () => {
  it("pendiente: dos botones con su rótulo; respondida: ninguno", () => {
    const on = html(h(SearchOffer, { offer: SEARCH_OFFER, onAction() {} }));
    expect(on).toContain("Sí, búscame opciones");
    expect(on).toContain("Por ahora no");
    expect(on).toContain("Yo no compro nada");
    expect(html(h(SearchOffer, { offer: SEARCH_OFFER, pending: false }))).not.toContain("<button");
  });
});

describe("ShoppingOptions", () => {
  const render = (block = SHOPPING_BLOCK, extra = {}) =>
    html(h(ShoppingOptions, { block, outfit: OUTFIT_FALTA, now: NOW, onSelect() {}, onRefine() {}, ...extra }));

  it("muestra tienda, precio en CLP, la línea de búsqueda y el aviso de que cambian", () => {
    const out = render();
    expect(out).toContain("Busqué en 3 tiendas · 41 resultados · elegí 3");
    expect(out).toContain("$54.990");
    expect(out).toContain("$39.990");
    expect(out).toContain("Tienda A");
    expect(out).toContain("Precio y stock pueden cambiar");
    expect(out).toContain("Enlace con comisión");
  });

  it("la opción elegida se marca con palabra y la ficha trae el enlace externo seguro, sin lima ni 'comprar'", () => {
    const out = render({ ...SHOPPING_BLOCK, selected_option_id: "opt-a1" });
    expect(out).toContain("Elegida");
    expect(out).toContain("Así queda con la 1");
    expect(out).toContain('aria-pressed="true"');
    expect(out).toContain('href="https://tienda-a.example/sandalia-camel"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="sponsored noopener noreferrer"');
    expect(out).toContain("Visto hoy, 14 nov, 10:40 · Precio y stock pueden cambiar");
    expect(out).not.toMatch(/comprar/i);
    expect(out).not.toMatch(/<a [^>]*bg-accion/);
  });

  it("sin comisión: rel sin sponsored; enlace http: no se muestra", () => {
    const b = { ...SHOPPING_BLOCK, selected_option_id: "opt-b1" };
    expect(render(b)).toContain('rel="noopener noreferrer"');
    const edge = render(SHOPPING_EDGE); // la opción elegida tiene url http
    expect(edge).not.toContain('target="_blank"');
    expect(edge).toContain("No pude validar el enlace");
  });

  it("sin stock lo dice con palabras", () => {
    expect(render({ ...SHOPPING_EDGE, selected_option_id: "opt-e1" })).toContain("Sin stock");
  });

  it("estado vacío honesto: no hay opciones ni 'elegí'", () => {
    const out = render(SHOPPING_EMPTY);
    expect(out).toContain("ninguno sirvió");
    expect(out).toContain("No encontré zapatos que valga la pena");
    expect(out).toContain("$20.000");
    expect(out).not.toContain("aria-pressed");
  });

  it("nunca pinta más de tres opciones", () => {
    const four = { ...SHOPPING_BLOCK, options: [...SHOPPING_BLOCK.options, { ...SHOPPING_BLOCK.options[0], id: "opt-x" }] };
    expect(render(four).match(/aria-pressed/g)).toHaveLength(3);
  });
});
