import { TOOL_STATUS_LABELS, type AgentToolName } from "@/lib/domain/types";

/** "Pensando": siempre dice qué hace el asesor. Tres puntos que respiran + etiqueta. */
export function ToolStatus({ tool }: { tool: AgentToolName | null }) {
  const label = (tool && TOOL_STATUS_LABELS[tool]) || "Pensando…";
  return (
    <div role="status" className="flex items-center gap-3 text-sm text-tinta-suave">
      <span aria-hidden="true" className="flex items-center gap-1">
        <span className="size-1.5 animate-respirar rounded-full bg-acento" />
        <span className="size-1.5 animate-respirar rounded-full bg-acento [animation-delay:150ms]" />
        <span className="size-1.5 animate-respirar rounded-full bg-acento [animation-delay:300ms]" />
      </span>
      {/* La etiqueta se vuelve a montar al cambiar: entra con un fundido corto. */}
      <span key={label} className="animate-aparecer">
        {label}
      </span>
    </div>
  );
}
