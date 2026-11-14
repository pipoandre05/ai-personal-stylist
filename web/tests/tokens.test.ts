import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Gate de tokens. Tailwind calla cuando una clase usa un token que no existe (no genera CSS, no avisa).
 * (a) Toda clase de utilidad que depende de un token propio existe en el @theme de globals.css.
 * (b) Los pares texto/fondo que DESIGN.MD declara obligatorios cumplen su contraste mínimo WCAG,
 *     y los ratios publicados en DESIGN.MD coinciden con los que salen de globals.css.
 */

const ROOT = path.resolve(__dirname, "..");
const CSS = readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");
const DESIGN = readFileSync(path.resolve(ROOT, "../DESIGN.MD"), "utf8");

// ---------- globals.css ----------

function themeBlocks(css: string): string {
  const out: string[] = [];
  const re = /@theme(?:\s+inline)?\s*\{/g;
  while (re.exec(css)) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    out.push(css.slice(re.lastIndex, i - 1));
  }
  return out.join("\n");
}

const THEME = themeBlocks(CSS);
const vars = new Map<string, string>();
for (const m of THEME.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) vars.set(m[1], m[2].trim());

const names = (prefix: string): Set<string> => {
  const s = new Set<string>();
  for (const k of vars.keys()) {
    if (k.startsWith(`--${prefix}-`) && k !== `--${prefix}-*`) s.add(k.slice(prefix.length + 3));
  }
  return s;
};
const colors = names("color");
const radii = names("radius");
const shadows = names("shadow");
const fonts = names("font");
const eases = names("ease");
const animates = names("animate");
const containers = names("container");
// --text-titulo--line-height no es un nombre de clase: solo el nombre base.
const textStyles = new Set([...names("text")].filter((n) => !n.includes("--")));
const utilities = new Set([...CSS.matchAll(/@utility\s+([a-z0-9-]+)/g)].map((m) => m[1]));

function resolveColor(name: string, seen = new Set<string>()): string {
  const v = vars.get(`--color-${name}`);
  if (!v) throw new Error(`color sin definir: ${name}`);
  const ref = v.match(/^var\(--color-([a-z0-9-]+)\)$/);
  if (ref) {
    if (seen.has(name)) throw new Error(`alias circular: ${name}`);
    seen.add(name);
    return resolveColor(ref[1], seen);
  }
  return v;
}

// ---------- clases usadas ----------

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

