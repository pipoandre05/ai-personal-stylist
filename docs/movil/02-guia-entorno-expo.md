# 02 · Guía práctica: entorno Expo, EAS y publicación

> 2026-11-26 · Expo SDK 58 (RN 0.88, React 19.3.0). Fuentes y detalle: `investigacion/expo-eas-tiendas.md`.
> **Nada de esto está instalado todavía.** Cada paso dice si lo hace Felipe (cuenta, pago o secreto), un agente
> (autónomo) o los dos.

## 1. Qué va dónde

| Dónde | Qué | Costo | Quién |
|---|---|---|---|
| **Mac (local)** | Node 24.3+ (los impares no sirven) · Xcode 26.4+ con Command Line Tools y simulador iOS · Android Studio con SDK Platform 36, emulador y JDK Zulu 17 · `eas-cli` · Maestro (E2E) | US$0 | Felipe instala Xcode (pide su Apple ID). El resto, un agente con aprobación |
| **Teléfonos reales** | Un iPhone y, si es posible, un Android para probar cámara, avisos y compartir | — | Felipe |
| **Nube Expo (EAS)** | Build, Submit, Update, Workflows, Observe | Free para empezar; Starter US$19/mes cuando haga falta | Felipe crea la cuenta y la organización |
| **Nube existente** | Vercel (la API que también usará la app) y Supabase (Auth, base de datos, Storage) | Sin cambio, salvo un Supabase de staging (AR-6) | — |
| **Cuentas externas** | Apple Developer Program · Google Play Console | US$99/año · US$25 una vez | **Felipe** (pago, identidad y, si es empresa, D-U-N-S) |

**Atajo:** con builds en la nube (EAS) se puede empezar sin Xcode ni Android Studio y probar en un teléfono físico con
un development build. Igual conviene tener el simulador local, porque el humo del QA bot corre ahí.

## 2. Costos

| Concepto | Año 1 (US$) | Nota |
|---|---|---|
| Apple Developer Program | 99 | Anual. Necesario para TestFlight y para la distribución ad hoc |
| Google Play | 25 | Pago único |
| EAS Free | 0 | 15 builds iOS + 15 Android al mes con prioridad baja, 1.000 MAU de OTA. Alcanza para el piloto |
| EAS Starter (opcional) | 228 | US$19/mes con US$45 de crédito. Solo si las colas de build frenan o se pasan los 1.000 MAU |
| Builds pagados por uso | ~0–50 | Android US$1–2 e iOS US$2–4 por build, solo fuera del cupo gratis |
| SMTP para Auth (Resend u otro) | 0–240 | ⚠ Verificar el plan gratis vigente; el volumen del piloto es bajo |
| **Total mínimo** | **124** | Con Starter: ~352. Apple y Google se pagan recién al distribuir (sección 4) |

## 3. Pasos, en orden

### Paso 0 · Decisiones previas (Felipe)
1. Aprobar el monorepo incremental (AR-1) y registrar DT-22 en `DECISION_LOG.md`.
2. **Nombre público de la app** (A-05). Las tiendas lo exigen, y el bundle ID y los paquetes `@<marca>/*` dependen de
   él. El bundle ID es casi imposible de cambiar después.
3. Cuenta Apple: ¿persona o empresa? Empresa exige D-U-N-S, que tarda días o semanas. Hay que pedirla ya.

### Paso 1 · Cuentas (Felipe)
1. Cuenta Expo y organización (gratis). **Ya.**
2. **SMTP propio para Supabase Auth** (por ejemplo Resend con el dominio de la marca, con SPF, DKIM y DMARC; skill
   `email-deliverability`). Es obligatorio con magic link: el correo por defecto de Supabase solo envía a miembros del
   equipo y hasta 2 correos por hora. Con SMTP propio el tope parte en 30 por hora y se ajusta. Hace falta **antes de
   abrir la entrada a personas fuera del equipo**, no para empezar a construir.
3. Apple Developer Program (US$99): **se puede postergar** (sección 4).
4. Google Play Console (US$25): también se puede postergar hasta el test cerrado. **Si es cuenta personal nueva: el test cerrado exige 12 testers activos durante 14 días
   seguidos antes de poder pedir producción.** Hay que reclutar testers desde ya.

