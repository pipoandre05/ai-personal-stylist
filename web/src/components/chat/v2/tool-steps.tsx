"use client";

import { useId, useState } from "react";
import { cn } from "@/components/ui/cn";
import { IconAlert, IconCheck, IconShirt } from "@/components/ui/icons";
import type { AgentToolName, GarmentCategory, ToolStep, ToolStepItem } from "@/lib/domain/types";
import { IconCalendar, IconChevronDown, IconCloudSun, IconSearch, IconSpark, IconSwatch, IconBookmark } from "./glyphs";
import { lowerFirst, plural } from "./format";
import { PieceImage } from "./piece";

/** Lo que el rastro necesita saber de una prenda para dibujar su miniatura. */
export type GarmentRef = { name: string; photo_url: string | null; category?: GarmentCategory };
export type GarmentLookup = Record<string, GarmentRef>;

export type ToolStepsProps = {
  steps: ToolStep[];
  /** Prendas por `garment_id`, para las miniaturas del paso del clóset. Sin ellas se muestra un marcador. */
  garments?: GarmentLookup;
  /**
   * Con varios pasos y todos terminados el rastro se pliega a una línea de resumen (UX_UI_SPEC §7.7).
   * `true` lo deja abierto de entrada. Mientras hay un paso en curso siempre está abierto.
   */
  defaultOpen?: boolean;
  /** Anima la entrada de cada paso (turno en vivo). El historial no anima. */
  animate?: boolean;
  className?: string;
};

const RUNNING_ICON: Partial<Record<AgentToolName, typeof IconSpark>> = {
  get_weather: IconCloudSun,
  get_closet: IconShirt,
  propose_outfit: IconSpark,
  set_event_summary: IconCalendar,
  search_products: IconSearch,
  add_garment: IconShirt,
  analyze_palette: IconSwatch,
  remember: IconBookmark,
  update_profile: IconBookmark,
};

const MAX_THUMBS = 8;

/** Texto de la línea plegada: "Miré el clima · revisé tu clóset · armé el look". */
export function summarizeSteps(steps: ToolStep[]): string {
  const done = steps.filter((s) => s.status === "done").map((s, i) => (i === 0 ? s.label_done : lowerFirst(s.label_done)));
  const failed = steps.filter((s) => s.status === "error").length;
  const parts = [...done];
  if (failed) parts.push(`${plural(failed, "paso", "pasos")} no se ${failed === 1 ? "pudo" : "pudieron"} completar`);
  return parts.join(" · ");
}

/**
 * Rastro de pasos del asesor. Queda en el hilo, en pasado y con su dato (principio 5). Cada paso está en curso
 * (rótulo en gerundio con tres puntos que respiran), hecho (rótulo en pasado + detalle) o con error (rótulo y aviso
 * con palabras: nunca solo color). El paso del clóset trae miniaturas con las prendas elegidas marcadas.
 */
export function ToolSteps({ steps, garments, defaultOpen, animate = false, className }: ToolStepsProps) {
  const listId = useId();
  const [userOpen, setUserOpen] = useState<boolean | null>(defaultOpen ?? null);
  if (steps.length === 0) return null;

  const running = steps.some((s) => s.status === "running");
  const collapsible = steps.length > 1 && !running;
  const open = !collapsible || (userOpen ?? false);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setUserOpen(!open)}
          className="-my-2.5 inline-flex min-h-11 items-center gap-2 self-start text-left text-meta font-bold text-tinta-suave"
        >
          <IconCheck className="size-4 shrink-0 text-exito" />
          <span>{summarizeSteps(steps) || "Lo que hice"}</span>
          <IconChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200 ease-salida motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </button>
      ) : null}
      <ol
        id={listId}
        aria-label="Lo que hice"
        hidden={!open}
        className="ml-2.5 flex flex-col gap-3.5 border-l-[1.5px] border-linea py-0.5 pl-[22px]"
      >
        {steps.map((step) => (
          <StepRow key={step.id} step={step} garments={garments} animate={animate} />
        ))}
      </ol>
    </div>
  );
}

