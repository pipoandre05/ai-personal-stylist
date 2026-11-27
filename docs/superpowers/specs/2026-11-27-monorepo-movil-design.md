# Diseño · Esqueleto del monorepo para la app móvil (A6)

> 2026-11-27 · Estado: **propuesta para aprobación de Felipe** (preguntas del constructor ya respondidas). Contexto completo en `docs/movil/` (01 §2–5, 02 §3–6).
> Base: `origin/main` @ `39916d4`.

## Intención

**Qué se busca:**
- Que la app móvil (Expo) y la web (Next.js) vivan en el mismo repo y compartan lógica pura (el contrato del asesor y el
  parser del chat) sin duplicarla.
- Que el sitio en producción y el equipo de bots sigan funcionando igual.

Es el primer paso de la línea A. Felipe eligió empezar por aquí.

**Qué queda listo:**
- La estructura con un primer módulo compartido de verdad.
- La CI para las tres partes.
- La app vacía corriendo en el simulador iOS.

Todavía no hay pantallas ni API para la app.

## Metas, no-metas y anti-metas

| Metas | No-metas (van en PRs siguientes) | Anti-metas (si pasa, falló aunque funcione) |
|---|---|---|
| Workspaces npm desde la raíz con un solo lockfile | Mover el resto de `lib/domain` a core (fuera de `types.ts`) | Que se rompa el deploy de producción en Vercel |
| `packages/core` con el contrato (`types.ts`) y el parser SSE movidos desde la web, con sus tests | `packages/tokens` | Dos copias de React en `node_modules` |
| `mobile/` en Expo SDK 58 con Expo Router, corriendo en el simulador iOS | Pantallas, auth y la API `v1` (A7) | Que un bot pueda tocar `mobile/` o `packages/` |
| CI que verifica web, core y móvil | Builds en la nube (EAS), Android Studio | Que un cambio solo de **código** móvil redespliegue la web |
| Registrar DT-22 en el DECISION_LOG | Cambios a los SOUL y a la frontera de los bots (A5) | |

## Enfoques considerados

Están en `docs/movil/01-arquitectura.md` §2.

- **A · Monorepo incremental:** `web/` no se mueve. Es mi recomendación.
- **B · Mover a `apps/web`.**
- **C · Repo separado.**

Felipe pidió partir por el monorepo; **este diseño asume A**. B rompe la plomería de los bots y de Vercel sin ganar nada
hoy. C duplica el contrato.

## Diseño

**Dos PRs, en este orden**, para aislar el riesgo de Vercel:

### PR 1 · `feat/monorepo-workspaces`: workspaces + core + CI (sin React Native)

1. **`package.json` en la raíz:**
   - `private: true`, `workspaces: ["web", "packages/*"]` (`mobile` entra en el PR 2).
   - `overrides` de `react` y `react-dom` en la versión exacta que fija la web hoy (19.3.0).
   - `engines.node >= 24.3`.
   - Scripts: `verify` (corre el verify de cada workspace), `verify:web` y `test:core`.
2. **Un solo `package-lock.json` en la raíz.** Se borra `web/package-lock.json`.
3. **`packages/core`** (`@aps/core`; `aps` = ai-personal-stylist):
   - Es un nombre interno: nunca se publica y no depende del nombre comercial (A-05).
   - TypeScript fuente sin build propio: `exports` apunta a `src/index.ts`.
   - Recibe `web/src/lib/chat/sse.ts` y **`web/src/lib/domain/types.ts`** sin cambios de lógica, con el test
     `web/tests/sse.test.ts` y Vitest propio. El parser depende de `CHAT_EVENT_TYPES` y `ChatEvent`, y `types.ts` no
     importa nada, así que se mueve completo. *(Mi decisión, tras la revisión del constructor.)*
   - **`web/src/lib/domain/types.ts` queda como una línea:** `export * from "@aps/core/types"`. Así los ~99 archivos de
     la web que importan `@/lib/domain/types` no cambian, y el diff queda chico.
   - Hoy importan el parser `api/chat/route.ts`, `lib/client/api.ts` y `tests/thread-contract.test.ts`; pasan a
     `@aps/core`.
   - Se elige este par porque es el contrato del asesor más el parser: puro, con tests y lo primero que la app necesita
     para el streaming.
   - Para los bots no cambia nada: `types.ts` sigue vetado por nombre y `packages/**` queda fuera de su frontera.
4. **`web/next.config.ts`:** `transpilePackages: ["@aps/core"]`.
5. **`web/vercel.json`:** `ignoreCommand`, para que Vercel no despliegue si no cambiaron `web/`, `packages/`,
   `package.json` ni `package-lock.json` de la raíz.
   - Con un solo lockfile, agregar una dependencia móvil también redespliega la web. **Se acepta**: es un redespliegue
     inofensivo y además prueba que la web sigue sana. No compensa una detección más fina. *(Mi decisión.)*
   - Por eso el PR 2, que toca el lockfile, sí genera un Preview de la web, y con ese Preview se cumple su criterio.
   - **Instalación:** se espera que Vercel detecte el monorepo e instale desde la raíz. Si el Preview falla en la
     instalación, el plan B es un `installCommand` explícito en `web/vercel.json` (`npm ci` en la raíz).
