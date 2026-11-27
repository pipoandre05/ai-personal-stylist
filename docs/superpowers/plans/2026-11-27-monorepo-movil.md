# Esqueleto del monorepo móvil · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `web/`, un paquete `packages/core` con el contrato del asesor y una app Expo vacía convivan en un monorepo npm, con CI para las tres partes y sin romper el deploy de Vercel ni al equipo de bots.

**Architecture:**
- Monorepo incremental: `web/` no se mueve. Se agregan un `package.json` raíz con workspaces, `packages/core` y `mobile/`.
- Va en dos PRs:
  - **PR 1** (tareas 1–4): workspaces, core y CI, sin React Native.
  - **PR 2** (tareas 5–7): la app.
- Core es TypeScript fuente sin build: Next lo transpila con `transpilePackages` y Metro y Jest lo resuelven por el workspace.

**Tech Stack:** npm 11 workspaces · Node 24 (local 24.14; Vercel 26.x) · Next.js 16.4.6 · React 19.3.0 · Vitest 5 · Expo SDK 58 (RN 0.88, Expo Router ~58) · jest-expo (Jest 30) · GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-27-monorepo-movil-design.md` (contexto en `docs/movil/01-arquitectura.md` y `02-guia-entorno-expo.md`).

## Global Constraints

- **Base:** cada PR sale de `origin/main` en una worktree (`superpowers:using-git-worktrees`), nunca del `main` local (está atrasado y tiene cambios sin commitear de otro trabajo).
- **Ramas:** `feat/monorepo-workspaces` (PR 1) y `feat/app-movil-esqueleto` (PR 2, desde `main` después del merge del PR 1). Se actualizan con merge, nunca rebase.
- **Commits:** Conventional, en español, sin tildes en el resumen. Al final, el trailer de co-autoría que indique la sesión.
- **Nombres:**
  - Paquete interno `@aps/core`.
  - Bundle IDs `cl.aps.app.dev` y `cl.aps.app.preview`.
  - Esquema de deep link `aps`.
  - Nombre visible **"Prendie"**.
  - **No** se define un bundle ID de producción (espera A-05).
- **React:** una sola versión exacta en todo el repo: 19.3.0, o la que exija `npx expo install --check` en el PR 2. Se fija con `overrides` en la raíz.
- **Prohibido en estos PRs:**
  - `eas.json`, builds de EAS y cuentas o credenciales;
  - cambios a la frontera de los bots (`verificar-frontera.sh`);
  - mover a core otros módulos de `lib/domain` que no sean `types.ts`;
  - service role, claves de IA y `AI_MODE=live`.
- **Dependencias:** solo las del template de Expo y las que el plan nombra. Si el freno (`.claude/hooks/freno.sh`) bloquea una instalación, **detenerse y pedirle autorización a Felipe**. Nunca saltar el freno.
- **Interfaz:** la única pantalla (tarea 6) está exenta de maqueta por decisión de Felipe. Igual pasa por el design-gate (leer `DESIGN.MD` y `docs/producto/UX_UI_SPEC.md`). Solo usa colores y fuentes de `DESIGN.MD` y tutea, sin emoji.
- **Fuera de alcance de los bots:** `mobile/**` y `packages/**` siguen fuera de su frontera.

## Review Focus

1. **Clon limpio:** `npm ci` en la raíz y luego `cd web && npm run dev` / `npm run verify` funcionan igual que antes. Las carpetas de los bots trabajan así. Lo prueba la tarea 2, paso 6.
2. **Vercel instala desde la raíz** y el Preview sirve `/entrar`. No hay test local que lo pruebe: lo verifica la tarea 4.
3. **React duplicado** al sumar Expo. Lo controla el script `check:react` (tarea 1), que corre en la CI (tareas 2 y 7).
4. **Frontera de los bots:** un cambio en `packages/core/…` o en `mobile/…` sale como fuera de la frontera. Lo prueba un caso nuevo en el test de la tarea 2.
5. **El `ignoreCommand` de Vercel:** un cambio solo en `mobile/src` no despliega la web, y un cambio en `package-lock.json` sí. Lo prueba la tarea 2, paso 4, con ramas de prueba locales.

---

## PR 1 · `feat/monorepo-workspaces`

### Task 1: Workspaces y `@aps/core` con el contrato y el parser SSE

**Files:**
- Create: `package.json` (raíz), `package-lock.json` (raíz, generado), `scripts/check-single-react.mjs`, `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.mts`, `packages/core/src/index.ts`
- Move (con `git mv`, sin cambiar lógica): `web/src/lib/domain/types.ts` → `packages/core/src/types.ts` · `web/src/lib/chat/sse.ts` → `packages/core/src/sse.ts` · `web/tests/sse.test.ts` → `packages/core/tests/sse.test.ts`
- Create (shim): `web/src/lib/domain/types.ts`
- Modify: `web/src/app/api/chat/route.ts:9`, `web/src/lib/client/api.ts:1`, `web/tests/thread-contract.test.ts:3`, `web/next.config.ts`, `.gitignore` (raíz)
- Delete: `web/package-lock.json`

**Interfaces:**
- Produces:
  - `@aps/core` exporta `encodeSSE(event: ChatEvent): string`, `createSSEParser(onEvent: (e: ChatEvent) => void): { push(chunk: string): void; flush(): void }` (firmas actuales, sin cambios) y `export * from "./types"`.
  - Subruta `@aps/core/types`.
  - Script raíz `npm run check:react`.

- [ ] **Step 1:** Crear la worktree `feat/monorepo-workspaces` desde `origin/main`. Correr `cd web && npm ci && npm run verify` y anotar el número de tests en verde: es la línea base.
- [ ] **Step 2:** Crear el `package.json` de la raíz:

```json
{
  "name": "ai-personal-stylist",
  "private": true,
  "workspaces": ["web", "packages/*"],
  "engines": { "node": ">=24.3" },
  "overrides": { "react": "19.3.0", "react-dom": "19.3.0" },
  "scripts": {
    "verify": "npm run check:react && npm run verify --workspaces --if-present",
    "verify:web": "npm run verify -w web",
    "test:core": "npm test -w @aps/core",
    "check:react": "node scripts/check-single-react.mjs"
  }
}
```

  Agregar `node_modules/` al `.gitignore` de la raíz.
- [ ] **Step 3:** Escribir `scripts/check-single-react.mjs`.
  - Ejecuta `npm ls react --all --json`, recorre el árbol y junta las versiones distintas de `react`.
  - Si hay más de una, sale con código 1 e imprime cuáles.
  - Si hay una, imprime `react OK <versión>` y sale con 0.
- [ ] **Step 4:** Crear `packages/core` con nombre `@aps/core`, `"private": true`, `"type": "module"` y `"exports": { ".": "./src/index.ts", "./types": "./src/types.ts" }`.
  - Scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`, `"verify": "npm run typecheck && npm test"`.
  - devDependencies `vitest` y `typescript` en las mismas versiones que `web/package.json`.
  - `tsconfig` estricto, `moduleResolution: "bundler"`, `noEmit`.
  - `vitest.config.mts` con `include: ["tests/**/*.test.ts"]`, entorno `node`.