function StepRow({ step, garments, animate }: { step: ToolStep; garments?: GarmentLookup; animate: boolean }) {
  const RunIcon = RUNNING_ICON[step.tool] ?? IconSpark;
  const state = step.status;

  return (
    <li className={cn("relative", animate && "animate-aparecer")}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute -left-[34px] -top-px grid size-[22px] place-items-center rounded-full bg-fondo ring-[1.5px] ring-inset",
          state === "running" && "text-tinta ring-linea-fuerte",
          state === "done" && "text-exito ring-linea",
          state === "error" && "text-error ring-linea",
        )}
      >
        {state === "done" ? (
          <IconCheck className="size-3.5" />
        ) : state === "error" ? (
          <IconAlert className="size-3.5" />
        ) : (
          <RunIcon className="size-3.5" />
        )}
      </span>

      {state === "running" ? (
        <div role="status">
          <span className="block text-control text-tinta-suave">
            {step.label_running}
            <span aria-hidden="true" className="ml-1.5 inline-flex gap-[3px] align-middle">
              <Dot />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
          </span>
        </div>
      ) : state === "done" ? (
        <>
          <span className="block text-control text-tinta">{step.label_done}</span>
          {step.detail ? <span className="mt-0.5 block text-meta text-tinta-suave">{step.detail}</span> : null}
        </>
      ) : (
        <>
          <span className="block text-control text-tinta-suave">{step.label_running}</span>
          <span className="mt-0.5 block text-meta text-tinta-suave">
            <span className="font-bold text-error">No se pudo completar.</span>
            {step.detail ? ` ${step.detail}.` : ""}
          </span>
        </>
      )}

      {state !== "running" && step.items && step.items.length > 0 ? (
        <ClosetThumbs items={step.items} garments={garments} animate={animate} />
      ) : null}
    </li>
  );
}

function Dot({ delay }: { delay?: string }) {
  return (
    <i
      className="block size-1 rounded-full bg-tinta animate-respirar motion-reduce:animate-none motion-reduce:opacity-60"
      style={delay ? { animationDelay: delay } : undefined}
    />
  );
}

/** Miniaturas de las prendas consideradas; las que el asesor usó, primero y marcadas con anillo (y dichas con palabras). */
function ClosetThumbs({ items, garments, animate }: { items: ToolStepItem[]; garments?: GarmentLookup; animate: boolean }) {
  const ordered = [...items].sort((a, b) => Number(b.chosen) - Number(a.chosen));
  const shown = ordered.slice(0, MAX_THUMBS);
  const rest = ordered.length - shown.length;
  const chosenCount = items.filter((i) => i.chosen).length;

  return (
    <div className="mt-2">
      <ul aria-label="Prendas que revisé" className="flex flex-wrap gap-1.5">
        {shown.map((it, i) => {
          const g = garments?.[it.garment_id];
          const name = g?.name ?? "Prenda";
          return (
            <li
              key={it.garment_id}
              className={cn(
                "grid size-[34px] place-items-center rounded-insignia bg-hundido",
                it.chosen ? "ring-[1.5px] ring-inset ring-linea-fuerte" : "opacity-50",
                animate && "animate-aparecer",
              )}
              style={animate ? { animationDelay: `${i * 40}ms` } : undefined}
            >
              <span className="size-[76%]">
                <PieceImage src={g?.photo_url} alt={it.chosen ? `${name}, elegida` : name} category={g?.category} shadow />
              </span>
            </li>
          );
        })}
        {rest > 0 ? (
          <li className="grid h-[34px] min-w-[34px] place-items-center rounded-insignia bg-hundido px-1.5 text-meta font-bold text-tinta-suave">
            +{rest}
          </li>
        ) : null}
      </ul>
      {chosenCount > 0 && chosenCount < items.length ? (
        <p className="mt-1.5 text-meta text-tinta-suave">Las marcadas son las que usé.</p>
      ) : null}
    </div>
  );
}
