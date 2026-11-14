import { beforeEach, describe, expect, it, vi } from "vitest";
import { clpPrice, imageUrl, productUrl } from "@/lib/shopping/adapters/common";
import { parseShopify } from "@/lib/shopping/adapters/shopify";
import { parseVtex } from "@/lib/shopping/adapters/vtex";
import { isForbiddenHostname, isPrivateAddress, resolvesToPrivate } from "@/lib/shopping/net-guard";
import { clearRobotsCache, getRobots, isAllowed, parseRobots } from "@/lib/shopping/robots";
import { USER_AGENT, safeFetch, type Fetcher } from "@/lib/shopping/safe-fetch";
import { parseStores } from "@/lib/shopping/stores";
import { plainText } from "@/lib/shopping/text";
import { readFixture, store } from "./helpers/shop-fixtures";

const allow = (...hosts: string[]) => new Set(hosts);
const ok = (body = "{}", init: ResponseInit = {}) => new Response(body, { status: 200, ...init });

describe("registro de tiendas (SHOP_STORES)", () => {
  it("sin valor el lector queda apagado", () => {
    expect(parseStores(undefined)).toEqual([]);
    expect(parseStores("")).toEqual([]);
    expect(parseStores(" , ,")).toEqual([]);
  });

  it("acepta dominio, nombre visible y afiliación; afiliación falsa por defecto", () => {
    const s = parseStores("www.hushpuppies.cl, fashionspark.com|Fashion's Park , doite.cl|Doite|afiliado");
    expect(s).toEqual([
      { domain: "www.hushpuppies.cl", name: "Hushpuppies", affiliate: false },
      { domain: "fashionspark.com", name: "Fashion's Park", affiliate: false },
      { domain: "doite.cl", name: "Doite", affiliate: true },
    ]);
  });

  it("descarta IP, localhost, rutas, puertos y duplicados", () => {
    const s = parseStores("127.0.0.1,localhost,10.0.0.5|x,tienda.local,[::1],tienda.cl:8080,ok.cl/ruta,https://ok.cl,ok.cl,intranet.internal");
    expect(s.map((x) => x.domain)).toEqual(["ok.cl"]);
  });

  it("no pasa de 20 tiendas", () => {
    const raw = Array.from({ length: 30 }, (_, i) => `tienda${i}.cl`).join(",");
    expect(parseStores(raw)).toHaveLength(20);
  });
});

describe("defensa de red", () => {
  it("reconoce direcciones privadas, de loopback y reservadas", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.10", "172.16.5.5", "172.31.255.255", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fc00::1", "fe80::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "172.32.0.1", "104.18.0.1", "2606:4700::1"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it("no consulta IP literales, localhost ni nombres internos", () => {
    for (const h of ["localhost", "127.0.0.1", "2130706433", "0x7f.0.0.1", "[::1]", "a.localhost", "db.internal", "tienda", "router.local"]) {
      expect(isForbiddenHostname(h), h).toBe(true);
    }
    expect(isForbiddenHostname("www.hushpuppies.cl")).toBe(false);
  });

  it("un dominio que resuelve a una dirección privada se bloquea", async () => {
    expect(await resolvesToPrivate("tienda.cl", async () => ["10.0.0.4"])).toBe(true);
    expect(await resolvesToPrivate("tienda.cl", async () => ["104.18.0.1", "169.254.169.254"])).toBe(true);
    expect(await resolvesToPrivate("tienda.cl", async () => ["104.18.0.1"])).toBe(false);
    expect(await resolvesToPrivate("tienda.cl", async () => Promise.reject(new Error("nxdomain")))).toBe(true);
  });
});

