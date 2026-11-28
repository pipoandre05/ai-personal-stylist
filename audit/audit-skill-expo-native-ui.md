# 🔍 Auditoría de Seguridad — expo-native-ui

**Fecha:** 2026-11-27 22:28
**Skill auditada:** expo-native-ui — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-native-ui` (copia local: `scratchpad/untrusted/audit-set/expo-native-ui`)
**Líneas analizadas:** 1888
**Archivos analizados:** `SKILL.md`, `agents/openai.yaml`, `references/controls.md`, `references/gradients.md`, `references/icons.md`, `references/media.md`, `references/storage.md`, `references/visual-effects.md`, `references/webgpu-three.md`

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-native-ui |
| Función declarada | Construir pantallas Expo con aspecto nativo: estilo HIG, colores semánticos, controles nativos, SF Symbols, media, efectos visuales, gradientes, almacenamiento y layout responsivo |
| Archivos bundleados | 9 archivos (SKILL.md, agents/openai.yaml, 7 references/*.md). Sin scripts ni binarios |
| Tools explícitas | Shell para `npx --yes @expo/agent-cli@latest {status,start,dev,dev:stop}`, `npx --yes eas-cli@latest build`, `npm install … --legacy-peer-deps`; "agent CLI" `feedback` |
| MCPs mencionados | Ninguno |
| URLs externas | developer.apple.com (SF Symbols), example.com (video ilustrativo), stream.nightride.fm (stream de audio ilustrativo) |
| Dependencias | `@expo/agent-cli@latest`, `eas-cli@latest` (no fijadas, con `--yes`); `react-native-wgpu@^0.4.1`, `three@0.172.0`, `@react-three/fiber@^9.4.0`, `wgpu-matrix@^3.0.2`, `@types/three@0.172.0`; paquetes `expo-*` y comunitarios mencionados en ejemplos |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Las instrucciones imperativas ("CRITICAL: Always try Expo Go first", "Never use AsyncStorage", "Use this skill for ANY 3D graphics…") son reglas de workflow/estilo coherentes con la función. No hay reclamos de autoridad, órdenes ocultas en comentarios ni condiciones encubiertas. La instrucción de cargar otras skills (`expo-ui`, `expo-data-fetching`, `expo-animation`) es enrutamiento legítimo.
**Evidencia:** N/A

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": el comando `feedback` del agent CLI envía a Expo un reporte con detalles del proyecto y del entorno. Condicionado al consentimiento del usuario y con prohibición de incluir secretos/datos personales. No se encontró variante sin consentimiento. Las URLs de los ejemplos de código son ilustrativas (`https://example.com/video.mp4`, `https://stream.nightride.fm/rektory.mp3` como fuente de audio de muestra en un ejemplo de `useAudioPlayer`); no envían datos del usuario.
**Evidencia:** `SKILL.md:196-197` — "Do not send a report before the user agrees." / "the report also carries project and environment details"; `references/media.md:86` y `:138` (URLs ilustrativas)

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** No hay scripts bundleados ni patrones `curl | bash`, `rm -rf`, escrituras a rutas del sistema ni cron/launchd. Los comandos que indica ejecutar (agent CLI, eas-cli, npm install) son de tooling oficial; su riesgo de origen se evalúa en P6 y su alcance en P7. El código de ejemplo escribe solo en `Paths.cache` de la app (helper Base64).
**Evidencia:** N/A

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No lee `.env`, keychain ni credenciales del entorno del desarrollador. `process.env.EXPO_OS` es una constante de plataforma de Expo, no un secreto. `references/storage.md` recomienda `expo-secure-store` para tokens/contraseñas de la app (buena práctica). No pide pegar tokens en el chat.
**Evidencia:** `SKILL.md:75` — "`process.env.EXPO_OS` not `Platform.OS`"; `references/storage.md:25` — "Sensitive data (tokens, passwords) | `expo-secure-store`"

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin instrucciones de cambiar o esconder la identidad de Claude ni plantillas que suplanten entidades.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** 🚨
**Hallazgo:** La skill instruye repetidamente al agente a descargar y ejecutar la última versión, sin fijar, de paquetes npm y con `--yes` (sin confirmación de instalación). Aunque el publicador es oficial (Expo), el comportamiento remoto puede cambiar en cualquier momento sin revisión: una versión comprometida o con cambios de comportamiento se ejecutaría automáticamente. Además, `webgpu-three.md` usa rangos con `^` (no fijados) y `--legacy-peer-deps`, que desactiva la resolución estricta de dependencias. Mitigable fijando versiones exactas y quitando `--yes` en una copia local.
**Evidencia:** `SKILL.md:32` — "`npx --yes @expo/agent-cli@latest dev --ios --dev-client`"; `SKILL.md:34-35,37` — "`npx --yes @expo/agent-cli@latest status`", "`… start`", "`… dev:stop`"; `SKILL.md:41` — "`npx --yes eas-cli@latest build`"; `references/webgpu-three.md:22` — "`npm install react-native-wgpu@^0.4.1 … @react-three/fiber@^9.4.0 wgpu-matrix@^3.0.2 … --legacy-peer-deps`"; `references/webgpu-three.md:500,503` — "`npx --yes @expo/agent-cli@latest dev --ios --dev-client --detach --wait-ready`"