6. **CI (`.github/workflows/ci.yml`):**
   - `npm ci` en la raíz, con caché sobre `package-lock.json` de la raíz.
   - El job `verify` corre `npm run verify -w web` y `npm run test:core`.
   - Los `paths` suman `packages/**`, `package.json` y `package-lock.json`, en PR y en push a `main`.
   - Los jobs `frontera` y `controles` no cambian.
7. **Hook `pre-push`:** `cd web && npm run verify` pasa a `npm run verify` en la raíz.
8. **Rutas en las instrucciones.** Con workspaces, `next` queda en el `node_modules` de la raíz. Por eso la ruta
   `web/node_modules/next/dist/docs/` pasa a `node_modules/next/dist/docs/` en `CLAUDE.md`, `AGENTS.md` y el SOUL del
   Constructor. El SOUL se regenera con `exportar-equipo.py`.
9. **Bots:**
   - La frontera **no cambia**, así que `mobile/**` y `packages/**` siguen prohibidos para los bots. Esto se verifica.
   - `preparar-carpetas.sh` pasa a correr `npm ci` en la raíz.
   - Las carpetas de la Torre y de la línea 1 necesitan `npm ci` en la raíz después del merge. Se avisa en el PR.
10. **DT-22** en `DECISION_LOG.md`: app nativa con React Native + Expo y monorepo incremental. También se registra la
    decisión de magic link (AR-5), que reemplaza DT-03.

### PR 2 · `feat/app-movil-esqueleto`: la app vacía

1. Crear la app con `create-expo-app` y el template `default@sdk-58` (fijado: el template por defecto puede traer SDK
   57). Luego `reset-project` deja una sola pantalla, y las rutas se mueven a `mobile/src/app/`.
2. `mobile` entra a `workspaces`. `npx expo install --check` debe dar todo alineado. Si Expo pide otra versión exacta de
   React, se ajusta el override de la raíz y se re-verifica la web.
3. **`app.config.ts`:**
   - `APP_VARIANT` con tres valores: `development`, `preview` y `production`.
   - **Bundle IDs provisorios solo para desarrollo** (`cl.aps.app.dev`). El de producción espera A-05.
   - Esquema de deep link provisorio `aps`, que necesita el magic link.
4. **Pantalla única de bienvenida:**
   - Usa los colores y las fuentes de `DESIGN.MD` escritos a mano, porque `packages/tokens` llega después.
   - **Exenta de maqueta (decisión de Felipe, 2026-11-27):** es técnica y nadie la ve fuera del simulador. La regla de
     maqueta aprobada aplica desde la primera pantalla real (MOB-E1-H01). Igual pasa por el design-gate y Felipe la ve
     en una captura.
   - **Nombre visible: "Prendie"** (decisión de Felipe, 2026-11-27), igual que la web hoy. Se cambia en
     `app.config.ts` cuando se cierre A-05.
   - Un test con jest-expo importa `createSSEParser` de `@aps/core`, para probar que el código compartido llega a la app.
5. `mobile` suma su script `verify` (tsc, lint, jest) y un job `verify-mobile` en la CI, con los paths `mobile/**`.
6. **No** se agregan `eas.json` ni builds en la nube. El simulador corre local con `npx expo run:ios` (Xcode 26.6 ya
   está instalado; no hace falta la cuenta de Apple).

## Criterios de aceptación

**PR 1:**
- `npm ci` en la raíz deja **una sola copia** de `react` (`npm ls react` lo verifica).
- `npm run verify -w web` y `test:core` en verde, con los mismos tests que antes, salvo los que se movieron.
- **Preview de Vercel en verde**, y `/entrar` carga en el Preview.
- `next build` no avisa de React duplicado.
- Un commit de prueba que solo toca `docs/` no dispara un deploy de la web.
- `bash agentes/scripts/test-verificar-frontera.sh` en verde. Un cambio simulado en `packages/` aparece como fuera de la
  frontera.

**PR 2:**
- `npx expo-doctor` sin errores.
- La CI `verify-mobile` en verde.
- La app abre en el simulador iPhone 17 Pro. Felipe la ve en una captura (regla: nada de interfaz se declara listo sin
  mostrarlo).
- La web sigue verde en la CI y en Vercel.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Vercel no instala bien desde workspaces | El PR 1 no trae React Native, así que si falla se aísla rápido. Plan B: `installCommand`. Rollback: revertir el PR |
| Se duplica React al sumar Expo | `overrides` y `npm ls react` en la CI del PR 2 |
| Las carpetas de los bots quedan con `node_modules` viejos | Aviso en el PR y `npm ci` en la raíz antes del siguiente encargo |
| La web en Vercel usa Node 26 y la CI usa 24 | Se deja así. Expo soporta 24.3+ y 26+ |
| Protección SSO en las Preview de Vercel | No afecta al esqueleto. Para que la app use una Preview como API hará falta un bypass (se anota para A7) |

## Quién hace qué

- **Construye:** subagentes Sonnet, un PR a la vez, en una worktree desde `origin/main` (el `main` local está atrasado y
  tiene cambios sin commitear).
- **Revisa:** Opus.
- **Felipe:**
  - aprueba este diseño;
  - revisa el Preview de Vercel y la captura del simulador;
  - mergea;
  - cambia la configuración de Vercel solo si el plan B lo exige.

## Lo que queda a criterio del constructor

- Estructura interna de `packages/core` más allá de `src/index.ts`.
- Configuración exacta de ESLint y Vitest por workspace.
- Texto de la pantalla de bienvenida, siempre en la voz de `CLAUDE.md`.
