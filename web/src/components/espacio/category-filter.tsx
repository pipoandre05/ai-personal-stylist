import Link from "next/link";
import { cn, IconCheck } from "@/components/ui";
import { CATEGORY_LABELS_SHORT, type GarmentCategory } from "@/lib/domain/types";

type CategoryFilterProps = {
  /** Categorías que tienen al menos una prenda. */
  available: GarmentCategory[];
  active: GarmentCategory | null;
};

const chip =
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.97]";

/** Filtro por categoría vía `?categoria=`: enlaces reales, así el filtro se comparte y el botón Atrás lo respeta. */
export function CategoryFilter({ available, active }: CategoryFilterProps) {
  const items: Array<{ key: string; href: string; label: string; on: boolean }> = [
    { key: "todo", href: "/closet", label: "Todo", on: active === null },
    ...available.map((c) => ({
      key: c,
      href: `/closet?categoria=${c}`,
      label: CATEGORY_LABELS_SHORT[c],
      on: active === c,
    })),
  ];

  return (
    <nav aria-label="Filtrar por categoría" className="-mx-5">
      <ul className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <li key={i.key} className="shrink-0">
            <Link
              href={i.href}
              replace
              scroll={false}
              aria-current={i.on ? "page" : undefined}
              className={cn(
                chip,
                i.on ? "border-acento bg-acento-suave text-acento" : "border-transparent bg-hundido text-tinta",
              )}
            >
              {i.on ? <IconCheck className="size-4" /> : null}
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