### P7 · Alcance Excesivo
**Estado:** ⚠️
**Hallazgo:** Para un bot de código desatendido, la skill habilita comandos que van más allá de editar UI: `npx --yes eas-cli@latest build` lanza builds en la nube de Expo (requiere cuenta/credenciales EAS, consume cuota y puede tener costo), y el flag `--eas` del agent CLI dispara un build EAS. `dev` además ejecuta `prebuild` (regenera `ios/` y `android/`). Están acotados a "ONLY when using…" y se sugiere `--plan` primero, pero no se exige confirmación humana. No hay comandos de envío a tiendas (`submit`) ni de gestión de credenciales.
**Evidencia:** `SKILL.md:41` — "or `npx --yes eas-cli@latest build`) ONLY when using:"; `references/webgpu-three.md:503` — "`dev` runs prebuild and the native build when the project needs them. If this machine cannot build, `dev` only describes an EAS build, and runs one only with `--eas`."

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** No hay payloads Base64 embebidos. El único uso de Base64 es el helper legítimo `base64ToLocalUri` en `references/media.md:175-192`, que decodifica con `atob` una imagen recibida en runtime para guardarla en la caché de la app antes de `MediaLibrary.saveToLibraryAsync`; no contiene datos codificados ni ejecuta lo decodificado. Sin caracteres invisibles/bidi/de control (verificado por rango Unicode); los no ASCII son tipográficos y de dibujo de árbol (— → ├ └ │ ◀ ▶).
**Evidencia:** `references/media.md:183` — "const binaryString = atob(base64);" (decodificación de datos de imagen, uso legítimo)

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe en `~/.claude`, en otras skills ni en configuración global. Sin auto-actualización de la skill. (El uso de `@latest` es auto-actualización del tooling, ya contabilizado en P6.)
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** No instruye ocultar errores ni resultados. Al contrario, exige reportar qué se probó y qué no se pudo ejecutar.
**Evidencia:** `SKILL.md:104` — "Report what you exercised and what you could not run."

---

## 📊 Resumen Ejecutivo

| Punto | Categoría | Estado |
|-------|-----------|--------|
| P1 | Prompt Injection | ✅ |
| P2 | Exfiltración de Datos | ⚠️ |
| P3 | Código Malicioso | ✅ |
| P4 | Robo de Credenciales | ✅ |
| P5 | Suplantación | ✅ |
| P6 | Supply Chain | 🚨 |
| P7 | Alcance Excesivo | ⚠️ |
| P8 | Ofuscación | ✅ |
| P9 | Persistencia | ✅ |
| P10 | Manipulación Output | ✅ |

**Vulnerabilidades detectadas (🚨):** 1
**Puntos sospechosos (⚠️):** 2

---

## 🏁 Veredicto

🟡 SOSPECHOSA

**Una vulnerabilidad de supply chain: ejecución automática (`--yes`) de paquetes npm sin versión fijada (`@latest`). No hay indicios de intención maliciosa; el riesgo es estructural y mitigable.**

> Revisar hallazgo antes de instalar. No instalar sin validación manual. Instalable tras adaptar una copia local:
> 1. Reemplazar cada `npx --yes @expo/agent-cli@latest` por `npx @expo/agent-cli@<versión exacta revisada>` (sin `--yes`), o por los equivalentes del expo instalado en el proyecto (`npx expo start`, `npx expo run:ios`).
> 2. Reemplazar `npx --yes eas-cli@latest build` por `npx eas-cli@<versión exacta> build` y añadir: "Nunca lanzar builds EAS ni usar `--eas` sin aprobación explícita de Felipe".
> 3. En `references/webgpu-three.md`, fijar versiones exactas (`react-native-wgpu@0.4.1`, `@react-three/fiber@9.4.0`, `wgpu-matrix@3.0.2`) y quitar `--legacy-peer-deps` salvo error ERESOLVE confirmado.
> 4. Eliminar la sección "Submitting Feedback" (`SKILL.md:195-197`) o dejarla solo con consentimiento explícito.

---

## 📝 Notas del Auditor

- El publicador es oficial (repo `expo/skills`); el 🚨 responde a la política de consistencia del auditor principal: `@latest` + `--yes` = comportamiento remoto que cambia sin revisión.
- `npx expo …` dentro del proyecto (usa el expo instalado) sería ✅; aquí el problema son solo los paquetes externos `@expo/agent-cli` y `eas-cli`.
- La skill remite a skills no incluidas en este set (`expo-ui`, `expo-data-fetching`); si se instalan, auditarlas por separado.
- `webgpu-three.md` menciona `@/lib/orbit-controls` ("See the full implementation in the lib files"), pero ese archivo no viene bundleado; no es un riesgo, solo una referencia rota.
