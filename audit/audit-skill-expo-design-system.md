# 🔍 Auditoría de Seguridad — expo-design-system

**Fecha:** 2026-11-27 22:28
**Skill auditada:** expo-design-system — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-design-system` (copia local: `scratchpad/untrusted/audit-set/expo-design-system`)
**Líneas analizadas:** 639
**Archivos analizados:** `SKILL.md`, `agents/openai.yaml`, `references/audit.md`, `references/native-slop.md`

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-design-system |
| Función declarada | Crear o extender el tema, tokens de diseño y convenciones de componentes reutilizables de una app Expo; auditar valores hardcodeados (colores, espaciado, fuentes) |
| Archivos bundleados | 4 archivos (SKILL.md, agents/openai.yaml, references/audit.md, references/native-slop.md). Sin scripts ni binarios |
| Tools explícitas | Shell de solo lectura sobre el código del proyecto: `grep -rn/-rEn/-rln`, `xargs grep -L`, `rg -n`, `find … | xargs wc -l`, `ls`; capturas de pantalla para auto-revisión; "agent CLI" `feedback` |
| MCPs mencionados | Ninguno |
| URLs externas | expo.dev/blog (guía de principios de diseño, citada), developer.apple.com (HIG alerts) |
| Dependencias | Ninguna |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. Las instrucciones son de workflow ("Run the audit before proposing changes. Report findings first; apply fixes only when asked.") y de convenciones de tokens. Sin reclamos de autoridad, órdenes ocultas ni texto dirigido al agente dentro de comentarios de código.
**Evidencia:** N/A

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": el comando `feedback` del agent CLI envía a Expo un reporte con detalles del proyecto y del entorno, condicionado al consentimiento del usuario y sin secretos/datos personales. No hay variante sin consentimiento. Los comandos de auditoría son locales y no envían nada por red. Las URLs son citas de documentación relacionada con la función.
**Evidencia:** `SKILL.md:370-371` — "Do not send a report before the user agrees." / "the report also carries project and environment details"

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** Los comandos de `references/audit.md` y `references/native-slop.md` son búsquedas de solo lectura sobre los directorios fuente del proyecto (`$SRC`), filtradas a `*.ts/*.tsx`, más conteo de líneas. No borran, no escriben, no descargan ni ejecutan nada. La skill aclara "apply fixes only when asked".
**Evidencia:** `references/audit.md:5` — "Run the audit **before** proposing changes. Report findings first; apply fixes only when asked."; `references/audit.md:30` — "grep -rEn '#[0-9a-fA-F]{3,8}\b' $SRC --include='*.tsx' --include='*.ts'"

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** Las coincidencias de "token" se refieren a tokens de diseño (colores, espaciado), no a credenciales. Las búsquedas se limitan a `*.ts/*.tsx`, por lo que no leen `.env`. No pide secretos.
**Evidencia:** N/A

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin instrucciones que alteren la identidad de Claude ni plantillas que suplanten entidades.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** ✅
**Hallazgo:** No instala paquetes ni carga código remoto. Las URLs son enlaces de referencia, no recursos que se carguen en runtime.
**Evidencia:** N/A

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** Accesos acotados a los archivos del proyecto (theme, components, screens, `package.json`) necesarios para la función declarada. Sin builds en la nube, tiendas, credenciales ni lectura del home.
**Evidencia:** N/A

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64 ni caracteres invisibles/bidi/de control (verificado por rango Unicode). Los no ASCII son tipográficos (§ × ÷ ’ → ≠ ≥) y emoji visibles usados como ejemplo de anti-patrón (🔥 ⚙️ ✨ ❤️), cuyo U+FE0F es el selector de variación normal del emoji, no texto oculto. `\x{FE0F}` en `native-slop.md:64-65` es un patrón regex literal y documentado.
**Evidencia:** `references/native-slop.md:11` — "🔥 ⚙️ ✨ ❤️ as tab icons, buttons, or empty-state art"

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe fuera del proyecto, ni en `~/.claude` ni en otras skills. Sin auto-actualización.
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** No oculta resultados. Las plantillas de reporte son transparentes y piden registrar puntajes y hallazgos.
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

**No se encontraron vulnerabilidades. El único punto de atención es el reporte de feedback a Expo, condicionado al consentimiento.**

> Skill puede instalarse. Recomendado: eliminar la sección "Submitting Feedback" (`SKILL.md:369-371`) en la copia local, o mantenerla con consentimiento explícito.

---

## 📝 Notas del Auditor

- Compatibilidad operativa (no de seguridad): los `grep -rn` de `references/audit.md` y `references/native-slop.md` serían bloqueados por el hook local que exige `--exclude='.env*'` en `grep -r`. Adaptación sugerida: reemplazarlos por `rg` (p. ej. `rg -n '#[0-9a-fA-F]{3,8}\b' $SRC -g '*.ts' -g '*.tsx'`) o añadir `--exclude='.env*'`.
- Este proyecto ya tiene su propio sistema de diseño (`DESIGN.MD`, tokens Tailwind v4 `@theme`); la regla de la skill "Never introduce a second system beside an existing one" es coherente con eso.
- Remite a skills no incluidas en el set (`expo-project-structure`, `expo-data-fetching`).
