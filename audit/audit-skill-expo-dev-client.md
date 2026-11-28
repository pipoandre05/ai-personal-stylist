# 🔍 Auditoría de Seguridad — expo-dev-client

**Fecha:** 2026-11-27 22:30
**Skill auditada:** expo-dev-client — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-dev-client` (copia local en scratchpad `untrusted/audit-set/expo-dev-client`)
**Líneas analizadas:** 187
**Archivos analizados:** `SKILL.md` (183), `agents/openai.yaml` (4)

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-dev-client |
| Función declarada | Construir y distribuir development clients de Expo, en local o vía TestFlight, para pruebas internas |
| Archivos bundleados | `agents/openai.yaml` |
| Tools explícitas | Bash implícito: `npx eas-cli`, `npx @expo/agent-cli`, `tar`, `xcrun simctl install`, `ideviceinstaller`, `adb install` |
| MCPs mencionados | Ninguno |
| URLs externas | `https://expo.dev/pricing` (:9), `https://docs.expo.dev/develop/development-builds/introduction/` (:13); deep link plantilla `<scheme>://expo-development-client/?url=…` (:159) |
| Dependencias | `eas-cli@latest` y `@expo/agent-cli@latest` vía `npx --yes` (sin versión fija); `eas.json` con `"cli": {"version": ">= 16.0.1"}` |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Instrucciones operativas normales.
**Evidencia:** N/A

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": el comando `feedback` del agent CLI envía a Expo detalles del proyecto y del entorno, condicionado al consentimiento del usuario. No hay variante sin consentimiento. Los builds en la nube (EAS) suben el proyecto a Expo, que es la función declarada.
**Evidencia:** SKILL.md:182-183 "Do not send a report before the user agrees… the report also carries project and environment details."

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** Sin borrados, descargas canalizadas a shell ni escrituras de sistema. `tar -xzf`, `xcrun simctl install`, `ideviceinstaller -i` y `adb install` instalan el artefacto construido localmente, coherente con la función. `--clear-cache` limpia caché de build de EAS, no archivos locales.
**Evidencia:** SKILL.md:97-98, 105, 111, 172

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No lee `.env`, keychain ni pide tokens en el chat. `eas credentials` es el gestor interactivo de certificados de firma de EAS (función declarada); su riesgo de alcance se evalúa en P7.
**Evidencia:** SKILL.md:166 `npx --yes eas-cli@latest credentials`

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin evidencia.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** 🚨
**Hallazgo:** Todos los comandos usan `npx --yes <pkg>@latest`: descargan y ejecutan la versión más nueva sin fijar y sin confirmación. El comportamiento remoto puede cambiar sin revisión aunque el publicador sea oficial. Mitigable fijando versiones y quitando `--yes` en una copia local.
**Evidencia:** SKILL.md:59, 80, 83, 118, 121, 124, 131, 134, 166, 172, 178 `npx --yes eas-cli@latest …`; SKILL.md:149, 152, 157 `npx --yes @expo/agent-cli@latest …`

### P7 · Alcance Excesivo
**Estado:** ⚠️
**Hallazgo:** Comandos con efecto en la nube y en cuentas: builds EAS pagados (minutos del plan), envío automático a App Store Connect con `--submit`, y gestión de credenciales de firma. La skill avisa del costo y recomienda `--plan` antes de `dev`, y deja el build EAS detrás de `--eas`; no empuja a ejecutarlos sin el usuario, por eso ⚠️ y no 🚨. Para un bot desatendido, estos comandos deben requerir aprobación explícita.
**Evidencia:** SKILL.md:59 `npx --yes eas-cli@latest build -p ios --profile development --submit` ("2. Automatically submit to App Store Connect", :65); SKILL.md:9 "cloud builds are paid"; SKILL.md:155 "It runs one only with `--eas`, which uses EAS credits. Run `dev --ios --dev-client --plan` first"

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Archivo 100 % ASCII. Sin Base64, hex ni caracteres invisibles.
**Evidencia:** Escaneo de no-ASCII: 0 caracteres.

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe en directorios de skills ni en configuración del agente. Pide asegurar un perfil en `eas.json` del proyecto (configuración del propio proyecto, función declarada). `appVersionSource: "remote"` mueve la fuente de verdad del número de versión a EAS; es decisión de producto, no persistencia maliciosa.
**Evidencia:** SKILL.md:24-52

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** Sin evidencia.
**Evidencia:** N/A

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

**Una vulnerabilidad de supply chain (`npx --yes … @latest` en 14 comandos). Sin indicios de malicia.**

> Revisar hallazgo antes de instalar. No instalar sin validación manual.

---

## 📝 Notas del Auditor

- Adaptación local necesaria para instalar:
  1. SKILL.md:59, 80, 83, 118, 121, 124, 131, 134, 166, 172, 178: `npx --yes eas-cli@latest` → `npx eas-cli@<versión-verificada>` (sin `--yes`), coherente con `cli.version` de `eas.json`; o fijar `eas-cli` como devDependency.
  2. SKILL.md:149, 152, 157: `npx --yes @expo/agent-cli@latest` → `npx @expo/agent-cli@<versión-verificada>`.
  3. SKILL.md:56-59: quitar `--submit` del comando por defecto o anteponer "pedir aprobación explícita antes de enviar a App Store Connect".
  4. SKILL.md:166: anteponer "solo con aprobación del usuario" a `eas credentials`.
  5. SKILL.md:181-183: conservar o eliminar "Submitting Feedback"; nunca ejecutar `feedback` sin un sí explícito.
- Referencia a `../expo-overview/references/launch-without-dev-menu.md` (:159): archivo de otra skill, no auditado en este set.