- [ ] **Step 5:** `git mv` de los tres archivos.
  - En `packages/core/src/sse.ts`, solo el import cambia a `./types`.
  - En el test movido, los imports cambian a `../src/sse` y `../src/types`.
  - `src/index.ts` = `export * from "./types"; export * from "./sse";`.
- [ ] **Step 6:** Shim: `web/src/lib/domain/types.ts` queda con una línea de comentario y `export * from "@aps/core/types";`.
  - Los tres imports de `@/lib/chat/sse` pasan a `@aps/core`.
  - `web/package.json` suma `"@aps/core": "*"` en `dependencies`.
  - `web/next.config.ts` suma `transpilePackages: ["@aps/core"]` sin tocar el resto.
- [ ] **Step 7:** Borrar `web/package-lock.json`. Correr `npm install` **en la raíz** (si el freno lo bloquea: detenerse y pedírselo a Felipe).
- [ ] **Step 8:** Verificar.
  - **Comando:** `npm run check:react && npm run test:core && npm run verify:web`.
  - **Esperado:**
    - `react OK 19.3.0`.
    - Los 7 tests SSE pasan en core.
    - Web en verde, con la línea base del paso 1 **menos** los 7 tests movidos y ningún fallo.
- [ ] **Step 9:** Verificar que el build de Next resuelve el paquete.
  - **Comando:** `npm run build -w web`.
  - **Esperado:** build exitoso, sin "Module not found: @aps/core" ni avisos de React duplicado.
