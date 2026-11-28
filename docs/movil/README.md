# Evolución a app nativa (React Native + Expo): índice ejecutivo

> **Versión 0.1 · 2026-11-26 · Estado: propuesta para aprobación de Felipe.**
> No se ha instalado nada ni se ha cambiado código, configuración, modelos, credenciales o SOUL.
> Base de análisis: `origin/main` @ `39916d4` (#33). El `main` local va 27 commits (24 PRs) atrás.
> Auditado por un revisor independiente el 2026-11-26: se corrigieron 2 bloqueantes, 10 hallazgos importantes y los menores.
> Actualizar este índice cada vez que una decisión cambie de estado.

## En una página

1. **Estructura:** monorepo incremental. `web/` se queda donde está y se agregan `mobile/` (Expo SDK 58) y
   `packages/core` y `packages/tokens`.
   - Se comparten ~2.500 líneas de lógica pura: contrato del asesor, reglas, parser SSE y view-models del hilo.
   - La interfaz se reconstruye en nativo.
   - El backend sigue siendo uno solo (la API de Next.js), con Bearer token y RLS.
2. **Equipo:**
   - Se conservan los 6 bots y todas sus mecánicas.
   - Se agrega un **Constructor Móvil** en una línea 2.
   - Se actualizan por secciones el bloque común (los 7 bots) y los SOUL de Productor, Diseño, Revisor, QA y DevOps.
     El Constructor web suma una sola línea ("nunca `mobile/**`").
   - Hay un orden obligatorio: crear `verify-mobile` y la CI de `main` antes de abrir la frontera a `mobile/`, porque si
     no, un PR móvil se mergearía sin verify ni revert.
   - El freno bloqueará `eas` y `npx expo install` solo en contexto de bot, para no bloquear a Felipe.
3. **Skills:**
   - Se instala un subconjunto de las oficiales de Expo (incluida `expo-web-to-native`) y dos de Callstack, previa
     auditoría.
   - Se adaptan `ui-ux-pro-max`, `testing-strategy` y `estilo-equipo`.
   - Se descartan las que duplican o fuerzan interfaz web.
4. **Modelos del asesor** (el agente que arma los looks; alcance corregido por Felipe el 2026-11-27):
   - Hoy corre en **Opus 5.5** con effort `low`. La caché cubre solo el system: cada vuelta del bucle (4 o 5 por look)
     re-paga el historial y la foto. **Poner caché en la cola del bucle es el mayor ahorro, sin tocar la calidad.**
   - Las herramientas corren en serie. Pasarlas a paralelo es la palanca principal contra los ~33 s de un look.
   - Ruteo por turno: turnos simples en Sonnet o Haiku, y looks, eventos y compras en Opus. Se decide con un eval
     (≈ US$35–85), que todavía no existe.
   - **DeepSeek se descarta para el asesor:** no es más barato que Haiku 5.5, ignora la caché, guarda los datos en China
     y el asesor ve fotos y selfies de personas.
5. **Producto:**
   - App "el asesor en tu bolsillo": captura de prendas con cámara, compartir un link para preguntar "¿vale la pena?" y
     avisos útiles.
   - Gamificación al servicio del clóset, nunca del consumo: sin rachas que se rompen, sin insignias decorativas y sin
     puntos.
6. **Costo mínimo año 1:** ~US$124 (Apple + Google), con EAS gratis para empezar. **Se puede construir hoy sin pagar
   Apple:** simulador iOS + Android. Apple se paga al distribuir a testers o al probar avisos en iPhone (`02` §4).

## Mapa de entregables

| # | Entregable | Dónde | Estado |
|---|---|---|---|
| 1 | Diagnóstico de la arquitectura actual | `01-arquitectura.md` §1 | Listo |
| 2 | Arquitectura objetivo | `01` §3 | Propuesta |
| 3 | Estructura de proyectos y repositorios | `01` §2 | Propuesta (AR-1) |
| 4 | Stack React Native + Expo | `01` §4–5 | Propuesta |
| 5 | Guía de instalación y configuración | `02-guia-entorno-expo.md` | Lista, sin ejecutar |
| 6 | Skills recomendadas y plan de integración | `03-skills-y-equipo.md` §1 + `audit/README.md` | Auditadas (6 SEGURA, 5 a adaptar); la integración va en A5 |
| 7 | Evaluación del equipo multiagente | `03` §2 + `investigacion/equipo-bots.md` | Listo |
| 8 | Cambios propuestos en los SOUL | `03` §2–3 | Propuesta, por secciones |
| 9 | Evaluación de proveedores y modelos (asesor) | `04-modelos-ia-costos.md` §1–3 + `investigacion/asesor-runtime.md` + `investigacion/modelos-ia-bots.md` | Lista (pruebas pendientes) |
| 10 | Estrategia de optimización de costos | `04` §3–4 | Propuesta |
| 11 | Sesión de planificación de producto | `05-producto-discovery-backlog.md` §4 | Lista |
| 12 | Gamificación y engagement | `05` §2–3 | Borrador para la sesión |
| 13 | Backlog funcional | `05` §5 | Borrador (6 épicas, 26 historias, 11 tareas) |
| 14 | Roadmap tecnológico y funcional | `06-roadmap-riesgos.md` | Propuesta |
| 15 | Riesgos, costos y dependencias | `06` + `02` §2 | Listo |

## Decisiones confirmadas

- React Native + Expo para iOS y Android (Felipe; no se reevalúa).
- Las vigentes del `DECISION_LOG` que siguen aplicando:
  - DP-09: el asesor nunca compra.
  - DP-10: neutralidad en las recomendaciones.
  - DP-11: toda recomendación explica el porqué.
  - DP-12: del cuerpo solo se habla de calce y proporción.
  - DT-02: sesión y RLS, sin service role.
  - DT-05: IA solo en el servidor.
  - DT-08: SSE.
  - DT-13: `AI_MODE=mock`.
  - Migraciones las aplica Felipe.
  - Nada de interfaz se declara listo sin mostrarlo.

## Pendientes de aprobación (Felipe)

| ID | Decisión | Recomendación | Bloquea |
|---|---|---|---|
| AR-1 | Monorepo incremental (`web/` sin mover) | Aprobar | A6 |
| AR-2 | DT-22 (app nativa) y revisión de DT-10 (push y offline) en el `DECISION_LOG` | Aprobar | Todo el código |
| AR-3 | BFF: Bearer y `api/v1/*` con servicios compartidos | Aprobar | A7 |
| AR-4 | Estilos con `StyleSheet` + tokens | Aprobar | A6 |
| AR-5 | **Decidido (Felipe, 2026-11-27):** magic link siempre, en web y app. El mismo correo trae un código de 6 dígitos de respaldo | Registrar en el DECISION_LOG (reemplaza DT-03) | MOB-E1-H01 |
| AR-5b | Acceso para el revisor de Apple con magic link | Cuenta demo con bandeja compartida; no un código fijo | A12 |
| AR-5c | SMTP propio para Supabase Auth (el correo por defecto solo envía al equipo y hasta 2 por hora) | Resend u otro, con el dominio de la marca | Abrir la entrada a personas fuera del equipo |
| AR-6 | Supabase de staging | Tu decisión (costo) | Preview con escrituras |
| AR-7 | Sentry | Postergar | — |
| EQ-1 | Bot nuevo Constructor Móvil en línea 2 y SOUL actualizados por secciones | Aprobar | A5 |
| EQ-2 | Instalar las skills seleccionadas (tras `skill-auditor`) | Aprobar | A4 |
| IA-1 a IA-5 | `ai_usage` de una semana · pasos gratis (caché, paralelo) · presupuesto del eval · descartar DeepSeek y otros · ruteo por turno | Ver `04` §6 | A8 |
| PR-1 | DP-26 (gamificación al servicio del clóset) y DP-27 (contrato de avisos) | Llevar a la sesión | B7 |
| PR-2 | Nombre público de la app (A-05) y alcance legal ampliado (A-02, incluye Expo Push Service y EAS Observe como encargados) | Tu decisión | A3, A12 |
| PR-3 | Puerta falsa con Web Push en la PWA (contradice DT-10 vigente) | Opcional; decidir junto con AR-2 | B3 |

**Fechas objetivo propuestas:**
- 2026-12-03: AR-1 a AR-4, EQ-1, EQ-2, IA-1 e IA-2. Desbloquean A4 a A8. (AR-5 ya está decidido.)
- Antes de crear las fichas de las tiendas: AR-6 y PR-2.
- En la sesión de discovery, unas 2 semanas después de instrumentar (≈2026-12-14): PR-1 y PR-3.
- **Criterio de aceptación de cada decisión:** una fila en `DECISION_LOG.md` con fecha, alternativas y el porqué.

## Necesita investigación adicional

- Que Vercel construya `web/` dentro de workspaces npm (se prueba en el PR del esqueleto).
- Que `expo-image-manipulator` borre el EXIF (test).
- El plugin para la extensión de compartir (comunitario, a auditar).
- Que `Intl` con `America/Santiago` funcione en Hermes.
- Si OpenMausBot acepta `ANTHROPIC_BASE_URL` por bot; cómo se facturan los bots.
- Precio oficial de Kimi.
- Si Expo Go de SDK 58 ya está en las tiendas.
- Ley 21.719: vigencia y efecto en avisos, caché local y calendario.
- Las skills de Expo que Felipe iba a compartir.

## Lo que puede hacer un agente sin aprobación (dentro de lo autorizado)

- Mantener estos documentos y actualizar estados.
- Preparar los insumos de la sesión de discovery (`05` §4.1).
- Auditar las skills candidatas con `skill-auditor` (lectura y reporte, **sin instalar**).
- Redactar borradores de DT-22, DP-26 y DP-27 para el `DECISION_LOG` (sin commitear la decisión).
- Diseñar el A/B y el script de medición (sin ejecutar inferencia pagada).
- Maquetas HTML de cámara, compartir y avisos en `docs/superpowers/mockups/`.

## Rúbrica de calidad

| Criterio | Cómo se verifica | Hoy |
|---|---|---|
| La arquitectura recomendada se apoya en evidencia | Cada bloqueo y cada módulo con su ruta; alternativas con trade-offs | Cumple |
| Expo configurado y validado | Los 7 criterios de `02` §6 | **Brecha**: espera AR-1 y las cuentas |
| Skills recomendadas (entregable 6) | Cada skill con veredicto, duplicados, a qué bot va y cuándo se usa | Cumple; faltan las skills de Felipe |
| Skills integradas y disponibles para los bots | Auditadas, copiadas, registradas y usadas en un humo | **Brecha**: espera EQ-2 |
| Cambios en los SOUL (entregable 8) | Por bot y por sección, sin reemplazar ninguno; bloque común incluido | Cumple |
| Equipo preparado para móvil | Los 5 puntos del humo de `03` §3 | **Brecha**: espera EQ-1 y A6 |
| Estrategia de costos (entregable 10) | Fases, ahorro estimado con su método, control de gasto y plan B sin failover | Cumple (estimación, no medición) |
| Estrategia de modelos validada con pruebas | Eval del asesor con la regla de adopción | **Brecha**: espera IA-1 (`ai_usage`) e IA-3 (presupuesto) |
| Sesión de producto preparada | Agenda, insumos, reglas y preguntas | Cumple |
| Backlog estructurado y priorizado | IDs, criterios y prioridad; corregido en la sesión | Parcial: borrador sin la sesión |
| Roadmap con dependencias y paralelismo | Cada etapa con su aceptación y responsable; la primera feature no depende de un paso que los bots no pueden hacer | Cumple (corregido tras la auditoría) |
| Riesgos y dependencias | Tabla con dueño y mitigación | Cumple |
| Documentación mantenible | Índice, estados y anexos con fuentes | Cumple |

Las brechas se cierran solo con aprobaciones, cuentas o credenciales de Felipe. No se pueden cerrar dentro de lo
autorizado hoy.
