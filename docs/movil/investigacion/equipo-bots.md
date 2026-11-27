# Diagnóstico: equipo Estilo en OpenMausBot frente a una app React Native + Expo

Fecha: 2026-11-26 · Solo lectura · Repo: `/Users/pipoandre/Documents/claude.nosync/ai-personal-stylist`
Citas: `archivo:línea`. "Vault" = `/Users/pipoandre/Documents/obsidian/pipoandre/`.

## 0. Resumen

1. El equipo hoy es **web de punta a punta**: el bloque común define el producto como "PWA mobile-first" (`agentes/bots/_comun.md:3`), la frontera es solo `web/**` + `docs/superpowers/**` (`agentes/scripts/verificar-frontera.sh:22-44`), la verificación es `cd web && npm run verify` y el humo de QA es un navegador contra `localhost:3210` a 390 × 844 (`agentes/skills/estilo-equipo/SKILL.md:58-66`).
2. Los mecanismos (hilo, veredictos sobre un sha, 7 condiciones, PAUSA, freno, topes de vueltas) **no dependen de la web** y se pueden conservar tal cual. Lo que cambia son rutas, comandos de verificación, la receta de humo y el conocimiento técnico de 4 SOUL.
3. Recomendación: **un rol nuevo, "Constructor Móvil Estilo", en una línea 2** (clon del Constructor con secciones móviles), **actualizar SOUL** de Diseño, Revisor, QA, DevOps y Productor con una variante "si la rama es móvil", **sin rol de publicación** (EAS submit y actualizaciones OTA a producción quedan en Felipe, igual que hoy `vercel`).
4. Dos huecos del freno para móvil: no conoce `eas` (no hay regla equivalente a `regla_vercel`) y `npx expo install <pkg>` evita la regla de dependencias. Ambos detallados en §3.4.

---

## 1. Inventario por bot (hoy)

Modelos y esfuerzo: `agentes/configuracion-bots.json:10-15`. Todos `claude-sonnet-5-5`, aprobación `full`, `mcp: []`. Skills por bot: `agentes/configuracion-bots.json:19-24`. Reglas comunes a todos: frontera (`_comun.md:9`), git sin rebase/force/vercel/Supabase/.env (`_comun.md:11`), topes de vueltas QA 4 / Revisor 3 / Diseño 3 (`_comun.md:13`), escalamiento solo vía Productor (`_comun.md:15`), órdenes solo de Felipe o del bot que encarga (`_comun.md:17`), PAUSA (`_comun.md:19`), sin Opus salvo donde el rol lo diga (`_comun.md:21`).

### 1.1 Productor Estilo
- **Rol:** director de ejecución, Chief of Staff (`configuracion-bots.json:4`). Sonnet 5.5 · medium · carpeta Torre.
- **Responsabilidades:** elegir historia, criterios con fuente, aprobar maqueta, zanjar desacuerdos al tope, escalar solo dudas funcionales (`productor/SOUL.md:8-18`); flujo de 5 pasos (`:20-27`); pedidos fuera de frontera (`:32-33`); "Paralelizar siempre" (`:64-70`).
- **Skills:** estilo-equipo, brainstorming, write-spec, sprint-planning.
- **Reglas duras:** nunca código, maquetas, merge ni tocar la PAUSA (`:38`); no aprueba ni bloquea el merge (`:12`).
- **Específico de web:** el backlog fijo "UI-1 a UI-6 de agente-primero §3.4" (`_comun.md:7`, `productor/SOUL.md:9`); "PWA" (`_comun.md:3`); informe `MERGEADO` con "Qué mirar en el teléfono" (`estilo-equipo/SKILL.md:91-95`), que en web basta con la URL de Vercel; en móvil necesita un build instalable.
- **Qué se rompe:** poco. No sabe que hay dos plataformas ni dos líneas; no sabe qué historias son móviles; la rutina "Avanzar el equipo" asume una sola línea (`configuracion-bots.json:34`).

### 1.2 Diseño Estilo
- **Rol:** maqueta y revisión visual. Sonnet 5.5 · medium · línea 1 · 1 subagente Opus validador por maqueta (`configuracion-bots.json:11`).
- **Responsabilidades:** maqueta HTML con todos los estados (`diseno/SOUL.md:14-20`); revisión de lo construido contra la maqueta (`:22-26`).
- **Skills:** estilo-equipo, frontend-design, ui-ux-pro-max, emil-design-eng, stageshow, design-critique, accessibility-review, ux-copy, design-handoff, impeccable.
- **Reglas duras:** validación Opus siempre antes de entregar (`:19`); no da VEREDICTO pero el Revisor no aprueba con hallazgos suyos abiertos (`:26`); nunca `web/src/**`, tokens ni `DESIGN.MD` (`:28-29`).
- **Específico de web:** la revisión levanta `cd web && npm run dev -- -p 3220` y mira a 390 px en navegador (`:23`); tokens de `DESIGN.MD` pensados como clases Tailwind de `globals.css`.
- **Qué se rompe:** la revisión visual no puede hacerse en navegador para RN (o solo aproximada vía Expo Web). Falta criterio nativo: áreas seguras, Dynamic Type, teclado, gestos de vuelta atrás, hápticos, navegación nativa (stack, sheet), diferencias iOS/Android.
- **Dato:** en `docs/superpowers/hilos/ui-3.md:22` Diseño entregó "sin validación Opus; sin consulta de factibilidad": la regla de `:19` ya se saltó una vez.