describe("safeFetch", () => {
  it("no sale a hosts fuera de la lista blanca ni a http", async () => {
    const fetcher = vi.fn<Fetcher>(async () => ok());
    const deps = { allowedHosts: allow("tienda.cl"), fetcher, skipDns: true };
    expect(await safeFetch("https://otra.cl/x", deps)).toEqual({ ok: false, reason: "blocked_host" });
    expect(await safeFetch("http://tienda.cl/x", deps)).toEqual({ ok: false, reason: "blocked_host" });
    expect(await safeFetch("https://user:pw@tienda.cl/x", deps)).toEqual({ ok: false, reason: "blocked_host" });
    expect(await safeFetch("https://tienda.cl:8443/x", deps)).toEqual({ ok: false, reason: "blocked_host" });
    expect(await safeFetch("https://127.0.0.1/x", { ...deps, allowedHosts: allow("127.0.0.1") })).toEqual({ ok: false, reason: "blocked_host" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("bloquea un dominio de la lista que resuelve a una IP privada (DNS)", async () => {
    const fetcher = vi.fn<Fetcher>(async () => ok());
    const r = await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher, resolve: async () => ["192.168.1.20"] });
    expect(r).toEqual({ ok: false, reason: "blocked_host" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("envía un User-Agent honesto, sin cookies ni credenciales", async () => {
    const fetcher = vi.fn<Fetcher>(async () => ok());
    await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher, skipDns: true });
    const init = fetcher.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>)["user-agent"]).toBe(USER_AGENT);
    expect(USER_AGENT).toMatch(/^EstiloShopReader\//);
    expect(init.credentials).toBe("omit");
    expect(init.redirect).toBe("manual");
  });

  it("no sigue redirecciones a otro dominio ni a una IP interna", async () => {
    for (const target of ["https://evil.cl/robots", "https://169.254.169.254/latest/meta-data", "http://tienda.cl/x", "https://sub.tienda.cl/x"]) {
      const fetcher = vi.fn<Fetcher>(async () => new Response(null, { status: 302, headers: { location: target } }));
      const r = await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl", "sub.tienda.cl"), fetcher, skipDns: true });
      expect(r, target).toEqual({ ok: false, reason: "redirect_blocked" });
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });

  it("sigue una redirección al mismo host (con tope) y sirve el contenido", async () => {
    const fetcher = vi.fn<Fetcher>(async (url) => (url.endsWith("/b") ? ok("final") : new Response(null, { status: 301, headers: { location: "/b" } })));
    const r = await safeFetch("https://tienda.cl/a", { allowedHosts: allow("tienda.cl"), fetcher, skipDns: true });
    expect(r).toMatchObject({ ok: true, text: "final" });
    const loop = vi.fn<Fetcher>(async () => new Response(null, { status: 301, headers: { location: "/a" } }));
    expect(await safeFetch("https://tienda.cl/a", { allowedHosts: allow("tienda.cl"), fetcher: loop, skipDns: true })).toMatchObject({ ok: false, reason: "redirect_blocked" });
    expect(loop.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it("corta respuestas demasiado grandes (por cabecera y por flujo)", async () => {
    const byHeader = async () => ok("x", { headers: { "content-length": "5000000" } });
    expect(await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher: byHeader, skipDns: true, maxBytes: 1000 })).toMatchObject({ ok: false, reason: "too_large" });
    const stream = async () => ok("y".repeat(5000));
    expect(await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher: stream, skipDns: true, maxBytes: 1000 })).toMatchObject({ ok: false, reason: "too_large" });
  });

  it("respeta el tiempo máximo aunque la tienda no responda", async () => {
    const hang: Fetcher = (_u, init) => new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("abort"), { name: "AbortError" }))));
    const t0 = Date.now();
    const r = await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher: hang, skipDns: true, signal: AbortSignal.timeout(60) });
    expect(r).toEqual({ ok: false, reason: "timeout" });
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it("distingue 429 (no insistir) y otros errores HTTP", async () => {
    const r429 = await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher: async () => new Response("", { status: 429 }), skipDns: true });
    expect(r429).toMatchObject({ ok: false, reason: "rate_limited" });
    const r500 = await safeFetch("https://tienda.cl/x", { allowedHosts: allow("tienda.cl"), fetcher: async () => new Response("", { status: 503 }), skipDns: true });
    expect(r500).toMatchObject({ ok: false, reason: "http_error", status: 503 });
  });
});