### Paso 2 · Máquina local (agente con aprobación de Felipe por cada instalación)
1. `node -v` ≥ 24.3. Hoy `web/` pide ≥ 24 y no hay conflicto.
2. Xcode 26.4+ desde la App Store (Felipe) → `xcode-select --install` → abrirlo una vez para aceptar la licencia.
3. Android Studio → SDK Platform 36, emulador Pixel y JDK Zulu 17. Exportar `ANDROID_HOME`.
4. `npm i -g eas-cli` → `eas login` (Felipe inicia sesión en el navegador).
5. Maestro con Homebrew y versión fijada (`brew install` del tap oficial de mobile.dev), en vez de `curl | bash`.
6. **Verificación:** `npx expo-doctor` en verde, simulador iOS y emulador Android abren.

### Paso 3 · Esqueleto del monorepo (agente, en rama `feat/monorepo-movil`, ≤ 400 líneas)
1. `package.json` en la raíz con `workspaces: ["web", "mobile", "packages/*"]` y `overrides` de react/react-dom 19.3.0.
2. `npx create-expo-app mobile --template default@sdk-58`. Usar `@sdk-58` explícito, porque el template por defecto
   puede seguir en 57.
3. `packages/core` y `packages/tokens` vacíos con su `tsconfig`, cada uno con un test que pase.
4. CI: job `verify-mobile` (typecheck, lint, jest-expo, `npx expo install --check`) con `paths: mobile/**, packages/**`.
   También se agrega `packages/**` al job web.
5. **Verificación:**
   - `npm ci` en la raíz;
   - `cd web && npm run verify` sigue verde;
   - el build de Vercel Preview sigue verde (⚠ el punto de riesgo del monorepo);
   - la app abre en el simulador con un development build.

### Paso 4 · Ambientes y variables (agente prepara, Felipe carga los valores)
1. `app.config.ts` con `APP_VARIANT` = `development` | `preview` | `production`. Cada uno con su nombre y bundle ID.
2. `eas.json` con perfiles `development` (dev client, interno), `preview` (interno, canal `preview`) y `production`
   (tienda, canal `production`). Cada perfil con `"environment"`.
3. Variables en EAS por ambiente: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` y
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **Son públicas por diseño. Ningún secreto va en la app.**
4. `runtimeVersion: { policy: "fingerprint" }` para que una OTA nunca llegue a un binario incompatible.

### Paso 5 · Development build (agente)
1. `eas build --profile development --platform ios` (simulador y dispositivo) y lo mismo con `android`.
2. Instalar en el iPhone. El ad hoc exige registrar el dispositivo con `eas device:create` (tope de 100 al año).
3. **Verificación:** la app abre, recarga con Fast Refresh y llega a la API (`localhost:3210` desde el simulador o una
   Preview desde el teléfono).

### Paso 6 · Distribución interna (DevOps/CI tras cada merge, sin publicar)
**Para no agotar el cupo gratis (15 builds iOS al mes):** después del merge, la CI construye un binario nuevo solo si
cambió el fingerprint nativo. Si el cambio es solo de JS, publica `eas update --channel preview`.

- iOS: `eas build --profile preview` + TestFlight interno con `eas submit` (el primer submit lo autoriza Felipe).
- Android: APK interno o la pista de test interno de Play.
- `MERGEADO` lleva el enlace o QR del build.

### Paso 7 · Publicación (solo Felipe)
**Requisitos de Apple que aplican a esta app:**
- Privacy manifest (`ios.privacyManifests`) y etiquetas de privacidad en App Store Connect.
- **Borrar la cuenta dentro de la app** (5.1.1(v)). Ya existe `deleteMyData`; falta exponerlo por la API.
- Sign in with Apple (4.8): **no aplica**, porque la entrada es solo con magic link propio (AR-5).
- **Acceso para el revisor de Apple:** no puede leer un correo, así que necesita una cuenta demo con bandeja compartida
  y las credenciales en las notas de revisión (AR-5b).
- **Consentimiento explícito antes de enviar fotos o datos a una IA de terceros** (5.1.2(i)). Hay que revisar si los
  consentimientos actuales cubren el texto que pide Apple.
- 4.2: la app tiene que ser más que un sitio envuelto. Nativo cumple de sobra.
- Cuestionario de edad nuevo, obligatorio desde 2026-01-31.
- Builds con Xcode 26 o el SDK de iOS 26.
- ⚠ La guía 1.2 (contenido generado por IA) aplica parcial: hace falta una vía de reporte y contacto publicado.

**Requisitos de Google:**
- Target API 36 (SDK 58 cumple).
- Ficha de seguridad de datos.
- 12 testers durante 14 días si la cuenta es personal.

**Al publicar:**
- `eas submit --profile production`.
- Las actualizaciones posteriores de solo JS van por OTA con `eas update --channel production --environment production`.
- Las nativas exigen un build nuevo y pasar de nuevo la revisión.

## 4. Construir sin pagar Apple (decisión de Felipe, 2026-11-27)

**Sí se puede empezar a construir hoy.** Los US$99 de Apple recién hacen falta para distribuir a otras personas o para
probar avisos reales en un iPhone.

| Qué | ¿Sin la cuenta paga? | Cómo |
|---|---|---|
| Desarrollar y probar en el **simulador iOS** | Sí | Xcode es gratis. `eas build` con `ios.simulator: true` no se firma y no pide credenciales ([Expo: Build for iOS Simulators](https://docs.expo.dev/build-reference/simulators/)). También `npx expo run:ios` local |
| Development build en **tu iPhone** | Sí, con límites | Compilación local con Xcode y tu Apple ID gratis ("Personal Team"); Expo dice que es la única vía sin la cuenta paga ([Expo: development builds](https://docs.expo.dev/develop/development-builds/create-a-build/)). ⚠ Según lo conocido (verificar en Xcode), el perfil vence a los ~7 días y hay que reinstalar; no se puede repartir a otros |
| **Android** completo, en emulador y en teléfono | Sí | APK instalable directo. Google Play (US$25) recién para el test cerrado y la publicación |
| Magic link en la app | Sí | Con esquema propio (`<marca>://`). Los Universal Links sí exigen la cuenta paga |
| **Avisos push reales en iPhone** | No | APNs exige la membresía. En el simulador se prueban con `xcrun simctl push` (local) |
| TestFlight, ad hoc a testers y App Store | No | Exigen la membresía |
| Compartir hacia la app (extensión) | ⚠ Por verificar | Depende de los permisos (App Groups) que acepte el Personal Team |