### 1.3 Constructor Estilo
- **Rol:** construye y lleva la conversación con Revisor, QA y Diseño. Sonnet 5.5 · **high** · línea 1 · subagentes Sonnet solo si > 3 archivos (`configuracion-bots.json:12`).
- **Responsabilidades:** `constructor/SOUL.md:8-13` (lecturas previas), `:15-17` (construir), `:19-24` (conversación, rework, veredicto vale sobre el sha, `LISTA <id> <sha>`), `:26-27` (CI roja, tope 2).
- **Skills:** estilo-equipo, frontend-design, ui-ux-pro-max, emil-design-eng, impeccable, subagent-driven-development, dispatching-parallel-agents, test-driven-development, requesting/receiving-code-review, verification-before-completion, systematic-debugging.
- **Reglas duras:** nunca fuera de frontera (responde `NECESITO FUERA DE FRONTERA`), nunca instalar dependencias, nunca `AI_MODE=live`, nunca escribir un VEREDICTO (`:16`, `:30`).
- **Específico de web:** Next 16 y `node_modules/next/dist/docs` y `proxy.ts` (`:11`); `cd web && npm run verify` (`:17`); tests en `web/tests/ui/*.test.ts` entorno node (`:12`); contrato en `web/src/lib/domain/types.ts` y `web/src/lib/client/api.ts` (`:10`).
- **Qué se rompe:** todo el bloque técnico. RN necesita otro verify (tsc, lint, jest-expo/RNTL, `expo-doctor`), otra estructura de rutas (Expo Router), otra forma de consumir el contrato (el tipo vive en `web/`), compresión de fotos en el teléfono (regla invariante de `CLAUDE.md`), sesión de Supabase guardada de forma segura en el dispositivo, y llamada al backend por URL absoluta (no hay rutas relativas como en la PWA).

### 1.4 Revisor Estilo
- **Rol:** revisión de código, primera firma. Sonnet 5.5 · high · línea 1.
- **Responsabilidades:** orden de 7 pasos (`revisor/SOUL.md:8-15`); hallazgos con severidad y VEREDICTO sobre sha (`:19-23`).
- **Skills:** estilo-equipo, requesting-code-review, impeccable, testing-strategy, agent-security, code-review y security-review (nativas, a verificar).
- **Reglas duras:** frontera primero, si falla `rechazado` (`:9`); `aprobado` solo sin bloquea/importante y sin hallazgos de Diseño abiertos (`:21`); nunca aprobar otro sha, editar ni mergear (`:25-26`).
- **Específico de web:** paso 3 "Reglas invariantes y Next 16: `proxy.ts`, `after()`" (`:11`); paso 5 tokens Tailwind contra `globals.css` `@theme` (`:13`); paso 6 `cd web && npm run verify` y tests en `web/tests/ui/` (`:14`); paso 2 "nada de datos personales en HTML, meta tags" (`:10`).
- **Qué se rompe:** pasos 3, 5 y 6. Faltan chequeos RN: nada secreto en variables `EXPO_PUBLIC_*` (van en el bundle), token de sesión en almacenamiento seguro, permisos declarados en la config de la app, listas virtualizadas, `accessibilityLabel`/`accessibilityRole`, sin llamadas a la IA desde el cliente (sigue aplicando).

