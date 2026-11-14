"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  applyEventToTurn,
  buildThreadItemsV2,
  buildTurnItems,
  CardBoundary,
  CardFallback,
  emptyTurnState,
  EventSummaryCard,
  freshOutfitIdOf,
  OutfitCardSkeleton,
  OutfitCardV2,
  OutfitPair,
  SearchOffer,
  ShoppingOptions,
  ThreadItemV2View,
  ToolSteps,
  type ThreadV2Handlers,
} from "@/components/chat/v2";
import { Button } from "@/components/ui/button";
import type { ChatIntent, ChatMessageView, OutfitStatus } from "@/lib/domain/types";
import {
  EVENT_COMPLETE,
  EVENT_INCOMPLETE,
  EVENT_SPARSE,
  GARMENTS,
  JOURNEY,
  LIVE_EVENTS,
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
  STEP_EVENT,
  STEP_OUTFIT_RUNNING,
  STEP_SEARCH_ERROR,
  STEP_WEATHER,
  WORK_STEPS,
} from "./fixtures";

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="mt-12">
      <h2 id={`${id}-h`} className="font-display text-titulo">
        {title}
      </h2>
      {note ? <p className="mt-1 text-cuerpo text-tinta-suave">{note}</p> : null}
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sobretitulo uppercase text-tinta-suave">{label}</p>
      {children}
    </div>
  );
}

function Advisor({ children }: { children: ReactNode }) {
  return <p className="text-destacado text-tinta">{children}</p>;
}

function Person({ children }: { children: ReactNode }) {
  return <p className="w-fit max-w-[82%] self-end rounded-campo bg-hundido px-4 py-3 text-cuerpo text-tinta">{children}</p>;
}

function Boom({ explode }: { explode: boolean }): ReactNode {
  if (explode) throw new Error("Tarjeta rota a propósito (vista previa)");
  return (
    <p className="rounded-campo bg-superficie p-4 text-cuerpo text-tinta">
      Esta tarjeta está sana. Toca el botón de abajo para romperla: el resto de la página sigue en pie.
    </p>
  );
}

