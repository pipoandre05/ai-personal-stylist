# Investigación Expo / React Native para app iOS + Android (2026-11-26)

Fuentes oficiales consultadas hoy. "⚠" = incierto o no confirmado en la fuente oficial.

## 1. Versiones actuales

| Dato | Valor | Fuente |
|---|---|---|
| SDK estable más reciente | **Expo SDK 58.0.0** (estable 2026-10-15; beta 2026-09-15) | https://docs.expo.dev/versions/latest/ · https://expo.dev/changelog/sdk-58 |
| React Native | **0.88** | ídem |
| React | **19.3.0** | https://docs.expo.dev/versions/latest/ |
| react-native-web | 0.21.0 | ídem |
| Expo Router | **~58.0.33** (Router ahora versiona igual que el SDK) | https://docs.expo.dev/versions/latest/sdk/router/ |
| iOS mínimo | **16.4+** | versions/latest |
| Android mínimo | **7+** (compileSdk 37, targetSdk 36) | versions/latest |
| Xcode | **26.4+** (versions/latest). Para la nueva funcionalidad iOS 27 (App Intents en pantalla) se requiere Xcode 27; SDK 58 genera `SceneDelegate.swift` (ciclo de vida por escenas iOS 27) | versions/latest · changelog sdk-58 |
| Node | Versión mínima de la tabla: 22.13.x. Changelog SDK 58: "22.13+ en la línea 22, 24.3+ en la 24, y 26+"; **impares (23, 25) no soportadas**. Node ≥24 del usuario: OK si es ≥24.3 | changelog sdk-58 |
| Android local | JDK **Azul Zulu 17**, Android Studio, Android SDK Platform **36** ("Android 16 Baklava SDK is required") | https://docs.expo.dev/get-started/set-up-your-environment/ |
| Watchman | Solo necesario en SDK ≤55 | ídem |
| Nueva Arquitectura | **Obligatoria y no desactivable desde SDK 55** (RN 0.82 eliminó el opt-out). Legacy congelada desde junio 2025 | https://docs.expo.dev/guides/new-architecture/ |
| Motor JS | Hermes V1 por defecto desde SDK 56 | https://expo.dev/changelog/sdk-56 |
| Cadencia | Históricamente **3 SDK mayores/año**; Expo dice estar "explorando una nueva cadencia" (SDK 57 fue pequeño; posibles upgrades opcionales casi inmediatos de RN entre SDK mayores). Cada SDK tiene ~1 año de soporte | https://expo.dev/changelog/sdk-57 |

Historial reciente: SDK 56 (2026-05-21, RN 0.85, React 19.2) · SDK 57 (2026-06-30, RN 0.86, React 19.2) · SDK 58 (2026-10-15, RN 0.88, React 19.3.0).

**Breaking changes SDK 58 relevantes:** API TypeScript estricta de RN 0.87 por defecto (se eliminan `InteractionManager`, prop `animated` de `Modal`); R8 activo en release Android; `NODE_ENV` lo fija Expo CLI; `File.write()` async; libSQL eliminado de `expo-sqlite`; `expo login` por navegador; Router genera salida server por defecto si `web.output` no está definido.

**Expo Go y SDK 58 (⚠ importante):** al lanzar SDK 58 Expo dijo que el Expo Go de tiendas llegaría "en unas semanas" y que mientras tanto `create-expo-app` crea proyectos **SDK 57**; para SDK 58 usar `npx create-expo-app --template default@sdk-58` + development build. No encontré confirmación de que ya esté en App Store/Play al 2026-11-17. Verificar en https://expo.dev/go antes de empezar. Además, desde 2026-09-03 **se requiere login para correr proyectos en Expo Go** (https://expo.dev/changelog).