### 1.5 QA Estilo
- **Rol:** humo, segunda firma. Sonnet 5.5 · medium · "nunca Haiku" · navegador de la app contra `http://localhost:3210` (`configuracion-bots.json:14`).
- **Responsabilidades:** `qa/SOUL.md:12-16` (recorrer criterios y estados, hallazgos reproducibles, en rework repasar el recorrido principal); veredicto con `## Humo` que DevOps copia al PR (`:18-22`).
- **Skills:** estilo-equipo, testing-strategy, verification-before-completion, systematic-debugging, accessibility-review.
- **Reglas duras:** nunca producción, datos reales, `AI_MODE=live`, editar código, dejar el servidor corriendo, aprobar algo no probado en el sha (`:24-25`); tope 4 vueltas que `hilo.sh` impone.
- **Específico de web:** **toda la receta de humo**: `cd web && npm run build && PORT=3210 npm start`, navegador a 390 × 844 y 375 × 812, cuenta de QA guardada en los logins del navegador del bot (`estilo-equipo/SKILL.md:58-66`, `qa/SOUL.md:10`, plan §11 paso 10).
- **Qué se rompe:** el humo completo. Hoy QA usa el navegador de la app; un simulador iOS o un emulador Android son otra herramienta. Los bots corren con `--strict-mcp-config` y `mcp: []` (plan `docs/superpowers/plans/2026-11-14-equipo-mausbot.md:36`, `configuracion-bots.json:14`), así que no ven el MCP de simulador de Claude Code salvo que se configure; el plan ya marca como no verificado cómo usa QA el navegador (`plan:256`).

### 1.6 DevOps Estilo
- **Rol:** Torre de Control. Sonnet 5.5 · medium · Torre · "nunca Haiku".
- **Responsabilidades:** 7 condiciones (`devops/SOUL.md:8-16`); rama, actualizar, PR, merge, vigilar, liberar (`:18-23`); revert si `main` roja (`:25-26`); `HICE:`/`→ SIGUIENTE:` y bitácora (`:28-31`).
- **Skills:** torre, estilo-equipo, finishing-a-development-branch.
- **Reglas duras:** nunca mergear sin `mergear.sh`, push a `main`, force/rebase/reset, cerrar PRs, deploys `vercel`, Supabase, tocar `.claude/.githooks/.github/agentes`, quitar la pausa (`:33-34`).
- **Específico de web:** condición 3 exige check `verify` solo "si el PR toca `web/`" (`:11`, `condiciones-merge.sh:83-88`); `vigilar-main.sh` solo ve la CI que corre en push a `main` con `paths: ['web/**']` (`.github/workflows/ci.yml:5-7`, `vigilar-main.sh:8`); "deploys (vercel)" es su única noción de despliegue.
- **Qué se rompe:** un PR que solo toca `mobile/**` hoy **no exige verify** y en `main` **no dispara CI**, así que `vigilar-main.sh` diría "SIN CORRIDAS" y el revert automático nunca saltaría. Además el despliegue móvil (build EAS, actualización OTA, envío a tiendas) no existe en su modelo y un `git revert` no deshace un binario ni una actualización OTA ya distribuida.

---

## 2. Veredicto y cambios por bot

Principio: **no reemplazar SOUL**; agregar una sección "Si la historia es móvil" o ramificar pasos concretos, y mover el conocimiento técnico móvil a una skill de protocolo (para no inflar los SOUL; tope 24.000 bytes por SOUL, `exportar-equipo.py:23`; hoy el mayor pesa 10,4 KB). Todo cambio de SOUL se hace en `agentes/bots/*` y se regenera con `exportar-equipo.py` (fuera de la frontera del equipo: lo hace la integradora).

| Bot | Veredicto | Esfuerzo |
|---|---|---|
| Productor | actualizar SOUL (ligero) | bajo |
| Diseño | actualizar SOUL | medio |
| Constructor (web) | sin cambios en lo técnico; actualizar interacción con la línea 2 | bajo |
| **Constructor Móvil** | **nuevo rol** | alto |
| Revisor | actualizar SOUL | medio |
| QA | actualizar SOUL + nueva receta de humo | alto |
| DevOps | actualizar SOUL + scripts | alto |
| Publicación/Release | **no crear ahora** (ver §3.3) | — |

### 2.1 Bloque común (`_comun.md`) — afecta a los 6
- `**Producto.**` (`:3`): "PWA mobile-first" → "app móvil React Native + Expo (y la PWA web mientras conviva)". Decisión a registrar primero en `DECISION_LOG.md` (hoy no hay entrada sobre RN/Expo: búsqueda sin resultados) y en `CLAUDE.md` § Stack.
- `**Qué construye el equipo.**` (`:7`): reemplazar "UI-1 a UI-6 de agente-primero §3.4" por la fuente del backlog móvil; mantener "contra el asesor simulado (`AI_MODE=mock`)": la app móvil apunta al servidor web local en modo simulado.
- `**Frontera.**` (`:9`): agregar `mobile/src/**`, `mobile/assets/**`, `mobile/tests/**` a lo permitido; prohibir `mobile/package.json`, lockfile, `app.json`/`app.config.*`, `eas.json`, credenciales y carpetas nativas generadas (`ios/`, `android/`) si se usan.
- `**Reglas del repo.**` (`:11`): agregar `eas build|submit|update` y credenciales de tiendas a la lista de "nunca".
- `**Cómo conversamos.**` (`:13`): agregar "Constructor Móvil → Revisor, QA y Diseño" igual que el Constructor.