- [ ] **Step 10:** Commit: `feat: monorepo npm con paquete core (contrato y parser SSE)`.

### Task 2: CI, hook pre-push, Vercel y la plomería de los bots

**Files:**
- Modify: `.github/workflows/ci.yml`, `.githooks/pre-push:21`, `agentes/scripts/preparar-carpetas.sh:105`, `agentes/scripts/test-verificar-frontera.sh`, `CLAUDE.md:44`, `AGENTS.md:15`, `agentes/bots/constructor/SOUL.md:11` (y lo que regenere `exportar-equipo.py`)
- Create: `web/vercel.json`

**Interfaces:**
- Consumes: scripts raíz `verify`, `check:react`, `test:core`, `verify:web` (tarea 1).

- [ ] **Step 1: Test que falla.** Agregar dos casos al test de la frontera.
  - Una rama `equipo/*` que modifica `packages/core/src/sse.ts` debe salir **fuera de la frontera** (código ≠ 0).
  - Lo mismo con `mobile/src/app/index.tsx`.
  - Seguir el formato de los casos existentes del archivo.
- [ ] **Step 2:** Correr `bash agentes/scripts/test-verificar-frontera.sh`. Lo esperado es que los casos nuevos pasen ya con la frontera actual, que funciona como lista blanca. Si alguno falla, **detenerse e informar**: la frontera tendría un hueco y este plan no la modifica.
- [ ] **Step 3: CI.**
  - Los `paths` de `pull_request` suman `packages/**`, `package.json`, `package-lock.json` y `scripts/**`.
  - Los `paths` de `push` a `main` suman `packages/**`, `package.json` y `package-lock.json`.
  - El job `verify` usa `cache-dependency-path: package-lock.json` y `npm ci` en la raíz, y luego corre `npm run verify` en la raíz (sin `working-directory`).
  - `frontera` y `controles` no se tocan.
- [ ] **Step 4: `web/vercel.json`.**

```json
{ "$schema": "https://openapi.vercel.sh/vercel.json",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ../packages ../package.json ../package-lock.json" }
```

  Probarlo local desde `web/`, con commits de prueba en una rama descartable:
  - Un commit que solo toca `docs/` → el comando sale 0, o sea que Vercel salta el deploy.
  - Un commit que toca `package-lock.json` → sale 1, o sea que despliega.
  - Borrar la rama de prueba después.
- [ ] **Step 5:**
  - `.githooks/pre-push`: la última línea pasa a `cd "$root" && npm run verify` y el comentario de layout se actualiza.
  - `preparar-carpetas.sh:105`: `npm ci` corre en `$LINEA` (la raíz), no en `$LINEA/web`.
  - `CLAUDE.md`, `AGENTS.md` y el SOUL del Constructor: `web/node_modules/next/dist/docs/` → `node_modules/next/dist/docs/`.
  - Regenerar con `python3 -I agentes/scripts/exportar-equipo.py` y comprobar con `--verificar`.
- [ ] **Step 6:** Verificar con un clon limpio.
  - **Comando:** `git clean -xdf -e .env.local` en la worktree, luego `npm ci` en la raíz y `npm run verify`.
  - Correr también los tres tests de controles: `bash agentes/propuesta-settings/hooks/test-freno.sh`, `bash agentes/scripts/test-verificar-frontera.sh` y `bash agentes/scripts/test-condiciones-merge.sh`.
  - **Esperado:** todo en verde y `ls node_modules/next/dist/docs` existe.
- [ ] **Step 7:** Commit: `chore: ci, pre-push y vercel para el monorepo`.

### Task 3: Registrar las decisiones

**Files:**
- Modify: `docs/producto/DECISION_LOG.md` (§2 y §7)

- [ ] **Step 1:** En §2, agregar dos filas con el formato de las existentes:
  - **DT-22:** "App nativa iOS y Android con React Native + Expo (SDK 58) en un monorepo incremental: `web/` sin mover, `mobile/` y `packages/core` con workspaces npm; la API de Next.js es el único backend." Origen `[FELIPE] 2026-11-27`, estado `tomada`, porqué y fuente `docs/movil/01-arquitectura.md`.
  - **DT-23:** "Entrada solo con magic link de Supabase, en web y app; el correo trae link y código de 6 dígitos; requiere SMTP propio antes de abrir a personas fuera del equipo. Reemplaza DT-03." Origen `[FELIPE] 2026-11-27`.
