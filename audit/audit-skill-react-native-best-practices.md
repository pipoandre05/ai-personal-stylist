# 🔍 Auditoría de Seguridad — react-native-best-practices

**Fecha:** 2026-11-27 22:30
**Skill auditada:** react-native-best-practices — github.com/callstackincubator/agent-skills @ 59e9d17446a248b21d86f078fcd0bd2d36db1ca4, `skills/react-native-best-practices` (copia local: `scratchpad/untrusted/audit-set/react-native-best-practices`, verificada idéntica con `diff -r` al clon del repo en ese commit)
**Líneas analizadas:** 6448 líneas de texto (SKILL.md 238, POWER.md 172, agents/openai.yaml 4, 29 references/*.md 6034) + 12 imágenes PNG (~8,0 MB, inspeccionadas a nivel binario)
**Archivos analizados:** `SKILL.md`, `POWER.md`, `agents/openai.yaml`, `references/` (29 .md: bundle-analyze-app, bundle-analyze-js, bundle-barrel-exports, bundle-code-splitting, bundle-hermes-mmap, bundle-library-size, bundle-native-assets, bundle-r8-android, bundle-tree-shaking, js-animations-reanimated, js-atomic-state, js-bottomsheet, js-concurrent-react, js-lists-flatlist-flashlist, js-measure-fps, js-memory-leaks, js-profile-react, js-react-compiler, js-uncontrolled-components, native-android-16kb-alignment, native-measure-tti, native-memory-leaks, native-memory-patterns, native-platform-setup, native-profiling, native-sdks-over-polyfills, native-threading-model, native-turbo-modules, native-view-flattening), `references/images/` (12 PNG)

**Cobertura:** leídos completos → `SKILL.md`, `POWER.md` (incluye la sección "Security Guardrails"), `agents/openai.yaml`, `references/js-profile-react.md`, `references/bundle-code-splitting.md`. Leídos por secciones relevantes → `js-react-compiler.md`, `native-turbo-modules.md`, `js-measure-fps.md`, `bundle-library-size.md`, `bundle-tree-shaking.md`, `bundle-barrel-exports.md`, `bundle-analyze-app.md`, `bundle-analyze-js.md`, `bundle-native-assets.md`. Escaneados el resto con `rg` sobre los 10 patrones de riesgo + extracción de **todos** los comandos de bloques ```bash de las 29 references. PNG: tipo de archivo, bytes tras `IEND` (0 en los 12) y metadatos XMP (solo dimensiones EXIF y `UserComment: Screenshot` de macOS).

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | react-native-best-practices |
| Función declarada | Guía de optimización de rendimiento React Native: FPS, TTI, tamaño de bundle, memory leaks, re-renders, animaciones, Hermes, FlashList, Turbo Modules (basada en "The Ultimate Guide to React Native Optimization" de Callstack) |
| Archivos bundleados | 44 archivos: SKILL.md, POWER.md (onboarding formato "power" de Kiro), agents/openai.yaml (metadatos UI de Codex), 29 references/*.md, 12 PNG. Sin scripts ejecutables |
| Tools explícitas | Bash implícito (comandos de desarrollo). CLI externa **`agent-device`** (`agent-device react-devtools …`, `agent-device perf`) no incluida en la skill; referencia a "the `agent-device` skill" |
| MCPs mencionados | Ninguno |
| URLs externas | github.com/callstackincubator/inspector, github.com/gorhom/react-native-bottom-sheet, shopify.github.io/flash-list, react.dev, playground.react.dev, docs.expo.dev, developer.android.com, cs.android.com, ui.perfetto.dev, bundlephobia.com, pkg-size.dev. Todas coherentes con la función |
| Dependencias | Ninguna instalada por la skill. Sugiere instalar en el proyecto: react-native-performance, @shopify/flash-list, jotai, zustand, react-native-reanimated, @gorhom/bottom-sheet@^5, @callstack/inspector, @rnx-kit/metro-serializer-esbuild, eslint-plugin-no-barrel-files, react-native-quick-crypto, react-native-screens, babel-plugin-react-compiler@latest/@beta, etc. Ejecuta vía `npx` sin versión: source-map-explorer, bundle-stats, expo-atlas, bundle-phobia-cli, sharp-cli; con `@latest`: react-compiler-healthcheck, create-react-native-library. CLIs externas: agent-device, flashlight, jadx, extensión VS Code `wix.vscode-import-cost` |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Los imperativos son de workflow técnico ("Measure → Optimize → Re-measure → Validate", "Review Guardrails" que *restringen* recomendaciones especulativas, "For AI-agent workflows, treat this as a required sequence" de profiling). No hay reclamos de autoridad de Anthropic/sistema, condicionales ocultos ni instrucciones en comentarios de código. Coincidencias de "override"/"IMPORTANT" son código Kotlin/Swift (`override fun`) o notas técnicas. `agents/openai.yaml` solo define `display_name`, `short_description` y `default_prompt` neutro.
**Evidencia:** N/A

### P2 · Exfiltración de Datos
**Estado:** ✅
**Hallazgo:** Sin llamadas de red, telemetría ni webhooks que envíen datos del proyecto o del usuario. `analytics.track(...)` aparece solo como código de ejemplo de la app (`native-measure-tti.md:184`, `js-animations-reanimated.md:118`). Emerge Tools se menciona como servicio de terceros al que *la persona* puede subir un IPA/APK manualmente (opcional, declarado), no como paso del agente.
**Evidencia:** `bundle-analyze-app.md:137-139` "Upload IPA, APK, or AAB through their web interface or CI integration." (opción manual)

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** No hay scripts bundleados. Los comandos son operaciones estándar de desarrollo dentro del proyecto (`./gradlew bundleRelease`, `xcodebuild -exportArchive`, `npx react-native bundle`, `zipalign -c`, `unzip app-release.apk`). Sin `rm -rf`, `curl | bash`, `eval`, escrituras a `/etc`, `~/.ssh`, cron o launchd. Las guardas de SKILL.md/POWER.md prohíben explícitamente "pipe remote scripts directly to a shell".
**Evidencia:** N/A

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No lee secretos ni pide tokens. Las menciones a `.env` son para **escribir** flags de build no sensibles de Expo; "token" aparece solo como "token-efficient". `process.env.RSDOCTOR` es un flag de build.
**Evidencia:** `bundle-tree-shaking.md:75-79` "Create/edit `.env`: EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1 / EXPO_UNSTABLE_TREE_SHAKING=1"

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin instrucciones de cambio de identidad, roleplay, ocultar que es Claude ni plantillas que suplanten entidades.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** 🚨
**Hallazgo:** La skill instruye ejecutar como paso obligatorio del workflow paquetes **no pinneados `@latest`** descargados de npm en tiempo de ejecución, lo que contradice sus propias "Security Notes"/"Security Guardrails" ("prefer version-pinned tooling"). Además usa `npx` de herramientas que no son dependencias del proyecto sin versión (resuelven a latest) y `npm install …@latest`/`@beta`.
**Evidencia:**
- `references/js-react-compiler.md:48` → `npx react-compiler-healthcheck@latest` (Step 1 "Check Compatibility")
- `references/js-react-compiler.md:256` → "**Not running healthcheck**: Always run `npx react-compiler-healthcheck@latest` before enabling"
- `references/native-turbo-modules.md:48,56,69` → `npx create-react-native-library@latest …` (Prerequisites / Step 1 scaffold)
- `references/js-react-compiler.md:82,88` → `npm install -D babel-plugin-react-compiler@latest`, `npm install react-compiler-runtime@latest`; `:61,64` `npx expo install babel-plugin-react-compiler@beta`
- ⚠️ contribuyentes (opcionales/análisis): `SKILL.md:99`, `POWER.md:128`, `bundle-analyze-js.md:21,76,149,223,239,249` `npx source-map-explorer` / `npx bundle-stats`; `bundle-analyze-js.md:24,116,257` `npx expo-atlas`; `bundle-library-size.md:18,135` `npx bundle-phobia-cli`; `bundle-native-assets.md:162` `npx sharp-cli`

### P7 · Alcance Excesivo
**Estado:** ⚠️
**Hallazgo:** La skill orienta al agente a preferir una CLI externa no incluida ni auditada, `agent-device`, que controla dispositivos/simuladores (instalar/abrir builds, navegar flujos, capturar screenshots y logs) y remite a otra skill ("the `agent-device` skill"). La instalación queda condicionada a una "ruta aprobada/confiable" **o a preguntar a la persona**, y existe fallback manual (React Native DevTools), por eso no es 🚨. También sugiere instalar una extensión de VS Code (opcional, manual). El resto del acceso (archivos del proyecto, build tools) es proporcional a la función.
**Evidencia:**
- `references/bundle-r8-android.md:219` "Use `agent-device` to install or open the release build, navigate critical flows, capture snapshots/screenshots, and collect logs. If it is missing … install it through the environment's approved/trusted path or ask the user to install or enable it. Read the `agent-device` skill…"
- `references/js-profile-react.md:41` "Keep this as fallback only; agent runs should prefer the CLI summaries above."
- Mismo patrón en `js-measure-fps.md:34`, `native-measure-tti.md:37`, `native-profiling.md:29`, `native-view-flattening.md:38`, `bundle-analyze-app.md:32`, `bundle-analyze-js.md:34`, `native-memory-leaks.md:127`
- `references/bundle-library-size.md:77` `code --install-extension wix.vscode-import-cost`

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, `atob`, escapes `\x`/`\u`, comentarios HTML, caracteres zero-width, bidi, tags Unicode, NBSP ni caracteres de control. No-ASCII presente solo tipográfico: `→ ─ — ├ └ ↔ ←` y emojis `✅ ❌ ⚠️` (U+FE0F selector de variante). Los 12 PNG son imágenes válidas, sin datos tras `IEND`; XMP solo con dimensiones y `UserComment: Screenshot`.
**Evidencia:** N/A

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe en `~/.claude`, en otras skills, en perfiles de shell ni en paths del sistema; no hay auto-actualización. Las ediciones sugeridas son a archivos del proyecto (`babel.config.js`, `metro.config.js`, `build.gradle`, `.env`). Nota: en el repo de origen, la skill se distribuye vía plugin `building-react-native-apps` (symlink); instalar el plugin/marketplace implicaría actualizaciones desde upstream — instalar copia fija evita esto.
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** Sin instrucciones de ocultar errores, alterar resultados ni omitir advertencias. Al contrario: exige medir antes/después y revertir si no mejora, y prohíbe reportar problemas especulativos sin evidencia.
**Evidencia:** `SKILL.md:54` "If metrics did not improve, revert and try the next suggested fix."

---

## 📊 Resumen Ejecutivo

| Punto | Categoría | Estado |
|-------|-----------|--------|
| P1 | Prompt Injection | ✅ |
| P2 | Exfiltración de Datos | ✅ |
| P3 | Código Malicioso | ✅ |
| P4 | Robo de Credenciales | ✅ |
| P5 | Suplantación | ✅ |
| P6 | Supply Chain | 🚨 |
| P7 | Alcance Excesivo | ⚠️ |
| P8 | Ofuscación | ✅ |
| P9 | Persistencia | ✅ |
| P10 | Manipulación Output | ✅ |

**Vulnerabilidades detectadas (🚨):** 1
**Puntos sospechosos (⚠️):** 1

---

## 🏁 Veredicto

🟡 SOSPECHOSA

**Una vulnerabilidad de supply chain (ejecución de paquetes npm `@latest` como paso obligatorio del workflow). No hay indicios de intención maliciosa: el contenido es documentación técnica legítima de Callstack con guardas de seguridad propias que la referencia contradice.**

> Revisar hallazgo antes de instalar. No instalar sin validación manual.

---

## 📝 Notas del Auditor

- **Security Guardrails (POWER.md:20-25) y Security Notes (SKILL.md:24-28):** restringen al agente (revisar comandos, no `curl | sh`, pinnear versiones, chunks remotos solo first-party firmados). No amplían permisos. Pero las references las incumplen (`@latest`), por eso P6 queda en 🚨 según la regla de consistencia del auditor líder.
- **`agents/` folder:** solo `openai.yaml` con metadatos de UI de Codex; no agrega herramientas, permisos ni prompts ocultos. `POWER.md` es el formato "power" (Kiro); Claude Code no lo usa.
- **bundle-code-splitting.md:** habla de carga remota de JS (Re.Pack). El contenido es de *endurecimiento* (allowlist, manifiesto firmado, `verifyScriptSignature: 'strict'`, fail-closed) y desaconseja adoptarlo; no es un vector.
- **Adaptación local para hacerla instalable (copia fija, no vía plugin/marketplace):**
  1. `references/js-react-compiler.md:48` y `:256` → reemplazar `npx react-compiler-healthcheck@latest` por versión explícita verificada (`npx react-compiler-healthcheck@<x.y.z>`) y cambiar "Always run" por "Proponer a Felipe ejecutar".
  2. `references/native-turbo-modules.md:48,56,69` → `npx create-react-native-library@<x.y.z>`.
  3. `references/js-react-compiler.md:82,88` → `@<x.y.z>` en lugar de `@latest`; `:61,64` versión exacta en lugar de `@beta`.
  4. Añadir en `SKILL.md` (sección Security Notes) una regla local: "`agent-device` no está instalado: usar el fallback manual (React Native DevTools → Profiler). No instalar CLIs, extensiones ni ejecutar `npx` de herramientas fuera de `package.json` (source-map-explorer, bundle-stats, expo-atlas, bundle-phobia-cli, sharp-cli, flashlight) sin versión fijada y aprobación explícita."
  5. Opcional: eliminar `POWER.md` y `agents/openai.yaml` (no los usa Claude Code; menos superficie).
- Tras aplicar 1-3 la skill pasaría a P6 ⚠️ (solo `npx` opcionales sin versión), es decir 🟢 SEGURA según la regla de veredicto.
