# Plan — MVP flujo vertical (2026-11-14)

**Rama:** `feat/mvp-flujo-vertical` · **Spec:** `docs/producto/FUNCTIONAL_SPECS.md` (SPEC de RF-01…RF-15) ·
**Contratos:** `docs/producto/TECHNICAL_ARCHITECTURE.md`, `AGENT_ARCHITECTURE.md`, `web/src/lib/domain/types.ts`,
`web/supabase/migrations/20261114000000_esquema_inicial.sql`.

Objetivo: portada → cuenta → onboarding → paleta preliminar → primeras prendas → primer outfit explicado → chat con
el asesor → guardar y feedback → Clóset, Looks y Yo navegables. PWA instalable. Todo verificable con `AI_MODE=mock`.

## Tareas, ejecutor y revisor

| # | Tarea | Archivos (propiedad exclusiva) | Ejecutor | Revisor |
|---|---|---|---|---|
| B1 | Base de servidor: Supabase, proxy, consultas, acciones, IA (visión + agente + mock), endpoints, clima, analítica, utilidades de cliente, tests | `web/src/lib/**`, `web/src/proxy.ts`, `web/src/app/api/**`, `web/tests/**` | Sonnet 5.5 | Integrador (Fable) |
| U1 | Primitivas de UI, shell con barra inferior, portada, entrar, PWA (manifest, íconos, service worker) | `web/src/components/ui/**`, `web/src/app/page.tsx`, `web/src/app/entrar/**`, `web/src/app/(app)/layout.tsx`, `web/src/app/manifest.ts`, `web/public/**` | Sonnet 5.5 | Integrador + Felipe (visual) |
| U2 | Asesor (chat con streaming), tarjeta de look, Looks | `web/src/components/chat/**`, `web/src/components/outfit/**`, `web/src/app/(app)/asesor/**`, `web/src/app/(app)/looks/**` | Sonnet 5.5 | Integrador + Felipe (visual) |
| U3 | Clóset (galería, agregar, detalle), Yo (perfil, paleta, memoria, privacidad) | `web/src/components/closet/**`, `web/src/components/palette/**`, `web/src/app/(app)/closet/**`, `web/src/app/(app)/yo/**` | Sonnet 5.5 | Integrador + Felipe (visual) |
| U4 | Onboarding `/bienvenida` (reusa componentes de U1–U3) | `web/src/components/onboarding/**`, `web/src/app/bienvenida/**` | Sonnet 5.5 | Integrador + Felipe (visual) |
| V | Verificación de punta a punta en navegador con IA simulada y Supabase real | — | Integrador | Felipe |

Orden: B1 y U1 en paralelo → U2 y U3 en paralelo → U4 → V. Nadie edita archivos fuera de su propiedad;
si necesita algo de otro, lo pide al integrador. `web/src/lib/domain/types.ts` es del integrador: B1 puede agregar tipos, no renombrar.

## Interfaz que B1 expone a la UI (nombres vinculantes)

Todas las acciones devuelven `ActionResult = { ok: true } | { ok: false; error: string }` (mensaje en español, listo para mostrar).

| Módulo | Exporta |
|---|---|
| `lib/supabase/server.ts` | `createClient()`, `getSessionUser(): Promise<{ id: string; email: string } \| null>`, `requireUser()` (redirige a `/entrar`) |
| `lib/supabase/client.ts` | `createClient()` (navegador) |
| `lib/data/queries.ts` (solo servidor) | `getProfile()`, `getStyleProfile()`, `getActiveColorAnalysis()`, `listGarments(opts?: { category?: GarmentCategory })`, `getGarment(id)`, `countGarments()`, `listOutfits(opts?: { status?: OutfitStatus })`, `listMemoryFacts()`, `getLatestConversation(): Promise<{ id: string; messages: ChatMessageView[] } \| null>`, `getWeatherForProfile(): Promise<Weather \| null>` |
| `lib/actions/auth.ts` | `signUp(prev, formData)`, `signIn(prev, formData)` (para `useActionState`; campos `email`, `password`), `signOut()` |
| `lib/actions/profile.ts` | `saveProfile(input: { display_name?: string; city?: string } & Partial<Omit<StyleProfile, "user_id">>)`, `completeOnboarding()` |
| `lib/actions/garments.ts` | `updateGarment(id, patch)`, `archiveGarment(id)`, `toggleFavorite(id)` |
| `lib/actions/outfits.ts` | `setOutfitStatus(id, "saved" \| "discarded")`, `rateOutfit(id, rating, reason?)` (un `no` con motivo crea un hecho de memoria) |
| `lib/actions/memory.ts` | `deleteMemoryFact(id)` |
| `lib/actions/color.ts` | `setManualColorSeason(season)` (paleta predefinida por estación, `source: 'manual'`) |
| `lib/actions/privacy.ts` | `deleteMyData()` (borra fotos del bucket, llama al RPC `delete_my_data`, cierra sesión) |
| `lib/client/upload.ts` | `uploadUserImage(file: File, kind: "garments" \| "selfies"): Promise<string>` (comprime y devuelve `photo_path`) |
| `lib/client/api.ts` | `createGarment(photo_path): Promise<GarmentView>`, `createColorAnalysis(photo_path): Promise<ColorAnalysis>`, `streamChat(input: { conversation_id?: string; text: string }, onEvent: (e: ChatEvent) => void, signal?: AbortSignal): Promise<void>` |

## Criterio de terminado

`npm run verify` en verde · flujo completo navegable con `AI_MODE=mock` · con claves reales: una prenda reconocida, una paleta
y un outfit propuesto por el agente · sin errores en consola · revisión visual de Felipe pendiente antes del merge.