### 2.2 Productor — actualizar SOUL
- **Conocimiento:** dos líneas y dos plataformas; qué historias son `mob-*`; qué depende del backend (contrato) y qué es solo cliente.
- **Responsabilidades nuevas:** repartir una historia por línea sin archivos compartidos (README §4 ya lo prevé, `agentes/README.md:46-54`); decidir si una historia móvil espera un cambio de contrato; incluir en `MERGEADO` el enlace al build interno para el teléfono de Felipe cuando exista.
- **Secciones a modificar:** `## Qué decides tú (sin consultar)` (agregar plataforma y línea), `## Flujo de una historia` (paso 3: encargar al Constructor o al Constructor Móvil según la línea), `## Pedidos fuera de la frontera` (agregar dependencias nativas y config de la app), `## Paralelizar siempre` (web y móvil en paralelo en líneas distintas).
- **Skills:** sin cambios.
- **Rutina:** "Avanzar el equipo" (`configuracion-bots.json:34`) debe mirar las dos líneas.

### 2.3 Diseño — actualizar SOUL
- **Conocimiento:** patrones nativos (stack, sheets, tab bar si aplica, gesto atrás), áreas seguras, teclado, Dynamic Type, objetivos táctiles 44 pt (iOS) / 48 dp (Android), hápticos, diferencias iOS/Android; cómo se traducen los tokens de `DESIGN.MD` a la app (objeto de tema o NativeWind: decisión de la integradora).
- **Secciones a modificar:** `## Antes de diseñar` (paso 4: `ui-ux-pro-max --stack react-native`); `## Maqueta` (la maqueta HTML a 390 px sigue sirviendo como formato; agregar estados nativos: teclado abierto, permiso de cámara negado, sin conexión, notch/isla); `## Revisión de lo construido` (reemplazar `npm run dev -- -p 3220` por la app en simulador con capturas, o Expo Web como aproximación declarada); `## Nunca` (agregar `mobile/src/**`).
- **Skills a agregar:** ninguna nueva de UI (ver §4: `ui-ux-pro-max` ya cubre RN). Opcional: skill de protocolo móvil para la receta de capturas.
- **Interacciones:** `consult` también al Constructor Móvil por factibilidad.
- **Corregir de paso:** que la validación Opus realmente ocurra (`ui-3.md:22`).

### 2.4 Constructor (web) — sin cambios técnicos
- Solo agregar en `## Nunca` "tocar `mobile/**`" si la frontera se separa por línea, y saber que el Constructor Móvil puede pedir un cambio de contrato vía Productor.

### 2.5 Constructor Móvil Estilo — nuevo rol (ver §3)
- **Base:** copiar `constructor/SOUL.md` completo y cambiar solo: `## Misión` (línea 2, rama `equipo/mob-*`), `## Antes de escribir código` (pasos 2-4: Expo Router, contrato, skills móviles), `## Construir` (`cd mobile && npm run verify`), `## Nunca` (`web/**`, `app.json`, `eas.json`, `package.json`, `eas build|submit|update`, `AI_MODE=live`).
- **Conocimiento:** Expo SDK y Expo Router; RN; consumir el contrato sin tocar `web/src/lib/domain/types.ts` (o un paquete compartido creado por la integradora); compresión de fotos en el teléfono (≤ 1280 px, JPEG, sin EXIF, regla de `CLAUDE.md`); URLs firmadas; sesión en almacenamiento seguro; red local del simulador hacia `localhost:3210` (en Android el host es otro).
- **Modelo:** Sonnet 5.5 · high, igual que el Constructor (sin evidencia para otro).
- **Skills:** las del Constructor + skill de Expo/RN (por elegir y auditar con `skill-auditor`) + `testing-strategy` con sección móvil.

### 2.6 Revisor — actualizar SOUL
- **Secciones a modificar** en `## Cómo revisas (en este orden)`: paso 2 (agregar "nada sensible en `EXPO_PUBLIC_*`; token en almacenamiento seguro"), paso 3 (si la rama es `mob-*`: reglas de `CLAUDE.md` que aplican al cliente móvil en vez de `proxy.ts`/`after()`), paso 4 (accesibilidad RN: `accessibilityLabel`, `accessibilityRole`, `accessibilityLiveRegion` en el streaming), paso 5 (tokens contra el tema móvil en vez de `globals.css`), paso 6 (`cd mobile && npm run verify`; tests en `mobile/tests/`).
- **Skills a agregar:** la skill de Expo/RN del Constructor Móvil (para leer con el mismo criterio).
- **Interacciones:** recibe encargos también del Constructor Móvil.

