import { cn } from "@/components/ui/cn";
import { Button, buttonStyles } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";
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
  /** Refinar la búsqueda ("Más baratos"): `intent` tal cual a `streamChat`, `label` es lo que ve la persona. */
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

const SECTION = "rounded-tarjeta bg-superficie p-[18px]";

function optionPhoto(o: ProductOption): string | null {
  return o.image_cutout_url ?? o.image_url;
}

/**
 * Opciones de compra honestas: hasta 3, con tienda, precio en CLP, cuándo se vieron y el aviso de que pueden cambiar,
 * por qué completan el look y si el enlace lleva comisión. "Ver en la tienda" abre la tienda en otra pestaña: nunca va
 * en el color de acción y nunca dice "comprar" (el asesor no compra, DP-09). La opción elegida se dice con palabra.
 */
export function ShoppingOptions({ block, outfit, onSelect, onRefine, busy = false, now, animate = false, className }: ShoppingOptionsProps) {
  const options = block.options.slice(0, 3);
  const selected = options.find((o) => o.id === block.selected_option_id) ?? null;
  const selectedIndex = selected ? options.indexOf(selected) + 1 : 0;
  const refinements = block.refinements;

  if (options.length === 0) {
    return (
      <section aria-label="Opciones para completar el look" className={cn(SECTION, className)}>
        <SearchLine text={searchLine({ searched: block.searched, options })} />
        <p className="mt-3 text-cuerpo text-tinta">
          No encontré {SLOT_WORD[block.slot]} que valga la pena para este look
          {block.budget_max_clp ? ` dentro de ${fmtCLP(block.budget_max_clp)}` : ""}.
        </p>
        <p className="mt-1.5 text-meta text-tinta-suave">
          Prefiero decírtelo a mostrarte algo que no calza con tu clóset o tu tope de gasto. Búsqueda: {block.query}.
        </p>
        <RefineRow refinements={refinements} onRefine={onRefine} busy={busy} />
      </section>
    );
  }

  const seenTimes = options.map((o) => new Date(o.seen_at).getTime()).filter((t) => !Number.isNaN(t));
  const latestSeen = seenTimes.length ? fmtSeenAt(new Date(Math.max(...seenTimes)).toISOString(), now) : "";

  return (
    <section aria-label="Opciones para completar el look" className={cn(SECTION, className)}>
      <SearchLine text={searchLine({ searched: block.searched, options })} />

      {outfit ? <LookStrip block={block} outfit={outfit} selected={selected} selectedIndex={selectedIndex} /> : null}

      <ol className="mt-3 grid grid-cols-3 gap-2">
        {options.map((o, i) => {
          const isSel = o.id === selected?.id;
          return (
            <li
              key={o.id}
              className={cn(animate && "animate-aparecer")}
              style={animate ? { animationDelay: `${i * 70}ms` } : undefined}
            >
              <button
                type="button"
                aria-pressed={isSel}
                disabled={busy || !onSelect}
                onClick={() => onSelect?.(isSel ? null : o.id)}
                className="flex w-full flex-col text-left transition-transform duration-150 ease-salida active:scale-[0.97] disabled:opacity-60"
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
                  {i + 1} · {o.store_name}
                </span>
                <span className="line-clamp-2 text-meta text-tinta">{o.title}</span>
                <span className="text-nombre tabular-nums text-tinta">{fmtCLP(o.price_clp)}</span>
                {o.affiliate ? <span className="text-meta text-tinta-suave">Enlace con comisión</span> : null}
              </button>
            </li>
          );
        })}
      </ol>

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

      <RefineRow refinements={refinements} onRefine={onRefine} busy={busy} />
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
      <p className="mt-1.5 text-meta text-tinta-suave">
        {seen ? `${seen} · ` : ""}
        {STOCK_NOTICE}
      </p>
      <div className="mt-3">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel={option.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
            className={buttonStyles({ variant: "contorno", size: "mediano", fullWidth: true })}
          >
            Ver en la tienda
            <IconExternal className="size-4" />
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        ) : (
          <p className="text-meta text-tinta-suave">No pude validar el enlace de esta tienda, así que no lo muestro.</p>
        )}
      </div>
    </div>
  );
}

function RefineRow({
  refinements,
  onRefine,
  busy,
}: {
  refinements: ShoppingOptionsBlock["refinements"];
  onRefine?: ShoppingOptionsProps["onRefine"];
  busy: boolean;
}) {
  if (refinements.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Ajustar la búsqueda"
      className={cn(
        "-mx-[18px] mt-3 flex gap-2 overflow-x-auto px-[18px] py-1 [scrollbar-width:none]",
        refinements.length > 2 && "[mask-image:linear-gradient(to_right,#000_85%,transparent)]",
      )}
    >
      {refinements.map((r) => (
        <Button
          key={r.id}
          variant="contorno"
          size="mediano"
          disabled={busy || !onRefine}
          onClick={() => onRefine?.(r.intent, r.label)}
          className="shrink-0 whitespace-nowrap"
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