**Alineación React con el monorepo:** web usa React 19.3 y SDK 58 usa **19.3.0** → coinciden en minor. ⚠ Riesgo: React Native exige que `react` coincida exactamente con la versión del renderer que trae RN (error "Incompatible React versions" si difiere el patch). En el monorepo hay que **fijar una sola versión exacta** de `react`/`react-dom` (19.3.0 o la que indique `npx expo install --check`) con `overrides` (npm) o `resolutions` (pnpm/yarn), y que Next.js 16 use la misma. Next.js App Router internamente usa su React canary vendorizado, así que el riesgo de choque real está en `node_modules` duplicados, no en Next. Expo docs: "Duplicate React versions cause runtime errors" y "multiple React Native versions in one monorepo are unsupported".

## 2. Stack recomendado

| Necesidad | Recomendación | Notas / fuente |
|---|---|---|
| Navegación | **Expo Router ~58** (file-based). Desde SDK 56 ya no depende de react-navigation; native Stack v5; en SDK 58 data loaders, SSR y middleware estables | changelog sdk-56/58 |
| Datos remotos | **TanStack Query** (la skill oficial `expo-data-fetching` cubre React Query/SWR, caché, offline, loaders) | https://github.com/expo/skills |
| Estado local | Zustand o React Context — ⚠ Expo no prescribe uno; elección comunitaria | — |
| Sesión Supabase | Guía oficial usa **expo-sqlite `localStorage`** (`import 'expo-sqlite/localStorage/install'` y `auth.storage: localStorage`), `detectSessionInUrl: false`, auto-refresh atado a AppState. No necesita `react-native-url-polyfill` (Expo ya expone `URL`). Comando nuevo: **`eas integrations:supabase:connect`** (crea/enlaza proyecto, instala SDK y escribe `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` y en EAS env) | https://docs.expo.dev/guides/using-supabase/ |
| Secretos en dispositivo | **expo-secure-store** (Keychain iOS / Keystore Android). Expo no fija límite pero advierte que algunas versiones de iOS rechazaban >~2048 bytes → por eso no es ideal para la sesión completa de Supabase (o usar patrón "clave cifrada en SecureStore + datos cifrados en otro storage") | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| OAuth / deep links | Requiere scheme + deep link (expo-linking/expo-auth-session/expo-web-browser). La guía Expo remite a la guía de deep linking móvil de Supabase. Universal/App Links no funcionan en Expo Go | using-supabase · dev-builds FAQ |
| Imágenes | **expo-image** (caché; SDK 57 añadió métodos read/write de caché) | changelog sdk-57 |
| Compresión fotos | **expo-image-manipulator**: `useImageManipulator(uri).resize({width:1280}).renderAsync()` → `saveAsync({format: SaveFormat.JPEG, compress: 0.8})`; `manipulateAsync` está **deprecado**. ⚠ La doc **no dice si elimina EXIF**: re-encodear normalmente lo descarta, pero hay que verificarlo con un test | https://docs.expo.dev/versions/latest/sdk/imagemanipulator/ |
| Captura | **expo-image-picker** (galería + cámara simple) o **expo-camera** (cámara custom) | docs SDK |
| Push | **expo-notifications**; push remoto **no** funciona en Expo Go → dev build | dev-builds FAQ |
| OTA | **expo-updates** + EAS Update (canales/branches/runtimeVersion) | https://docs.expo.dev/eas-update/how-it-works/ |
| Persistencia local | **expo-sqlite** (incluye `localStorage` y kv-store); MMKV (`react-native-mmkv`) como alternativa rápida ⚠ (requiere dev build) | — |
| Streaming del asesor (Claude) | **`expo/fetch`**: Fetch WinterCG con `resp.body.getReader()`; desde SDK 56 se instala como `fetch` global en iOS/Android (opt-out `EXPO_PUBLIC_USE_RN_FETCH=1`). `TextDecoder` disponible. ⚠ No hay `EventSource`/parser SSE incluido: parsear `text/event-stream` a mano o con librería. Las llamadas a Claude siguen en el servidor (Next.js API) | https://docs.expo.dev/versions/latest/sdk/expo/ |
| Estilos | Opciones: (a) **StyleSheet** + tokens de DESIGN.MD en un paquete compartido (lo más estable); (b) **Uniwind** (free MIT, Tailwind v4, estable desde ~nov 2025, funciona en Expo Go; Pro US$99/seat/año, Expo SDK 55–58); (c) **NativeWind v5** = **RC** (5.0.0-rc.0, Tailwind 4.1.12, react-native-css 3.1.0-rc.0), "not intended for production", soporte SDK 58 en curso; NativeWind v4 estable usa **Tailwind v3**. Expo docs solo dicen "Tailwind estándar es solo web; para universal usar NativeWind o Uniwind" | https://docs.expo.dev/guides/tailwind/ · https://www.nativewind.dev/v5 · https://github.com/nativewind/nativewind/discussions/1818 · https://uniwind.dev/pricing |
| Errores | **Sentry**: `npx @sentry/wizard@latest -i reactNative`, plugin `@sentry/react-native/expo`, `SENTRY_AUTH_TOKEN` (visibilidad sensitive) sube sourcemaps en EAS Build; tras `eas update` correr `npx sentry-expo-upload-sourcemaps dist`. Alternativa nativa: **EAS Observe** (GA 2026-08-20; crashes nativos desde 2026-10-07) | https://docs.expo.dev/guides/using-sentry/ |
| Unit tests | **jest-expo** + Jest 30 (SDK 58 lo exige) + **@testing-library/react-native ≥14** para Router. `react-test-renderer` deprecado (no soporta React 19). Vitest no mencionado (⚠ el proyecto web usa Vitest: el paquete compartido puede testearse con Vitest si es TS puro) | https://docs.expo.dev/develop/unit-testing/ |
| E2E | **Maestro** (guía oficial; integrable como job en EAS Workflows) | https://docs.expo.dev/eas/workflows/ |