### 2.7 QA — actualizar SOUL + receta nueva
- **Secciones a modificar:** `## Antes de probar` (paso 2: receta 4a web o 4b móvil según la rama); `## Qué haces` (agregar estados nativos: teclado tapa el compositor, rotación si aplica, app en segundo plano y vuelta, permiso de cámara/galería negado, sin red, matar y reabrir); `## Veredicto` (el `## Humo` declara plataforma, dispositivo y versión del SO); `## Nunca` (agregar "dejar Metro o el simulador corriendo", "builds de EAS").
- **Receta 4b propuesta** (en `estilo-equipo`, no en el SOUL): backend `cd web && npm run build && PORT=3210 npm start` (`AI_MODE=mock`) → app en simulador iOS de un iPhone de 390 × 844 pt (mismo ancho que el humo web) → recorrido → capturas por `xcrun simctl io booted screenshot` → Android emulador opcional → detener todo.
- **Por verificar antes de confiar en esto** (como la prueba 3 del humo del equipo, `plan:227`): que el bot pueda manejar el simulador desde Bash sin MCP y que pueda tocar la pantalla. Sin una herramienta de interacción (MCP de simulador o flujos tipo Maestro, que serían una dependencia a pedir a la integradora), QA solo puede lanzar y capturar, no recorrer.
- **Skills:** `testing-strategy` hoy es "Next.js/Node con Vitest y Playwright" (descripción de la skill): necesita su sección móvil.

### 2.8 DevOps — actualizar SOUL + scripts
- **Secciones a modificar:** `## Condiciones para mergear` (condición 3: "y `verify-mobile` en SUCCESS si toca `mobile/`"); `## Qué haces, por encargo del Productor` (`/torre rama` con línea); `## main sana` (vigilar también la CI móvil); `## Nunca` (agregar `eas build|submit|update` salvo lectura).
- **Responsabilidades nuevas (opcionales):** mirar el estado de un build interno disparado por CI tras el merge, solo lectura, y pasarle el enlace al Productor.
- **Scripts:** ver §3.4.

---

## 3. ¿Rol nuevo o extender?

### 3.1 Constructor Móvil: sí, rol nuevo
Argumentos con las mecánicas del equipo:
1. **Una línea = una rama a la vez** (`agentes/torre/references/reglas.md:21-24`). Con un solo Constructor, web y móvil se ponen en fila. El README ya describe cómo agregar una segunda línea duplicando al Constructor (`agentes/README.md:46-54`). Una línea 2 dedicada a móvil cumple justo la condición de "historias con archivos disjuntos" (`web/**` vs `mobile/**`).
2. **El SOUL del Constructor es casi todo técnico de Next** (`constructor/SOUL.md:8-17`). Ramificarlo con "si web / si móvil" en cada paso lo hace más largo y más propenso a mezclar reglas (p. ej. `proxy.ts` en una rama móvil). Un clon con las mismas secciones conserva todo el protocolo (`## La conversación con Revisor, QA y Diseño`, `## Cuando te encarga DevOps`) sin tocarlo.
3. **Profundidad de encargos:** Productor (0) → Constructor Móvil (1) → QA (2) → consulta a Diseño (3) cabe en el límite de 4 (`plan:39`, `plan:91`), igual que hoy.
4. **Costo:** un bot más en Sonnet. En la semana medida de Prendie los bots Sonnet costaron poco (DevOps US$ 10, QA US$ 6; vault `research/prendie-equipo-mausbot.md:306-307`); el costo lo pusieron los controladores Opus y la entrada cacheada (`:309`, `:312`).
5. Revisor, QA y Diseño **no se duplican**: atienden las dos líneas recibiendo la carpeta en cada encargo; el README sugiere pasarlos a la Torre y usar `git -C` cuando haya dos líneas (`agentes/README.md:53`).

### 3.2 Extender Revisor, QA, Diseño y DevOps (no duplicar)
Su protocolo (veredicto sobre sha, topes, hallazgos numerados, 7 condiciones) es el mismo; cambia solo el conocimiento técnico y la receta. Duplicarlos dobla turnos sin beneficio.

### 3.3 Rol de publicación (release): no por ahora
- Publicar en tiendas y actualizar por OTA son acciones con credenciales y efecto público; hoy el equipo tiene prohibido desplegar (`_comun.md:11`, `devops/SOUL.md:34`) y "los deploys los hace Vercel tras el merge" (`freno.sh:402`). Lo equivalente en móvil: el build de preview lo dispara la CI tras el merge; `eas submit` y una actualización OTA a producción las hace Felipe.
- Un bot más sin trabajo frecuente (pocas publicaciones) cuesta contexto y no aporta. Si más adelante hay cadencia de releases, el lugar natural es DevOps con un script `torre` nuevo de solo lectura, no un séptimo bot.
- Riesgo nuevo a escribir en el plan: `git revert` no retira un binario ni una actualización OTA ya distribuida; la vigilancia de `main` no cubre eso.

