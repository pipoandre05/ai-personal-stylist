# 🔍 Auditoría de Seguridad — expo-web-to-native

**Fecha:** 2026-11-27 22:30
**Skill auditada:** expo-web-to-native — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-web-to-native` (copia local en scratchpad `untrusted/audit-set/expo-web-to-native`)
**Líneas analizadas:** 340
**Archivos analizados:** `SKILL.md` (86), `agents/openai.yaml` (4), `references/false-friends.md` (119), `references/native-patterns.md` (39), `references/run-as-goal.md` (48), `references/verify-on-device.md` (44)

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-web-to-native |
| Función declarada | Migrar una app web React (Next.js/Vite/CRA) a app nativa iOS/Android con Expo, pantalla por pantalla (shell DOM primero, luego nativizar) |
| Archivos bundleados | `agents/openai.yaml`, `references/false-friends.md`, `references/native-patterns.md`, `references/run-as-goal.md`, `references/verify-on-device.md` |
| Tools explícitas | Bash implícito (npx, npm, xcrun simctl, adb), comando de loop `/goal` del harness, escritura de `migration-progress.md` y `migration-goal.md` en el proyecto |
| MCPs mencionados | Ninguno. CLIs de agente externas: `agent-browser` (vercel-labs), `argent` (`@swmansion/argent`), `@expo/agent-cli` |
| URLs externas | `https://expo.dev/blog/from-web-to-native-with-react` (SKILL.md:9, 82) |
| Dependencias | `@expo/agent-cli@latest` vía `npx --yes`; `agent-browser` y `@swmansion/argent` vía `npm i -g` sin versión; `agent-browser install` (descarga Chrome). Paquetes de app citados sin comando de instalación (`@expo/ui`, `expo-router`, `expo-sqlite`, `expo-secure-store`, etc.) |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ⚠️
**Hallazgo:** No hay frases de override, autoridad falsa ni instrucciones ocultas. Sí hay instrucciones dirigidas al agente que amplían su autonomía más allá del pedido del usuario: el "primer movimiento" es escribir y lanzar un objetivo de loop (`/goal`) que se reinyecta cada turno y obliga a releer la skill en cada iteración. Es flujo de trabajo legítimo, pero cambia el modo de operación del agente a desatendido sin que el usuario lo pida explícitamente.
**Evidencia:** SKILL.md:32 "the first move is to **write the goal objective and launch it** — not to grind screens by hand… Then run `/goal` with it"; run-as-goal.md:22 "Each iteration, FIRST re-read the playbook - plugins/expo/skills/expo-web-to-native/SKILL.md"

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** La sección "Submitting Feedback" indica usar el comando `feedback` del agent CLI, que envía a Expo un reporte que incluye detalles del proyecto y del entorno. Está condicionado al consentimiento del usuario ("Do not send a report before the user agrees") y, sin usuario, solo deja el comando en el resumen. No se encontró variante sin consentimiento. Además, el flujo de verificación sugiere abrir la **URL desplegada** (producción) con `agent-browser` y capturar snapshots/screenshots (verify-on-device.md:21), datos que quedan locales.
**Evidencia:** SKILL.md:85-86 "Do not send a report before the user agrees… tell the user that the report also carries project and environment details."

### P3 · Ejecución de Código Malicioso
**Estado:** ⚠️
**Hallazgo:** No hay `rm -rf`, `curl | bash` ni escrituras a `/etc`, `~/.ssh` o shell rc. Sí instruye instalar binarios globales (`npm i -g`) y que `agent-browser install` descargue su propio Chrome; además lanza servidores de desarrollo en segundo plano (`--detach`). La instalación está condicionada a preguntar al usuario, pero la skill presiona para no aceptar alternativa ("don't fall back to manual screenshots").
**Evidencia:** verify-on-device.md:15-16 `which agent-browser || (npm i -g agent-browser && agent-browser install)` / `which argent || npm i -g @swmansion/argent`; SKILL.md:74 "if `agent-browser` or `argent` isn't installed, ask the user and install it before proceeding — don't fall back to manual screenshots."

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No lee `.env`, keychain ni variables sensibles; no pide tokens en el chat. Las menciones a tokens son guía de arquitectura (guardar el token en `expo-secure-store`, usar `EXPO_PUBLIC_` solo para valores públicos). El loop marca como bloqueada una pantalla que requiera "a secret you can't supply" en vez de buscarlo.
**Evidencia:** false-friends.md:59, 69-70, 82; run-as-goal.md:36 "(missing backend/auth/data, or a secret you can't supply), don't loop — mark it blocked"

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin instrucciones de cambiar identidad, ocultar que es Claude ni plantillas que imiten entidades reales. Las frases "look like Apple/Google shipped it" son criterio de diseño de UI.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** 🚨
**Hallazgo:** Ordena descargar y ejecutar la última versión no fijada de `@expo/agent-cli` con `npx --yes` (sin confirmación de npm), e instalar globalmente `agent-browser` y `@swmansion/argent` sin versión. El comportamiento remoto puede cambiar sin revisión aunque el publicador sea oficial/conocido. Mitigable fijando versiones y quitando `--yes` en una copia local.
**Evidencia:** verify-on-device.md:32 `npx --yes @expo/agent-cli@latest dev --ios --go --detach --wait-ready`; :33 `npx --yes @expo/agent-cli@latest navigate …`; :36 (dos veces, `dev --android` y `navigate`); :15-16 `npm i -g agent-browser`, `npm i -g @swmansion/argent`