## 3. Monorepo (Expo docs)

- Soporta **Bun, npm, pnpm, Yarn (Classic y Berry)**. npm/yarn/bun: `"workspaces": ["apps/*","packages/*"]`; pnpm: `pnpm-workspace.yaml`.
- **Metro se configura solo desde SDK 52** (`expo/metro-config`); quitar `watchFolders`, `nodeModulesPaths`, `extraNodeModules`, `disableHierarchicalLookup` y correr `npx expo start --clear`.
- `experiments.autolinkingModuleResolution` automático en monorepos desde SDK 55.
- Isolated installs soportados desde SDK 54; si pnpm da problemas: `nodeLinker: hoisted`.
- Detectar duplicados: `npm why react-native` / `pnpm why --depth=10 react-native`. Fijar `react` con `overrides`/`resolutions`.
- Paquetes locales: `"workspace:*"` (npm/pnpm/bun).
- Expo recomienda monorepo solo si hay código compartido real; verificar que las librerías funcionen.
- ⚠ Problemas conocidos al compartir con Next.js: (1) versiones de React duplicadas; (2) paquetes compartidos no deben importar `next/*`, DOM, `server-only` ni código Node (Supabase server client, `@anthropic-ai/sdk`) — compartir solo tipos, esquemas zod, contratos del asesor, utilidades puras y tokens; (3) Tailwind v4 web y NativeWind/Uniwind no comparten config 1:1; (4) actualmente el repo usa `web/` como root de Vercel: mover a `apps/web` obliga a cambiar Root Directory. Fuente: https://docs.expo.dev/guides/monorepos/

## 4. Entornos

