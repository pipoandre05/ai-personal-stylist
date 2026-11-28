# 🔍 Auditoría de Seguridad — expo-upgrade

**Fecha:** 2026-11-27 22:30
**Skill auditada:** expo-upgrade — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-upgrade` (copia local en scratchpad `untrusted/audit-set/expo-upgrade`)
**Líneas analizadas:** 843
**Archivos analizados:** `SKILL.md` (145), `agents/openai.yaml` (4), `references/expo-av-to-audio.md` (132), `references/expo-av-to-video.md` (160), `references/native-tabs.md` (124), `references/new-architecture.md` (79), `references/react-19.md` (79), `references/react-compiler.md` (59), `references/react-navigation-to-expo-router.md` (61)

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-upgrade |
| Función declarada | Guía para actualizar versiones del SDK de Expo y arreglar problemas de dependencias |
| Archivos bundleados | `agents/openai.yaml` y 7 referencias de migración (React 19, New Architecture, React Compiler, native tabs, expo-av→audio/video, react-navigation→expo-router) |
| Tools explícitas | Bash implícito: `npx @expo/agent-cli`, `rm -rf`, `watchman`, `pod install`, `./gradlew clean`, `npx expo-codemod`, `bunx xcobra` |
| MCPs mencionados | Ninguno |
| URLs externas | `https://exp.host/--/api/v2/versions` (:21, API pública de versiones de Expo), `https://expo.dev/changelog`, `https://docs.expo.dev/...` (varias); en ejemplos: `https://example.com/video.mp4` |
| Dependencias | `@expo/agent-cli@latest` vía `npx --yes`; `expo@latest`, `expo@next` (beta); `expo-codemod` sin versión; `xcobra` vía `bunx` sin versión |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Hay restricciones de consejo técnico ("Do not guide users to opt in to or out of Hermes V1", "Do not recommend Worklets Bundle Mode"), que son política de soporte con motivo explícito, no órdenes ocultas.
**Evidencia:** SKILL.md:135, 137

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": `feedback` del agent CLI envía a Expo detalles del proyecto y del entorno, condicionado al consentimiento; no hay variante sin consentimiento. La consulta a `exp.host/--/api/v2/versions` es de lectura y pertenece al servicio declarado.
**Evidencia:** SKILL.md:144-145 "Do not send a report before the user agrees… the report also carries project and environment details."

### P3 · Ejecución de Código Malicioso
**Estado:** ⚠️
**Hallazgo:** Limpiezas legítimas pero destructivas: `rm -rf node_modules .expo` (dentro del proyecto, recuperable con reinstalación); `watchman watch-del-all` (borra los watches de **todos** los proyectos de la máquina, fuera del proyecto, aunque inocuo); `prebuild --clean` regenera `ios/` y `android/` y puede borrar cambios nativos hechos a mano (la skill pide verificar antes); borrar `babel.config.js`/`metro.config.js` y parches en `patches/`. Todo coherente con la función, sin descargas canalizadas a shell ni escrituras de sistema.
**Evidencia:** SKILL.md:44 `rm -rf node_modules .expo`; :45 `watchman watch-del-all`; :63 `npx --yes @expo/agent-cli@latest prebuild --clean` y :66 "Ensure the project is not a bare workflow app before running this command."; :86-87, :116

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No lee `.env`, keychain ni variables sensibles; no pide tokens.
**Evidencia:** N/A

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin evidencia.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** 🚨
**Hallazgo:** Ordena ejecutar `npx --yes @expo/agent-cli@latest` (versión más nueva sin fijar, sin confirmación) en 12 lugares; además ejecuta `npx expo-codemod` sin versión y `bunx xcobra` (paquete de terceros, no publicado por Expo en este repo) sin versión, y ofrece instalar betas (`expo@next`). El comportamiento remoto puede cambiar sin revisión. Mitigable fijando versiones y quitando `--yes` en una copia local.
**Evidencia:** SKILL.md:24, 34, 35, 38, 43, 63, 73, 85; references/new-architecture.md:54, 76, 77; references/react-compiler.md:56 (`npx --yes @expo/agent-cli@latest …`); references/react-navigation-to-expo-router.md:18, 22 (`npx expo-codemod …`); references/new-architecture.md:72 (`bunx xcobra expo eval "_IS_FABRIC"`)

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** Cambios de dependencias, configuración y limpieza de cachés corresponden a la función declarada. No toca builds en la nube, tiendas ni credenciales. Pide confirmar con el usuario antes de aplicar en masa cambios por imports deprecados.
**Evidencia:** references/react-navigation-to-expo-router.md:51 "Wait for the user to confirm before mass-applying further changes."

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, hex, ancho cero, bidi ni controles. No-ASCII: solo — y →.
**Evidencia:** Escaneo `rg --pcre2` de caracteres invisibles/controles: 0 coincidencias.

