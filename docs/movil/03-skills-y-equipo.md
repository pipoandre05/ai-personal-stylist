# 03 · Skills de Expo y evolución del equipo de bots

> 2026-11-26 · **Propuesta, nada instalado ni modificado.** Detalle con citas archivo:línea:
> `investigacion/equipo-bots.md`. Las skills de Expo que Felipe iba a compartir **aún no llegan**: aquí se evalúan las
> oficiales de Expo y las de Callstack y Software Mansion. Cuando lleguen las de Felipe, se comparan con esta tabla.

## 1. Skills: instalar, adaptar o descartar

**Cómo llegan las skills a los bots hoy:**
- Los bots corren con `--setting-sources project` y **no ven skills globales ni plugins**.
- Ven solo lo que `agentes/scripts/preparar-carpetas.sh` copia a `.claude/skills/` de la Torre y de cada línea.
- Por eso instalar el plugin de Expo en tu Claude Code **no** se lo da a los bots: hay que copiar la skill y
  registrarla en `configuracion-bots.json`.

> **Auditoría hecha (2026-11-27, `audit/README.md`):** 6 SEGURA y 5 SOSPECHOSA, ninguna OFENSIVA. Las sospechosas
> (`expo-native-ui`, `expo-dev-client`, `expo-upgrade`, `expo-web-to-native` y `react-native-best-practices`) mandan a
> ejecutar paquetes `@latest` sin confirmación, y se instalan **solo como copia adaptada** con versiones fijas.
> `expo-web-to-native` instala herramientas globales y se relanza sola, así que **nunca va a un bot**.

**Protocolo para cada skill externa:**
1. `skill-auditor` (veredicto SEGURA).
2. Copiarla, fijada a un commit, a `agentes/skills-externas/<origen>/<skill>@<sha>`.
3. Registrarla en `preparar-carpetas.sh` y en `configuracion-bots.json`.
4. Dejar una línea en `docs/tecnico/skills-de-diseno.md` (o en un mapa nuevo, `skills-movil.md`).

| Skill | Origen | Qué aporta | Veredicto | Para quién |
|---|---|---|---|---|
| `expo-web-to-native` | Expo oficial | Migración de Next.js a nativo, el caso exacto de este proyecto | **Adaptar** (auditoría: SOSPECHOSA) | Solo la sesión integradora, como guía; nunca un bot |
| `expo-project-structure`, `expo-router`, `expo-dev-client` | Expo | Estructura, rutas y development build | **Instalar** | Constructor Móvil, Revisor |
| `expo-data-fetching` | Expo | TanStack Query, streaming y fetch | **Instalar** | Constructor Móvil |
| `expo-native-ui`, `expo-design-system` | Expo | Patrones de interfaz nativa y sistema de diseño | **Instalar** | Diseño, Constructor Móvil |
| `expo-animation` | Expo | Animaciones nativas | **Adaptar**: se cruza con `emil-design-eng`. Expo manda en la técnica, Emil en el criterio | Constructor Móvil |
| `expo-upgrade` | Expo | Subir de SDK | **Instalar más tarde**, en el primer upgrade | Sesión integradora |
| `eas-workflows`, `eas-update`, `eas-app-stores` | Expo (servicios) | CI de EAS, OTA y publicación | **Solo para Felipe y la sesión integradora**. Ningún bot publica | — |
| `eas-observe`, `eas-simulator` | Expo | Errores en producción; simuladores en la nube (con cobro) | **Postergar** | — |
| `expo-dom` | Expo | Componentes web dentro de la app | **Descartar**: va contra no forzar la interfaz web en nativo | — |
| `expo-ui`, `expo-module`, `expo-brownfield`, `expo-app-clip`, `expo-examples`, experimentales | Expo | SwiftUI/Compose, módulos nativos propios, apps híbridas, App Clips | **Descartar por ahora**: no hay caso | — |
| `react-native-best-practices` | Callstack | Rendimiento (listas, re-renders, Hermes) | **Instalar** | Constructor Móvil, Revisor |
| `react-native-testing` | Callstack | React Native Testing Library y jest | **Instalar** | Constructor Móvil, QA |
| `react-native-best-practices` | Software Mansion | Reanimated 4 y gestos | **Descartar**: duplica a Callstack y `expo-animation`. Reevaluar si hay animación pesada | — |
| Expo MCP (`mcp.expo.dev`) | Expo | Docs, capturas y control del dev server | **Solo para la sesión principal**, con aprobación. Los bots siguen sin MCP (`mcp: []`) | Felipe |

**Skills actuales que se adaptan, sin reemplazarlas:**
- `ui-ux-pro-max`: ya cubre React Native (`--stack react-native`), así que no se agrega otra guía de UI móvil. Ojo: su
  línea 359 dice que RN es "this project's only tech stack" y puede sesgar a los bots web. Se corrige en la copia local.