- **EAS environment variables**: entornos `development`, `preview`, `production` (custom solo en Production/Enterprise). Visibilidad: **plain text**, **sensitive** (ofuscada en logs), **secret** (nunca legible fuera de servidores Expo).
- `EXPO_PUBLIC_*` se incrustan en el bundle → **públicas**. Docs: "anything that is included in your client-side code should be considered public". Nunca `ANTHROPIC_API_KEY` ni service role en la app.
- `eas env:set --name X --value Y --environment production --visibility plaintext`; `eas env:pull` para local.
- Build profile elige entorno con `"environment": "production"` en `eas.json`. `eas update --environment production` (flag obligatorio).
- **Variantes**: `app.config.(js|ts)` con `APP_VARIANT` → bundle id `.dev`/`.preview`, nombre "(Dev)"; se setea en `env` de cada perfil de `eas.json`. https://docs.expo.dev/tutorial/eas/multiple-app-variants/
- **Canales EAS Update**: cada build lleva un channel (en `eas.json`); el channel apunta a un branch; `eas channel:edit` para promover/rollback; update solo llega si plataforma + `runtimeVersion` coinciden. OTA solo cambia JS/assets; cambio nativo = build nuevo.
- https://docs.expo.dev/eas/environment-variables/

## 5. Expo Go vs development builds, EAS

- **Expo Go**: set fijo de librerías nativas, una sola SDK por versión de Expo Go, sin push remoto, sin Universal/App Links, sin probar icono/nombre/splash, requiere login (desde 2026-09). Para una app a tiendas Expo recomienda **development build**. https://docs.expo.dev/develop/development-builds/faq/
- **EAS Build** (nube; local con `npx expo run:ios|android` o `eas build --local`), **EAS Submit** (sube a App Store Connect / Play), **EAS Update** (OTA), **EAS Workflows** (YAML en `.eas/workflows/`, triggers push a rama / App Store Connect / manual `eas workflow:run`; requiere conectar GitHub; jobs build, submit, update, fingerprint, maestro ⚠ nombres exactos no todos confirmados en la página de inicio), **EAS Observe**, **EAS Hosting**.
- **Credenciales**: EAS genera y guarda certificados/perfiles iOS y keystore Android (gestionados con `eas credentials`).
- **Distribución interna**: `"distribution": "internal"` → iOS ad hoc (registrar UDID con `eas device:create`, máx. 100 iPhones/año, requiere Apple Developer pagado; dispositivos nuevos pueden tardar 24–72 h en cuentas recientes) y Android APK. **TestFlight** vía `eas submit`; **Play internal testing** vía `eas submit` a track internal. https://docs.expo.dev/build/internal-distribution/

## 6. Costos (USD)

### Expo services (ex-EAS) — https://expo.dev/pricing
| Plan | Precio | Builds | Prioridad / timeout | Updates MAU | Otros |
|---|---|---|---|---|---|
| **Free** | $0 | 15 Android + 15 iOS /mes | baja / 45 min | 1.000 (sin overage) | Workflows hasta 60 min baja prioridad; Observe 100K eventos; 100 GiB bandwidth |
| **Starter** | **$19/mes** + uso | $45 de crédito, luego por uso | alta / 2 h | 3.000; luego $0.005/MAU | 2 concurrencias macOS |
| **Production** | **$199/mes** + uso | $225 de crédito | alta / 2 h | 50.000 | entornos custom, Maestro insights |
| **Enterprise** | a medida | desde $1.000 crédito | alta | precio preferente | SLA 99.9% |

Builds pay-as-you-go: Android **$1** (medium) / $2 (large); iOS **$2** (medium) / $4 (large).

### Tiendas
- **Apple Developer Program: US$99/año** (precio local puede variar). Organización requiere **D-U-N-S**. https://developer.apple.com/programs/enroll/
- **Google Play Console: US$25 único**; puede pedir ID y tarjeta a nombre legal; cuentas personales deben verificar acceso a un dispositivo Android. https://support.google.com/googleplay/android-developer/answer/6112435
- **Google Play cuentas personales nuevas (creadas después del 2023-11-13)**: **closed test con ≥12 testers opt-in continuos durante ≥14 días** antes de pedir acceso a producción. https://support.google.com/googleplay/android-developer/answer/14151465
- **Android target API**: desde **2026-08-31** apps nuevas y updates deben apuntar a **API 36 (Android 16)**; extensión posible hasta 2026-11-01 (ya vencida). SDK 58 usa targetSdk 36 ✓. https://developer.android.com/google/play/requirements/target-sdk
- **Android developer verification**: vigente desde 2026-09-30 en Brasil, Indonesia, Singapur y Tailandia; global en 2027 (Chile aún no). Cuentas de Play ya pagadas no pagan de nuevo. https://android-developers.googleblog.com/2026/06/android-developer-verification.html