- [ ] **Step 2:** Marcar DT-03 como reemplazada por DT-23, sin borrarla. En §7, agregar una fila de historial con la versión siguiente a la última registrada.
- [ ] **Step 3:** Commit: `docs: DT-22 app nativa en monorepo y DT-23 entrada con magic link`.

### Task 4: PR 1 y verificación en Vercel

- [ ] **Step 1:** Push de la rama y PR con el checklist del repo.
  - **Sección `## Humo`:** primer deploy de Vercel con workspaces.
  - **Aviso para los bots:** las carpetas `ai-personal-stylist-torre` y `-linea-1` necesitan `npm ci` en la raíz después del merge.
- [ ] **Step 2:** Esperar la CI.
  - **Esperado:** `verify`, `controles` y `frontera` (si aplica) en verde.
- [ ] **Step 3:** Revisar el Preview de Vercel del PR (estado y logs de build con las herramientas MCP de Vercel, en solo lectura).
  - **Esperado:** `READY`, el install corrió desde la raíz y `/entrar` responde. El Preview tiene protección SSO, así que si no se puede abrir, se verifica el estado del build y se le pide a Felipe que lo abra.
  - **Si el install falla:** plan B del spec, que suma `"installCommand": "cd .. && npm ci"` a `web/vercel.json`. Se hace en un commit aparte y se vuelve al paso 2.
- [ ] **Step 4:** Revisión de toda la rama (`superpowers:requesting-code-review`, revisor Opus).
- [ ] **Step 5:** Felipe revisa y mergea. Después del merge, `npm ci` en las carpetas de los bots (o avisarle al Productor).

---

## PR 2 · `feat/app-movil-esqueleto` (desde `main` con el PR 1 mergeado)

### Task 5: Crear la app Expo dentro del monorepo

**Files:**
- Create: `mobile/**` (generado por el template)
- Modify: `package.json` raíz (`workspaces`), `package-lock.json`

**Interfaces:**
- Produces: workspace `mobile` (nombre de paquete `mobile`) con `src/app/` como carpeta de rutas de Expo Router.

- [ ] **Step 1:** Crear la app en la raíz de la worktree.
  - **Comando:** `npx create-expo-app@latest mobile --template default@sdk-58 --no-install`.
  - **Esperado:** `mobile/package.json` con `expo` ~58.
  - **Si el template SDK 58 no existe:** detenerse e informar. No usar SDK 57.
- [ ] **Step 2:** Correr `npm run reset-project` dentro de `mobile` (o hacer a mano lo mismo que hace).
  - Borrar `app-example/`.
  - Mover `mobile/app/` a `mobile/src/app/`.
  - Borrar los componentes de ejemplo que no se usen.
- [ ] **Step 3:** Agregar `"mobile"` a `workspaces` y correr `npm install` en la raíz.
  - Luego `cd mobile && npx expo install --check`.
  - **Esperado:** todo alineado. Si Expo pide otra versión exacta de React, actualizar `overrides` en la raíz, reinstalar y volver a correr `npm run verify:web`.
- [ ] **Step 4:** Verificar.
  - **Comandos:** `npm run check:react` y `cd mobile && npx expo-doctor`.
  - **Esperado:** `react OK <versión>` y expo-doctor sin errores.
- [ ] **Step 5:** Commit: `feat: app expo sdk 58 en el monorepo`.

### Task 6: Configuración, pantalla de bienvenida y prueba de core en la app

**Files:**
- Create: `mobile/app.config.ts` (reemplaza `app.json`), `mobile/jest.config.js`, `mobile/tests/core-link.test.ts`
- Modify: `mobile/src/app/index.tsx`, `mobile/src/app/_layout.tsx`, `mobile/package.json`

**Interfaces:**
- Consumes: `createSSEParser` y `encodeSSE` de `@aps/core` (tarea 1).

