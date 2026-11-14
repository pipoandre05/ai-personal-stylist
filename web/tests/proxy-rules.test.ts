import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevPath, isPublicPath, proxyRedirect } from "@/lib/auth/proxy-rules";

describe("reglas del proxy", () => {
  it("rutas públicas", () => {
    for (const p of ["/", "/entrar", "/manifest.webmanifest", "/sw.js", "/icons/icon-192.png", "/_next/static/x.js"]) {
      expect(isPublicPath(p), p).toBe(true);
    }
    for (const p of ["/asesor", "/closet/nueva", "/yo/paleta", "/bienvenida", "/looks"]) {
      expect(isPublicPath(p), p).toBe(false);
    }
  });

  it("sin sesión: protege la app y deja pasar lo público", () => {
    expect(proxyRedirect({ pathname: "/asesor", hasSession: false })).toBe("/entrar");
    expect(proxyRedirect({ pathname: "/bienvenida", hasSession: false })).toBe("/entrar");
    expect(proxyRedirect({ pathname: "/", hasSession: false })).toBeNull();
    expect(proxyRedirect({ pathname: "/entrar", hasSession: false })).toBeNull();
  });

  it("con sesión: /entrar manda a /asesor y el resto pasa", () => {
    expect(proxyRedirect({ pathname: "/entrar", hasSession: true })).toBe("/asesor");
    expect(proxyRedirect({ pathname: "/asesor", hasSession: true })).toBeNull();
    expect(proxyRedirect({ pathname: "/", hasSession: true })).toBeNull();
  });

  it("la API nunca se redirige (responde 401 por sí misma)", () => {
    expect(proxyRedirect({ pathname: "/api/chat", hasSession: false })).toBeNull();
    expect(proxyRedirect({ pathname: "/api/garments", hasSession: true })).toBeNull();
  });

  describe("vistas previas /dev", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("fuera de producción son públicas (sin sesión)", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isPublicPath("/dev/hilo-v2")).toBe(true);
      expect(proxyRedirect({ pathname: "/dev/hilo-v2", hasSession: false })).toBeNull();
      expect(isDevPath("/dev")).toBe(true);
    });

    it("en producción no lo son: el proxy manda a /entrar", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(isPublicPath("/dev/hilo-v2")).toBe(false);
      expect(proxyRedirect({ pathname: "/dev/hilo-v2", hasSession: false })).toBe("/entrar");
    });

    it("no abre rutas parecidas", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isDevPath("/developer")).toBe(false);
      expect(isPublicPath("/developer")).toBe(false);
      expect(isPublicPath("/devx/hilo")).toBe(false);
    });
  });
});