function stringLiterals(src: string): string[] {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
  return [...noComments.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
}

type Use = { cls: string; file: string };
function collectClasses(): Use[] {
  const uses: Use[] = [];
  for (const file of walk(path.join(ROOT, "src"))) {
    for (const lit of stringLiterals(readFileSync(file, "utf8"))) {
      for (const raw of lit.split(/\s+/)) {
        if (!raw) continue;
        uses.push({ cls: raw, file: path.relative(ROOT, file) });
      }
    }
  }
  return uses;
}

const NUM = /^\d+(\.\d+)?$/;
const arbitrary = (s: string) => s.startsWith("[") || s.startsWith("(");
const SPECIAL_COLOR = new Set(["transparent", "current", "inherit"]);
const isColor = (n: string) => colors.has(n) || SPECIAL_COLOR.has(n);

/** Devuelve un mensaje si la clase usa un token propio inexistente; undefined si está bien o no es de tokens. */
function check(cls: string): string | undefined {
  // quita variantes (hover:, md:, data-[x]:, group-open:) y el prefijo !
  let c = cls.replace(/^(?:[^\s:[]*(?:\[[^\]]*\])?[^\s:[]*:)+/, "").replace(/^!/, "").replace(/!$/, "");
  const neg = c.startsWith("-");
  if (neg) c = c.slice(1);
  if (!/^[a-z][a-z0-9-]*(\/[\w.[\]%]+)?(-?\[.*\])?$/.test(c) && !/^[a-z][a-z0-9-]*\/[\w.]+$/.test(c)) return undefined;
  // quita modificador de opacidad /50
  const base = c.replace(/\/[\w.[\]%]+$/, "");
  if (/-[[(]/.test(base)) return undefined;

  const m = base.match(/^(bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|shadow|rounded|font|animate|ease|divide|placeholder|accent|caret|max-w|pt|pb|pl|pr|px|py|top|bottom)(?:-(.+))?$/);
  if (!m) return undefined;
  const [, p, rest = ""] = m;
  const ko = (kind: string) => `${kind}: ${cls}`;

  switch (p) {
    case "bg":
      if (!rest) return undefined;
      if (
        /^(none|fixed|local|scroll|clip-|origin-|repeat|no-repeat|top|bottom|left|right|center|cover|contain|auto|gradient|linear|radial|conic|blend-|size-|position-|image|linear-to-)/.test(rest) ||
        NUM.test(rest)
      )
        return undefined;
      return isColor(rest) ? undefined : ko("color bg");
    case "text":
      if (!rest) return undefined;
      if (/^(xs|sm|base|lg|xl|\dxl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip|shadow)/.test(rest)) return undefined;
      return isColor(rest) || textStyles.has(rest) ? undefined : ko("color/texto");
    case "border":
      if (!rest) return undefined;
      if (/^([tblrxyse]|solid|dashed|dotted|double|hidden|none|collapse|separate|spacing|opacity)(-|$)/.test(rest) || NUM.test(rest)) {
        // border-t-linea: el lado seguido de color
        const sideColor = rest.match(/^[tblrxyse]-(.+)$/);
        if (sideColor && !NUM.test(sideColor[1]) && !arbitrary(sideColor[1])) return isColor(sideColor[1]) ? undefined : ko("color border");
        return undefined;
      }
      return isColor(rest) ? undefined : ko("color border");
    case "ring":
    case "outline":
    case "stroke":
    case "decoration":
    case "divide":
    case "placeholder":
    case "accent":
    case "caret":
    case "fill":
    case "from":
    case "via":
    case "to": {
      if (!rest) return undefined;
      if (NUM.test(rest) || /^(inset|offset|none|hidden|dashed|dotted|double|solid|auto|from-font|x|y|reverse|current|image|\d+%)/.test(rest) || /%$/.test(rest)) return undefined;
      if (p === "to" || p === "from" || p === "via") if (/^[a-z]+-\d/.test(rest)) return undefined;
      return isColor(rest) ? undefined : ko(`color ${p}`);
    }
    case "shadow":
      if (!rest) return undefined;
      if (shadows.has(rest) || ["sm", "md", "lg", "xl", "2xl", "xs", "2xs", "none", "inner"].includes(rest)) return undefined;
      return isColor(rest) ? undefined : ko("sombra");
    case "rounded": {
      if (!rest) return undefined;
      const sizeToken = rest.replace(/^(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)(-|$)/, "");
      if (sizeToken === "" ) return undefined;
      if (["full", "none", "xl", "2xl", "3xl", "4xl"].includes(sizeToken) || radii.has(sizeToken)) return undefined;
      return ko("radio");
    }
    case "font":
      if (!rest) return undefined;
      if (/^(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono|stretch|variation|features|smoothing)/.test(rest)) return undefined;
      return fonts.has(rest) ? undefined : ko("fuente");
    case "animate":
      if (!rest) return undefined;
      if (["none", "spin", "ping", "pulse", "bounce"].includes(rest)) return undefined;
      return animates.has(rest) ? undefined : ko("animación");
    case "ease":
      if (!rest) return undefined;
      if (["linear", "in", "out", "in-out", "initial"].includes(rest)) return undefined;
      return eases.has(rest) ? undefined : ko("curva");
    case "max-w":
      if (!rest) return undefined;
      if (NUM.test(rest) || /^(none|full|screen|min|max|fit|prose|px|xs|sm|md|lg|xl|\dxl|\d+\/\d+|dvw|lvw|svw|dvh|lvh|svh|lh)/.test(rest)) return undefined;
      return containers.has(rest) ? undefined : ko("contenedor");
    case "pt":
    case "pb":
    case "pl":
    case "pr":
    case "px":
    case "py":
    case "top":
    case "bottom": {
      // solo las utilidades propias (nombre en español terminado en seguro/barra)
      if (!/(seguro|barra)$/.test(rest)) return undefined;
      return utilities.has(`${p}-${rest}`) ? undefined : ko("utilidad propia");
    }
  }
  return undefined;
}

describe("(a) toda clase de token usa un token que existe en @theme", () => {
  const uses = collectClasses();
  const bad = new Map<string, Set<string>>();
  for (const u of uses) {
    const msg = check(u.cls);
    if (msg) {
      if (!bad.has(msg)) bad.set(msg, new Set());
      bad.get(msg)!.add(u.file);
    }
  }

  it("el parser de @theme encuentra los tokens base", () => {
    expect(colors.has("fondo")).toBe(true);
    expect(colors.has("tinta")).toBe(true);
    expect(fonts.has("display")).toBe(true);
  });

  it("no hay clases con tokens inexistentes", () => {
    const report = [...bad].map(([k, files]) => `  ${k}   (${[...files].join(", ")})`);
    expect(report, `Clases que no generan CSS:\n${report.join("\n")}`).toEqual([]);
  });

  it("detecta una clase inventada (el gate no es ciego)", () => {
    expect(check("bg-granate")).toBeDefined();
    expect(check("hover:text-acento-inventado")).toBeDefined();
    expect(check("bg-white")).toBeDefined();
    expect(check("rounded-pildora")).toBeDefined();
    expect(check("bg-fondo")).toBeUndefined();
    expect(check("md:bg-fondo/90")).toBeUndefined();
  });

  it("la lista de alias transitorios no tiene alias circulares ni sin resolver", () => {
    for (const c of colors) expect(resolveColor(c)).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

// ---------- contraste ----------

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(fg: string, bg: string): number {
  const a = lum(resolveColor(fg));
  const b = lum(resolveColor(bg));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Pares obligatorios de DESIGN.MD §1: [texto, fondo, mínimo]. Texto >= 4.5; no-texto (foco) >= 3.
const REQUIRED: [string, string, number][] = [
  ["tinta", "fondo", 4.5],
  ["tinta", "superficie", 4.5],
  ["tinta", "hundido", 4.5],
  ["tinta-suave", "fondo", 4.5],
  ["tinta-suave", "superficie", 4.5],
  ["tinta-suave", "hundido", 4.5],
  ["sobre-inverso", "inverso", 4.5],
  ["sobre-inverso-suave", "inverso", 4.5],
  ["sobre-color", "accion", 4.5],
  ["sobre-color", "memoria", 4.5],
  ["sobre-color", "falta", 4.5],
  ["sobre-estado", "exito", 4.5],
  ["sobre-estado", "error", 4.5],
  ["exito", "fondo", 4.5],
  ["error", "fondo", 4.5],
  ["foco", "fondo", 3],
  ["foco", "inverso", 3],
];
// Pares prohibidos (DESIGN.MD marca ✗): lima y naranja nunca como texto sobre claro.
const FORBIDDEN_AS_TEXT: [string, string][] = [
  ["accion", "fondo"],
  ["falta", "superficie"],
];

describe("(b) contraste WCAG de los pares de DESIGN.MD", () => {
  for (const [fg, bg, min] of REQUIRED) {
    it(`${fg} / ${bg} >= ${min}`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
    });
  }

  it("lima y naranja no sirven como texto sobre claro (por eso son solo superficies)", () => {
    for (const [fg, bg] of FORBIDDEN_AS_TEXT) expect(ratio(fg, bg)).toBeLessThan(3);
  });

  it("los ratios publicados en DESIGN.MD coinciden con globals.css", () => {
    const rows = [...DESIGN.matchAll(/\|\s*([a-z-]+) \/ ([a-z-]+)\s*\|\s*([0-9]+\.[0-9]+)/g)];
    expect(rows.length).toBeGreaterThanOrEqual(10);
    // la segunda columna de cada fila también
    const rows2 = [...DESIGN.matchAll(/\|\s*[0-9.]+\s*\|\s*([a-z-]+) \/ ([a-z-]+)\s*\|\s*([0-9]+\.[0-9]+)/g)];
    for (const [, fg, bg, published] of [...rows, ...rows2]) {
      expect(Math.abs(ratio(fg, bg) - Number(published)), `${fg}/${bg}`).toBeLessThan(0.01);
    }
  });

  it("los alias transitorios de texto siguen siendo legibles sobre las superficies donde se usan hoy", () => {
    for (const bg of ["fondo", "superficie", "hundido"]) {
      for (const fg of ["acento", "alerta", "exito", "error"]) {
        expect(ratio(fg, bg), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(ratio("alerta", "alerta-suave")).toBeGreaterThanOrEqual(4.5);
    expect(ratio("exito", "exito-suave")).toBeGreaterThanOrEqual(4.5);
    expect(ratio("error", "error-suave")).toBeGreaterThanOrEqual(4.5);
    expect(ratio("superficie", "acento")).toBeGreaterThanOrEqual(4.5);
  });
});