### Requisitos Apple — https://developer.apple.com/app-store/review/guidelines/ · https://developer.apple.com/news/upcoming-requirements/
- **Xcode 26+ / SDK iOS 26** obligatorio para subir desde 2026-04-28; target iOS 13+ desde 2026-09-09 (SDK 58 ya cumple con 16.4).
- **Privacy manifest**: razones aprobadas para "required reason APIs" desde 2024-05-01; en Expo se declara en `ios.privacyManifests` de app.json; paquetes Expo traen su propio PrivacyInfo. https://docs.expo.dev/guides/apple-privacy/
- **App Privacy labels** en App Store Connect (fotos, datos de cuerpo/estilo, uso por IA) — declarar.
- **5.1.1(v)**: si hay creación de cuenta, **eliminación de cuenta dentro de la app**.
- **4.8 Login Services**: si usas login de terceros (Google, etc.) como cuenta principal, ofrecer una opción equivalente que limite datos a nombre+email, permita ocultar el email y no rastree para publicidad (Sign in with Apple cumple). Email/contraseña o magic link propio → exento.
- **5.1.2(i)**: "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." → consentimiento explícito antes de mandar fotos/datos a Claude.
- **1.2 UGC**: aplica a "AI content creation apps": filtro de contenido objetable, mecanismo de reporte, bloqueo, contacto publicado. ⚠ Aplicabilidad parcial (no hay contenido entre usuarios), pero conviene reporte + contacto.
- **4.2**: la app debe ir más allá de un sitio web reempaquetado (no WebView del PWA).
- **3.1.1**: suscripciones digitales con IAP; links externos de pago solo permitidos en storefront de EE.UU. (Chile: IAP).
- **Edad**: nuevo cuestionario de clasificación por edad (obligatorio desde 2026-01-31).

## 7. Skills y MCP para agentes

### Expo oficial — https://github.com/expo/skills · https://docs.expo.dev/skills/
Instalación Claude Code: **`claude plugin install expo@claude-plugins-official`** (o `/plugin install expo@claude-plugins-official`). Incluye y registra el **Expo MCP Server**. Otros agentes: `npx skills@latest add expo/skills --skill '*'`. Experimentales: plugin `expo-experiments`. Actualización: vía marketplace o `npx skills@latest update`.

Framework (gratis): `expo-overview` (entrada/router), `expo-project-structure`, `expo-router`, `expo-animation` (Reanimated, Gesture Handler, haptics), `expo-native-ui` (HIG, SF Symbols), `expo-design-system` (tokens, componentes, auditoría de drift), `expo-ui` (@expo/ui SwiftUI/Compose), `expo-data-fetching` (React Query/SWR, offline, loaders), `expo-dom` (componentes web en webview), **`expo-web-to-native`** (migrar Next.js/Vite/CRA a nativo — muy relevante), `expo-module` (módulos nativos Swift/Kotlin), `expo-brownfield`, `expo-dev-client` (builds locales gratis; TestFlight vía EAS pago), `expo-examples` (ejemplos `with-*`), `expo-app-clip`, `expo-upgrade`.
Servicios (requieren EAS pago según el repo): `eas-app-stores` (build+submit TestFlight/App Store/Play, versionado, metadata), `eas-hosting`, `eas-workflows`, `eas-observe`, `eas-update`, `eas-update-insights`, `eas-simulator` (simuladores en la nube).
Experimentales: `expo-mascot` (mascota 2D con Rive), `expo-migrate-module` (Modules API 1.0→2.0).
⚠ La doc menciona `expo-tailwind-setup` en ejemplos pero no está en la lista actual.
Requisitos: no se declara versión mínima de Claude Code ni de SDK. Las skills ofrecen enviar feedback vía `@expo/agent-cli` solo con aceptación del usuario (revisar con skill-auditor antes de instalar).