**Orden recomendado:**
1. Construir con simulador iOS + Android físico.
2. Pagar Apple al llegar a A11 (distribución interna) o a MOB-E4 (avisos en iPhone), lo que ocurra primero.
3. Google Play al reclutar los 12 testers. Ojo: los 14 días corren desde ahí.

## 5. Seguridad y secretos

| Regla | Cómo se cumple |
|---|---|
| Ningún secreto en el bundle | Solo `EXPO_PUBLIC_*` (URL y publishable key). Anthropic, service role y Vercel nunca llegan a `mobile/` |
| Credenciales de firma | Las gestiona EAS (`eas credentials`). Ningún bot las toca: el freno bloquea `eas credentials`, `build`, `submit` y `update` **solo en contexto de bot** (carpetas `*-torre` y `*-linea-*`, o una variable que fije OpenMausBot). El freno aplica a todas las sesiones del repo, y bloquearlo sin condición te dejaría a ti y a la sesión integradora sin poder hacer el Paso 5 (ver 03) |
| Sesión en el teléfono | Cifrada, con la clave en el Keychain o Keystore (`expo-secure-store`). Logout borra todo |
| Fotos | Comprimidas y sin EXIF en el teléfono, en bucket privado y con URL firmada. ⚠ Falta el test que verifique EXIF |
| Datos en la pantalla bloqueada | Los avisos nunca muestran contenido personal (DP-27 propuesta) |
| Dependencias nativas | Solo vía PR de la sesión integradora. En contexto de bot, el freno trata `npx expo install` como instalar una dependencia |

## 6. Criterios de "entorno listo" (verificables)

1. `npx expo-doctor` sin errores en `mobile/`.
2. `npm ci` en la raíz, `cd web && npm run verify` y `verify-mobile` verdes en la CI.
3. El build de Vercel Preview del PR del monorepo queda verde.
4. El development build corre en el simulador iOS y en Android (emulador y teléfono). En el iPhone físico, cuando haya
   cuenta de Apple o con Personal Team.
5. La app lee `EXPO_PUBLIC_API_URL` según la variante y llega a la API con `AI_MODE=mock`.
6. `eas build --profile preview` produce un binario instalable por enlace o QR.
7. En contexto de bot, el freno bloquea `eas build|submit|update|credentials` y `npx expo install`, y en la sesión
   integradora los deja pasar. `test-freno.sh` prueba los dos lados.
