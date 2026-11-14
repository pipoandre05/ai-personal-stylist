# EXECUTION_PLAN_2000 — Plan de ejecución del 2026-11-14

**Meta:** a las 20:00 (Chile) un flujo vertical funcional y navegable, verificado, en un PR listo para tu revisión visual.
**Hora de inicio:** 11:12 · **Ventana:** 8 h 48 min · **Reserva sin asignar:** 1 h 30 min (17 %).

Regla del día: **si el tiempo no alcanza, se reduce alcance antes que calidad.** El orden de recorte está en §4.

## 1. Qué queda funcionando hoy

Una persona puede: abrir la portada → crear su cuenta → responder un onboarding breve → (opcional) sacarse una selfie y
recibir una paleta preliminar → fotografiar sus primeras prendas y confirmar lo reconocido → recibir su primer look
explicado → conversar con el asesor y pedir otros looks → guardar, descartar y calificar → revisar su Clóset, sus Looks
y su perfil, paleta y memoria en Yo → borrar sus datos. Instalable como PWA.

Cubre RF-01, 03, 05, 06, 07, 08, 09, 10, 11, 12, 14 y, parcialmente, RF-02, 04, 13 y 15 (DTR §10).

**No entra hoy** (y no se promete): foto dentro del chat (RF-16), productos y links de compra (RF-17, 18),
consentimiento versionado completo, edición avanzada, despliegue en Vercel (A-04), ClickUp (A-04), tests E2E automatizados.

## 2. Horizontes, entregables e hitos

Las duraciones son **presupuestos de tiempo**, no estimaciones precisas: suponen que el trabajo se reparte entre
subagentes en paralelo sobre archivos disjuntos y que la integración la hace una sola sesión.

### Horizonte 1 — Inception y definición (11:12 → 12:30)

| Entregable | Resultado esperado | Dependencias | Presupuesto | Responsable | Terminado cuando | Riesgo |
|---|---|---|---|---|---|---|
| Exploración | Investigación, Project Inception, La Torre y stack leídos | — | 15 min | Integrador | Hallazgos comunicados | — |
| Decisiones núcleo | `DECISION_LOG.md` v0.1 | Exploración | 15 min | Integrador | 15 DP, 17 DT, supuestos e hipótesis con origen | Decidir de más sin evidencia → todo marcado reversible o "requiere aprobación" |
| Modelo de datos | Migración SQL inicial con RLS | Decisiones | 10 min | Integrador | Idempotente, RLS en todas las tablas | Defecto de esquema → lo revisa el agente de arquitectura |
| DTR maestro | `DTR_AI_PERSONAL_STYLIST.md` v0.1 | Decisiones | 25 min | Integrador | 28 secciones, trazabilidad RF → épica | Duplicar satélites → el DTR solo enlaza |
| Backlog y specs | `PRODUCT_BACKLOG.md`, `FUNCTIONAL_SPECS.md` | Núcleo de contratos | 40 min en paralelo | Agente PM (Opus) | Historias con los 11 campos; spec por feature MVP | Contradicción con contratos → sección de observaciones |
| Arquitectura | `TECHNICAL_ARCHITECTURE.md`, `AGENT_ARCHITECTURE.md`, `DATA_MODEL.md`, `QA_STRATEGY.md` | Núcleo de contratos | 40 min en paralelo | Agente Arquitecto (Opus) | Contratos completos; decisión por cada candidato a agente | Ídem |
| Diseño | `DESIGN.MD`, `UX_UI_SPEC.md`, tokens, maqueta HTML | Núcleo de contratos | 20 min en paralelo | Agente UX (Opus) | Tokens AA verificados; maqueta de 5 pantallas | Gusto: lo decide tu revisión visual |

**Hito H1 — 12:30.** Documentación coherente; observaciones de los agentes resueltas o registradas.

### Horizonte 2 — Preparación de desarrollo (en paralelo, 11:20 → 12:45)

| Entregable | Resultado esperado | Dependencias | Presupuesto | Responsable | Terminado cuando | Riesgo |
|---|---|---|---|---|---|---|
| Repo y enforcement | Git, hooks, CI, PR template, CLAUDE.md, AGENTS.md, GitHub privado solo-squash | Nombre y permiso | 20 min | Integrador | `npm run verify` en verde; repo creado | — |
| Tipos y plan | `types.ts` + plan con propiedad de archivos | Modelo de datos | 15 min | Integrador | Interfaz servidor ↔ UI nombrada | Interfaz incompleta → se ajusta en integración |
| Base de servidor (B1) | Supabase SSR, proxy, consultas, acciones, visión, agente, IA simulada, endpoints, tests | Tipos, esquema | 60 min | Agente (Sonnet 5.5) | `verify` y `build` en verde sin credenciales | API de Claude distinta a lo documentado → se prueba con clave real |
| Primitivas y shell (U1) | Componentes base, navegación, portada, acceso, PWA | Diseño | 45 min | Agente (Sonnet 5.5) | Portada y acceso renderizan a 390 px | — |
| **Infra de Felipe** | Proyecto Supabase, migración aplicada, `.env.local` con claves | — | 10 min tuyos | **Felipe** | La app conecta | **Es el único bloqueo externo del día** |

