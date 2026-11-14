"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { signOut } from "@/lib/actions/auth";
import { IconClose } from "./icons";

export type SpaceSummary = {
  closetCount?: number;
  latestGarmentName?: string | null;
  garmentThumbs?: string[];
  looksCount?: number;
  latestLookTitle?: string | null;
  lookThumb?: string | null;
  memoryCount?: number;
  latestMemoryFact?: string | null;
  paletteSeason?: string | null;
  paletteSwatches?: string[];
};

type SpaceSheetProps = {
  open: boolean;
  onClose: () => void;
  summary?: SpaceSummary;
};

/**
 * Hoja inferior "Tu espacio" (UI-15) sobre <dialog> nativo:
 * Cuatro accesos rápidos (clóset, looks, memoria, paleta) con conteos, bajadas
 * y previsualizaciones, foco automático al título y botón de cierre accesible.
 */
export function SpaceSheet({ open, onClose, summary }: SpaceSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const closetCount = summary?.closetCount ?? 0;
  const latestGarment = summary?.latestGarmentName?.trim() || null;
  const garmentThumbs = summary?.garmentThumbs ?? [];

  const looksCount = summary?.looksCount ?? 0;
  const latestLook = summary?.latestLookTitle?.trim() || null;
  const lookThumb = summary?.lookThumb ?? null;

  const memoryCount = summary?.memoryCount ?? 0;
  const latestMemory = summary?.latestMemoryFact?.trim() || null;

  const paletteSeason = summary?.paletteSeason?.trim() || null;
  const paletteSwatches = summary?.paletteSwatches ?? [];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // Enfoque inicial al título accesible
      titleRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="space-sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-app max-h-[90dvh] overflow-y-auto rounded-t-tarjeta bg-superficie px-6 pt-2 pb-seguro text-tinta shadow-flotante backdrop:bg-tinta/40 open:animate-subir"
    >
      {/* Asa decorativa */}
      <span className="mx-auto block h-[5px] w-9 rounded-full bg-linea" aria-hidden="true" />

      {/* Cabecera */}
      <div className="mt-2 flex items-center justify-between">
        <h2
          id="space-sheet-title"
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta outline-none"
        >
          Tu espacio
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-hundido"
        >
          <IconClose className="size-5" />
        </button>
      </div>

      {/* Enlaces de secciones */}
      <nav aria-label="Vistas de Tu espacio" className="mt-2">
        <ul className="divide-y-0">
          {/* Tu clóset */}
          <li>
            <Link
              href="/closet"
              onClick={onClose}
              className="-mx-2 grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-x-3 rounded-insignia border-t border-linea px-2 py-3.5 text-tinta no-underline transition-colors hover:bg-hundido/40 focus-visible:ring-3 focus-visible:ring-foco"
            >
              <div className="min-w-0">
                <h3 className="font-display text-titulo-s font-extrabold tracking-[-0.01em]">
                  Tu clóset
                  {closetCount > 0 ? (
                    <sup className="ml-1 font-body text-meta font-bold text-tinta-suave">
                      {closetCount}
                    </sup>
                  ) : null}
                </h3>
                <span className="mt-1 block truncate font-body text-meta text-tinta-suave">
                  {closetCount > 0
                    ? latestGarment
                      ? `Última: ${latestGarment}`
                      : "Prendas guardadas"
                    : "Aún no hay prendas"}
                </span>
              </div>
              <span className="col-start-2 row-span-2 flex items-center">
                {garmentThumbs.length > 0
                  ? garmentThumbs.slice(0, 3).map((thumb, idx) => (
                      <span
                        key={idx}
                        className="ml-1 flex h-10 w-[34px] items-center justify-center overflow-hidden rounded-insignia bg-hundido p-[3px] first:ml-0"
                      >
                        {thumb.startsWith("http") || thumb.startsWith("/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="size-full rounded-[9px] object-cover" />
                        ) : (
                          <i
                            className="block size-full rounded-[9px]"
                            style={{ backgroundColor: thumb }}
                          />
                        )}
                      </span>
                    ))
                  : null}
              </span>
            </Link>
          </li>

          {/* Tus looks */}
          <li>
            <Link
              href="/looks"
              onClick={onClose}
              className="-mx-2 grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-x-3 rounded-insignia border-t border-linea px-2 py-3.5 text-tinta no-underline transition-colors hover:bg-hundido/40 focus-visible:ring-3 focus-visible:ring-foco"
            >
              <div className="min-w-0">
                <h3 className="font-display text-titulo-s font-extrabold tracking-[-0.01em]">
                  Tus looks
                  {looksCount > 0 ? (
                    <sup className="ml-1 font-body text-meta font-bold text-tinta-suave">
                      {looksCount}
                    </sup>
                  ) : null}
                </h3>
                <span className="mt-1 block truncate font-body text-meta text-tinta-suave">
                  {looksCount > 0 ? latestLook || "Look guardado" : "Aún no guardas looks"}
                </span>
              </div>
              <span className="col-start-2 row-span-2 flex items-center">
                {lookThumb ? (
                  <span className="flex h-10 w-[34px] items-center justify-center overflow-hidden rounded-insignia bg-hundido p-[3px]">
                    {lookThumb.startsWith("http") || lookThumb.startsWith("/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lookThumb} alt="" className="size-full rounded-[9px] object-cover" />
                    ) : (
                      <i
                        className="block size-full rounded-[9px]"
                        style={{ backgroundColor: lookThumb }}
                      />
                    )}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>

          {/* Lo que sé de ti */}
          <li>
            <Link
              href="/yo#memoria"
              onClick={onClose}
              className="-mx-2 grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-x-3 rounded-insignia border-t border-linea px-2 py-3.5 text-tinta no-underline transition-colors hover:bg-hundido/40 focus-visible:ring-3 focus-visible:ring-foco"
            >
              <div className="min-w-0">
                <h3 className="font-display text-titulo-s font-extrabold tracking-[-0.01em]">
                  Lo que sé de ti
                  {memoryCount > 0 ? (
                    <sup className="ml-1 font-body text-meta font-bold text-tinta-suave">
                      {memoryCount}
                    </sup>
                  ) : null}
                </h3>
                <span className="mt-1 block truncate font-body text-meta text-tinta-suave">
                  {memoryCount > 0
                    ? latestMemory || "Preferencia guardada"
                    : "Todavía no te conozco"}
                </span>
              </div>
              <span className="col-start-2 row-span-2 flex items-center" />
            </Link>
          </li>

          {/* Tu paleta */}
          <li>
            <Link
              href="/yo/paleta"
              onClick={onClose}
              className="-mx-2 grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-x-3 rounded-insignia border-t border-linea px-2 py-3.5 text-tinta no-underline transition-colors hover:bg-hundido/40 focus-visible:ring-3 focus-visible:ring-foco"
            >
              <div className="min-w-0">
                <h3 className="font-display text-titulo-s font-extrabold tracking-[-0.01em]">
                  Tu paleta
                </h3>
                <span className="mt-1 block truncate font-body text-meta text-tinta-suave">
                  {paletteSeason ? `${paletteSeason} · orientativa` : "Aún sin calcular"}
                </span>
              </div>
              <span className="col-start-2 row-span-2 flex items-center">
                {paletteSwatches.length > 0 ? (
                  <span className="flex items-center">
                    {paletteSwatches.slice(0, 5).map((hex, idx) => (
                      <i
                        key={idx}
                        className="-ml-[5px] size-3.5 rounded-full ring-2 ring-superficie first:ml-0"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Cerrar sesión */}
      <form action={signOut} className="mt-2 w-full border-t border-linea pt-2">
        <button
          type="submit"
          className="flex min-h-11 w-full items-center justify-center font-body text-control text-tinta-suave transition-colors hover:text-tinta focus-visible:ring-3 focus-visible:ring-foco rounded-full"
        >
          Cerrar sesión
        </button>
      </form>
    </dialog>
  );
}