- `testing-strategy`: se le agrega una sección móvil (jest-expo, RNTL y Maestro).
- `estilo-equipo`: se agrega la receta de humo **4b (móvil)** y la línea 2.
- `frontend-design`, `emil-design-eng`, `impeccable` y `accessibility-review` se mantienen como criterio. La técnica
  nativa la ponen las skills de Expo y Callstack.
- `ckm-ui-styling` (shadcn y Tailwind) no se usa en móvil. Hay que vigilar que `design-system` y `ckm-design-system`
  no se dupliquen.

**Cuándo se usa cada una** (va en los SOUL):

| Momento | Skills |
|---|---|
| Diseñar una pantalla nativa | `ui-ux-pro-max --stack react-native` + `expo-native-ui` + `frontend-design` |
| Construir | `expo-router` / `expo-data-fetching` / `expo-project-structure` + `react-native-best-practices` + `test-driven-development` |
| Revisar | `react-native-best-practices` + `agent-security` + la lista de verificación móvil (sección 2) |
| Probar | `react-native-testing` + `testing-strategy` (móvil) + humo 4b |
| Upgrade de SDK | `expo-upgrade`, solo la sesión integradora |

## 2. Equipo: se conserva y se extiende

**Diagnóstico:**
- El equipo es web de punta a punta: frontera `web/**`, `cd web && npm run verify` y humo en navegador a 390 px contra
  `localhost:3210`.
- **Las mecánicas valen igual para móvil y se conservan tal cual:** hilo, veredictos sobre un sha, 7 condiciones de
  merge, PAUSA, freno, topes de vueltas y escalamiento.
- No se reemplaza ningún SOUL. Los cambios son secciones agregadas, del tipo "si la rama es móvil…".

| Bot | Veredicto | Qué cambia (sección del SOUL) | Skills nuevas |
|---|---|---|---|
| **Bloque común** (`_comun.md`, se regenera en los 7 con `exportar-equipo.py`) | Actualizar | `**Producto.**`: PWA y app nativa. `**Qué construye el equipo.**`: backlog `MOB-*` además de UI-x, siempre contra `AI_MODE=mock`. `**Frontera.**`: dos listas (web y móvil). `**Reglas del repo.**`: `eas` y `npx expo install` prohibidos. `**Cómo conversamos.**`: suma al Constructor Móvil. "Idéntico en los 6 bots" pasa a 7 | — |
| **Productor** | Actualizar (ligero) | `## Qué decides tú` y `## Flujo de una historia`: elige línea según `web` o `mob`. `## Pedidos fuera de la frontera`: dependencias nativas. `## Paralelizar siempre`: web y móvil en líneas distintas. `MERGEADO` lleva el enlace al build | — |
| **Diseño** | Actualizar | `## Antes de diseñar`: stack `react-native`. `## Maqueta`: estados nativos (área segura, teclado, Dynamic Type, gesto atrás, permisos negados). `## Revisión de lo construido`: capturas del simulador en vez de `npm run dev -p 3220`. Debe volver a correr el validador Opus, que ya se saltó en `ui-3` | `expo-native-ui`, `expo-design-system` |
| **Constructor (web)** | Sin cambios técnicos | `## Nunca`: agregar `mobile/**` | — |
| **Constructor Móvil** | **Nuevo, clon del Constructor** | Cambian `## Misión` (línea 2, ramas `equipo/mob-*`), `## Antes de escribir código` (Expo Router, contrato en `packages/core`, skills), `## Construir` (`cd mobile && npm run verify` con tsc, lint, jest-expo y `expo-doctor`) y `## Nunca` (`app.config.*`, `eas.json`, `ios/`, `android/`, `package.json`, `eas *`). Sonnet 5.5 con esfuerzo high | Expo (8: `expo-web-to-native`, `expo-project-structure`, `expo-router`, `expo-dev-client`, `expo-data-fetching`, `expo-native-ui`, `expo-design-system`, `expo-animation`) + Callstack (2) |
| **Revisor** | Actualizar | `## Cómo revisas`, con variante móvil en los pasos 2 a 6: nada secreto en `EXPO_PUBLIC_*`, sesión cifrada, fotos sin EXIF, lógica de negocio fuera de los `.tsx`, accesibilidad RN (`accessibilityLabel`, tamaño de toque ≥ 44 pt), y listas virtualizadas | `react-native-best-practices` |
| **QA** | Actualizar y receta nueva | `## Antes de probar`: receta 4a web o 4b móvil (backend local con `AI_MODE=mock`, simulador iPhone 390×844 pt, Maestro, capturas con `xcrun simctl`). `## Qué haces`: teclado, segundo plano, permisos negados, sin red, matar y reabrir. `## Veredicto`: el `## Humo` declara plataforma y SO | `react-native-testing` |
| **DevOps** | Actualizar SOUL y scripts | `## Condiciones para mergear`: `verify-mobile`. `## main sana`: vigilar la CI móvil. `## Nunca`: EAS salvo lectura (`eas build:list`) | — |
| Bot de publicación | **No se crea** | Publicar en tiendas y hacer OTA a producción son irreversibles y públicos: los hace Felipe. El build de preview lo dispara la CI | — |

