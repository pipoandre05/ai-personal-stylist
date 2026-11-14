import { useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { IconCheck, IconBack, IconChevron } from "@/components/ui/icons";
import type { ChatIntent, OutfitView, ProductOption, ShoppingOptionsBlock } from "@/lib/domain/types";
import { fmtCLP } from "@/lib/format";
import { STOCK_NOTICE, SLOT_WORD, fmtSeenAt, plural, safeHttpsUrl } from "./format";
import { CategoryGlyph, IconExternal } from "./glyphs";
import { buildPieces } from "./outfit-layout";
import { PieceImage } from "./piece";

export type ShoppingOptionsProps = {
  block: ShoppingOptionsBlock;
  /** El look al que completa, para "así queda el look con esta". Sin él no se dibuja la tira. */
  outfit?: OutfitView | null;
  /** Elegir una opción (`selectShoppingOption`) o quitar la elección (`null`). Elegir no compra nada. */
  onSelect?: (optionId: string | null) => void;
  /** @deprecated Los ajustes de compra ahora se consolidan sobre el compositor en suggested-replies (UI-20). */
  onRefine?: (intent: ChatIntent, label: string) => void;
  busy?: boolean;
  /** Para "visto hoy": se fija en la vista previa; por defecto, ahora. */
  now?: Date;
  /** Anima la entrada de las opciones (turno en vivo). */
  animate?: boolean;
  className?: string;
};

/** "Busqué en 3 tiendas · 41 resultados · elegí 3". */
export function searchLine(block: Pick<ShoppingOptionsBlock, "searched" | "options">): string {
  const { stores, results } = block.searched;
  const head = `Busqué en ${plural(stores, "tienda", "tiendas")} · ${plural(results, "resultado", "resultados")}`;
  return block.options.length === 0 ? `${head} · ninguno sirvió` : `${head} · elegí ${block.options.length}`;
}

const SECTION = "rounded-tarjeta bg-superficie p-[18px] @container";

function optionPhoto(o: ProductOption): string | null {
  return o.image_cutout_url ?? o.image_url;
}

/**
 * Opciones de compra honestas en carrusel horizontal o cuadrícula de 3 columnas (UI-25, D-16):
 * - En móvil o contenedor < 600 px: carrusel deslizable horizontal con scroll-snap (snap-x snap-mandatory) y navegación por teclado (flechas).
 * - En contenedor >= 600 px: 2 o 3 opciones se despliegan en cuadrícula de 3 columnas iguales sin desplazamiento horizontal.
 * - Si hay 1 sola opción, ocupa el ancho completo en móvil y escritorio.
 * - Si hay más de 3 opciones en escritorio: flechas de paginación de 44 px en contorno con puntero fino.
 * - Tarjetas accesibles (lector de pantalla con "Opción X de Y", min target >= 44 px).
 * - En la ficha solo queda "Ver en la tienda" (con aviso de afiliación DP-10).
 */
export function ShoppingOptions({
  block,
  outfit,
  onSelect,
  busy = false,
  now,
  animate = false,
  className,
}: ShoppingOptionsProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const allOptions = block.options;
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 3;
  const totalPages = Math.ceil(allOptions.length / pageSize) || 1;

  // En móvil o carrusel se muestran las opciones (o las de la página si se pagina)
  // Para mantener compatibilidad con carrusel y escritorio, las opciones activas:
  const isPaginating = allOptions.length > pageSize;
  const visibleOptions = isPaginating
    ? allOptions.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
    : allOptions;

  const selected = allOptions.find((o) => o.id === block.selected_option_id) ?? null;
  const selectedIndex = selected ? allOptions.indexOf(selected) + 1 : 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLOListElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons?.length) return;
    const activeIndex = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
    if (activeIndex === -1) return;
    if (e.key === "ArrowRight" && activeIndex < buttons.length - 1) {
      e.preventDefault();
      buttons[activeIndex + 1].focus();
    } else if (e.key === "ArrowLeft" && activeIndex > 0) {
      e.preventDefault();
      buttons[activeIndex - 1].focus();
    }
  };

  if (allOptions.length === 0) {
    return (
      <section aria-label="Opciones para completar el look" className={cn(SECTION, className)}>
        <SearchLine text={searchLine({ searched: block.searched, options: allOptions })} />
        <p className="mt-3 text-cuerpo text-tinta">
          No encontré {SLOT_WORD[block.slot]} que valga la pena para este look
          {block.budget_max_clp ? ` dentro de ${fmtCLP(block.budget_max_clp)}` : ""}.
        </p>
        <p className="mt-1.5 text-meta text-tinta-suave">
          Prefiero decírtelo a mostrarte algo que no calza con tu clóset o tu tope de gasto. Búsqueda: {block.query}.
        </p>
      </section>
    );
  }

  const seenTimes = allOptions.map((o) => new Date(o.seen_at).getTime()).filter((t) => !Number.isNaN(t));
  const latestSeen = seenTimes.length ? fmtSeenAt(new Date(Math.max(...seenTimes)).toISOString(), now) : "";

  const canGoPrev = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;
  const startNum = pageIndex * pageSize + 1;
  const endNum = Math.min((pageIndex + 1) * pageSize, allOptions.length);

  return (
    <section aria-label="Opciones para completar el look" className={cn(SECTION, className)}>
      <SearchLine text={searchLine({ searched: block.searched, options: allOptions })} />

      {outfit ? <LookStrip block={block} outfit={outfit} selected={selected} selectedIndex={selectedIndex} /> : null}

      <div
        role="region"
        aria-label="Opciones de compra"
        className="mt-3 -mx-[18px] px-[18px] @[600px]:mx-0 @[600px]:px-0"
      >
        <ol
          ref={listRef}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex gap-3 pb-2 [scrollbar-width:none]",
            allOptions.length > 1
              ? "overflow-x-auto scroll-smooth snap-x snap-mandatory motion-reduce:scroll-auto"
              : "overflow-x-visible",
            "@[600px]:grid @[600px]:grid-cols-3 @[600px]:overflow-visible @[600px]:pb-0",
          )}
        >
          {visibleOptions.map((o, idx) => {
            const globalIndex = pageIndex * pageSize + idx;
            const isSel = o.id === selected?.id;
            return (
              <li
                key={o.id}
                className={cn(
                  "snap-start shrink-0",
                  allOptions.length === 1 ? "w-full @[600px]:col-span-3" : "w-[240px] sm:w-[260px]",
                  "@[600px]:w-auto",
                  animate && "animate-aparecer",
                )}
                style={animate ? { animationDelay: `${idx * 70}ms` } : undefined}
              >
                <button
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`Opción ${globalIndex + 1} de ${allOptions.length}: ${o.title}, ${o.store_name}`}
                  disabled={busy || !onSelect}
                  onClick={() => onSelect?.(isSel ? null : o.id)}
                  className="flex w-full flex-col text-left transition-transform duration-150 ease-salida active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foco rounded-foto"
                >
                  <span
                    className={cn(
                      "relative grid aspect-square w-full place-items-center rounded-foto bg-hundido",
                      isSel && "ring-2 ring-inset ring-linea-fuerte",
                    )}
                  >
                    <span className="block size-[84%]">
                      <PieceImage src={optionPhoto(o)} alt={`${o.title}, ${o.store_name}`} category={block.slot} shadow />
                    </span>
                    {isSel ? (
                      <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-insignia bg-inverso px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sobre-inverso">
                        <IconCheck className="size-3" />
                        Elegida
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-tinta-suave">
                    {globalIndex + 1} · {o.store_name}
                  </span>
                  <span className="line-clamp-2 text-meta text-tinta">{o.title}</span>
                  <span className="text-nombre tabular-nums text-tinta">{fmtCLP(o.price_clp)}</span>
                  {o.affiliate ? <span className="text-meta text-tinta-suave">Enlace con comisión</span> : null}
                </button>
              </li>
            );
          })}
        </ol>

        {isPaginating ? (
          <div className="hidden @[600px]:[@media(pointer:fine)]:flex items-center justify-between gap-2 mt-3 pt-2">
            <span className="text-meta text-tinta-suave">
              Opciones {startNum} a {endNum} de {allOptions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Opciones anteriores"
                aria-disabled={!canGoPrev}
                disabled={!canGoPrev}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                className="grid size-11 place-items-center rounded-full border-[1.5px] border-linea-fuerte text-tinta bg-transparent hover:bg-hundido transition-[transform,opacity] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-foco"
              >
                <IconBack className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Opciones siguientes"
                aria-disabled={!canGoNext}
                disabled={!canGoNext}
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                className="grid size-11 place-items-center rounded-full border-[1.5px] border-linea-fuerte text-tinta bg-transparent hover:bg-hundido transition-[transform,opacity] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-foco"
              >
                <IconChevron className="size-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div aria-live="polite">
        {selected ? (
          <Ficha key={selected.id} option={selected} now={now} />
        ) : (
          <p className="mt-3 text-meta text-tinta-suave">
            Toca una opción para ver el detalle y cómo queda tu look.
            {latestSeen ? ` ${latestSeen} · ${STOCK_NOTICE}.` : ""}
          </p>
        )}
      </div>
    </section>
  );
}

function SearchLine({ text }: { text: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-meta font-bold text-tinta-suave">
      <IconCheck className="size-4 shrink-0 text-exito" />
      {text}
    </p>
  );
}

/** "Así queda el look con esta": las piezas del look y, en la celda naranja, la que falta o la opción elegida. */
function LookStrip({
  block,
  outfit,
  selected,
  selectedIndex,
}: {
  block: ShoppingOptionsBlock;
  outfit: OutfitView;
  selected: ProductOption | null;
  selectedIndex: number;
}) {
  const pieces = buildPieces({
    items: outfit.items,
    missing_piece: { category: block.slot, description: block.query, why: "" },
    selected_option: selected,
  });
  return (
    <div
      role="group"
      aria-label="Así queda tu look con la opción elegida"
      className="mt-3 grid gap-1 rounded-foto bg-hundido p-1.5"
      style={{ gridTemplateColumns: `repeat(${Math.min(pieces.length, 7)}, minmax(0, 1fr))` }}
    >
      {pieces.map((p) => {
        const slot = p.kind !== "garment";
        return (
          <div
            key={p.key}
            className={cn("grid aspect-square place-items-center rounded-insignia", slot && "bg-falta", slot && p.kind === "chosen" && "animate-aparecer")}
          >
            {p.kind === "missing" ? (
              <CategoryGlyph category={p.category} dashed className="size-[70%] text-sobre-color" />
            ) : (
              <span className="block size-[80%]">
                <PieceImage src={p.src} alt={p.name} category={p.category} shadow />
              </span>
            )}
          </div>
        );
      })}
      <p className="col-span-full px-1 pt-1 text-right text-meta font-bold text-tinta">
        {selected ? `Así queda con la ${selectedIndex}` : `Falta: ${SLOT_WORD[block.slot]}`}
      </p>
    </div>
  );
}

/** Ficha honesta de la opción elegida: de quién, cuánto, por qué, cuándo se vio, comisión y salida a la tienda. */
function Ficha({ option, now }: { option: ProductOption; now?: Date }) {
  const href = safeHttpsUrl(option.url);
  const seen = fmtSeenAt(option.seen_at, now);
  return (
    <div className="mt-4 animate-aparecer border-t border-linea pt-3">
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <span className="text-sobretitulo uppercase text-tinta">{option.store_name}</span>
        <span className="flex flex-wrap gap-1.5">
          {option.in_stock === false ? (
            <span className="rounded-insignia bg-falta px-2 py-0.5 text-meta font-bold text-sobre-color">Sin stock</span>
          ) : null}
          {option.affiliate ? (
            <span className="rounded-insignia border-[1.5px] border-linea px-2 py-0.5 text-meta font-bold text-tinta-suave">
              Enlace con comisión
            </span>
          ) : null}
        </span>
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-nombre text-tinta">
        <span className="min-w-0">{option.title}</span>
        <span className="whitespace-nowrap tabular-nums">{fmtCLP(option.price_clp)}</span>
      </p>
      <p className="mt-1 text-cuerpo text-tinta">{option.reason}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-meta text-tinta-suave">
          {seen ? `${seen} · ` : ""}
          {STOCK_NOTICE}.
        </span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel={option.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border-[1.5px] border-linea-fuerte px-4 text-control text-tinta transition-transform duration-150 ease-salida hover:bg-hundido active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-foco"
          >
            Ver en la tienda
            <IconExternal className="size-4" />
          </a>
        ) : (
          <span className="text-meta text-tinta-suave">No pude validar el enlace a la tienda.</span>
        )}
      </div>
    </div>
  );
}
