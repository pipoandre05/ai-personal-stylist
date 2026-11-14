import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Un <dialog> cerrado se oculta con la regla del navegador `dialog:not([open]) { display: none }`.
// Una clase de display sin variante (flex, grid, block…) le gana a esa regla y deja el panel visible estando cerrado.
// Pasó con el panel de sesiones (2026-11-14): aparecía una franja "Conversaciones" sobre el encabezado.

const DISPLAY = new Set(["flex", "grid", "block", "inline-flex", "inline-block", "inline-grid", "contents", "table"]);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : [],
  );
}

describe("un diálogo cerrado no se ve", () => {
  const dialogs = files(join(__dirname, "../../src")).flatMap((file) => {
    const src = readFileSync(file, "utf8");
    return [...src.matchAll(/<dialog\b[\s\S]*?className="([^"]*)"/g)].map((m) => ({ file, classes: m[1].split(/\s+/) }));
  });

  it("encuentra los diálogos de la app", () => {
    expect(dialogs.length).toBeGreaterThanOrEqual(3);
  });

  it.each(dialogs.map((d) => [d.file.split("/src/")[1], d.classes] as const))("%s no fija el display sin la variante open:", (_file, classes) => {
    expect(classes.filter((c) => DISPLAY.has(c))).toEqual([]);
  });
});
