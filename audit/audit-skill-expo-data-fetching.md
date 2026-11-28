# 🔍 Auditoría de Seguridad — expo-data-fetching

**Fecha:** 2026-11-27 22:30
**Skill auditada:** expo-data-fetching — github.com/expo/skills @ 8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2, `plugins/expo/skills/expo-data-fetching` (copia local en scratchpad `untrusted/audit-set/expo-data-fetching`)
**Líneas analizadas:** 886
**Archivos analizados:** `SKILL.md` (473), `agents/openai.yaml` (4), `references/expo-router-loaders.md` (341), `references/offline-and-cancellation.md` (68)

---

## 📄 Perfil de la Skill

| Campo | Valor |
|-------|-------|
| Nombre declarado | expo-data-fetching |
| Función declarada | Implementar o depurar data fetching en apps Expo: fetch, React Query, SWR, peticiones autenticadas, caché, reintentos, offline, estados de carga/error, loaders de Expo Router |
| Archivos bundleados | `agents/openai.yaml`, `references/expo-router-loaders.md`, `references/offline-and-cancellation.md` |
| Tools explícitas | Ninguna obligatoria. Comandos de referencia: `npx expo serve`, `npx expo export --platform web` (CLI local del proyecto) |
| MCPs mencionados | Ninguno |
| URLs externas | Solo en ejemplos de código: `https://api.example.com/...`, `http://localhost:3000`, `https://api.production.com`, `https://api.stripe.com/v1/balance` |
| Dependencias | Citadas sin comando de instalación: `@tanstack/react-query`, `@react-native-community/netinfo`, `expo-secure-store`, `expo-router`, `expo-server` |

---

## 🔬 Evaluación por Punto

### P1 · Prompt Injection
**Estado:** ⚠️
**Hallazgo:** No hay override ni autoridad falsa, pero sí una instrucción imperativa de auto-activación amplia ("MUST… ANY networking work") que puede desplazar las reglas y skills propias del proyecto (por ejemplo `claude-api`/`agent-security` para llamadas de IA). Es un patrón de secuestro de disparador de bajo riesgo, dentro de la función declarada.
**Evidencia:** SKILL.md:9 "**You MUST use this skill for ANY networking work including API requests, data fetching, caching, or network debugging.**"

### P2 · Exfiltración de Datos
**Estado:** ⚠️
**Hallazgo:** Sección "Submitting Feedback": `feedback` del agent CLI envía a Expo detalles del proyecto y del entorno, condicionado al consentimiento del usuario; no hay variante sin consentimiento. Las URLs de los ejemplos (`api.example.com`, `api.stripe.com`) son ilustrativas dentro de código de app, no llamadas que haga el agente.
**Evidencia:** SKILL.md:472-473 "Do not send a report before the user agrees… the report also carries project and environment details."

### P3 · Ejecución de Código Malicioso
**Estado:** ✅
**Hallazgo:** No hay comandos destructivos. `npx expo serve` / `npx expo export` usan el CLI `expo` local del proyecto, sin `@latest` ni `--yes`.
**Evidencia:** references/expo-router-loaders.md:14, 318

### P4 · Robo de Credenciales
**Estado:** ✅
**Hallazgo:** No instruye leer `.env` reales, imprimir variables ni pedir tokens en el chat. Los ejemplos con `process.env.STRIPE_SECRET_KEY` y la lectura de la cookie `session` son patrones de código de servidor de la app, y la guía refuerza buenas prácticas: no poner secretos en `EXPO_PUBLIC_`, tokens en SecureStore y no en AsyncStorage.
**Evidencia:** references/expo-router-loaders.md:202-208; SKILL.md:352 "Never put secrets (API keys with write access, database passwords) in `EXPO_PUBLIC_` variables"; SKILL.md:436-445

### P5 · Suplantación de Identidad
**Estado:** ✅
**Hallazgo:** Sin evidencia.
**Evidencia:** N/A

### P6 · Supply Chain
**Estado:** ✅
**Hallazgo:** No hay `npx --yes`, `@latest`, `npm install` ni carga remota de código. Los paquetes se citan solo como imports.
**Evidencia:** N/A

### P7 · Alcance Excesivo
**Estado:** ✅
**Hallazgo:** Todo el contenido corresponde a la función declarada. Sin acceso a home, MCPs ajenos ni comandos de nube.
**Evidencia:** N/A

### P8 · Ofuscación
**Estado:** ✅
**Hallazgo:** Sin Base64, hex, ancho cero, bidi ni controles. No-ASCII: solo — y ≠.
**Evidencia:** Escaneo `rg --pcre2` de caracteres invisibles/controles: 0 coincidencias.

### P9 · Persistencia
**Estado:** ✅
**Hallazgo:** Sin evidencia de escritura a skills o configuración persistente.
**Evidencia:** N/A

### P10 · Manipulación de Output
**Estado:** ✅
**Hallazgo:** Sin evidencia; promueve mostrar errores y estados vacíos de forma explícita.
**Evidencia:** N/A

---

## 📊 Resumen Ejecutivo

| Punto | Categoría | Estado |
|-------|-----------|--------|
| P1 | Prompt Injection | ⚠️ |
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
**Puntos sospechosos (⚠️):** 2

---

## 🏁 Veredicto

🟢 SEGURA

**Skill de documentación y ejemplos de código; sin ejecución de paquetes remotos. Atención menor a la auto-activación agresiva y al feedback con consentimiento.**

> Skill puede instalarse.

---

## 📝 Notas del Auditor

- Adaptación local recomendada (no bloqueante):
  1. SKILL.md:9: suavizar a "Use this skill for Expo networking work" para que no desplace las skills del proyecto (`claude-api`, `agent-security`) en llamadas de IA.
  2. SKILL.md:471-473: conservar o eliminar "Submitting Feedback"; nunca ejecutar `feedback` sin un sí explícito.
- Choque de contexto: la preferencia "Avoid axios, prefer expo/fetch" (SKILL.md:36) es para apps Expo; no aplica a la PWA Next.js actual.