**Hito H2 — 12:45.** Base compilando; portada y acceso visibles.

### Horizonte 3 — Implementación (12:45 → 18:30)

| Entregable | Resultado esperado | Dependencias | Presupuesto | Responsable | Terminado cuando | Riesgo |
|---|---|---|---|---|---|---|
| Asesor y Looks (U2) | Chat con streaming, tarjeta de look, guardar y feedback | B1, U1 | 75 min | Agente (Sonnet 5.5) | Un look se propone, se guarda y aparece en Looks | Streaming en iOS |
| Clóset y Yo (U3) | Galería, agregar prenda, detalle, perfil, paleta, memoria, borrado | B1, U1 | 75 min | Agente (Sonnet 5.5) | Una foto se convierte en prenda corregible | Cámara y compresión en móvil |
| Onboarding (U4) | Bienvenida conversacional de punta a punta | U1–U3 | 60 min | Agente (Sonnet 5.5) | De cuenta nueva a primer look sin salir del flujo | Es la pantalla con más estados |
| Integración | Todo junto, `verify` y `build` en verde | U2–U4 | 45 min | Integrador | Sin errores de consola | Choques entre agentes |
| Verificación con IA simulada | Flujo completo en navegador a 390 px | Integración + Supabase | 45 min | Integrador | Checklist de humo de `QA_STRATEGY.md` | Sin Supabase no se puede verificar de punta a punta |
| Verificación con IA real | Una prenda reconocida, una paleta y un look con Claude | Clave de Felipe | 30 min | Integrador | Tres llamadas reales correctas | Ajustes de prompt |
| Pulido | `impeccable` sobre las pantallas | Verificación | 30 min | Integrador | Hallazgos críticos corregidos | — |

**Hito H3a — 15:30.** Asesor, Looks, Clóset y Yo funcionando por separado.
**Hito H3b — 17:00.** Onboarding e integración completos.
**Hito H3c — 18:30.** Flujo verificado; PR abierto.

### Cierre (18:30 → 20:00, reserva)

| Entregable | Responsable | Terminado cuando |
|---|---|---|
| PR con checklist y sección de humo | Integrador | PR borrador con evidencia |
| Notas del vault (índice + log) y fila en la tabla de proyectos | Integrador | Creadas |
| Reporte final: qué quedó, qué no, qué se verificó y qué no | Integrador | Entregado antes de las 20:00 |

## 3. Horarios de control

| Hora | Qué se revisa | Si no se cumple |
|---|---|---|
| 12:30 | H1: documentos coherentes | El DTR manda; los satélites incompletos se cierran después de las 20:00 |
| 13:00 | H2: base compilando | El integrador toma lo que falte de B1 |
| 15:30 | H3a: pantallas principales | Primer recorte de §4 |
| 17:00 | H3b: onboarding e integración | Segundo recorte de §4 |
| 18:30 | H3c: verificación | Se congela el código; solo correcciones |
| 19:30 | Cierre | Reporte honesto de lo no verificado |

## 4. Orden de recorte

Si un hito se atrasa, se corta en este orden (primero lo menos valioso para el flujo):

1. Pulido con `impeccable` más allá de lo crítico.
2. Detalle y edición avanzada de prenda (queda editar nombre y categoría).
3. Memoria visible en Yo (queda solo el borrado de datos).
4. Paleta desde selfie dentro del onboarding (queda en Yo → Paleta).
5. Clima (el asesor recomienda sin él).
6. Looks como pantalla propia (los looks quedan en el chat).

**No se recorta:** cuenta, alta de prenda con reconocimiento, primer look explicado, chat, RLS, `verify` en verde.

## 5. Uso de La Torre hoy

No se instala (DT-16). Hoy hay una sola sesión integradora y subagentes con propiedad exclusiva de archivos: no hay PRs
en cola que ordenar. Queda preparado el traspaso: IDs de historia compatibles con `.torre/plan.yaml`, plan en
`docs/superpowers/plans/`, y `permissions.deny` cubriendo lo irreversible. Gatillo de instalación: la primera vez que
dos features avancen en sesiones separadas.

## 6. Registro de avance

| Hora | Hito | Estado |
|---|---|---|
| 11:12 | Inicio | — |
| 11:20 | Exploración y 4 respuestas de Felipe (nombre, infra, permisos, tráfico) | Hecho |
| 11:30 | Decisiones, esquema, repo en GitHub, tipos y plan | Hecho |
| 11:34 | Dirección visual, tokens y maqueta | Hecho |
