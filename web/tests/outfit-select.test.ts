import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OUTFIT_SELECT } from "@/lib/data/mappers";

const dir = path.resolve(__dirname, "../supabase/migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(dir, f), "utf8"))
  .join("\n");

/** Cuenta las FK entre dos tablas (simples y compuestas) leyendo las migraciones. */
function relationCount(from: string, to: string): number {
  const simple = new RegExp(`create table if not exists public\\.${from} \\(([\\s\\S]*?)\\n\\);`).exec(sql)?.[1] ?? "";
  const simpleFks = (simple.match(new RegExp(`references public\\.${to} \\(`, "g")) ?? []).length;
  const alters = new RegExp(`alter table public\\.${from} add constraint \\w+\\s+foreign key \\([^)]*\\) references public\\.${to} `, "g");
  return simpleFks + (sql.match(alters) ?? []).length;
}

describe("embeds de PostgREST de OUTFIT_SELECT", () => {
  // Regresión PGRST201: la migración 2 sumó FK compuestas (id, user_id) junto a las simples y cada embed
  // sin nombre de restricción quedó ambiguo, así que el look nunca llegaba a la interfaz.
  it.each([
    ["outfit_items", "outfits"],
    ["outfit_items", "garments"],
    ["outfit_feedback", "outfits"],
  ])("%s -> %s tiene más de una FK en las migraciones", (from, to) => {
    expect(relationCount(from, to)).toBeGreaterThan(1);
  });

  it.each(["outfit_items", "garments", "outfit_feedback"])("el embed de %s nombra su restricción con !", (table) => {
    expect(OUTFIT_SELECT).toMatch(new RegExp(`${table}!\\w+_fkey\\(`));
  });
});
