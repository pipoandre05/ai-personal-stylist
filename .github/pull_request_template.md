## Qué cambia y por qué

<!-- Una o dos frases. El porqué importa más que el qué. -->

## Humo

<!-- Solo si el PR estrena una ruta de API, assets en public/, Storage o una migración.
     Una línea por cosa a probar en el Preview: `ruta o asset → código esperado`. -->

## Checklist previo a producción

**Código**
- [ ] `npm run verify` en verde (lint + tipos + tests)
- [ ] CI de GitHub en verde
- [ ] Rama al día con `main` (merge, no rebase)

**Preview revisado con los ojos**
- [ ] Móvil (375px) y desktop (1280px)
- [ ] Consola del navegador sin errores
- [ ] Si hay UI: `impeccable` ejecutada antes de pedir revisión visual

**Producto**
- [ ] Sin precios ni datos sensibles en HTML, meta tags, OG ni JSON embebido
- [ ] Metadata title/description/OG/canonical (si hay página nueva — skill `seo-fundamentals`)
- [ ] Eventos GA4 disparando en el preview (si aplica — skill `analytics-tracking`)
- [ ] Copy revisado contra la voz de `DESIGN.MD` / `brand/`

**Infraestructura**
- [ ] Migraciones backward-compatible, expand/contract (si aplica — skill `db-migrations`)
- [ ] Migración aplicada en Supabase por Felipe **antes** del merge
- [ ] Variables nuevas en los 3 entornos de Vercel (si aplica)
- [ ] Rutas `/api/` nuevas con `requireAdmin()` o en la allowlist pública a conciencia
- [ ] Sin secretos ni PII en el diff

**Cierre**
- [ ] Revisión visual de Felipe (si hay UI)
- [ ] Tarjeta de ClickUp cerrada / log del vault actualizado
