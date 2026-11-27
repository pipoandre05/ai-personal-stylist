# 01 · Arquitectura: diagnóstico y objetivo

> Estado: **propuesta, pendiente de aprobación** · 2026-11-26 · Base: `origin/main` @ `39916d4` (#33).
> Expo + React Native es decisión confirmada; aquí no se reevalúa. Lo marcado ⚠ falta verificarlo con una prueba.

## 1. Diagnóstico de la arquitectura actual

Hoy hay un solo paquete (`web/`, Next.js 16, React 19.3.0, Zod 4, Supabase y Claude en el servidor), sin `package.json`
en la raíz ni workspaces. Vercel usa Root Directory `web`, y la CI, el hook `pre-push` y los scripts del equipo de bots
asumen `web/`.

**Qué se puede compartir**, medido sobre ~19k líneas de `web/src` sin contar tests:

| Clase | Módulos | Líneas | Para mobile |
|---|---|---|---|
| **A · TS puro, se comparte tal cual** | `lib/domain/*` (tipos, contrato del asesor, intents, reglas de outfit, paletas, eventos, `photo-path`), `lib/chat/sse.ts` y `collector.ts`, `lib/format.ts`, `components/chat/v2/thread-items-v2.ts` y `outfit-layout.ts`, `components/espacio/labels.ts` | ~2.500 | Paquete compartido. Su lógica tiene ~125 tests de Vitest que se mueven con ella |
| **B · Se comparte tras extraerlo** | `lib/client/api.ts` (URL relativa, cookie, `TextDecoderStream`), `lib/client/upload.ts` (canvas), la máquina de estados de `use-conversation.ts` (681 líneas mezcladas con DOM y `next/navigation`), los schemas de request que hoy viven dentro de las rutas y las acciones | ~800 | Hay que inyectar `baseUrl`, el token y `fetch`, y sacar un reducer puro |
| **C · Solo servidor, se queda detrás de la API** | `lib/agent/*` (~2.900), `lib/ai/*`, `lib/actions/*` (10 archivos con `"use server"`), `lib/data/*`, `lib/shopping/*`, `lib/supabase/server.ts` | ~4.700 | No se toca. Mobile lo consume por HTTP |
| **D · Solo interfaz web** | 59 componentes `.tsx`, páginas RSC, `proxy.ts`, estilos de Tailwind | ~8.000 | Se reconstruye en nativo. **No se fuerza reutilizarlo** |

**Bloqueos para un cliente nativo**, ordenados por prioridad:

1. **La API autentica solo con cookie.** `authenticate()` y `getUserCtx()` leen la sesión de `@supabase/ssr`, y no
   aparece `Authorization: Bearer` en todo `src`.
2. **Las mutaciones son Server Actions y las lecturas son RSC.** Hay 10 archivos de acciones con `"use server"` (auth,
   perfil, prendas, looks, compra, evento, paleta, memoria, privacidad, conversaciones) y ninguna lectura expuesta por HTTP. Un cliente nativo
   no puede llamar Server Actions.
3. **El streaming usa web streams.** `res.body.pipeThrough(new TextDecoderStream())` no existe en el `fetch` de RN.
   Desde SDK 56, `expo/fetch` sí entrega `body.getReader()`.
4. **La compresión de fotos usa canvas y el DOM.** En nativo se rehace con `expo-image-manipulator`. ⚠ Hay que
   verificar con un test que el JPEG sale sin EXIF.
5. **No hay workspaces.** El alias `@/`, Vercel, la CI, los hooks y la frontera de los bots están amarrados a `web/`.
6. Detalles menores: `NEXT_PUBLIC_*` pasa a `EXPO_PUBLIC_*`; `crypto.randomUUID` necesita `expo-crypto`; ⚠ falta
   verificar `Intl` con `timeZone: America/Santiago` en Hermes.

**Hallazgos colaterales** (no bloquean, pero quedan registrados):

- El código no usa `after()` en ningún archivo, aunque `CLAUDE.md` y `TECHNICAL_ARCHITECTURE` §1.4 lo exigen; la
  analítica usa `void track()`.
- La URL firmada dura 1 h en el código y 15 min en la documentación.
- El `main` local está 27 commits (24 PRs) atrás de `origin/main`.

**Decisiones vigentes que se cruzan con mobile:**

- DP-03: "la API del agente no conoce el canal". Respalda un cliente nativo sobre la misma API.
- DT-02: sesión y RLS, sin service role. Con un Bearer token y RLS se mantiene.
- DT-03: email y contraseña. Se descartó el login anónimo porque la PWA instalada en iOS pierde el almacenamiento;
  nativo con almacenamiento seguro lo resuelve. **Felipe decidió (2026-11-27) reemplazarla por magic link siempre**
  (AR-5).
- DT-05: IA solo en el servidor.
- DT-08: SSE.
- **DT-10: sin push ni datos offline en el MVP.** Hay que revisarla, porque el push es una de las razones para ir a
  nativo.

## 2. Alternativas de estructura

| | A · Monorepo incremental (**recomendada**) | B · Monorepo con migración completa | C · Repo separado |
|---|---|---|---|
| Forma | `web/` se queda donde está y se agregan `mobile/` y `packages/*` con workspaces npm desde la raíz | Se mueve `web/` a `apps/web`, se crea `apps/mobile` y `packages/*` | Repo `estilo-mobile`, con el contrato publicado como paquete o copiado |
| Contrato compartido | Una sola fuente y un PR atómico (API + app) | Igual | Dos fuentes: el contrato se desincroniza o hay que versionar un paquete |
| Vercel | Root Directory sigue en `web`. ⚠ Verificar que el build instala bien desde workspaces | Cambia a `apps/web` | Sin cambios |
| CI, hooks, scripts de bots | Se agregan job `verify-mobile` y rutas `mobile/**` y `packages/**`. Lo de `web/` sigue igual | Hay que reescribir todas las rutas | Todo se duplica |
| Riesgo y esfuerzo | Bajo. 1–2 días de plomería | Medio. Rompe PRs abiertos y los scripts de bots | Bajo al inicio, alto en mantenimiento |
| Escalabilidad | Buena. Se puede pasar a B después sin rehacer nada | La mejor a largo plazo | Mala para una sola persona |

**Por qué A:** consigue lo que vale de un monorepo (un solo contrato y PRs atómicos) sin romper la plomería que ya
funciona. Mover `web/` es cosmético y se puede hacer después si molesta. C se descarta porque el valor del producto
está en el contrato del asesor, que cambia seguido (ya va en v2), y dos repos garantizan que se desincronice.

**Gestor de paquetes:** seguir con **npm workspaces**. Expo lo soporta, el repo ya usa npm y cambiar a pnpm o Bun no
aporta lo suficiente para justificar el riesgo. React queda en **19.3.0 exacto** en todo el repo (`overrides`), porque
RN falla si el patch difiere del renderer.

## 3. Arquitectura objetivo

```
ai-personal-stylist/
├─ package.json            workspaces: ["web", "mobile", "packages/*"] · overrides react 19.3.0
│                          (los nombres @<marca>/… y el bundle ID esperan A-05)
├─ web/                    Next.js 16: interfaz web + API (BFF) para web y app. Sin cambio de ruta
│  └─ src/app/api/v1/*     NUEVO: endpoints REST para la app (reusan los servicios de las Server Actions)
├─ mobile/                 Expo SDK 58 · RN 0.88 · Expo Router
│  ├─ src/app/             rutas (Expo Router) · el design-gate ya vigila */src/app/*
│  ├─ src/features/        conversacion · closet · espacio · captura · avisos · cuenta
│  ├─ src/ui/              primitivas nativas con tokens
│  └─ app.config.ts · eas.json
└─ packages/
   ├─ core/                @<marca>/core: domain, contrato v2, schemas zod de request, parser SSE,
   │                       thread-items (view-model del hilo), reducer de conversación, cliente API
   │                       con baseUrl, token y fetch inyectados
   └─ tokens/              @<marca>/tokens: tokens.ts → genera el @theme de web y el theme de RN
```

**Backend único (BFF).** La app no habla con Claude, nunca usa service role y no arma el hilo por su cuenta: todo pasa
por la API de Next.js. Para eso hay que hacer cuatro cambios en el servidor:

1. **Solo `authenticate()`** (el helper de las rutas `api/*`) acepta `Authorization: Bearer <jwt>` y crea el cliente de
   Supabase con ese header, así que RLS sigue aplicando (DT-02 intacta). `getUserCtx()` de las Server Actions **no**
   acepta Bearer: las acciones son solo de la web y abrirlas amplía la superficie de ataque sin necesidad. Un test
   confirma que una acción con Bearer y sin cookie se rechaza.
2. Cada Server Action se separa en un **servicio** (`lib/server/services/*`) más dos adaptadores: la acción, para la
   web, y una ruta `api/v1/*`, para la app. La lógica queda en un solo lugar.
3. Lecturas como `GET /api/v1/thread`, `/garments` y `/outfits` devuelven el hilo ya armado y las URLs firmadas.
   Supabase directo desde la app se usa solo para Auth y para subir a Storage con RLS.
4. Avisos: tabla `push_tokens` con RLS, y el envío al terminar el turno se hace con `after()` vía Expo Push Service.
   Es una migración y **la aplica Felipe**.

**Separar lógica de presentación.** En `packages/core` va todo lo que no dibuja nada (reglas, contrato, reducer,
cliente). En `mobile/src/features/*` van los hooks que conectan core con TanStack Query. En `mobile/src/ui` van solo
componentes que dibujan. Si una regla de negocio aparece en un `.tsx`, eso es un hallazgo de revisión.

## 4. Stack de la app

Todas las versiones son las que fija SDK 58. Se instalan con `npx expo install` para que calcen.

| Necesidad | Elección | Por qué | Alternativa descartada |
|---|---|---|---|
| Base | Expo SDK 58 · RN 0.88 · React 19.3.0 · New Architecture (obligatoria) · Hermes V1 | Es el SDK estable y coincide con el React de la web | SDK 57, que no calza con React 19.3 |
| Desarrollo | **Development build desde el día 1** | Push, compartir, deep links propios y cámara completa no corren en Expo Go. ⚠ Expo Go de SDK 58 quizás aún no está en las tiendas | Expo Go |
| Navegación | Expo Router ~58 | Rutas por archivo, deep links y share intents nativos; ya no depende de react-navigation | react-navigation directo |
| Datos del servidor | TanStack Query | Caché, reintentos y estado offline de lectura (MOB-E6-H02). Es lo que recomienda la skill oficial `expo-data-fetching` | SWR |
| Estado local | `useReducer` del reducer de core + Context | El estado de la conversación ya es una máquina de estados; **no se agrega librería** | Zustand (solo si aparece estado global que lo justifique) |
| Streaming | `expo/fetch` + `createSSEParser` de core | El parser actual se reutiliza sin cambios | `react-native-sse` (otra dependencia) |
| Auth | **Magic link + código de 6 dígitos** (`signInWithOtp`, `verifyOtp` con `type: 'email'`) · deep link con esquema propio (`<marca>://auth`, vía `expo-linking`) · `@supabase/supabase-js` con almacenamiento cifrado (clave AES en `expo-secure-store` y datos en `expo-sqlite/localStorage`) | Felipe lo decidió (AR-5). El código cubre el caso en que el link abre en el navegador de la app de correo. Sin login social no hace falta Sign in with Apple. Los Universal Links exigen la cuenta paga de Apple, así que se parte con esquema propio. La sesión se cifra porque SecureStore rechaza valores de más de ~2 KB en algunos iOS; la guía de Expo usa `localStorage` de sqlite y se le suma cifrado. ⚠ Patrón a verificar | Email y contraseña · Apple y Google · AsyncStorage sin cifrar |
| Fotos | `expo-camera` o `expo-image-picker` → `expo-image-manipulator` (≤ 1280 px, JPEG) → Storage `user-media/{user_id}/…` · `expo-image` para mostrar | Mismo pipeline que la web. ⚠ Falta el test de EXIF | — |
| Estilos | **`StyleSheet` + `@<marca>/tokens`** | Cero dependencias, estable y los tokens siguen siendo la única fuente | NativeWind v5 (sigue en RC). Uniwind (estable y usa Tailwind v4): reevaluar tras 2 pantallas si `StyleSheet` frena |
| Fuentes | `expo-font` con Bricolage Grotesque y Manrope | Las mismas de `DESIGN.MD` | — |
| Avisos | `expo-notifications` + Expo Push Service | Gratis e integrado con EAS. **Es un tercero que procesa tokens y el contenido del aviso fuera de Chile**: el contenido no lleva datos personales (solo texto genérico e id de conversación, DP-27) y entra en A-02 y en las etiquetas de privacidad | FCM y APNs directo |
| Compartir hacia la app | Extensión de compartir mediante config plugin | ⚠ **Por investigar**: elegir el plugin (comunitario) y auditarlo | — |
| Errores | Error boundary por ruta + **EAS Observe** al inicio · Sentry pendiente de aprobación | Observe ya viene con EAS, que la app usa de todos modos; igual **es un encargado de datos** y va en A-02. Sentry suma un tercero más | — |
| Listas | `FlatList` al inicio; `FlashList` si las listas de prendas o looks muestran tirones (lo mide la skill de Callstack) | Una dependencia menos hasta que haya evidencia | — |
| Sin conexión (Later, MOB-E6-H02) | Persistidor de TanStack Query sobre `expo-sqlite` | Se decide al llegar a esa historia. ⚠ Verificar el paquete persistidor | — |
| Tests | `jest-expo` (Jest 30) + React Native Testing Library para la app · Vitest se queda para web y `packages/*` · Maestro para el humo E2E | Lo que soporta SDK 58. Maestro corre en el simulador y sirve al QA bot | Detox |
| Analítica | El mismo `track()` del servidor, con `platform` como propiedad | Un solo diccionario de eventos | SDK de analítica en el cliente |

**Errores.** El cliente de core normaliza todo en `ApiError {kind: network | auth | limit | server | validation}`.
TanStack Query reintenta solo `network`. `auth` dispara un refresh y luego el logout. `limit` (el 429 diario) muestra
el mensaje del asesor. Nada se loguea con datos personales.

## 5. Ambientes, variables y actualizaciones

| Ambiente | App (`APP_VARIANT`) | Bundle ID | Backend | Canal OTA |
|---|---|---|---|---|
| Development | `development` | `cl.<marca>.app.dev` (espera A-05) | `localhost:3210` con `AI_MODE=mock` o una Preview de Vercel | — |
| Preview (staging) | `preview` | `cl.<marca>.app.preview` | Preview de Vercel | `preview` |
| Production | `production` | `cl.<marca>.app` | Producción | `production` |

- **⚠ No hay un Supabase de staging.** Las Preview de Vercel leen producción en solo lectura (`estrategia-git-deploy.md`
  §ambientes). Para que la app de preview escriba hace falta decidir si se crea un segundo proyecto Supabase. Es una
  **decisión de Felipe** con costo.
- **Variables:** la app solo lleva `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **Todo `EXPO_PUBLIC_*` es público**: ninguna clave de Anthropic ni service role
  va en la app. Los valores viven en los ambientes de EAS (development, preview y production), con visibilidad
  `plain` o `sensitive` (nunca `secret`: igual quedan en el bundle). ⚠ Verificar el nombre exacto de las visibilidades.
- **Actualizaciones:** EAS Update con `runtimeVersion: {policy: "fingerprint"}`. Un cambio solo de JS sale por OTA al
  canal correspondiente; un cambio nativo exige un build nuevo. **Publicar a `production` lo hace solo Felipe.**
- **Mantenimiento:** subir de SDK una vez por SDK mayor (unas 3 veces al año) con la skill `expo-upgrade` en una rama
  propia, y `npx expo install --check` en la CI.

## 6. Decisiones que requieren aprobación

| # | Decisión | Recomendación |
|---|---|---|
| AR-1 | Estructura | Monorepo incremental (A) con `web/` sin mover |
| AR-2 | Registrar la app nativa en `DECISION_LOG` (DT-22) y revisar DT-10 (push y offline) | Sí, antes de escribir código |
| AR-3 | BFF: Bearer solo en las rutas y `api/v1/*` con servicios compartidos | Sí. Toca API y auth, así que necesita un agente `Plan` |
| AR-4 | Estilos con `StyleSheet` + tokens (y no NativeWind ni Uniwind) | Sí, reevaluar tras 2 pantallas |
| AR-5 | **Decidido por Felipe:** magic link siempre, en web y app (reemplaza DT-03) | Mismo correo con link y código; SMTP propio antes de abrir a personas fuera del equipo |
| AR-5b | Acceso para la revisión de Apple (el revisor no puede leer un correo) | Bandeja compartida para una cuenta demo, con las credenciales en las notas de revisión. **No** un código fijo en el servidor, que sería una puerta trasera |
| AR-5c | Cuentas con contraseña que ya existen | Se mantienen: el mismo email entra por magic link a la misma cuenta. Se quita el formulario de contraseña de la web |
| AR-6 | Supabase de staging | Felipe decide: costo contra riesgo de probar escrituras en producción |
| AR-7 | Sentry | Postergar. EAS Observe primero |
