# 🔍 Auditoría de Seguridad — expo-project-structure

**Fecha:** 2026-11-27 22:30
**Skill auditada:** expo-project-structure — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-project-structure` (copia local en scratchpad `untrusted/audit-set/expo-project-structure`)
**Líneas analizadas:** 113
**Archivos analizados:** `SKILL.md` (109), `agents/openai.yaml` (4)

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-project-structure |
| Función declarada | Estructura de carpetas para una app Expo **nueva** con Expo Router; prohíbe reestructurar apps existentes |
| Archivos bundleados | `agents/openai.yaml` |
| Tools explícitas | Ninguna (solo guía de layout). Mención del comando `feedback` del agent CLI |
| MCPs mencionados | Ninguno |
| URLs externas | `https://docs.expo.dev/router/web/api-routes/#hosting-on-third-party-services` (:80), `https://expo.dev/blog/expo-app-folder-structure-best-practices` (:105), `https://docs.expo.dev/router/reference/src-directory/` (:105) |
| Dependencias | Ninguna |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Las instrucciones son de workflow y además restrictivas (aplicar solo a proyectos nuevos, preguntar antes de mover archivos).
**Evidencia:** SKILL.md:11 "When unsure whether a project is new, ask before moving anything."

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": el comando `feedback` del agent CLI envía a Expo un reporte con detalles del proyecto y del entorno. Condicionado al consentimiento del usuario; sin usuario, solo deja el comando en el resumen. No hay variante sin consentimiento. No hay otras llamadas de red.
**Evidencia:** SKILL.md:108-109 "Do not send a report before the user agrees… the report also carries project and environment details."

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** No contiene comandos ejecutables ni scripts. Solo un árbol de carpetas y un ejemplo TSX.
**Evidencia:** N/A

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** Solo menciona, como concepto, que las API routes del servidor pueden leer variables secretas (`process.env.X`). No instruye leerlas ni mostrarlas.
**Evidencia:** SKILL.md:80 "can read secret env vars (`process.env.X`, not just `EXPO_PUBLIC_*`)"

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin evidencia.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** ✅
**Hallazgo:** No instala ni ejecuta paquetes. La sección de feedback nombra "the agent CLI" sin comando ni versión concretos; si se usara, aplicaría la misma regla de fijar versión que en las otras skills Expo.
**Evidencia:** N/A

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** El alcance coincide con la función declarada. Menciona `AGENTS.md`/`CLAUDE.md` y `.claude/` solo para describir dónde viven, no para escribir en ellos.
**Evidencia:** SKILL.md:101 "Agent instructions live at the repo root — `AGENTS.md` / `CLAUDE.md`, with project skills under `.claude/`."

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, hex, ancho cero, bidi ni controles. Los no-ASCII son caracteres de dibujo de árbol (─ │ ├ └) y tipografía (— → …).
**Evidencia:** Escaneo `rg --pcre2` de caracteres invisibles/controles: 0 coincidencias.

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe en directorios de skills ni en configuración persistente.
**Evidencia:** N/A

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
| P6 | Supply Chain | ✅ |
| P7 | Alcance Excesivo | ✅ |
| P8 | Ofuscación | ✅ |
| P9 | Persistencia | ✅ |
| P10 | Manipulación Output | ✅ |

**Vulnerabilidades detectadas (🚨):** 0
**Puntos sospechosos (⚠️):** 1

---

## 🏁 Veredicto

🟢 SEGURA

**Skill de solo documentación; el único punto de atención es el reporte de feedback a Expo, condicionado al consentimiento del usuario.**

> Skill puede instalarse.

---

## 📝 Notas del Auditor

- Adaptación local opcional: eliminar SKILL.md:107-109 ("Submitting Feedback") si no se quiere que el agente ofrezca enviar datos del proyecto a Expo; si se mantiene, nunca ejecutar `feedback` sin un sí explícito.
- Choque de convención con este proyecto: propone `src/app` y `screens/`; la skill misma prohíbe aplicarlo a proyectos existentes, así que solo sirve para un repo móvil nuevo.
