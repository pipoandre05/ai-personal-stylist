import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/actions/auth", () => ({ signOut: vi.fn() }));

import { getContextualGreeting, START_SUGGESTIONS } from "@/components/chat/greeting";
import { StartScreen } from "@/components/chat/start-screen";
import { SuggestedReplies } from "@/components/chat/suggested-replies";
import { OutfitCardV2 } from "@/components/chat/v2/outfit-card-v2";
import { ShoppingOptions } from "@/components/chat/v2/shopping-options";
import { AppHeader } from "@/components/ui/app-header";
import { SessionsSheet } from "@/components/ui/sessions-sheet";
import type { ConversationSummary, OutfitView, ShoppingOptionsBlock } from "@/lib/domain/types";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("UI-20: Sesiones, inicio de cero y respuestas rápidas", () => {
  describe("Pieza C: Saludo contextual y Pantalla de inicio", () => {
    it("saludo en la mañana con nombre", () => {
      // 2026-11-14 (sábado) 09:30 Santiago (UTC-3 -> 12:30 UTC)
      const date = new Date("2026-11-14T12:30:00Z");
      const res = getContextualGreeting("Felipe", date, 0);
      expect(res.greeting).toContain("Felipe");
      expect(res.greeting).not.toContain("undefined");
      expect(res.subtitle).toBeTruthy();
    });

    it("saludo en la tarde sin nombre no deja comas sueltas", () => {
      // 2026-11-14 15:30 Santiago (UTC-3 -> 18:30 UTC)
      const date = new Date("2026-11-14T18:30:00Z");
      const res = getContextualGreeting(null, date, 0);
      expect(res.greeting).not.toContain("undefined");
      expect(res.greeting).not.toContain(", .");
      expect(res.greeting).not.toMatch(/,\s*$/);
    });

    it("saludo en la noche", () => {
      // 2026-11-14 22:30 Santiago
      const date = new Date("2026-11-15T01:30:00Z");
      const res = getContextualGreeting("Felipe", date);
      expect(res.greeting).toContain("Felipe");
    });

    it("saludo de fin de semana", () => {
      // Sábado 2026-11-14
      const date = new Date("2026-11-14T16:00:00Z");
      const res = getContextualGreeting("Felipe", date, 0);
      expect(res.greeting).toMatch(/(fin de semana|Buen|De vuelta|Hola|Buenas)/i);
    });

    it("START_SUGGESTIONS contiene 4 sugerencias en tono de Estilo", () => {
      expect(START_SUGGESTIONS).toHaveLength(4);
      expect(START_SUGGESTIONS[0]).toContain("fin de semana");
    });

    it("StartScreen renderiza encabezado, subtítulo y píldoras sin lima", () => {
      const out = html(
        h(StartScreen, {
          displayName: "Felipe",
          onSelectSuggestion: vi.fn(),
        }),
      );
      // El saludo se calcula en el navegador (depende de su hora): en el HTML del servidor no viaja, para que
      // servidor y navegador no se contradigan. El nombre lo cubre el test de getContextualGreeting.
      expect(out).not.toContain("Felipe");
      expect(out).toContain('role="group"');
      expect(out).toContain('aria-label="Sugerencias para empezar"');
      expect(out).toContain("Quiero armar un look");
      expect(out).not.toContain("bg-accion");
      expect(out).not.toContain("text-accion");
    });
  });

  describe("Pieza D: Panel lateral de sesiones y AppHeader", () => {
    const MOCK_SESSIONS: ConversationSummary[] = [
      {
        id: "c1",
        title: "Matrimonio en Casablanca",
        updated_at: "2026-11-14T15:30:00Z",
      },
      {
        id: "c2",
        title: "Look para entrevista de trabajo",
        updated_at: "2026-11-13T10:00:00Z",
      },
    ];

    it("AppHeader renderiza botón de sesiones a la izquierda con IconMenu de 44 px", () => {
      const out = html(
        h(AppHeader, {
          conversations: MOCK_SESSIONS,
          closetCount: 12,
        }),
      );
      expect(out).toContain('aria-label="Sesiones"');
      expect(out).toContain("Estilo");
      expect(out).toContain("Tu espacio");
      expect(out).toContain("size-11");
    });

    it("SessionsSheet renderiza diálogo accesible y botón Nueva conversación a /asesor", () => {
      const out = html(
        h(SessionsSheet, {
          open: true,
          onClose: vi.fn(),
          conversations: MOCK_SESSIONS,
          currentConversationId: "c1",
        }),
      );
      expect(out).toContain("<dialog");
      expect(out).toContain('aria-labelledby="sessions-sheet-title"');
      expect(out).toContain("Conversaciones");
      expect(out).toContain('href="/asesor"');
      expect(out).toContain("Nueva conversación");
      expect(out).toContain("Matrimonio en Casablanca");
      expect(out).toContain('href="/asesor/c1"');
      expect(out).toContain('href="/asesor/c2"');
    });

    it("SessionsSheet estado vacío tiene mensaje con voz de Estilo", () => {
      const out = html(
        h(SessionsSheet, {
          open: true,
          onClose: vi.fn(),
          conversations: [],
        }),
      );
      expect(out).toContain("Aún no tienes conversaciones guardadas");
    });
  });

  describe("Pieza A: Respuestas sugeridas y refinamientos unificados", () => {
    it("SuggestedReplies renderiza opciones con intent como botones contorno de 44 px", () => {
      const refinements = [
        { id: "ref-1", label: "Más abrigado", intent: { kind: "refine_outfit" as const, outfit_id: "o1", change: "warmer" as const } },
        { id: "ref-2", label: "Cambiar zapatos", intent: { kind: "refine_outfit" as const, outfit_id: "o1", change: "lighter" as const } },
      ];
      const out = html(
        h(SuggestedReplies, {
          options: refinements,
          onSend: vi.fn(),
        }),
      );
      expect(out).toContain('role="group"');
      expect(out).toContain("Más abrigado");
      expect(out).toContain("Cambiar zapatos");
      expect(out).not.toContain("bg-accion");
    });

    it("OutfitCardV2 solo contiene Guardar look y No es para mí (refinamientos extraídos)", () => {
      const outfit: OutfitView = {
        id: "o-test",
        title: "Look de prueba",
        occasion: "Matrimonio",
        status: "proposed",
        variant: "seguro",
        items: [],
        rationale: "Funciona perfecto",
        weather: null,
        missing_piece: null,
        rating: null,
        created_at: "2026-11-14T10:00:00Z",
        refinements: [
          { id: "r1", label: "Más abrigado", intent: { kind: "refine_outfit", outfit_id: "o-test", change: "warmer" } },
        ],
      };
      const out = html(h(OutfitCardV2, { outfit, onSave: vi.fn(), onDiscard: vi.fn() }));
      expect(out).toContain("Guardar look");
      expect(out).toContain("No es para mí");
      expect(out).not.toContain("Ajustar el look");
      expect(out).not.toContain("Más abrigado");
    });
  });

  describe("Pieza B: Opciones de compra en carrusel horizontal", () => {
    const block: ShoppingOptionsBlock = {
      id: "shop-test",
      for_outfit_id: "o1",
      slot: "shoes",
      query: "sandalias",
      searched: { stores: 3, results: 12 },
      trigger: "offer_accepted",
      budget_max_clp: null,
      selected_option_id: null,
      options: [
        {
          id: "opt-1",
          store_name: "Tienda A",
          title: "Sandalia Camel",
          price_clp: 39990,
          url: "https://example.com/1",
          image_cutout_url: null,
          image_url: "https://example.com/1.jpg",
          affiliate: false,
          seen_at: "2026-11-14T10:00:00Z",
          reason: "Calza con tu estilo",
        },
        {
          id: "opt-2",
          store_name: "Tienda B",
          title: "Sandalia Negra",
          price_clp: 45990,
          url: "https://example.com/2",
          image_cutout_url: null,
          image_url: "https://example.com/2.jpg",
          affiliate: true,
          seen_at: "2026-11-14T10:00:00Z",
          reason: "Combina con todo",
        },
      ],
      refinements: [
        { id: "r-shop", label: "Más baratos", intent: { kind: "refine_search", block_id: "shop-test", change: "cheaper" } },
      ],
    };

    it("ShoppingOptions renderiza carrusel horizontal accesible con snap-x y sin botones de ajuste", () => {
      const out = html(h(ShoppingOptions, { block, onSelect: vi.fn() }));
      expect(out).toContain('role="region"');
      expect(out).toContain('aria-label="Opciones de compra"');
      expect(out).toContain("snap-x");
      expect(out).not.toContain("Ajustar la búsqueda");
      expect(out).not.toContain("Más baratos");
    });

    it("una sola opción de compra ocupa ancho completo sin scroll snap roto", () => {
      const singleBlock = { ...block, options: [block.options[0]] };
      const out = html(h(ShoppingOptions, { block: singleBlock, onSelect: vi.fn() }));
      expect(out).toContain("w-full");
      expect(out).not.toContain("snap-x");
    });
  });
});
