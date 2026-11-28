# 🔍 Auditoría de Seguridad — expo-router

**Fecha:** 2026-11-27 22:28
**Skill auditada:** expo-router — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-router` (copia local: `scratchpad/untrusted/audit-set/expo-router`)
**Líneas analizadas:** 1844
**Archivos analizados:** `SKILL.md`, `agents/openai.yaml`, `references/route-structure.md`, `references/tabs.md`, `references/toolbar-and-headers.md`, `references/form-sheet.md`, `references/search.md`, `references/zoom-transitions.md`

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-router |
| Función declarada | Navegación y routing en Expo Router: rutas por archivo, grupos, rutas dinámicas, Link con previews y menús, Stack nativo, modales, form sheets, NativeTabs, headers, toolbars y barras de búsqueda |
| Archivos bundleados | 8 archivos (SKILL.md, agents/openai.yaml, 6 references/*.md). Sin scripts ni binarios |
| Tools explícitas | Ninguna declarada. Implícitamente edición de archivos del proyecto; "agent CLI" de Expo solo para el comando `feedback` |
| MCPs mencionados | Ninguno |
| URLs externas | docs.expo.dev (3), developer.apple.com (1), example.com (6, imágenes ilustrativas en ejemplos de código) |
| Dependencias | Ninguna instalada por la skill (usa `expo-router`, `react-native`, `react-native-screens` ya presentes en un proyecto Expo) |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Las frases imperativas ("Always use kebab-case", "ALWAYS use `_layout.tsx`", "Never co-locate components…") son convenciones de código propias de la función declarada. No hay instrucciones ocultas, condicionales encubiertas ni reclamos de autoridad de Anthropic/sistema. `agents/openai.yaml` solo contiene metadatos de interfaz.
**Evidencia:** N/A

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** La sección "Submitting Feedback" indica usar el comando `feedback` del agent CLI de Expo, que envía a Expo un reporte que "también lleva detalles del proyecto y del entorno". Está condicionada al consentimiento del usuario ("Do not send a report before the user agrees") y pide no incluir secretos ni datos personales. No hay variante sin consentimiento. Es un canal de salida de datos legítimo pero digno de atención, sobre todo en sesiones no atendidas. Las URLs restantes son documentación oficial o `example.com` claramente ilustrativo.
**Evidencia:** `SKILL.md:234-235` — "Do not send a report before the user agrees." / "tell the user that the report also carries project and environment details. If you cannot ask the user, put the command with your message in your final summary"

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** No hay scripts ni comandos de shell. La instrucción de borrar archivos se limita a rutas viejas del propio proyecto al reestructurar la navegación (refactor normal, no destructivo fuera del alcance). Sin escrituras a `/etc`, `~/.ssh`, shell rc, cron ni launchd.
**Evidencia:** `SKILL.md:28` — "Always remove old route files when moving or restructuring navigation"; `references/route-structure.md:91` — "You may need to delete or refactor existing routes to fit this structure"

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No lee `.env`, credenciales, keychain ni variables de entorno sensibles; no pide pegar tokens. La sección de feedback explícitamente prohíbe incluir secretos.
**Evidencia:** N/A

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** No altera la identidad de Claude ni pide ocultar que es una IA. Sin plantillas de mensajes que suplanten entidades reales.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** ✅
**Hallazgo:** La skill no instala dependencias ni ejecuta paquetes remotos. Solo referencia la documentación oficial ("read to see the full API"); el contenido leído desde docs.expo.dev debe tratarse como dato, no como instrucción. El comando `feedback` menciona "the agent CLI" sin fijar cómo se obtiene (ver Notas).
**Evidencia:** `references/toolbar-and-headers.md:284` — "Docs https://docs.expo.dev/versions/unversioned/sdk/router - read to see the full API."

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** Todo el contenido se limita a archivos de rutas y layouts del proyecto (`app/`, `_layout.tsx`, `tsconfig.json`). No toca builds en la nube, publicación en tiendas, credenciales, MCPs ni directorios del home.
**Evidencia:** N/A

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, escapes hex ni caracteres invisibles/bidi/de control (verificado por rango Unicode). Los caracteres no ASCII son tipográficos (— → ✅ ❌).
**Evidencia:** N/A

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe en `~/.claude`, en directorios de otras skills ni en configuración del sistema. Sin auto-actualización.
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** No instruye ocultar errores ni alterar resultados. La sección de feedback exige mostrar al usuario el mensaje antes de enviarlo.
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

**No se encontraron vulnerabilidades. El único punto de atención es el reporte de feedback a Expo, que está condicionado al consentimiento del usuario.**

> Skill puede instalarse. Recomendado: eliminar la sección "Submitting Feedback" (`SKILL.md:233-235`) en la copia local, o mantenerla sabiendo que nunca debe ejecutarse sin un "sí" explícito de Felipe.

---

## 📝 Notas del Auditor

- La sección de feedback habla de "the agent CLI" sin decir cómo invocarlo; la skill hermana `expo-native-ui` lo invoca como `npx --yes @expo/agent-cli@latest` (no fijado). Si se conserva la sección, usar una versión fijada sin `--yes`.
- Referencia a skills hermanas (`expo-native-ui`, `expo-animation`) que no forman parte de esta auditoría por separado; cada una tiene su propio informe.
- Los ejemplos usan APIs de SDK 55/56 (`expo-router/unstable-native-tabs`, `expo-router/react-navigation`); validar contra la versión de Expo del monorepo móvil antes de seguirlos al pie de la letra.
