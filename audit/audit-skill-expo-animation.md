# 🔍 Auditoría de Seguridad — expo-animation

**Fecha:** 2026-11-27 22:28
**Skill auditada:** expo-animation — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-animation` (copia local: `scratchpad/untrusted/audit-set/expo-animation`)
**Líneas analizadas:** 679
**Archivos analizados:** `SKILL.md`, `RECIPES.md`, `LICENSE`, `agents/openai.yaml`

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-animation |
| Función declarada | Construir animaciones en React Native/Expo (decidir si animar, hilo, propiedades, spring o timing, gestos, degradación) con Reanimated, Gesture Handler, Expo Router y expo-haptics |
| Archivos bundleados | 4 archivos (SKILL.md, RECIPES.md, LICENSE MIT de Emil Kowalski, agents/openai.yaml). Sin scripts ni binarios |
| Tools explícitas | Shell para `npx expo install <pkg>`; "agent CLI" `feedback` |
| MCPs mencionados | Ninguno |
| URLs externas | github.com/emilkowalski y github.com/emilkowalski/skills (atribución), docs.swmansion.com (gesture-handler), docs.expo.dev (2) |
| Dependencias | `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `expo-haptics`, `react-native-keyboard-controller`, opcionales `lottie-react-native`, `@shopify/react-native-skia` — todas vía `npx expo install` |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ✅
**Hallazgo:** Sin evidencia de prompt injection. "Operating Posture" y "Hard Rules" son instrucciones de workflow técnico (decidir y escribir el código, no presentar menús de opciones, rechazar animaciones que no pasan el filtro de frecuencia diciéndolo al usuario). Sin reclamos de autoridad ni instrucciones ocultas.
**Evidencia:** N/A

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": el comando `feedback` del agent CLI envía a Expo un reporte con detalles del proyecto y del entorno, condicionado al consentimiento del usuario y sin secretos/datos personales. No hay variante sin consentimiento. Las demás URLs son atribución y documentación.
**Evidencia:** `SKILL.md:268-269` — "Do not send a report before the user agrees." / "the report also carries project and environment details"

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** Solo `npx expo install` de paquetes de animación dentro del proyecto. Sin `rm -rf`, descargas ejecutadas, escrituras al sistema ni cron. El único cambio de configuración sugerido es `CADisableMinimumFrameDurationOnPhone` en `app.json` del propio proyecto.
**Evidencia:** `RECIPES.md:10` — "npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics"

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No accede a `.env`, credenciales ni variables sensibles; no pide tokens.
**Evidencia:** N/A

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Contiene un encuadre de rol ("You are a senior mobile engineer…"), pero solo fija la postura técnica de trabajo; no pide ocultar que es Claude, ni negar ser una IA, ni suplantar entidades reales. La mención a Emil Kowalski es atribución con licencia MIT incluida.
**Evidencia:** `SKILL.md:21` — "You are a senior mobile engineer building the animation yourself. Make the call, state the reasoning in one line, write the code."

### P6 · Supply Chain
**Estado:** ✅
**Hallazgo:** Las dependencias se instalan con `npx expo install`, que usa el expo instalado en el proyecto y resuelve la versión compatible con el SDK (y queda fijada en el lockfile del proyecto). No hay `npx --yes …@latest`, `git clone` ni carga dinámica de código remoto. Los enlaces a `emilkowalski/skills` son atribución, no instrucciones de descarga.
**Evidencia:** `SKILL.md:79` — "Install with `npx expo install <package>` — it resolves the version that matches the project's SDK"

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** Alcance limitado a código de animación, gestos, hápticos y opciones de navegación del proyecto. Sin builds en la nube, publicación, credenciales ni MCPs.
**Evidencia:** N/A

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64 ni caracteres invisibles/bidi/de control (verificado por rango Unicode). Los no ASCII son tipográficos (— – → × ²).
**Evidencia:** N/A

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** No escribe en `~/.claude` ni en otras skills; sin auto-actualización.
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** No oculta resultados. Exige explicar qué se rechazó y por qué, y qué no puede verificarse sin dispositivo real.
**Evidencia:** `SKILL.md:257-259` — "Say what you rejected and why." / "gestures, velocity handoff and haptic timing cannot be judged from code"

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

> Skill puede instalarse. Recomendado: eliminar la sección "Submitting Feedback" (`SKILL.md:267-269`) en la copia local, o mantenerla con consentimiento explícito.

---

## 📝 Notas del Auditor

- La descripción remite a una skill `animate` para animación web y el cuerpo a `expo-data-fetching`/`expo-ui` vía skills hermanas; no forman parte de este set.
- Postura opinada: puede negarse a escribir una animación que no pase el filtro de frecuencia, pero debe decirlo al usuario (transparente, no es manipulación).
- `LICENSE` (MIT, Emil Kowalski 2026) es coherente con la atribución de `SKILL.md:9`.