export function HiloV2Preview() {
  const [selected, setSelected] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, OutfitStatus>>({});
  const [last, setLast] = useState<string>("Todavía no tocaste nada.");
  const [explode, setExplode] = useState(false);
  const [live, setLive] = useState(() => emptyTurnState());
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  const say = (s: string) => setLast(s);
  const intentText = (i: ChatIntent, label: string) => `streamChat({ text: "${label}", intent: ${JSON.stringify(i)} })`;

  // El hilo cargado, con lo que la persona tocó aplicado (en la app real lo hacen las Server Actions + la recarga).
  const messages = useMemo<ChatMessageView[]>(
    () =>
      JOURNEY.map((m) => ({
        ...m,
        outfits: m.outfits.map((o) => ({ ...o, status: statuses[o.id] ?? o.status })),
        shopping_blocks: m.shopping_blocks?.map((b) => ({ ...b, selected_option_id: selected })),
      })),
    [selected, statuses],
  );
  const turns = useMemo(() => buildThreadItemsV2(messages), [messages]);
  const itemsOf = (id: string) => turns.find((t) => t.messageId === id)?.items ?? [];

  const handlers: ThreadV2Handlers = {
    onEditEvent: (field) => say(`updateEventSummary({ ${field}: … })  ·  se abre el editor del campo "${field}"`),
    onSaveOutfit: (o) => {
      setStatuses((s) => ({ ...s, [o.id]: "saved" }));
      say(`setOutfitStatus("${o.id}", "saved")`);
    },
    onDiscardOutfit: (o) => {
      setStatuses((s) => ({ ...s, [o.id]: "discarded" }));
      say(`setOutfitStatus("${o.id}", "discarded")`);
    },
    onRefine: (intent, label) => say(intentText(intent, label)),
    onSearchOfferAction: (a) => say(intentText(a.intent, a.label)),
    onSelectOption: (_block, outfitId, optionId) => {
      setSelected(optionId);
      say(`selectShoppingOption("${outfitId}", ${optionId === null ? "null" : `"${optionId}"`})`);
    },
  };

  const play = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setLive(emptyTurnState());
    setPlaying(true);
    LIVE_EVENTS.forEach((e, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLive((s) => applyEventToTurn(s, e));
          if (i === LIVE_EVENTS.length - 1) setPlaying(false);
        }, 700 * (i + 1)),
      );
    });
  };
  const liveItems = buildTurnItems({ id: "live", ...live }, { freshOutfitId: freshOutfitIdOf(live.outfits), isLastMessage: true });

  const common = { garments: GARMENTS, now: NOW, handlers } as const;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-app bg-fondo px-6 pt-seguro pb-24">
      <header className="pt-8">
        <p className="text-sobretitulo uppercase text-tinta-suave">Vista previa · solo desarrollo</p>
        <h1 className="mt-1 font-display text-titular">Hilo v2</h1>
        <p className="mt-2 text-cuerpo text-tinta-suave">
          Componentes del contrato v2 con datos fijos del contrato. Nada de esto toca la red ni la base de datos.
        </p>
      </header>

      <div
        role="status"
        aria-live="polite"
        className="sticky top-0 z-20 -mx-6 mt-5 border-b border-linea bg-fondo/90 px-6 py-1.5 pt-seguro backdrop-blur-md"
      >
        <p className="text-sobretitulo uppercase text-tinta-suave">Último callback</p>
        <p className="mt-0.5 break-words text-meta text-tinta">{last}</p>
      </div>

      <Section
        id="recorrido"
        title="Recorrido completo"
        note="Evento, pasos, par de looks, oferta, opciones y opción elegida. Sale de buildThreadItemsV2() sobre el hilo de ejemplo."
      >
        <div className="flex flex-col gap-6" aria-label="Conversación de ejemplo">
          <Person>{JOURNEY[0].text}</Person>
          <div className="flex flex-col gap-3.5">
            <Advisor>{JOURNEY[1].text}</Advisor>
            {itemsOf("m2").map((it) => (
              <ThreadItemV2View key={it.key} item={it} {...common} />
            ))}
          </div>
          <Person>{JOURNEY[2].text}</Person>
          <div className="flex flex-col gap-3.5">
            <Advisor>{JOURNEY[3].text}</Advisor>
            {itemsOf("m4").map((it) => (
              <ThreadItemV2View key={it.key} item={it} {...common} />
            ))}
          </div>
          <Person>{JOURNEY[4].text}</Person>
          <div className="flex flex-col gap-3.5">
            <Advisor>{JOURNEY[5].text}</Advisor>
            {itemsOf("m6").map((it) => (
              <ThreadItemV2View key={it.key} item={it} {...common} />
            ))}
          </div>
          <Person>{JOURNEY[6].text}</Person>
          <div className="flex flex-col gap-3.5">
            <Advisor>{JOURNEY[7].text}</Advisor>
            {itemsOf("m8").map((it) => (
              <ThreadItemV2View key={it.key} item={it} {...common} />
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="en-vivo"
        title="Turno en vivo"
        note="Reproduce los eventos SSE del asesor simulado con applyEventToTurn(): los pasos pasan de en curso a hecho y los looks caen."
      >
        <div>
          <Button variant="inverso" size="mediano" onClick={play} disabled={playing}>
            {playing ? "Reproduciendo…" : "Reproducir turno"}
          </Button>
        </div>
        <div className="flex min-h-24 flex-col gap-3.5" aria-live="off">
          {liveItems.length === 0 ? <p className="text-meta text-tinta-suave">Aquí aparece el turno.</p> : null}
          {liveItems.map((it) => (
            <ThreadItemV2View key={it.key} item={it} {...common} animate />
          ))}
        </div>
      </Section>

      <Section id="pasos" title="Rastro de pasos">
        <State label="En curso (con hecho encima)">
          <ToolSteps steps={[STEP_EVENT, STEP_WEATHER, STEP_CLOSET_RUNNING]} garments={GARMENTS} />
        </State>
        <State label="Armando el look">
          <ToolSteps steps={[STEP_EVENT, STEP_WEATHER, STEP_CLOSET_DONE, STEP_OUTFIT_RUNNING]} garments={GARMENTS} />
        </State>
        <State label="Hecho, abierto (miniaturas con las elegidas marcadas)">
          <ToolSteps steps={WORK_STEPS} garments={GARMENTS} defaultOpen />
        </State>
        <State label="Hecho, plegado (toca para abrir)">
          <ToolSteps steps={WORK_STEPS} garments={GARMENTS} />
        </State>
        <State label="Un paso con error">
          <ToolSteps steps={[STEP_EVENT, STEP_SEARCH_ERROR]} garments={GARMENTS} defaultOpen />
        </State>
        <State label="Un solo paso (sin plegar)">
          <ToolSteps steps={[STEP_WEATHER]} />
        </State>
      </Section>

      <Section id="evento" title="Lo que entendí">
        <State label="Falta la vestimenta">
          <EventSummaryCard summary={EVENT_INCOMPLETE} onEdit={handlers.onEditEvent} />
        </State>
        <State label="Completo">
          <EventSummaryCard summary={EVENT_COMPLETE} onEdit={handlers.onEditEvent} />
        </State>
        <State label="Casi vacío">
          <EventSummaryCard summary={EVENT_SPARSE} onEdit={handlers.onEditEvent} />
        </State>
        <State label="Guardando una corrección">
          <EventSummaryCard summary={EVENT_COMPLETE} onEdit={handlers.onEditEvent} busy />
        </State>
        <State label="Solo lectura">
          <EventSummaryCard summary={EVENT_COMPLETE} />
        </State>
      </Section>

      <Section id="look" title="Tarjeta de look">
        <State label="Recién propuesto (inverso, única acción en lima) · con pieza faltante">
          <OutfitCardV2 outfit={OUTFIT_FALTA} fresh animate onSave={handlers.onSaveOutfit} onDiscard={handlers.onDiscardOutfit} onRefine={handlers.onRefine} />
        </State>
        <State label="Normal (en papel, blanco)">
          <OutfitCardV2
            outfit={{ ...OUTFIT_SEGURO, variant: null, pair_id: null }}
            onSave={handlers.onSaveOutfit}
            onDiscard={handlers.onDiscardOutfit}
            onRefine={handlers.onRefine}
          />
        </State>
        <State label="Guardado">
          <OutfitCardV2 outfit={{ ...OUTFIT_SEGURO, variant: null, pair_id: null, status: "saved" }} onDiscard={handlers.onDiscardOutfit} onRefine={handlers.onRefine} />
        </State>
        <State label="No es para mí">
          <OutfitCardV2 outfit={{ ...OUTFIT_ATREVIDO, variant: null, pair_id: null, status: "discarded" }} />
        </State>
        <State label="Con la opción de compra elegida dentro de la composición">
          <OutfitCardV2
            outfit={{ ...OUTFIT_FALTA, selected_option: SHOPPING_BLOCK.options[0] }}
            onSave={handlers.onSaveOutfit}
            onDiscard={handlers.onDiscardOutfit}
          />
        </State>
        <State label="Compacta (Tus looks) · prenda sin foto">
          <OutfitCardV2
            compact
            outfit={{
              ...OUTFIT_SEGURO,
              variant: null,
              pair_id: null,
              evidence: undefined,
              refinements: undefined,
              items: [
                { garment_id: "g-camisa", name: "Camisa rayada", category: "top", photo_url: null },
                { garment_id: "g-pantalon", name: "Pantalón azul marino", category: "bottom", photo_url: "/dev/prendas/pantalon.svg" },
                { garment_id: "g-botines", name: "Botines café", category: "shoes", photo_url: null },
              ],
            }}
          />
        </State>
        <State label="Cargando">
          <OutfitCardSkeleton />
        </State>
      </Section>

      <Section id="par" title="Dos looks para elegir" note="Apilados con rótulo (ver outfit-pair.tsx). Ninguno es inverso: el énfasis es de la cabecera.">
        <OutfitPair
          outfits={[OUTFIT_ATREVIDO, OUTFIT_SEGURO]}
          onSave={handlers.onSaveOutfit}
          onDiscard={handlers.onDiscardOutfit}
          onRefine={handlers.onRefine}
        />
      </Section>

      <Section id="oferta" title="Oferta de búsqueda">
        <State label="Pendiente (último mensaje)">
          <SearchOffer offer={SEARCH_OFFER} onAction={handlers.onSearchOfferAction} />
        </State>
        <State label="Ya respondida (sin botones)">
          <SearchOffer offer={SEARCH_OFFER} pending={false} />
        </State>
      </Section>

      <Section id="opciones" title="Opciones de compra">
        <State label="Sin elegir">
          <ShoppingOptions block={SHOPPING_BLOCK} outfit={OUTFIT_FALTA} now={NOW} onSelect={(id) => say(`selectShoppingOption(…, ${id})`)} onRefine={handlers.onRefine} />
        </State>
        <State label="Elegida (con comisión, ficha completa)">
          <ShoppingOptions
            block={{ ...SHOPPING_BLOCK, selected_option_id: "opt-a1" }}
            outfit={OUTFIT_FALTA}
            now={NOW}
            onSelect={(id) => say(`selectShoppingOption(…, ${id})`)}
            onRefine={handlers.onRefine}
          />
        </State>
        <State label="Elegida sin comisión · otro día">
          <ShoppingOptions
            block={{
              ...SHOPPING_BLOCK,
              selected_option_id: "opt-b1",
              options: SHOPPING_BLOCK.options.map((o) => ({ ...o, seen_at: "2026-11-13T21:05:00Z" })),
            }}
            outfit={OUTFIT_FALTA}
            now={NOW}
            onSelect={(id) => say(`selectShoppingOption(…, ${id})`)}
          />
        </State>
        <State label="Sin stock · enlace que no es https · sin foto">
          <ShoppingOptions block={SHOPPING_EDGE} outfit={OUTFIT_FALTA} now={NOW} onSelect={(id) => say(`selectShoppingOption(…, ${id})`)} />
        </State>
        <State label="Sin nada bueno (estado vacío honesto)">
          <ShoppingOptions block={SHOPPING_EMPTY} outfit={OUTFIT_FALTA} now={NOW} onRefine={handlers.onRefine} />
        </State>
        <State label="Ocupado (guardando la elección)">
          <ShoppingOptions block={{ ...SHOPPING_BLOCK, selected_option_id: "opt-c1" }} now={NOW} onSelect={() => undefined} busy />
        </State>
      </Section>

      <Section id="error" title="Error contenido por tarjeta">
        <State label="Aviso">
          <CardFallback label="Look" onRetry={() => say("Reintentar la tarjeta")} />
        </State>
        <State label="En vivo: rompe una tarjeta y el resto sigue">
          <CardBoundary label="Tarjeta de prueba" resetKey={explode ? "roto" : "sano"}>
            <Boom explode={explode} />
          </CardBoundary>
          <div>
            <Button variant="contorno" size="mediano" onClick={() => setExplode((v) => !v)}>
              {explode ? "Arreglar la tarjeta" : "Romper la tarjeta"}
            </Button>
          </div>
        </State>
      </Section>
    </div>
  );
}
