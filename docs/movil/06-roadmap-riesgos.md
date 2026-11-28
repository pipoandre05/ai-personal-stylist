# 06 · Roadmap en dos líneas, riesgos y dependencias

> 2026-11-26. Las líneas A (tecnología) y B (producto) corren en paralelo y se cruzan en dos puntos: **A2 ↔ B6**
> (el backlog necesita saber qué es caro de construir) y **A8 ← B8** (la primera feature móvil sale del backlog).
> "Ya" = puede empezar hoy, sin esperar otra etapa.

## Línea A · Tecnología

| # | Etapa | Objetivo y actividades | Depende de | Entregable | Aceptación (verificable) | Responsable | ¿Paralelo? |
|---|---|---|---|---|---|---|---|
| A1 | Diagnóstico | Clasificar el código A/B/C/D y los bloqueos | — | `01-arquitectura.md` §1 | Cada bloqueo con archivo y evidencia | Sesión integradora (Opus) | **Hecho** |
| A2 | Arquitectura objetivo | Aprobar AR-1 a AR-7. DT-22 y revisión de DT-10 en el `DECISION_LOG` | A1 · Felipe | Filas en `DECISION_LOG` | Decisiones firmadas por Felipe | Felipe + integradora | Ya |
| A3 | Cuentas y entorno | Expo · Xcode, Android Studio, eas-cli · SMTP propio. **Apple y Google se pagan recién en A11** (`02` §4) | A2 · A-05 (nombre y bundle ID) | Entorno local listo | Criterios 1 y 4 de `02` §6 | **Felipe** (cuentas) + agente | Ya (Expo) |
| A4 | Skills | Auditar con `skill-auditor`, copiar fijadas y registrar | — | Skills en `agentes/skills-externas/` | Veredicto SEGURA por skill (o copia adaptada); aparecen en `preparar-carpetas.sh` | Agente (integradora) | **Auditoría hecha** (`audit/README.md`); la copia y el registro van en A5 |
| A5 | Equipo de bots | Plomería (`03` §3), SOUL actualizados, Constructor Móvil, línea 2, humo del equipo | A4 · A6 (esqueleto) · **orden:** CI y `verify-mobile` antes de abrir la frontera | PR `chore/equipo-movil` | Los 5 puntos del humo de `03` §3 pasan | Integradora + DevOps | Tras A6 |
| A6 | Esqueleto del monorepo | Workspaces, `mobile/` SDK 58, `packages/core` y `tokens`, CI `verify-mobile` | A2 | PR `feat/monorepo-movil` | Criterios 2, 3 y 5 de `02` §6; Vercel Preview verde | Constructor (Sonnet) + revisión Opus | Tras A2 |
| A7 | BFF para la app | Bearer en `authenticate()`, servicios compartidos, `api/v1/*`, `push_tokens` | A2 · migración aplicada por Felipe | PRs `feat/api-v1-*` (≤ 400 líneas c/u): MOB-T-09 a T-11 | Tests de auth (Bearer en rutas, rechazado en acciones, RLS sin service role); borrar cuenta por API; la web sin regresión | Agente `Plan` → Constructor | En paralelo a A6 |
| A8 | Costo y latencia del asesor | `ai_usage` por turno, caché de cola, herramientas en paralelo y luego el eval (BF-11) para el ruteo por turno (`04` §5) | IA-1 · IA-2 · IA-3 | PRs de un cambio cada uno + informe del eval | Regla de adopción de `04` §5; p50 y p90 de latencia informados | Integradora | Ya (diseño); la ejecución espera la aprobación |
| A9 | Primera feature móvil | MOB-E1-H01 (entrar y sesión) y luego H02 (conversación) | A5 · A6 · A7. H01 y H02 son paridad y no esperan B8; desde H03, sí | App con login y chat en streaming | Criterios de las historias en `05`; humo 4b aprobado | Equipo de bots, línea 2 | — |
| A10 | Testing y QA | jest-expo, RNTL, Maestro en la CI, matriz de dispositivos (iPhone SE y 15, un Android medio) | A9 | Suite y flujo Maestro del caso del evento | Caso del evento E2E verde en iOS y Android | QA + Constructor Móvil | Junto con A9 |
| A11 | Distribución interna | `eas build` de preview tras el merge, TestFlight interno, test cerrado de Play. **Aquí se pagan Apple (US$99) y Google (US$25)** | A3 · A9 | Builds instalables | Felipe instala desde un enlace; **12 testers × 14 días** corriendo en Play | DevOps (build) + Felipe (testers) | Reclutar testers: **ya** |
| A12 | Publicación | Ficha, privacidad, consentimiento IA (5.1.2(i)), borrar cuenta, acceso de revisión con magic link (AR-5b), revisión | A11 · A-02 (legal) · A-05 (marca) | App en tiendas | Aprobada por Apple y Google | **Felipe** | — |

## Línea B · Producto (detalle en `05-producto-discovery-backlog.md`)