### P9 · Persistencia
**Estado:** ⚠️
**Hallazgo:** Instruye editar archivos de instrucciones del agente (`AGENTS.md`) para actualizar links de documentación versionada. El alcance declarado es acotado (solo links `docs.expo.dev/versions/`), pero es escritura en un archivo que persiste entre sesiones y gobierna al agente; requiere revisar el diff. No escribe en directorios de skills ni en `~/.claude`.
**Evidencia:** SKILL.md:79 "Update versioned docs links in agent instruction files (`AGENTS.md`)… Search for `docs.expo.dev/versions/` and bump each link to the new SDK version."

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** Sin evidencia; pide mostrar al usuario las deprecaciones con motivo y reemplazo.
**Evidencia:** references/react-navigation-to-expo-router.md:9, 51

---

## 📊 Resumen Ejecutivo

| Punto | Categoría | Estado |
|-------|-----------|--------|
| P1 | Prompt Injection | ✅ |
| P2 | Exfiltración de Datos | ⚠️ |
| P3 | Código Malicioso | ⚠️ |
| P4 | Robo de Credenciales | ✅ |
| P5 | Suplantación | ✅ |
| P6 | Supply Chain | 🚨 |
| P7 | Alcance Excesivo | ✅ |
| P8 | Ofuscación | ✅ |
| P9 | Persistencia | ⚠️ |
| P10 | Manipulación Output | ✅ |

**Vulnerabilidades detectadas (🚨):** 1
**Puntos sospechosos (⚠️):** 3

---

## 🏁 Veredicto

🟡 SOSPECHOSA

**Una vulnerabilidad de supply chain (`npx --yes @expo/agent-cli@latest`, `expo-codemod` y `bunx xcobra` sin versión). Sin indicios de malicia.**

> Revisar hallazgo antes de instalar. No instalar sin validación manual.

---

## 📝 Notas del Auditor

- Adaptación local necesaria para instalar:
  1. SKILL.md:24, 34, 35, 38, 43, 63, 73, 85; references/new-architecture.md:54, 76, 77; references/react-compiler.md:56: `npx --yes @expo/agent-cli@latest` → `npx @expo/agent-cli@<versión-verificada>` (sin `--yes`), o usar el CLI local del proyecto (`npx expo install --fix`, `npx expo prebuild --clean`, `npx expo start --clear`).
  2. references/react-navigation-to-expo-router.md:18, 22: fijar `npx expo-codemod@<versión>`.
  3. references/new-architecture.md:72: eliminar la línea `bunx xcobra …` o fijar versión tras revisar el paquete.
  4. SKILL.md:24 y :34: reemplazar `expo@next` / `expo@latest` por un objetivo de SDK explícito aprobado (la propia skill recomienda `expo@57.0.9` o superior, :29).
  5. SKILL.md:45: limitar `watchman watch-del-all` a `watchman watch-del "$PWD"`.
  6. SKILL.md:63: exigir aprobación explícita antes de `prebuild --clean`.
  7. SKILL.md:79: exigir mostrar el diff antes de editar `AGENTS.md`/`CLAUDE.md`.
  8. SKILL.md:143-145: conservar o eliminar "Submitting Feedback"; nunca ejecutar `feedback` sin un sí explícito.
