# Auditoría de skills para el equipo móvil (A4)

> 2026-11-27 · Marco: `skill-auditor` (10 puntos). Solo se leyeron archivos; no se ejecutó nada de las skills.
> Fuentes fijadas: `github.com/expo/skills` @ `8f2b6c0c65533e695243aa401eaa1cb6f1fe86c2` ·
> `github.com/callstackincubator/agent-skills` @ `59e9d17446a248b21d86f078fcd0bd2d36db1ca4`.
> **Nada se instaló.** La integración a los bots es parte de A5 (`docs/movil/03-skills-y-equipo.md`).

## Resultado

**6 SEGURA · 5 SOSPECHOSA · 0 OFENSIVA.** No hay prompt injection maliciosa, robo de credenciales, exfiltración,
código ofuscado ni escrituras en `~/.claude`.

El patrón que se repite, también en las skills oficiales: mandan a ejecutar paquetes en su **última versión sin fijar y
sin pedir confirmación** (`npx --yes <paquete>@latest`). Quien publica puede cambiar lo que corre sin que nadie lo
revise. Se corrige en la copia local fijando versiones.

| Skill | Veredicto | Hallazgo principal | Qué hacer | Para quién |
|---|---|---|---|---|
| `expo-router` | 🟢 SEGURA | Sección de feedback a Expo (con consentimiento) | Copiar y quitar el feedback | Constructor Móvil, Revisor |
| `expo-design-system` | 🟢 SEGURA | Feedback · sus `grep -rn` chocan con el freno | Copiar, quitar el feedback y cambiar `grep` por `rg` | Diseño, Constructor Móvil |
| `expo-animation` | 🟢 SEGURA | Feedback | Copiar y quitar el feedback | Constructor Móvil |
| `expo-project-structure` | 🟢 SEGURA | Feedback | Copiar y quitar el feedback | Constructor Móvil, Revisor |
| `expo-data-fetching` | 🟢 SEGURA | Feedback · "You MUST use this skill for ANY networking work" puede desplazar a `claude-api` y `agent-security` | Copiar, quitar el feedback y bajar el disparador a "networking del cliente móvil" | Constructor Móvil |
| `react-native-testing` | 🟢 SEGURA | Ninguno. Es una copia vendorizada de `callstack/react-native-testing-library` | Copiar solo la carpeta. **No** instalar el plugin, porque arrastra `agent-device` y `dogfood` sin auditar y se actualiza cada noche | Constructor Móvil, QA |
| `expo-native-ui` | 🟡 SOSPECHOSA | `agent-cli@latest` y `eas-cli@latest` con `--yes` · rangos `^` y `--legacy-peer-deps` · puede lanzar builds de EAS | Fijar versiones y quitar `--yes`. Los builds de EAS requieren aprobación de Felipe | Diseño, Constructor Móvil |
| `expo-dev-client` | 🟡 SOSPECHOSA | `eas-cli@latest` 11 veces · `--submit` a App Store Connect · `eas credentials` | Fijar versiones. Sacar `--submit` del comando por defecto. `credentials` solo con Felipe | Sesión integradora (los bots tienen EAS bloqueado) |
| `expo-upgrade` | 🟡 SOSPECHOSA | `agent-cli@latest` 12 veces · `expo@next` · `bunx xcobra` sin fijar · `watchman watch-del-all` global · edita `AGENTS.md` | Fijar el SDK objetivo y las versiones. Limitar watchman al proyecto. Mostrar el diff de `AGENTS.md` | Sesión integradora, en cada upgrade de SDK |
| `expo-web-to-native` | 🟡 SOSPECHOSA | `agent-cli@latest` · instala globalmente `agent-browser` y `@swmansion/argent` y descarga Chrome · se relanza sola en loop (`/goal`) · "puede correr desatendida" | Fijar versiones sin instalaciones globales. Quitar el autolanzamiento de `/goal`. **Nunca a un bot** | Solo la sesión integradora, como guía de migración |
| `react-native-best-practices` | 🟡 SOSPECHOSA | Manda a correr `react-compiler-healthcheck@latest` y `create-react-native-library@latest`, en contra de sus propias reglas · apunta a la CLI externa `agent-device` | Fijar 8 versiones. "Always run" pasa a "proponer a Felipe". Sin `agent-device` | Constructor Móvil, Revisor |

## Reglas para la copia local (A5)

1. Copiar solo la carpeta de cada skill a `agentes/skills-externas/<origen>/<skill>@<sha>/`, con un `ORIGEN.md` que
   indique repositorio, commit, fecha y cambios hechos. **Nunca instalar los plugins ni el marketplace.**
2. Reemplazar `npx --yes <paquete>@latest` por `npx <paquete>@<versión-exacta>`. La versión se elige y se revisa al
   integrar (`npm view <paquete> version`).
3. Quitar la sección "Submitting Feedback" de las skills de Expo, o dejarla con un sí explícito de Felipe.
4. El freno ya debe bloquear para los bots `eas build|submit|update|credentials` y `npx expo install`. Las skills
   adaptadas no reemplazan ese control.
5. Volver a auditar cada vez que se cambie el SHA fijado.

## Informes

Un archivo por skill en esta carpeta: `audit-skill-<nombre>.md`.
