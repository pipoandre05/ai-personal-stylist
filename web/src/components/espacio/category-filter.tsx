import Link from "next/link";
import { cn, IconCheck } from "@/components/ui";
import { CATEGORY_LABELS_SHORT, type GarmentCategory } from "@/lib/domain/types";

type CategoryFilterProps = {
  /** Categorías que tienen al menos una prenda. */
  available: GarmentCategory[];
  active: GarmentCategory | null;
};

const chipBase =
  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 font-body text-sm font-extrabold transition-[transform,opacity] duration-150 ease-estilo active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-foco";

/** Filtro por categoría vía `?categoria=`: chips con scroll horizontal y tokens de Prendie. */
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
    <nav aria-label="Filtrar por categoría" className="-mx-6 my-4">
      <ul className="flex gap-2 overflow-x-auto px-6 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <li key={i.key} className="shrink-0">
            <Link
              href={i.href}
              replace
              scroll={false}
              aria-current={i.on ? "page" : undefined}
              className={cn(
                chipBase,
                i.on
                  ? "border-inverso bg-inverso text-sobre-inverso"
                  : "border-linea bg-superficie text-tinta hover:bg-hundido",
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