**Por qué un bot nuevo y no extender el Constructor:**
- Una línea lleva una rama a la vez (`torre/references/reglas.md`). Sin una segunda línea, web y móvil van en fila.
- El README ya describe cómo duplicar al Constructor en una línea 2, y `web/**` contra `mobile/**` son archivos
  disjuntos.
- Revisor, QA y Diseño atienden las dos líneas (reciben la carpeta en cada encargo) y no se duplican.

## 3. Plomería que se rompe si no se ajusta (antes de la primera historia móvil)

| Archivo | Problema | Ajuste |
|---|---|---|
| `condiciones-merge.sh:83-88` + `ci.yml:4-7` + `vigilar-main.sh` | Hoy la frontera (lista blanca) rechaza `mobile/**`, así que no hay hueco. **Aparece en cuanto se abra la frontera** si antes no existen `verify-mobile` y la CI de `main` para `mobile/**`: un PR móvil se mergearía sin verify y sin revert | **Orden obligatorio:** primero `toca_mobile`, el job `verify-mobile` y los paths `mobile/**` y `packages/**`; recién después abrir la frontera |
| `freno.sh` | No hay regla para `eas`. `npx expo install <pkg>` esquiva la regla de dependencias (`regla_paquetes` solo mira npm, pnpm, yarn y bun). **El freno aplica a todas las sesiones del repo** | Bloquear `eas build`, `submit`, `update`, `credentials` y `secret`, y tratar `expo install` como dependencia, **solo en contexto de bot** (carpetas `*-torre` y `*-linea-*`, o una variable de OpenMausBot). Tests de los dos lados en `test-freno.sh` |
| `verificar-frontera.sh:22-44` + test | La frontera solo conoce `web/**` | Permitir `mobile/src/**`, `mobile/assets/**` y `mobile/tests/**`. Prohibir la configuración nativa (`app.config.*`, `eas.json`, `ios/`, `android/`), `mobile/package.json`, **el `package.json` y el lockfile de la raíz** y `packages/core/**` (el contrato) |
| `hilo.sh:24` | `ROLES` fijo: rechazaría al rol nuevo | Agregar `ConstructorMovil` con el formato de la lista |
| `torre/scripts/crear-rama.sh:10,14` | `L=1` fijo; el id solo acepta `[a-z0-9-]` | Recibir la línea como parámetro. Ramas e ids en minúsculas: `equipo/mob-e1-h01-<slug>` |
| `preparar-carpetas.sh` | Línea 1 y `web/` fijos | Parámetro de línea, skills móviles y `npm ci` en la raíz |
| `exportar-equipo.py` | "Seis bots" fijo | 7 miembros |
| `estilo-equipo/SKILL.md:15` | Carpeta de la línea 1 fija | Las dos líneas |
| `.claude/hooks/design-gate.sh:13` | Vigila `*/src/app/*` y `*/src/components/*`. `mobile/src/app` ya queda cubierto | Agregar `*/src/ui/*` |

**Cómo se certifica una historia móvil:**
- Sigue la misma forma de hoy (encargo → maqueta validada → construir → Revisor y Diseño → QA humo 4b → `LISTA` →
  7 condiciones → merge squash).
- Se suma un **paso 7b fuera del gate**: tras el merge, la CI construye un binario de preview solo si cambió el
  fingerprint nativo; si no, publica `eas update --channel preview`. Si falla, se trata como `main` roja.
- `MERGEADO` lleva el enlace del build.
- Felipe revisa lo visual en su teléfono: sigue la regla de que nada de interfaz se declara listo sin mostrarlo.

**Antes de abrir la línea 2, un humo del equipo** (criterio de aceptación de esta etapa):
1. QA arranca el simulador, instala el build y saca capturas sin MCP.
2. QA toca y escribe en la app (Maestro). Si no puede, hace falta decidir un MCP de simulador.
3. La app del simulador llega a `localhost:3210`.
4. En contexto de bot, el freno bloquea `eas` y `npx expo install`, y en la sesión integradora no.
5. Un PR solo de `mobile/` no puede mergearse sin `verify-mobile`.
