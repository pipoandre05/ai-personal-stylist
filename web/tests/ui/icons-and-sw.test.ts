import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(__dirname, "../../public");

describe("D-01 / D-07: Íconos de Prendie PWA y Service Worker", () => {
  it("web/public/manifest.json existe y declara la identidad Prendie con maskable y tokens DESIGN.MD", () => {
    const manifestPath = path.join(publicDir, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe("Prendie");
    expect(manifest.short_name).toBe("Prendie");
    expect(manifest.theme_color).toBe("#121412");
    expect(manifest.background_color).toBe("#FAFAFA");
    expect(manifest.start_url).toBe("/asesor");

    const icon512 = manifest.icons.find((i: { sizes: string }) => i.sizes === "512x512");
    expect(icon512).toBeDefined();
    expect(icon512.purpose).toContain("maskable");

    const icon192 = manifest.icons.find((i: { sizes: string }) => i.sizes === "192x192");
    expect(icon192).toBeDefined();
    expect(icon192.purpose).toContain("maskable");
  });

  it("web/public/sw.js invalida la caché con prendie-shell-v1 y lista los assets requeridos", () => {
    const swPath = path.join(publicDir, "sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain('const CACHE = "prendie-shell-v1";');
    expect(content).toContain('"/icon-192.png"');
    expect(content).toContain('"/icon-512.png"');
    expect(content).toContain('"/apple-touch-icon.png"');
    expect(content).toContain('"/favicon.svg"');
    expect(content).toContain('"/favicon.ico"');
  });

  it("los assets canónicos existen y tienen formato binario/svg válido", () => {
    const files = [
      "icon-512.png",
      "icon-192.png",
      "apple-touch-icon.png",
      "favicon.ico",
      "favicon.svg",
      "icon.svg",
    ];

    for (const f of files) {
      const fullPath = path.join(publicDir, f);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(0);
    }

    // Cabecera PNG para icon-512
    const pngBuf = fs.readFileSync(path.join(publicDir, "icon-512.png"));
    expect(pngBuf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(true);

    // Cabecera ICO para favicon.ico (0x0000 0x0001)
    const icoBuf = fs.readFileSync(path.join(publicDir, "favicon.ico"));
    expect(icoBuf.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00]))).toBe(true);
  });
});