### 3.4 Scripts y archivos con `web/` o línea 1 fijos

| Archivo | Qué está fijo | Cambio |
|---|---|---|
| `agentes/scripts/verificar-frontera.sh:22-44` | listas `PROHIBIDAS`/`PERMITIDAS` solo con `web/` | agregar `mobile/src/`, `mobile/assets/`, `mobile/tests/` a permitidas; `mobile/package.json`, `mobile/app.json`, `mobile/app.config.*`, `mobile/eas.json`, `mobile/ios/`, `mobile/android/` a prohibidas. Opcional: perfil por línea (`--perfil web|movil`) para que cada Constructor solo toque su paquete. Actualizar `test-verificar-frontera.sh` |
| `agentes/scripts/condiciones-merge.sh:83-88` | `toca_web` → check `verify` | parametrizar: si toca `mobile/`, exigir check `verify-mobile`; regex del id (`:63`) ya acepta `mob-1`. Actualizar `test-condiciones-merge.sh` |
| `agentes/scripts/hilo.sh:24` | `ROLES="Productor Diseño Constructor Revisor QA DevOps"` | agregar el rol del Constructor Móvil (o que firme como `Constructor` con la línea en el texto) |
| `agentes/scripts/preparar-carpetas.sh:25` | `LINEA=…-linea-1` | parámetro de línea (lo pide `README.md:50`) |
| `agentes/scripts/preparar-carpetas.sh:30-31` | listas de skills | agregar skills móviles |
| `agentes/scripts/preparar-carpetas.sh:92-105` | `web/.env.local` y `cd web && npm ci` | para la línea móvil: `mobile/.env` solo con `EXPO_PUBLIC_*` hacia el backend local y `npm ci` en `mobile/` (y en `web/` porque QA levanta el backend) |
| `agentes/torre/scripts/crear-rama.sh:14` | `L=1` | recibir la línea; el resto de scripts Torre ya aceptan `L` (`abrir-pr.sh:6`, `estado.sh:6`, `liberar-linea.sh:7`, `actualizar-rama.sh:6`) |
| `agentes/torre/scripts/vigilar-main.sh:7-8` + `.github/workflows/ci.yml:5-7` | CI de `main` solo con `paths: ['web/**']` | agregar `mobile/**` y un job `verify-mobile`; si no, un merge móvil roto nunca se revierte solo |
| `.github/workflows/ci.yml:4` | `pull_request.paths` sin `mobile/**` | agregar |
| `agentes/torre/references/reglas.md:12-13` | estados por "commits en `web/`" | "commits en `web/` o `mobile/`" |
| `agentes/torre/scripts/abrir-pr.sh:27` | checklist "CI y `verify`" | agregar `verify-mobile` |
| `agentes/skills/estilo-equipo/SKILL.md:15` | `CARPETA: …-linea-1` en la plantilla de encargo | `<carpeta de la línea>` |
| `agentes/skills/estilo-equipo/SKILL.md:58-66` | humo web | dividir en §4a web y §4b móvil |
| `agentes/scripts/exportar-equipo.py:24-49` | `EQUIPO` "Seis bots" y `MIEMBROS` con 6 entradas | agregar el miembro `constructor-movil` |
| `agentes/configuracion-bots.json:6-8, 10-24` | carpetas, bots y skills | línea 2, bot nuevo, skills |
| `.claude/hooks/design-gate.sh:11-20` | dispara solo en `*/src/app/*` y `*/src/components/*` con `.tsx`/`.css` | si la app usa Expo Router en `mobile/app/` el gate no avisa; usar `mobile/src/app/` (Expo Router lo admite) o ampliar el patrón |
| `.claude/hooks/freno.sh:398-404` | `regla_vercel`; no hay regla para `eas` | agregar `regla_eas`: permitir solo lectura (`build:list`, `build:view`, `whoami`), bloquear `build`, `submit`, `update`, `credentials`, `secret` |
| `.claude/hooks/freno.sh:552-556` + `:443-460` | `npx <cmd>` se revisa como `<cmd>`; `expo` no tiene regla | `npx expo install <pkg>` instala dependencias sin pasar por `regla_paquetes`; agregar `expo install` a la regla de dependencias. Hoy solo lo frenaría la frontera al mergear (`package.json` prohibido), es decir tarde |

---

## 4. Skills: inventario y dónde entra lo móvil

**En `.claude/skills/` del repo (18):** accessibility-review, ckm-banner-design, ckm-brand, ckm-design, ckm-design-system, ckm-slides, ckm-ui-styling, design-critique, design-handoff, design-system, emil-design-eng, frontend-design, impeccable, research-synthesis, stageshow, ui-ux-pro-max, user-research, ux-copy. Mapa de uso: `docs/tecnico/skills-de-diseno.md:12-26`.

