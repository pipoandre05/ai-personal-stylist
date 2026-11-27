# AGENTS.md — ai-personal-stylist

> Punto de entrada para cualquier agente de código (Codex, Antigravity, Cursor…).
> La fuente de verdad completa es `CLAUDE.md` (raíz) — leerlo primero.

## Qué es este repo

PWA mobile-first (español de Chile) con un agente de IA de asesoría de imagen y personal shopper:
perfil de estilo, paleta de color, clóset digital y outfits para una ocasión. Piloto, sin producción todavía.
Next.js 16 (App Router) + Tailwind v4 + Supabase (Auth, Postgres con RLS, Storage) + Claude API + Vercel. Código en `web/`.
Producto y decisiones: `docs/producto/` (maestro: `DTR_AI_PERSONAL_STYLIST.md`; decisiones: `DECISION_LOG.md`).

## This is NOT the Next.js you know

Breaking changes respecto al training data. Leer `node_modules/next/dist/docs/`
antes de escribir código. `src/proxy.ts`, NUNCA `middleware.ts`.

## Reglas mínimas innegociables

1. Datos siempre con la sesión de la persona y RLS. Sin service role (DT-02).
2. La clave de Claude y toda llamada de IA viven solo en el servidor. `AI_MODE=mock` para tests y desarrollo sin clave.
3. Fotos en bucket privado, ruta `{user_id}/…`, solo URLs firmadas. Nunca datos personales en HTML, meta, OG ni JSON embebido.
4. El agente nunca ejecuta compras ni pagos (DP-09) y no comenta el cuerpo salvo que la persona lo pida (DP-12).
5. UI: solo tokens y reglas de `DESIGN.MD`. Nunca colores ni fuentes hardcodeadas.
6. `after()` de `next/server` para trabajo post-respuesta — jamás `void (async () => {})()`.
7. Git: rama corta + PR + squash. Nunca push directo a `main` (el pre-push lo bloquea salvo docs-only).
8. Idioma: español; base de datos y eventos de analítica en inglés; commits Conventional en español sin tildes en el resumen.