### Expo MCP Server — https://docs.expo.dev/eas/ai/mcp/
- URL `https://mcp.expo.dev/mcp`; manual: `claude mcp add --transport http expo https://mcp.expo.dev/mcp` y `/mcp` para OAuth con cuenta Expo.
- Remoto: docs, builds/workflows (run, logs, cancel, submit), Observe, Sentry, simuladores en la nube, TestFlight crashes/feedback, reseñas de tiendas. `search_documentation` requiere plan pago; simuladores/sandboxes se cobran.
- Local (SDK ≥54, `expo-mcp` como devDependency, `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start`): sitemap de Router, DevTools, logs, screenshots/tap en simulador.
- Nota: "Expo Agent" (agente propio de Expo) se cerró el 2026-07-20; existe "Connect Expo in the Claude desktop app" (2026-08-13).

### Otras skills reputadas
- **Callstack** — https://github.com/callstackincubator/agent-skills (MIT): `react-native-best-practices` (rendimiento JS/nativo/bundle, basado en su "Ultimate Guide to RN Optimization"), `upgrading-react-native`, `react-navigation`, `react-native-testing`, `github-actions`, `create-react-native-library`, `react-native-brownfield-migration`, etc. Instalar: `npx skills@latest add callstackincubator/agent-skills --skill react-native-best-practices` o `/plugin marketplace add callstackincubator/agent-skills` + `/plugin install building-react-native-apps@callstack-agent-skills`.
- **Software Mansion** — https://github.com/software-mansion-labs/skills: `react-native-best-practices` (Reanimated 4, Gesture Handler, SVG, Worklets, Audio API, etc.; ojo: `runOnJS` eliminado en Reanimated 4 → `scheduleOnRN`), `react-native-executorch` (IA on-device), `react-native-moq`. Instalar: `npx skills add software-mansion-labs/skills`.
- ⚠ Métricas de estrellas vienen de directorios de terceros. Auditar con `skill-auditor` antes de instalar (regla del usuario).

## 8. Qué instalar dónde

**Local (Mac Apple Silicon):**
- Node **24.3+** (o 22.13+) LTS par; gestor de paquetes (npm ya está; pnpm/bun opcional).
- **Xcode 26.4+** (App Store) + Command Line Tools + simulador iOS (Xcode 27 solo si se quieren features iOS 27). CocoaPods lo maneja `expo prebuild`/`run:ios` ⚠ (Homebrew `cocoapods` si falla).
- **Android Studio** + SDK Platform 36 + Build-Tools + Emulator; **JDK Zulu 17** (`brew install --cask zulu@17`); `ANDROID_HOME` y PATH.
- Watchman **no** necesario (SDK ≥56).
- `eas-cli` (`npm i -g eas-cli`) para builds/submit/update/env. Maestro CLI opcional para E2E locales.
- Dispositivo físico iPhone/Android para probar cámara/push.
- Nota: si solo usas **EAS Build en la nube**, puedes evitar Xcode/Android Studio al inicio (dev build instalado vía link), pero Expo Go para SDK 58 en tiendas aún ⚠ pendiente.

**Nube:** EAS Build/Submit/Update/Workflows (Free alcanza para empezar: 15+15 builds/mes), Supabase (existente), Vercel (API Next.js existente como backend del asesor), Sentry o EAS Observe.

**Cuentas:** Expo (gratis), **Apple Developer US$99/año** (necesaria para TestFlight, ad hoc y push iOS; individual sin D-U-N-S), **Google Play Console US$25** (personal → 12 testers × 14 días antes de producción; planificarlo temprano), GitHub (Workflows), Sentry (opcional).
