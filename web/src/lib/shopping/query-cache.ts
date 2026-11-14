// Caché corta en memoria de resultados por consulta: evita golpear a las tiendas cuando la persona repite o refina
// una búsqueda en pocos minutos. No guarda catálogo: solo el resultado ya filtrado (≤ 3 fichas) de una consulta,
// con su hora real de lectura, y vence solo.

export class TtlCache<V> {
  private map = new Map<string, { at: number; value: V }>();
  constructor(
    private ttlMs: number,
    private maxEntries: number,
  ) {}

  get(key: string, now = Date.now()): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (now - hit.at > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V, now = Date.now()): void {
    if (this.map.size >= this.maxEntries) {
      for (const [k, v] of this.map) if (now - v.at > this.ttlMs) this.map.delete(k);
      const oldest = this.map.keys().next().value;
      if (this.map.size >= this.maxEntries && oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { at: now, value });
  }

  clear(): void {
    this.map.clear();
  }
}