- [ ] **Step 1: Test que falla.** `mobile/tests/core-link.test.ts`, con `describe("core en la app")` → `it("parsea una trama del contrato")`.
  - Construye el evento `{ type: "done", message_id: "m1" }`, que es la forma exacta de `ChatEvent` en `packages/core/src/types.ts`.
  - Lo pasa por `encodeSSE` y después por `createSSEParser`, empujando el texto en dos trozos cortados a la mitad.
  - Espera recibir exactamente 1 evento, igual al original (`toEqual`).
- [ ] **Step 2:** Agregar `jest-expo` y `@testing-library/react-native` con `npx expo install` (si el freno lo bloquea, pedírselo a Felipe).
  - `jest.config.js`: `preset: "jest-expo"`.
  - Scripts de `mobile`: `"test": "jest"`, `"typecheck": "tsc --noEmit"`, `"verify": "npm run typecheck && npm run lint && npm test"`. Mantener el script `lint` del template.
  - `mobile/package.json` suma `"@aps/core": "*"`.
- [ ] **Step 3:** Correr `cd mobile && npm test`.
  - **Esperado:** PASS.
  - **Si falla porque Jest no transforma `@aps/core`:** agregar `@aps` a la lista de `transformIgnorePatterns` del preset y volver a correr.
- [ ] **Step 4: `app.config.ts`.**
  - `const variant = process.env.APP_VARIANT ?? "development"`.
  - `name`: `"Prendie"` (con sufijo `" (dev)"` o `" (preview)"` fuera de producción).
  - `slug: "prendie"`, `scheme: "aps"`.
  - `ios.bundleIdentifier` y `android.package`: `cl.aps.app.dev` en development y `cl.aps.app.preview` en preview.
  - Con `production`, **lanza un error**: `"Bundle ID de producción pendiente (A-05)"`.
  - Mantener los plugins del template (`expo-router`, etc.).
- [ ] **Step 5: Pantalla.**
  - `index.tsx` muestra, sobre el fondo `#f2f2ee` y con tinta `#121412`:
    - el título "Prendie";
    - una línea: "La app está en construcción. Por ahora tu asesor vive en la web.";
    - el tono de voz de `CLAUDE.md`.
  - Usa `SafeAreaView` y áreas táctiles de 44 pt o más si hubiera alguna (no hace falta ningún botón).
  - Fuentes: Bricolage Grotesque y Manrope solo si `expo-font` viene en el template. Si no, la fuente del sistema, y se deja anotado.
- [ ] **Step 6:** Verificar.
  - **Comando:** `cd mobile && npm run verify`. **Esperado:** verde.
  - **Comando:** `APP_VARIANT=production npx expo config`. **Esperado:** falla con el mensaje de A-05.
- [ ] **Step 7:** Commit: `feat: configuracion por variante y pantalla de bienvenida de la app`.

### Task 7: CI móvil, simulador y PR 2

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: CI.**
  - Los `paths` de PR y de push suman `mobile/**`.
  - Nuevo job `verify-mobile`: Node 24, caché del lockfile de la raíz, `npm ci` en la raíz, `npm run check:react`, `npm run verify -w mobile` y `cd mobile && npx expo install --check`.
  - El `verify` raíz ya incluye a `mobile` por `--workspaces`. Para no duplicar trabajo, dejar el job `verify` con `npm run verify:web && npm run test:core`.
- [ ] **Step 2: Simulador.** Correr `cd mobile && npx expo run:ios --device "iPhone 17 Pro"`.
  - Si pide CocoaPods o permisos, informar sin instalar nada fuera del plan.
  - **Esperado:** la app abre con la pantalla de bienvenida.
  - Tomar una captura con `xcrun simctl io booted screenshot docs/superpowers/mockups/capturas/movil-esqueleto-bienvenida.png`.
  - **No** commitear `mobile/ios/` ni `mobile/android/`: deben quedar en `.gitignore` (el template de Expo ya los ignora; verificarlo).
- [ ] **Step 3:** Push y PR.
  - Incluir la captura.
  - En `## Humo`: el primer build local en el simulador.
  - El Preview de Vercel de la web debe quedar en verde, porque cambia el lockfile (spec, decisión 2).
- [ ] **Step 4:** Revisión de toda la rama (`superpowers:requesting-code-review`, Opus) y `superpowers:verification-before-completion`.
- [ ] **Step 5:** Felipe ve la captura, revisa y mergea.