**Copiadas a los bots desde Prendie** (`preparar-carpetas.sh:31`): brainstorming, writing-plans, subagent-driven-development, dispatching-parallel-agents, test-driven-development, requesting-code-review, receiving-code-review, verification-before-completion, systematic-debugging, finishing-a-development-branch, testing-strategy, agent-security, write-spec, sprint-planning. Más `torre` y `estilo-equipo` (`:89-90`). Los bots no ven skills globales ni plugins (`plan:37`).

**Por skill, frente a RN:**

| Skill | ¿Sirve para RN? | Nota |
|---|---|---|
| `ui-ux-pro-max` | **Sí, ya lo cubre** | descripción incluye React Native (`SKILL.md:3`), datos en `data/stacks/react-native.csv`, paso "Stack Guidelines (React Native)" (`:439-444`) y reglas de App UI iOS/Android (`:562`). **Ojo:** `:359` dice "Stack: React Native (this project's only tech stack)": hoy puede empujar a los bots web a consejos de RN. No agregar otra skill de guías de UI móvil (duplicado) |
| `frontend-design` | Parcial | orientada a web; el gate la exige junto a `ui-ux-pro-max` (`skills-de-diseno.md:14`). Sirve como dirección estética |
| `emil-design-eng` | Parcial | animación pensada en CSS; en RN se traduce a otra librería de animación |
| `impeccable` | Parcial | auditoría de "frontend interface"; útil como checklist, no como guía de API |
| `stageshow` | Sí para maquetas | marcos de teléfono; "React and plain CSS" |
| `accessibility-review` | Parcial | WCAG sí; props de accesibilidad de RN no |
| `ckm-ui-styling` | No | shadcn/Tailwind web: no dársela al Constructor Móvil |
| `testing-strategy` | No tal cual | "Next.js/Node con Vitest y Playwright": agregar sección móvil |
| `agent-security` | Sí | igual para el cliente móvil |

**Dónde enchufar lo móvil:**
1. Una skill de Expo/RN (construcción, Router, EAS en modo lectura) para Constructor Móvil y Revisor; auditarla con `skill-auditor` antes de copiarla.
2. `estilo-equipo` §4b humo móvil (protocolo del equipo, no conocimiento general).
3. `testing-strategy` con sección móvil.
4. Copiarlas en `preparar-carpetas.sh:30-31`; registrarlas en `configuracion-bots.json:19-24` y `skills-de-diseno.md`.

**Duplicados a vigilar:** `ui-ux-pro-max` RN contra cualquier skill nueva de "mobile UI"; `design-system` contra `ckm-design-system`; `design-handoff` contra la skill de protocolo si esta repite la especificación de pantallas.

---

## 5. Costo, consumo, modelos y proveedores (solo con evidencia)

**Campos de consumo:**
- `~/.openmausbot/usage/<año-mes>.jsonl` con `botName`, `model`, `costUsd`, `input`, `cachedInput`, `output` y un one-liner `jq` por bot y día: `agentes/README.md:30-31`.
- Lista completa de claves: `botName`, `model`, `input`, `cachedInput`, `output`, `costUsd`, `costSource`, `trigger`, `threadId`: `docs/superpowers/plans/2026-11-14-equipo-mausbot.md:44`.