| # | Etapa | Objetivo y actividades | Depende de | Entregable | Aceptación | Responsable | ¿Paralelo? |
|---|---|---|---|---|---|---|---|
| B1 | Discovery de oportunidades | 17 oportunidades nativas con ICE y supuestos | — | `05` §2 | Cada una con problema, conducta, métrica y dependencias | Agente | **Hecho (borrador)** |
| B2 | Preparar la sesión | Insumos, agenda de 2 h 40 min y reglas de decisión | B1 | `05` §4 | Insumos listos 24 h antes | Agente | **Hecho**; insumos: ya |
| B3 | Instrumentar la PWA | Hora del "¿qué me pongo?", turnos con la pestaña oculta, links pegados, prendas por sesión | — | Eventos nuevos (sin datos personales) | Datos de 2 semanas antes de B7 | **Sesión integradora** (toca `types.ts` y `app/api/`, fuera de la frontera de los bots) | **Ya** |
| B4 | Gamificación | 5 reglas; DP-26 y DP-27 en borrador | B1 | `05` §3 | Cada mecánica con conducta, métrica y guardarraíl | Agente → Felipe | Ya |
| B5 | Engagement y avisos | Contrato de avisos (DP-27), textos reales con `ux-copy` | B4 | Textos y reglas | 5 avisos redactados con la voz del producto | Diseño + Felipe | Ya |
| B6 | Épicas e historias | 6 épicas y 26 historias, 12 con criterios | B1 · A2 (costo) | `05` §5 | Formato y criterios Dado/Cuando/Entonces | Agente | **Hecho (borrador)** |
| B7 | Sesión y priorización | La sesión con Felipe; corregir el ICE; cortar el MVP | B2 · B3 (datos) | Now / Next / Later firmado | Reglas de decisión aplicadas; preguntas de `05` §4.4 cerradas | **Felipe** + agente | Tras 2 semanas de B3 |
| B8 | Backlog inicial | Volcar al `PRODUCT_BACKLOG.md` (o ClickUp si se autoriza) con IDs `MOB-*` | B7 | Backlog priorizado | Historias de Now con criterios y estimación | Productor | — |
| B9 | Roadmap funcional | Now / Next / Later con métricas de salida | B8 | `05` §6 actualizado | Cada horizonte con su criterio de salida | Productor | — |

**Puede empezar hoy:** A2 y A3 (Felipe: decisiones y cuentas), A4 (auditar skills), el diseño de A8, B3
(instrumentar, la sesión integradora), B4, B5, los insumos de B2, maquetas HTML de cámara, compartir y avisos, y 5 conversaciones con personas
del piloto.

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación | Dueño |
|---|---|---|---|---|
| Vercel no construye bien `web/` dentro de workspaces | Media | Alto (producción) | PR del esqueleto solo con plomería y Preview verde antes de mergear; rollback = revert | DevOps |
| Merge de `mobile/` sin verify ni revert al abrir la frontera (hoy no pasa: la lista blanca lo rechaza) | Alta si se abre en el orden equivocado | Medio | Crear `verify-mobile` y la CI de `main` antes de abrir la frontera (A5) | DevOps |
| Dos interfaces que mantener | Alta | Medio | Paridad acotada (conversación y Tu espacio); la lógica en `packages/core` | Productor |
| La latencia del asesor (20–50 s) se siente peor en nativo | Alta | Alto | Aviso "tu look está listo" (MOB-E4-H01) amortigua. La causa necesita una meta de p50 por turno, que se fija en A2 | Sesión integradora |
| Rechazo en App Store (consentimiento IA, borrar cuenta, revisor sin acceso por el magic link) | Media | Alto | Checklist de `02` §3 paso 7 antes del primer submit | Felipe |
| Regla de 12 testers × 14 días retrasa Android | Alta | Medio | Reclutar ahora | Felipe |
| Expo Go de SDK 58 no disponible | Media | Bajo | Development build desde el día 1 | Sesión integradora |
| EXIF no se borra con `expo-image-manipulator` | Baja | Alto (privacidad) | Test obligatorio antes de MOB-E2-H01 | QA |
| Push que se siente como marketing | Media | Alto (desinstalaciones) | DP-27: opt-in, tope diario, nada personal en la pantalla bloqueada | Productor |
| Costo de visión con carga en lote | Media | Medio | Tope diario (A-03) y Batch para el etiquetado sin apuro. La visión ya corre en Haiku 5.5 | Felipe |
| Datos de personas (fotos, selfies, memoria) enviados a un proveedor sin garantías | Baja si se sigue `04` | Alto | El asesor se queda en Anthropic (IA-4) | Felipe |
| Timeout del cliente Claude (50 s × 2) contra `maxDuration` 60 s en Vercel | Media | Medio | Herramientas en paralelo y revisar timeouts (`04` §5) | Sesión integradora |
| No hay Supabase de staging | Alta | Medio | Decidir AR-6; mientras tanto, preview contra producción con cuentas de prueba | Felipe |

## Costos (año 1, USD)

| Partida | Monto |
|---|---|
| Apple Developer | 99 |
| Google Play | 25 |
| EAS | 0 (Free) a 228 (Starter) |
| Supabase de staging (si AR-6 = sí) | ~300 (Pro US$25/mes; ⚠ verificar) |
| Eval del asesor (IA-3) | ≈ 35–85, una vez; sirve también para BF-11 |
| Bots | Sin cambio o menor (36–47 % si la fase 2 aplica a la facturación por API) |