describe("robots.txt", () => {
  beforeEach(() => clearRobotsCache());

  it("aplica la regla más larga y gana Allow en empate; entiende comodines y $", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /search\nAllow: /search/suggest.json\nDisallow: /*.pdf$\nDisallow: /a?*x=");
    expect(isAllowed(rules, "/search?q=a")).toBe(false);
    expect(isAllowed(rules, "/search/suggest.json?q=a")).toBe(true);
    expect(isAllowed(rules, "/doc/a.pdf")).toBe(false);
    expect(isAllowed(rules, "/doc/a.pdf?x=1")).toBe(true);
    expect(isAllowed(rules, "/a?y=1&x=2")).toBe(false);
    expect(isAllowed(rules, "/otra")).toBe(true);
  });

  it("un grupo propio manda sobre `*`", () => {
    const text = "User-agent: *\nAllow: /\n\nUser-agent: EstiloShopReader\nDisallow: /";
    expect(isAllowed(parseRobots(text), "/search/suggest.json")).toBe(false);
    expect(isAllowed(parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: otrobot\nAllow: /"), "/x")).toBe(false);
    expect(isAllowed(parseRobots("User-agent: otrobot\nDisallow: /"), "/x")).toBe(true);
  });

  it("con los robots.txt reales grabados: la ruta de búsqueda de Shopify y la API de VTEX están permitidas", () => {
    const shopify = parseRobots(readFixture("robots__www.hushpuppies.cl.txt"));
    expect(isAllowed(shopify, "/search/suggest.json?q=sandalia&resources[type]=product")).toBe(true);
    expect(isAllowed(shopify, "/cart.js")).toBe(false);
    const vtex = parseRobots(readFixture("robots__www.ellus.cl.txt"));
    expect(isAllowed(vtex, "/api/catalog_system/pub/products/search?ft=sandalia")).toBe(true);
    expect(isAllowed(vtex, "/busca/algo")).toBe(false);
  });

  it("404 = sin restricciones; 5xx o sin respuesta = no se consulta; se cachea", async () => {
    const f404 = vi.fn<Fetcher>(async () => new Response("no", { status: 404 }));
    const a = await getRobots("a.cl", { allowedHosts: allow("a.cl"), fetcher: f404, skipDns: true });
    expect(a.result).toEqual({ ok: true, rules: [] });
    await getRobots("a.cl", { allowedHosts: allow("a.cl"), fetcher: f404, skipDns: true });
    expect(f404).toHaveBeenCalledTimes(1);
    const f500 = async () => new Response("x", { status: 503 });
    const b = await getRobots("b.cl", { allowedHosts: allow("b.cl"), fetcher: f500, skipDns: true });
    expect(b.result).toEqual({ ok: false, reason: "robots_unreachable" });
  });
});

describe("normalización de campos", () => {
  it("el precio es CLP entero: rechaza decimales reales, absurdos y no numéricos", () => {
    expect(clpPrice("19995")).toBe(19995);
    expect(clpPrice("19995.00")).toBe(19995);
    expect(clpPrice(22990.0)).toBe(22990);
    for (const bad of ["49.90", 49.9, "0", "-5", "12", "abc", "", null, undefined, {}, "1e9", 99_999_999_999]) expect(clpPrice(bad), String(bad)).toBeNull();
  });

  it("la URL del producto es https, del mismo dominio y sin parámetros de seguimiento", () => {
    expect(productUrl("t.cl", "/products/x?_pos=1&_psq=a#frag")).toBe("https://t.cl/products/x");
    expect(productUrl("t.cl", "https://t.cl/a/p?utm=1")).toBe("https://t.cl/a/p");
    for (const bad of ["https://otra.cl/products/x", "http://t.cl/x", "//otra.cl/x", "javascript:alert(1)", "https://t.cl.evil.cl/x", "https://u:p@t.cl/x", 5, null]) {
      expect(productUrl("t.cl", bad), String(bad)).toBeNull();
    }
  });

  it("la imagen es https y de un host público", () => {
    expect(imageUrl("//cdn.shopify.com/a.jpg")).toBe("https://cdn.shopify.com/a.jpg");
    for (const bad of ["http://cdn.x.cl/a.jpg", "https://127.0.0.1/a.jpg", "https://localhost/a.jpg", "data:image/png;base64,AAAA", null]) expect(imageUrl(bad), String(bad)).toBeNull();
  });

  it("los títulos son texto plano: sin HTML, sin entidades de marcado, sin control, recortados", () => {
    expect(plainText("<b>Blazer</b> <script>alert(1)</script> lino", 140)).toBe("Blazer alert(1) lino");
    expect(plainText("Blazer &lt;img src=x onerror=alert(1)&gt; &amp; lino&nbsp;beige", 140)).not.toMatch(/[<>]/);
    expect(plainText("a\u0000b‮c​d\n\te", 50)).toBe("a b c d e");
    expect(plainText("x".repeat(500), 140).length).toBeLessThanOrEqual(140);
    expect(plainText(42, 10)).toBe("");
  });
});

describe("adaptadores contra fixtures reales", () => {
  const hush = store("www.hushpuppies.cl");

  it("Shopify: fichas con título, precio CLP entero, url https del mismo dominio e imagen https", () => {
    const items = parseShopify(readFixture("shopify__www.hushpuppies.cl__1.json"), hush)!;
    expect(items.length).toBeGreaterThan(5);
    for (const it of items) {
      expect(Number.isInteger(it.price_clp) && it.price_clp > 500).toBe(true);
      expect(it.url).toMatch(/^https:\/\/www\.hushpuppies\.cl\/products\/[^?#]+$/);
      expect(it.image_url === null || it.image_url.startsWith("https://")).toBe(true);
      expect(it.title).not.toMatch(/[<>]/);
      expect(typeof it.available).toBe("boolean");
    }
    expect(items[0].title).toBe("Sandalia Mujer Tabitha Metalizado");
    expect(items[0].price_clp).toBe(59990);
  });

  it("Shopify: lee las variantes (tallas) cuando la tienda las entrega", () => {
    const items = parseShopify(readFixture("shopify__www.doite.cl__2.json"), store("www.doite.cl"))!;
    const withSizes = items.find((i) => i.sizes);
    expect(withSizes?.sizes?.[0]).toEqual({ label: "Beige / S", available: false });
  });

  it("Shopify: una respuesta que no tiene su forma no es Shopify; una vacía sí lo es", () => {
    expect(parseShopify("<html>no</html>", hush)).toBeNull();
    expect(parseShopify("[]", hush)).toBeNull();
    expect(parseShopify('{"resources":{"results":{"products":[]}}}', hush)).toEqual([]);
  });

  it("Shopify: descarta fichas con precio no CLP, url de otro dominio o sin título", () => {
    const body = JSON.stringify({
      resources: { results: { products: [
        { title: "Bueno", price: "19990", url: "/products/bueno?_pos=1", available: true },
        { title: "Dólares", price: "49.90", url: "/products/usd", available: true },
        { title: "Ajeno", price: "19990", url: "https://evil.cl/products/x", available: true },
        { title: "", price: "19990", url: "/products/sin-titulo" },
        { title: "<img src=x onerror=alert(1)>Con html", price: "19990", url: "/products/html", image: "http://insegura.cl/a.jpg" },
      ] } },
    });
    const items = parseShopify(body, hush)!;
    expect(items.map((i) => i.title)).toEqual(["Bueno", "Con html"]);
    expect(items[1].image_url).toBeNull();
  });

  it("VTEX: precio mínimo con stock, tallas, color e imagen https", () => {
    const items = parseVtex(readFixture("vtex__www.ellus.cl__1.json"), store("www.ellus.cl"))!;
    expect(items.length).toBeGreaterThan(3);
    expect(items[0]).toMatchObject({ title: "Sandalia Maxi Cadena Negro", price_clp: 22990, available: true });
    expect(items[0].url).toBe("https://www.ellus.cl/sandalia_maxi_cadena_negro/p");
    expect(items[0].sizes?.[0]).toEqual({ label: "35", available: true });
    expect(items[0].image_url).toMatch(/^https:\/\//);
  });

  it("VTEX: una lista vacía es válida; algo que no es VTEX no lo es", () => {
    expect(parseVtex("[]", store("www.ellus.cl"))).toEqual([]);
    expect(parseVtex('[{"foo":1}]', store("www.ellus.cl"))).toBeNull();
    expect(parseVtex("{}", store("www.ellus.cl"))).toBeNull();
  });
});
