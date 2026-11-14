// Defensa de red del lector: qué hosts se pueden tocar. Todo puro salvo `resolvesToPrivate` (consulta DNS).

/** Direcciones IPv4 privadas, de loopback, link-local, CGNAT, multicast o reservadas. */
export function isPrivateIPv4(ip: string): boolean {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (!s.includes(":")) return false;
  if (s === "::" || s === "::1") return true;
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return /^(fc|fd|fe[89ab]|ff)/.test(s) || s.startsWith("::ffff:");
}

export function isPrivateAddress(ip: string): boolean {
  return isPrivateIPv4(ip) || isPrivateIPv6(ip);
}

/** Nombres que nunca se consultan: IP literales (cualquier forma), localhost y sufijos de red interna. */
export function isForbiddenHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!h || h.length > 253) return true;
  if (h.includes(":") || h.startsWith("[")) return true; // IPv6 literal o puerto
  if (/^[0-9.]+$/.test(h) || /^0x[0-9a-f.]+$/i.test(h)) return true; // IPv4 en cualquier notación
  if (!h.includes(".")) return true;
  return h === "localhost" || /\.(localhost|local|internal|lan|home|corp|intranet|test|invalid|example)$/.test(h);
}

export type Resolver = (host: string) => Promise<string[]>;

/** Resolución real con `node:dns`. Se importa al usarla para no romper entornos sin Node. */
export const dnsResolver: Resolver = async (host) => {
  const { lookup } = await import("node:dns/promises");
  const res = await lookup(host, { all: true });
  return res.map((r) => r.address);
};

/**
 * ¿El dominio resuelve a una dirección privada? Mitiga que un dominio de la lista apunte (o pase a apuntar) a la red
 * interna. Es una verificación previa: no fija la IP de la conexión, por eso la lista blanca sigue siendo la defensa principal.
 */
export async function resolvesToPrivate(host: string, resolve: Resolver = dnsResolver): Promise<boolean> {
  try {
    const addrs = await resolve(host);
    return addrs.length === 0 || addrs.some(isPrivateAddress);
  } catch {
    return true; // si no se puede resolver, no se consulta
  }
}
