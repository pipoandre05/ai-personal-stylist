# Skills de diseño cargadas en el proyecto

Copiadas a `.claude/skills/` el 2026-11-14 desde el toolkit (`~/Documents/claude/_toolkit/skills/design`) y el plugin de
diseño. Están **en la carpeta local, no en git** (igual que en Prendie): `.gitignore` solo versiona `settings.json`,
`hooks/` y `launch.json`. Un clon nuevo o la carpeta de una línea del equipo de bots debe volver a copiarlas (los bots
de OpenMausBot no ven las skills globales ni los plugins).

Para actualizarlas, repetir la copia desde el toolkit. La fuente de verdad sigue siendo el toolkit.

## Cuándo usar cada una

| Skill | Cuándo |
|---|---|
| `frontend-design` + `ui-ux-pro-max` | SIEMPRE JUNTAS al construir o rediseñar una pantalla o componente. El gate de diseño las exige a las dos. |
| `impeccable` | SIEMPRE al cerrar cualquier cambio de interfaz, antes de pedir revisión visual. |
| `emil-design-eng` | Detalle fino: animación, micro-interacciones, estados, lo que hace que la conversación se sienta bien. Clave para el hilo, el compositor y las tarjetas. |
| `stageshow` | Interfaz simulada con apariencia de producto real, fija o animada con cursor: maquetas de alta fidelidad, demos del asesor conversando, piezas para la portada. Instalada el 2026-11-14. |
| `design-critique` | Crítica estructurada de una maqueta o pantalla antes de mostrársela a Felipe. |
| `accessibility-review` | Auditoría WCAG 2.1 AA: hilo con streaming, foco, contraste, objetivos táctiles. |
| `ux-copy` | Textos de interfaz: mensajes del asesor que son fijos, errores, estados vacíos, botones. |
| `design-handoff` | Especificación de una pantalla para quien la construye (Diseño → Constructor). |
| `design-system` | Auditar o extender tokens y componentes. |
| `user-research` · `research-synthesis` | Planificar y sintetizar entrevistas y pruebas con personas del piloto. |
| `ckm-design-system` · `ckm-ui-styling` | Arquitectura de tokens y estilos con Tailwind; referencia, no reemplaza `DESIGN.MD`. |
| `ckm-design` · `ckm-brand` | Identidad, logo, piezas de marca y voz. Para la sesión de marca (A-05). |
| `ckm-banner-design` · `ckm-slides` | Banners y presentaciones. Fuera del producto; para difusión. |

La dirección visual ya decidida vive en `DESIGN.MD` (raíz) y `docs/producto/UX_UI_SPEC.md`: las skills aportan criterio,
no cambian tokens ni tipografías sin pasar por `DECISION_LOG.md`.
