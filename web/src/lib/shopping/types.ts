// Tipos internos del lector de tiendas. Nada de esto sale del módulo: la frontera hacia el resto de la app es
// `ProductSearch` (product-search.ts) con `ProductCandidate`.

export type Platform = "shopify" | "vtex" | "unknown";

export type Store = {
  /** Dominio exacto (sin esquema ni ruta), en minúsculas. Es la lista blanca: nada fuera de estos dominios se consulta. */
  domain: string;
  /** Nombre visible para la persona. */
  name: string;
  /** La tienda tiene enlace con comisión (DP-10). Falso por defecto; solo se muestra, nunca pesa en el orden. */
  affiliate: boolean;
};

/** Talla de una variante, tal como la entrega la tienda (texto plano). */
export type SizeInfo = { label: string; available: boolean | null };

/** Una ficha leída de una tienda, ya normalizada pero todavía sin puntuar. Todo texto es plano. */
export type RawCandidate = {
  store: Store;
  title: string;
  price_clp: number;
  /** https, mismo dominio de la tienda, sin parámetros de seguimiento. */
  url: string;
  image_url: string | null;
  /** null = la tienda no lo dice. */
  available: boolean | null;
  /** null = la tienda no entregó variantes (no se puede afirmar nada de tallas). */
  sizes: SizeInfo[] | null;
  /** Texto de la tienda usado SOLO para puntuar (tipo, categoría, color, etiquetas). Nunca se muestra ni llega al asesor. */
  attrs: string;
};

export type FailureReason =
  | "robots_disallow"
  | "robots_unreachable"
  | "blocked_host"
  | "timeout"
  | "too_large"
  | "redirect_blocked"
  | "rate_limited"
  | "http_error"
  | "network"
  | "bad_response"
  | "unknown_platform"
  | "budget_exhausted";

export type StoreOutcome =
  | { ok: true; store: Store; platform: Platform; candidates: RawCandidate[]; requests: number }
  | { ok: false; store: Store; reason: FailureReason; requests: number };

/** Lo que el lector registra de una búsqueda (para el rastro y los logs). No incluye contenido de las tiendas. */
export type SearchSummary = {
  stores_queried: number;
  stores_ok: number;
  results: number;
  failed: { domain: string; reason: FailureReason }[];
  requests: number;
};