### P7 · Alcance Excesivo
**Estado:** ⚠️
**Hallazgo:** Para un bot de código desatendido, la skill empuja explícitamente a correr la migración sin supervisión ("can run unattended"), con instalación global de herramientas, control de simuladores y navegación del sitio desplegado. El paso 6 deriva builds de tienda y EAS Update a otra skill (`eas-app-stores`) sin ejecutarlos aquí, y el loop nunca toca "nativize-later". No empuja a builds/submit sin el usuario, por eso ⚠️ y no 🚨.
**Evidencia:** SKILL.md:57 "It's a loop over a durable worklist, so it can run unattended - hand it to a goal loop"; SKILL.md:65 "`eas-app-stores` for the store builds (App Store / Play / TestFlight), EAS Update for OTA pushes after."; run-as-goal.md:42 "never touch \"nativize-later\" items."

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, escapes hex, caracteres de ancho cero, bidi ni de control. Los no-ASCII son tipográficos (— → · – …) en prosa y diagramas.
**Evidencia:** Escaneo `rg --pcre2` de U+200B-200F, U+202A-202E, U+2060-2064, U+FEFF, U+00A0, tags U+E0000 y controles C0: 0 coincidencias.

### P9 · Persistencia
**Estado:** ⚠️
**Hallazgo:** No escribe en `~/.claude` ni en directorios de skills. Pero el modo B escribe `migration-goal.md` en el proyecto con un objetivo que, al relanzarse, reinyecta las instrucciones de la skill cada turno (persistencia de instrucciones entre sesiones), y las instalaciones `npm i -g` dejan binarios persistentes en el sistema. Además el objetivo apunta a una ruta del repo de origen (`plugins/expo/skills/...`) que, instalada localmente, puede no existir o resolver a otro archivo.
**Evidencia:** run-as-goal.md:13 "Write the filled-in objective to `migration-goal.md` in the project"; run-as-goal.md:22 ruta `plugins/expo/skills/expo-web-to-native/SKILL.md`

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** No oculta errores ni altera resultados; al contrario, exige verificar ejecutando y reportar pantallas bloqueadas con motivo.
**Evidencia:** run-as-goal.md:38-40 "\"<screen> — blocked: <reason> — needs <what would unlock>\""

---

## 📊 Resumen Ejecutivo

| Punto | Categoría | Estado |
|-------|-----------|--------|
| P1 | Prompt Injection | ⚠️ |
| P2 | Exfiltración de Datos | ⚠️ |
| P3 | Código Malicioso | ⚠️ |
| P4 | Robo de Credenciales | ✅ |
| P5 | Suplantación | ✅ |
| P6 | Supply Chain | 🚨 |
| P7 | Alcance Excesivo | ⚠️ |
| P8 | Ofuscación | ✅ |
| P9 | Persistencia | ⚠️ |
| P10 | Manipulación Output | ✅ |

**Vulnerabilidades detectadas (🚨):** 1
**Puntos sospechosos (⚠️):** 5

---

## 🏁 Veredicto

🟡 SOSPECHOSA

**Una vulnerabilidad de supply chain (ejecución de paquetes `@latest` sin fijar y con `--yes`, más instalaciones globales sin versión). No hay indicios de malicia; el riesgo es estructural.**

> Revisar hallazgo antes de instalar. No instalar sin validación manual.

---

## 📝 Notas del Auditor

- Fuente oficial (repo `expo/skills`); los hallazgos son de diseño, no de intención maliciosa.
- Adaptación local necesaria para instalar:
  1. verify-on-device.md:32, 33, 36: reemplazar `npx --yes @expo/agent-cli@latest` por `npx @expo/agent-cli@<versión-verificada>` (sin `--yes`), o fijarlo como devDependency y usarlo desde el lockfile.
  2. verify-on-device.md:15-16: fijar `agent-browser@<versión>` y `@swmansion/argent@<versión>`, preferir `npx` sobre `npm i -g`, y exigir aprobación explícita antes de `agent-browser install`.
  3. SKILL.md:74: eliminar "don't fall back to manual screenshots" para permitir verificación con las herramientas ya aprobadas del proyecto (por ejemplo el Browser pane o Playwright).
  4. SKILL.md:32 y :57, run-as-goal.md: quitar el lanzamiento automático de `/goal`; el loop desatendido solo con aprobación de Felipe. Corregir la ruta de run-as-goal.md:22 a la ruta de instalación local.
  5. SKILL.md:84-86: conservar o eliminar la sección "Submitting Feedback" según política; si se conserva, nunca ejecutar `feedback` sin un sí explícito.
- Referencias a skills hermanas no incluidas en este set (`expo-dom`, `expo-router`, `eas-hosting`, `eas-app-stores`, `expo-overview/references/launch-without-dev-menu.md`): su contenido no fue auditado aquí.
- Para este proyecto (PWA Next.js en Vercel): la migración a nativo choca con CLAUDE.md (1 sesión = 1 feature, Sonnet construye, revisión visual de Felipe); el modo loop desatendido no es compatible con ese flujo.