**Cifras registradas:**
- Prendie, una semana (3 al 9 de noviembre): **US$ 724 equivalentes, 88 % Opus**: `plan:190`; detalle por bot en vault `research/prendie-equipo-mausbot.md:298-309` (Constructor 2 US$ 276; Arquitecto Opus US$ 170; DevOps Sonnet US$ 10; QA Sonnet US$ 6). Es cuota del plan Max 5x, no factura (`:309`); casi todo es entrada cacheada (`:309`).
- Ahorro estimado si se pasaba a Sonnet/Haiku: de US$ 724 a US$ 200–250 (`vault …prendie-equipo-mausbot.md:341`), estimación, no medición.
- **Gasto del equipo Estilo: no evidenciado.** El plan pide medir tras ui-0 y UI-1 (`plan:191-192`, `plan:229`, `plan:246`); el equipo corrió (hilos `ui-0`, `ui-2`, `ui-3`; commits #3, #5, #7), pero no encontré la medición en el repo ni en el log del vault (la última mención del equipo en `proyectos/ai-personal-stylist-log.md:45` es "Falta: importar…").

**Modelos por bot:** todos `claude-sonnet-5-5`; esfuerzo medium (Productor, Diseño, QA, DevOps) y high (Constructor, Revisor); Opus solo como subagente validador de Diseño (`configuracion-bots.json:10-15`, `plan:186-188`). Sin Haiku ni Gemini a propósito (`plan:52`).

**Proveedores no Anthropic en OpenMausBot:**
- En el repo solo hay una mención indirecta: "Sin Haiku ni Gemini" (`plan:52`).
- En el vault sí hay evidencia: motor **Antigravity (ACP)** con modelos Gemini (`gemini-3.8-flash`) usado en Lo Nuestro, con límites: sin MCP, **sin `coordinate_bots`**, **sin hooks ni `deny` de `.claude/settings.json`**, sin `.claude/skills`; lee `AGENTS.md`; costo reportado `estimated` = 0 (`research/prendie-equipo-mausbot.md:316`). Estado al 2026-11-09: motor `unavailable` hasta reinstalar el runtime oficial; el driver reconoce `gemini-4-argon-*` (`:343`). Riesgos (`:345`).
- OpenAI/Codex como motor de bots: **no evidenciado.**
- Implicancia: un bot Gemini no podría participar en la conversación por encargos ni quedaría bajo el freno; no sirve para Constructor Móvil ni para QA en este esquema.

---

## 6. Certificación hoy y dónde entra lo móvil

**Hoy** (`plan:104-120`, `productor/SOUL.md:20-25`):
1. Productor elige y encarga → DevOps `crear-rama.sh` (rama `equipo/<id>-<slug>` + hilo con dependencias).
2. Diseño: maqueta HTML 390 px + validación Opus → Productor `decision`.
3. Constructor: construye, `cd web && npm run verify`, push.
4. Constructor encarga Revisor ∥ Diseño (`reply: resume`) → hallazgos → `respuesta` → `rework` (topes 3).
5. Constructor encarga QA: build de producción, `PORT=3210`, navegador 390 × 844, `AI_MODE=mock` → hallazgos (tope 4) → `VEREDICTO QA aprobado sha=…` con `## Humo`.
6. Si entra código después de un aprobado, se vuelve a revisar (lo detecta la condición 7).
7. `LISTA <id> <sha>` → DevOps: actualizar por merge, PR, CI, `condiciones-merge.sh` (7), `mergear.sh` squash, `vigilar-main.sh`, revert si rojo, `liberar-linea.sh`.
8. Productor: `MERGEADO` a Felipe.

**Móvil, encajado sin cambiar la forma:**

| Paso | Qué cambia |
|---|---|
| 1 | `crear-rama.sh` con línea 2; id `mob-<n>`; el hilo declara dependencias nativas que la integradora debe instalar antes |
| 2 | misma maqueta HTML 390 px, con estados nativos; validación Opus igual |
| 3 | Constructor Móvil; `cd mobile && npm run verify` (tsc, lint, tests jest-expo/RNTL, `expo-doctor`) |
| 4 | Revisor con la variante móvil; Diseño revisa capturas del simulador (o Expo Web declarado como aproximación) |
| 5 | QA receta 4b: backend web local en modo simulado + app en simulador iOS (iPhone 390 × 844 pt), Android opcional; `## Humo` con plataforma y SO |
| 6 | igual |
| 7 | condición 3 exige `verify-mobile`; CI de `main` con `mobile/**`; revert igual |
| **7b (nuevo, fuera del merge)** | build de preview para distribución interna disparado por la CI tras el merge (credencial de Expo como secreto de GitHub, nunca en el bot); DevOps solo lee su estado |
| 8 | `MERGEADO` con enlace o QR del build para el teléfono de Felipe |
| **Publicación** | `eas submit` y actualización OTA a producción: solo Felipe |

**Por qué el build EAS no entra como condición de merge:** es lento, usa cuota de builds de Expo, necesita un token (secreto) y las 7 condiciones tienen que poder evaluarse con `gh` y `git` en segundos y fallar cerrado. Dejarlo después del merge mantiene el gate objetivo y rápido; si el build falla, se trata como una `main` roja (revert + aviso).

**Antes de confiar en el flujo móvil (humo del equipo, como `plan:221-232`):**
1. Que QA pueda arrancar el simulador, instalar la app y sacar capturas desde Bash con `mcp: []`.
2. Que pueda **interactuar** (tocar, escribir): si no, hace falta un MCP de simulador configurado para el bot o una herramienta de flujos (dependencia que pide la integradora).
3. Que la app en el simulador llegue a `localhost:3210` con el asesor simulado y la cuenta de QA.
4. Que el freno bloquee `eas build|submit|update` y `npx expo install <pkg>` (hoy no lo hace).

## 7. Próximo paso sugerido
Registrar la decisión RN + Expo en `DECISION_LOG.md` (con estructura `mobile/`, cómo se comparte el contrato y cómo se traducen los tokens), porque la frontera, el gate de diseño y los scripts dependen de esas rutas.
