"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { IconChevron, IconSpace } from "./icons";
import { Sheet } from "./sheet";

type AppHeaderProps = {
  /** Número de prendas para mostrar junto a "Tu clóset". Quien monta el encabezado lo consulta. */
  closetCount?: number;
};

const LINKS = [
  { href: "/closet", label: "Tu clóset" },
  { href: "/looks", label: "Tus looks" },
  { href: "/yo", label: "Tu perfil y paleta" },
];

/** Encabezado de la conversación: "Estilo" + botón "Tu espacio" que abre una hoja con las vistas de consulta. */
export function AppHeader({ closetCount }: AppHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-fondo/90 pt-seguro backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-2 px-5">
        <span className="font-display text-2xl italic">Estilo</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="-mr-2 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-tinta-suave"
        >
          <IconSpace className="size-5" />
          Tu espacio
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Tu espacio">
        <ul className="divide-y divide-linea border-y border-linea">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center justify-between gap-3 font-display text-2xl"
              >
                <span>{l.label}</span>
                <span className="flex items-center gap-2 font-body text-sm text-tinta-suave">
                  {l.href === "/closet" && closetCount !== undefined
                    ? `${closetCount} ${closetCount === 1 ? "prenda" : "prendas"}`
                    : null}
                  <IconChevron className="size-5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="min-h-11 rounded-sm px-1 text-sm text-tinta-suave underline decoration-1 underline-offset-4"
          >
            Cerrar sesión
          </button>
        </form>
      </Sheet>
    </header>
  );
}
