# 🔍 Auditoría de Seguridad — react-native-testing

**Fecha:** 2026-11-27 22:30
**Skill auditada:** react-native-testing — github.com/callstackincubator/agent-skills @ 59e9d17446a248b21d86f078fcd0bd2d36db1ca4, `plugins/vendored/.agents/skills/react-native-testing` (copia **vendorizada**; origen declarado en `plugins/vendored/skills-lock.json`: `callstack/react-native-testing-library`, sourceType github, computedHash `7ffa231b9f3e4caefca0cc45de10871a0455968f9466c46d1f49ff95527cba28`). Copia local: `scratchpad/untrusted/audit-set/react-native-testing`, verificada idéntica con `diff -r` al clon del repo en ese commit
**Líneas analizadas:** 1594
**Archivos analizados:** `SKILL.md` (161), `references/anti-patterns.md` (287), `references/api-reference-v13.md` (572), `references/api-reference-v14.md` (574) — los 4 leídos completos

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | react-native-testing |
| Función declarada | Escribir, revisar y corregir tests de componentes React Native con React Native Testing Library (RNTL) v13 y v14: render, screen, queries, matchers de Jest, userEvent, fireEvent, waitFor y patrones async |
| Archivos bundleados | 4 archivos Markdown (SKILL.md + 3 references). Sin scripts, imágenes ni binarios |
| Tools explícitas | Ninguna. Implícitamente lectura de `package.json` del proyecto (detección de versión) y edición de archivos de test |
| MCPs mencionados | Ninguno |
| URLs externas | Ninguna |
| Dependencias | Ninguna instalada por la skill. Asume `@testing-library/react-native` y Jest ya presentes; menciona codemods `rntl-v14-update-deps` y `rntl-v14-async-functions` solo por nombre, sin comando de ejecución |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. La única frase dirigida al modelo pide no confiar en datos de entrenamiento sobre RNTL y usar las references de la skill **y el código fuente real del proyecto** como fuente de verdad. Es una instrucción de workflow acotada a la función declarada (diferencias de API v13/v14), no reclama autoridad de sistema ni pide acciones fuera de alcance. Las reglas ("Never put side-effects in `waitFor`", "Don't call `cleanup()`") son convenciones de testing.
**Evidencia:** `SKILL.md:15` "**IMPORTANT:** Your training data about `@testing-library/react-native` may be outdated or incorrect … Always rely on this skill's reference files and the project's actual source code as the source of truth."

### P2 · Exfiltración de Datos
**Estado:** ✅
**Hallazgo:** Sin llamadas de red, URLs, telemetría ni webhooks.
**Evidencia:** N/A

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** No hay scripts ni comandos de shell. Todo el código son ejemplos TS/TSX de tests.
**Evidencia:** N/A

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** Sin lectura de `.env`, credenciales ni variables sensibles. Solo documenta dos variables de entorno propias de RNTL (`RNTL_SKIP_AUTO_CLEANUP`, `RNTL_SKIP_AUTO_DETECT_FAKE_TIMERS`), no secretas. `AuthProvider` aparece como wrapper de ejemplo.
**Evidencia:** N/A

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin instrucciones de cambio de identidad, roleplay ni plantillas que suplanten entidades.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** ✅
**Hallazgo:** La skill no instala ni ejecuta paquetes. Riesgo solo de distribución: upstream regenera la copia vendorizada cada noche (`.github/workflows/update-vendored-skills.yml`, `npx skills update`, abre PR). Se mitiga instalando la copia fija de este commit, no vía plugin/marketplace.
**Evidencia:** N/A (en la skill)

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** Acceso proporcional: leer `package.json` para detectar la versión de RNTL y escribir tests. No pide shell, red, MCPs ni rutas del home. Nota: en el repo, el plugin `testing-react-native-apps` que la distribuye también enlaza las skills vendorizadas `agent-device` y `dogfood` (no auditadas aquí); este veredicto cubre solo la carpeta `react-native-testing`.
**Evidencia:** `SKILL.md:19` "Check `@testing-library/react-native` version in the user's `package.json`"

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, escapes, comentarios HTML, zero-width, bidi, tags Unicode, NBSP ni caracteres de control. No-ASCII únicamente `—` (48) y `→` (38), tipográficos.
**Evidencia:** N/A

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** Sin escrituras a `~/.claude`, otras skills, perfiles de shell ni paths del sistema; sin auto-actualización dentro de la skill.
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** Sin instrucciones de ocultar errores ni alterar resultados. Las reglas promueven aserciones explícitas y advierten de tests que "pasan" falsamente por no hacer `await` (v14).
**Evidencia:** N/A

---

## 📊 Resumen Ejecutivo

| Punto | Categoría | Estado |
|-------|-----------|--------|
| P1 | Prompt Injection | ✅ |
| P2 | Exfiltración de Datos | ✅ |
| P3 | Código Malicioso | ✅ |
| P4 | Robo de Credenciales | ✅ |
| P5 | Suplantación | ✅ |
| P6 | Supply Chain | ✅ |
| P7 | Alcance Excesivo | ✅ |
| P8 | Ofuscación | ✅ |
| P9 | Persistencia | ✅ |
| P10 | Manipulación Output | ✅ |

**Vulnerabilidades detectadas (🚨):** 0
**Puntos sospechosos (⚠️):** 0

---

## 🏁 Veredicto

🟢 SEGURA

**Documentación de referencia de API pura, sin scripts, red, dependencias ni instrucciones fuera de la función declarada.**

> Skill puede instalarse.

---

## 📝 Notas del Auditor

- **Origen vendorizado:** el repo `callstackincubator/agent-skills` la copia desde `callstack/react-native-testing-library` (según `plugins/vendored/skills-lock.json`); el `README.md` de `plugins/vendored/` dice que es un workaround temporal. **No existe copia canónica en `skills/`** del repo (allí solo hay assess-react-native-migration, create-react-native-library, github-actions, react-native-best-practices, react-native-brownfield-migration, react-native-tv-best-practices, react-navigation, upgrading-react-native, writing-user-docs).
- **Adaptación local para instalar:** ninguna en el contenido. Requisitos de instalación: (1) copiar solo la carpeta `react-native-testing` fijada al commit `59e9d17…`, **no** instalar el plugin `testing-react-native-apps` (arrastra `agent-device` y `dogfood` sin auditar) ni el marketplace (auto-refresh nocturno); (2) registrar en el `SKILL.md` local el origen y SHA para revisar cambios en cada actualización.
- La skill asume Jest + RNTL; en este proyecto el stack de tests es Vitest (web). Solo aplica al workspace móvil si adopta RNTL.
